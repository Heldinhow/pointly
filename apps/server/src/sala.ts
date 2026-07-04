/**
 * Sala — Planning Poker state machine (Phase 3 — T12)
 *
 * Sala encapsula o estado canônico de uma partida Planning Poker:
 *  - Map<playerId, Player> com uuid + nick + seatIndex + voto
 *  - phase: idle → voting → revealable → revealed → (loop) → voting
 *  - round: contador 1-based (incrementado em `startNewRound`)
 *  - timer: 60s regressivo, started no primeiro voto da rodada,
 *           decrementado via `tick()` (chamado pelo hub a cada 1s),
 *           dispara auto-reveal em 0
 *
 * Domain: Sala é container efêmero (CONTEXT.md).
 * Registrada no `Hub` (T17) por `Map<codigo, Sala>`. Removida quando o
 * último player sai (T18).
 *
 * @see docs/adr/0005-v1-functional-in-memory-state.md
 * @see docs/adr/0009-reconnect-uuid-strategy.md        (UUID como reconnect handle)
 * @see docs/adr/0002-host-is-creator-not-ruler.md      (host fraco; reveal/new_round democráticos)
 */

import {
	DECK_VALUES,
	type Player,
	type Phase,
	type SalaState,
	type Vote,
	computeConsensus,
	isUnanimous,
} from "@planning-poker/shared";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Erro lançado pela Sala em falhas de regras de negócio.
 * Handlers (T13-T16) traduzem para `error { code }` no WS.
 */
export class SalaError extends Error {
	readonly code:
		| "sala_cheia"
		| "sala_nao_encontrada"
		| "invalid_phase"
		| "invalid_vote"
		| "invalid_nick";
	constructor(code: SalaError["code"], message: string) {
		super(message);
		this.name = "SalaError";
		this.code = code;
	}
}

// ---------------------------------------------------------------------------
// Sala
// ---------------------------------------------------------------------------

const SEAT_COUNT = 12;
const TIMER_SECONDS = 60;
const TIMER_TICK_MS = 1000;
const DISCONNECT_GRACE_MS = 60_000;

export type RevealOutcome = {
	votes: Record<string, Vote>;
	median: number | null;
	mean: number | null;
	range: [number, number] | null;
	unanimous: boolean;
};

/**
 * Sala — uma partida Planning Poker. Mutável in-place; o hub serializa
 * snapshots via `toState()` para mandar pelo WS.
 */
export class Sala {
	readonly code: string;
	readonly createdAt: number;
	hostId: string | null;
	round: number = 1;
	timer: number = TIMER_SECONDS;
	phase: Phase = "idle";
	readonly players: Map<string, Player> = new Map();
	readonly votes: Map<string, Vote> = new Map();

	/**
	 * Indica se timer está rodando. True entre primeiro voto da rodada
	 * e reveal (manual ou auto). Após revelar, para. Reset em startNewRound.
	 */
	private timerActive: boolean = false;
	/** Handler de setInterval — usado para parar o timer em reveal/newRound. */
	private timerHandle: ReturnType<typeof setInterval> | null = null;

	/**
	 * Server-internal: timestamp (epoch ms) de quando cada player
	 * disconnectou pela última vez. NÃO vai no wire format (SalaState).
	 * Usado por `tickGracePeriod()` para remover player após 60s.
	 */
	private readonly disconnectedAt: Map<string, number> = new Map();

	constructor(code: string, firstPlayer: Player, now: number = Date.now()) {
		if (firstPlayer.role !== "host") {
			throw new Error("first player must have role: 'host'");
		}
		this.code = code;
		this.createdAt = now;
		this.hostId = firstPlayer.id;
		this.players.set(firstPlayer.id, firstPlayer);
	}

	// -----------------------------------------------------------------------
	// Players
	// -----------------------------------------------------------------------

	/**
	 * Adiciona player à sala. Lança `SalaError` se sala cheia (sala_cheia).
	 * Atribui `seatIndex` no primeiro assento livre (F-027).
	 */
	addPlayer(player: Player): Player {
		if (this.players.size >= SEAT_COUNT) {
			throw new SalaError(
				"sala_cheia",
				`Sala ${this.code} tem ${SEAT_COUNT}/${SEAT_COUNT} jogadores.`,
			);
		}
		const seatIndex = this.firstFreeSeat();
		const seated: Player = { ...player, seatIndex };
		this.players.set(seated.id, seated);
		return seated;
	}

	/**
	 * Remove player da sala. Se era host E ainda há outros conectados,
	 * promove o player mais antigo (F-048). Se sala ficar vazia, retorna
	 * sinal para o hub remover do Map (T18).
	 *
	 * @returns id do player promovido a host (ou null se ninguém promovido)
	 */
	removePlayer(playerId: string): { promoted: string | null } {
		const existed = this.players.delete(playerId);
		if (!existed) return { promoted: null };
		this.votes.delete(playerId);
		this.disconnectedAt.delete(playerId);

		// Host saiu e ainda há outros → promove mais antigo
		const promoted =
			this.players.size > 0 && this.hostId === playerId
				? this.promoteOldestPlayer()
				: null;
		const promotedId = promoted?.id ?? null;

		// Sala ficou vazia: limpa hostId e reseta estado
		if (this.players.size === 0) {
			this.hostId = null;
			this.stopTimer();
			this.phase = "idle";
		}
		return { promoted: promotedId };
	}

	/**
	 * Procura player por UUID. Null se não existe (F-037 — reconnect miss).
	 */
	findByUUID(uuid: string): Player | null {
		for (const p of this.players.values()) {
			if (p.uuid === uuid) return p;
		}
		return null;
	}

	/**
	 * Marca player como disconnected. NÃO remove da sala (F-050).
	 * Mantém voto e seatIndex — hub exibe opacity 0.4 + badge DISCONNECTED.
	 *
	 * Se player já estava disconnected (mesma chamada duplicada), atualiza timestamp.
	 *
	 * @returns player atualizado ou null se ID não existe
	 */
	markDisconnected(playerId: string, now: number = Date.now()): Player | null {
		const player = this.players.get(playerId);
		if (!player) return null;
		this.disconnectedAt.set(playerId, now);
		if (player.status === "disconnected") return player;
		const updated: Player = { ...player, status: "disconnected" };
		this.players.set(playerId, updated);
		return updated;
	}

	/**
	 * Reconecta player por UUID. Marca como connected e limpa timestamp.
	 * Hub chama isso quando recebe `hello` com UUID conhecido (F-037/F-038).
	 *
	 * @returns player atualizado ou null se UUID não está na sala
	 */
	markConnected(uuid: string): Player | null {
		const player = this.findByUUID(uuid);
		if (!player) return null;
		this.disconnectedAt.delete(player.id);
		if (player.status === "connected") return player;
		const updated: Player = { ...player, status: "connected" };
		this.players.set(player.id, updated);
		return updated;
	}

	/**
	 * Job de limpeza de grace period. Chamado externamente (hub / T18)
	 * a cada 10s. Remove players disconnected há mais de DISCONNECT_GRACE_MS.
	 *
	 * @returns lista de IDs removidos (hub pode disparar broadcasts)
	 */
	tickGracePeriod(now: number = Date.now()): string[] {
		const removed: string[] = [];
		for (const [id, disconnectedAtMs] of this.disconnectedAt) {
			if (now - disconnectedAtMs > DISCONNECT_GRACE_MS) {
				removed.push(id);
			}
		}
		for (const id of removed) {
			this.disconnectedAt.delete(id);
			this.removePlayer(id);
		}
		return removed;
	}

	/**
	 * Promove o player com menor `joinedAt` a host. Null se sala vazia.
	 * Idempotente: se já existe um host válido, retorna esse host sem mexer.
	 *
	 * F-048 (grilling 2026-07-04): host é "criador", não "governante".
	 * Reveal/new_round continuam democráticos.
	 */
	promoteOldestPlayer(): Player | null {
		if (this.players.size === 0) return null;
		if (this.hostId && this.players.has(this.hostId)) {
			const current = this.players.get(this.hostId)!;
			if (current.role === "host") return current;
		}
		let oldest: Player | null = null;
		for (const p of this.players.values()) {
			if (!oldest || p.joinedAt < oldest.joinedAt) oldest = p;
		}
		if (!oldest) return null;
		// Reatribui role host para o mais antigo
		const updated: Player = { ...oldest, role: "host" };
		this.players.set(oldest.id, updated);
		this.hostId = oldest.id;
		return updated;
	}

	/**
	 * Encontra o primeiro `seatIndex` livre em [0..11]. Sala cheia nunca
	 * chega aqui (addPlayer lança antes). F-027.
	 */
	private firstFreeSeat(): number {
		const taken = new Set<number>();
		for (const p of this.players.values()) taken.add(p.seatIndex);
		for (let s = 0; s < SEAT_COUNT; s++) {
			if (!taken.has(s)) return s;
		}
		// Não reachable (addPlayer já validou size < SEAT_COUNT), mas TS seguro:
		throw new Error("no free seat — sala cheia");
	}

	// -----------------------------------------------------------------------
	// Voting
	// -----------------------------------------------------------------------

	/**
	 * Registra/atualiza voto de um player. Idempotente em `value`.
	 *
	 * Regras:
	 *  - `phase !== 'voting' && phase !== 'revealable'` → `invalid_phase`
	 *  - `value === null` → `invalid_vote` (un-vote proibido — spec F-012)
	 *  - `value ∉ DECK_VALUES` → `invalid_vote`
	 *  - Marca `hasVoted = true`, atualiza in-place (F-011 idempotência)
	 *  - Se primeiro voto da rodada, inicia timer 60s (F-013) e phase → 'voting'
	 *  - Se todos os conectados votaram, phase → 'revealable'
	 *
	 * @returns void on success; lança SalaError em falha
	 */
	castVote(playerId: string, value: Vote | null): void {
		if (value === null) {
			throw new SalaError("invalid_vote", "Un-vote (value=null) é proibido.");
		}
		if (!DECK_VALUES.includes(value as Vote)) {
			throw new SalaError("invalid_vote", `Valor fora do deck: ${value}`);
		}
		if (
			this.phase !== "idle" &&
			this.phase !== "voting" &&
			this.phase !== "revealable"
		) {
			throw new SalaError(
				"invalid_phase",
				`invalid_phase: cast_vote requer phase=idle|voting|revealable; atual=${this.phase}`,
			);
		}

		const player = this.players.get(playerId);
		if (!player) {
			throw new SalaError(
				"invalid_vote",
				`Player ${playerId} não está na sala.`,
			);
		}

		// Update in-place (F-011 idempotência)
		const updated: Player = { ...player, value, hasVoted: true };
		this.players.set(playerId, updated);
		this.votes.set(playerId, value);

		// Primeira transição da rodada: idle → voting (F-013)
		if (this.phase === "idle") {
			this.phase = "voting";
		}

		// Inicia timer no primeiro voto da rodada (F-013)
		if (!this.timerActive) {
			this.startTimer();
		}

		// Phase 'voting' → 'revealable' se todos conectados votaram (F-014 prep)
		if (this.allConnectedVoted() && this.phase === "voting") {
			this.phase = "revealable";
		}
	}

	/**
	 * Qualquer player pode revelar (sem role check — ADR-0002 grilling).
	 *
	 * Regras:
	 *  - `phase === 'voting' || phase === 'revealable'` aceito
	 *  - Calcula stats via `computeConsensus` (F-020)
	 *  - Detecta unanimous via `isUnanimous`
	 *  - Phase → 'revealed', para timer
	 */
	reveal(_playerId: string): RevealOutcome {
		if (this.phase !== "voting" && this.phase !== "revealable") {
			throw new SalaError(
				"invalid_phase",
				`invalid_phase: reveal requer phase=voting|revealable; atual=${this.phase}`,
			);
		}

		const voteList = Array.from(this.votes.values());
		const stats = computeConsensus(voteList);
		const unanimous = isUnanimous(voteList);
		this.phase = "revealed";
		this.stopTimer();

		return {
			votes: Object.fromEntries(this.votes),
			median: stats.median,
			mean: stats.mean,
			range: stats.range,
			unanimous,
		};
	}

	/**
	 * Qualquer player pode iniciar nova rodada (sem role check — ADR-0002).
	 *
	 * Regras:
	 *  - `phase === 'revealed'` aceito
	 *  - Limpa votes e hasVoted de todos players
	 *  - Incrementa round
	 *  - Reset timer (próximo cast_vote inicia contagem)
	 *  - Phase → 'voting'
	 */
	startNewRound(): void {
		if (this.phase !== "revealed") {
			throw new SalaError(
				"invalid_phase",
				`invalid_phase: start_new_round requer phase=revealed; atual=${this.phase}`,
			);
		}
		for (const p of this.players.values()) {
			this.players.set(p.id, { ...p, hasVoted: false, value: null });
		}
		this.votes.clear();
		this.round += 1;
		this.timer = TIMER_SECONDS;
		this.phase = "voting";
		this.stopTimer();
	}

	// -----------------------------------------------------------------------
	// Timer
	// -----------------------------------------------------------------------

	/**
	 * Inicia timer regressivo de 60s. Tickado externamente via `tick()`.
	 * Idempotente — se já ativo, no-op.
	 */
	private startTimer(): void {
		if (this.timerActive) return;
		this.timer = TIMER_SECONDS;
		this.timerActive = true;
		this.timerHandle = setInterval(() => this.tick(), TIMER_TICK_MS);
		// Permite que o processo termine mesmo com timer ativo (Bun).
		if (
			this.timerHandle &&
			typeof (this.timerHandle as { unref?: () => void }).unref === "function"
		) {
			(this.timerHandle as { unref: () => void }).unref();
		}
	}

	/**
	 * Para o timer. Limpa interval. Não reseta `timer` (deixa o último valor
	 * para UI mostrar).
	 */
	private stopTimer(): void {
		if (this.timerHandle !== null) {
			clearInterval(this.timerHandle);
			this.timerHandle = null;
		}
		this.timerActive = false;
	}

	/**
	 * Decrementa 1s do timer. Se chegar a 0, dispara auto-reveal.
	 * Público — chamado pelo hub ou diretamente em testes.
	 *
	 * @returns verdade se auto-reveal foi disparado neste tick
	 */
	tick(): boolean {
		if (!this.timerActive) return false;
		this.timer = Math.max(0, this.timer - 1);
		if (this.timer <= 0) {
			// Auto-reveal (F-015)
			this.reveal("__auto_reveal__");
			return true;
		}
		return false;
	}

	/**
	 * Indica se timer está em estado crítico (≤30s). F-014 — UI coral.
	 */
	isCritical(): boolean {
		return this.timerActive && this.timer > 0 && this.timer <= 30;
	}

	// -----------------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------------

	/**
	 * Verdade se todos os players conectados votaram. Usado na transição
	 * voting → revealable. Players disconnected (grace period) não contam.
	 */
	private allConnectedVoted(): boolean {
		let connectedCount = 0;
		let connectedVoted = 0;
		for (const p of this.players.values()) {
			if (p.status !== "connected") continue;
			connectedCount += 1;
			if (p.hasVoted) connectedVoted += 1;
		}
		return connectedCount > 0 && connectedCount === connectedVoted;
	}

	// -----------------------------------------------------------------------
	// Wire format
	// -----------------------------------------------------------------------

	/**
	 * Snapshot serializável para broadcast `room_state` (F sala_state_event).
	 * Inclui `critical` flag derivada do timer (F-014).
	 */
	toState(): SalaState & { critical: boolean } {
		return {
			code: this.code,
			hostId: this.hostId,
			players: Array.from(this.players.values()),
			phase: this.phase,
			round: this.round,
			timer: this.timer,
			votes: Object.fromEntries(this.votes),
			createdAt: this.createdAt,
			critical: this.isCritical(),
		};
	}

	/**
	 * @returns número de players. Sala vazia = hub deve remover do Map.
	 */
	get playerCount(): number {
		return this.players.size;
	}

	/**
	 * @returns Map lookup helper. Exposto para o hub iterar.
	 */
	getPlayer(playerId: string): Player | undefined {
		return this.players.get(playerId);
	}
}

/**
 * Helper exportado para testes — primeiro assento livre (F-027).
 */
export function computeFirstFreeSeat(players: readonly Player[]): number {
	const taken = new Set<number>();
	for (const p of players) taken.add(p.seatIndex);
	for (let s = 0; s < SEAT_COUNT; s++) {
		if (!taken.has(s)) return s;
	}
	throw new Error("no free seat — sala cheia");
}

/**
 * Constante exportada para hubs/UI: 12 assentos é o limite duro.
 */
export const SALA_SEAT_COUNT = SEAT_COUNT;
/** Constante: timer inicial / máximo em segundos. */
export const SALA_TIMER_SECONDS = TIMER_SECONDS;
/** Constante: grace period pra remover player disconnected. */
export const SALA_DISCONNECT_GRACE_MS = DISCONNECT_GRACE_MS;
