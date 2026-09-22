/**
 * Sala — Planning Poker state machine (Phase 3 — T12)
 *
 * Sala encapsula o estado canônico de uma partida Planning Poker:
 *  - Map<playerId, Player> com uuid + nick + seatIndex + voto
 *  - phase: idle → voting → revealable → revealed → (loop) → voting
 *  - round: contador 1-based (incrementado em `startNewRound`)
 *  - sem timer: votação sem pressa, reveal só manual
 *
 * Domain: Sala é container efêmero (CONTEXT.md).
 * Registrada no `Hub` (T17) por `Map<codigo, Sala>`. Removida quando o
 * último player sai (T18).
 *
 * @see docs/adr/0005-v1-functional-in-memory-state.md
 * @see docs/adr/0009-reconnect-uuid-strategy.md        (UUID como reconnect handle)
 * @see docs/adr/0002-host-is-creator-not-ruler.md      (host fraco; reveal/new_round democráticos)
 */

import { randomUUID } from "node:crypto";
import {
	DECK_VALUES,
	HistoriaCriterioSchema,
	HistoriaTituloSchema,
	PAUTA_MAX_HISTORIAS,
	PROJECTILE_CHAIR_COOLDOWN_MS,
	PROJECTILE_COOLDOWN_MS,
	type ConsensusStats,
	type Historia,
	type Player,
	type Phase,
	type SalaState,
	type Vote,
	type VotesRevealedEvent,
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
		| "role_denied"
		| "invalid_nick"
		| "pauta_cheia"
		| "historia_nao_encontrada";
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
/**
 * Grace period pós-queda: 6min (cobre o backoff de 5min do cliente com
 * folga — o `hello` com o mesmo UUID reidrata voto, assento e fase).
 */
const DISCONNECT_GRACE_MS = 360_000;
/** Espectadores extras além dos 12 assentos (não votam, seatIndex -1). */
const SPECTATOR_CAP = 12;

export type RevealOutcome = VotesRevealedEvent;

/**
 * Sala — uma partida Planning Poker. Mutável in-place; o hub serializa
 * snapshots via `toState()` para mandar pelo WS.
 */
export class Sala {
	readonly code: string;
	readonly createdAt: number;
	hostId: string | null;
	round: number = 1;
	phase: Phase = "idle";
	readonly players: Map<string, Player> = new Map();
	readonly votes: Map<string, Vote> = new Map();

	/**
	 * Pauta efêmera em memória (issue #162, parent #160). Some junto com a
	 * Sala (hub remove a Sala quando o último sai — sem persistência).
	 * Ordem canônica = índice no array; `ordem` espelha o índice.
	 */
	pauta: Historia[] = [];
	/** História ativa da rodada. `null` = nenhuma ativa. */
	historiaAtualId: string | null = null;

	/**
	 * Server-internal: timestamp (epoch ms) de quando cada player
	 * disconnectou pela última vez. NÃO vai no wire format (SalaState).
	 * Usado por `tickGracePeriod()` para remover player após o grace period.
	 */
	private readonly disconnectedAt: Map<string, number> = new Map();

	/**
	 * Server-internal: timestamp (epoch ms) e tipo da última interação
	 * (arremesso ou cutucada — issue #172) de cada player. NÃO vai no wire
	 * format. Usado para validar o cooldown compartilhado entre interações.
	 */
	private readonly lastInteractionAt: Map<string, number> = new Map();
	private readonly lastInteractionType: Map<string, string> = new Map();

	/**
	 * EVR-04/EVR-05: tracking primitive pra edições pós-reveal.
	 * Marcado `true` em `castVote()` quando phase='revealed' e o voto
	 * realmente mudou. `consumeConsensusDirty()` é chamado por
	 * `broadcastRoomState` no WS handler, retornando E limpando
	 * atomicamente. Comportamentalmente redundante com o broadcast
	 * imediato já existente (T5); especificado para rastrear
	 * "consenso precisa de re-broadcast" como flag explícita.
	 */
	private consensusDirty: boolean = false;

	constructor(code: string, firstPlayer: Player, now: number = Date.now()) {
		if (firstPlayer.role !== "host" && firstPlayer.role !== "spectator") {
			throw new Error("first player must have role: 'host' or 'spectator'");
		}
		this.code = code;
		this.createdAt = now;
		if (firstPlayer.role === "spectator") {
			this.hostId = null;
			this.players.set(firstPlayer.id, { ...firstPlayer, seatIndex: -1 });
		} else {
			this.hostId = firstPlayer.id;
			this.players.set(firstPlayer.id, firstPlayer);
		}
	}

	// -----------------------------------------------------------------------
	// Players
	// -----------------------------------------------------------------------

	/**
	 * Adiciona player à sala. Lança `SalaError` se sala cheia (sala_cheia).
	 * Votantes (host/player) ocupam assento 0..11, limite 12.
	 * Espectadores usam seatIndex -1, não ocupam assento nem contam no
	 * limite de 12 — limite duro total 24 para evitar broadcast gigante.
	 */
	addPlayer(player: Player): Player {
		if (player.role === "spectator") {
			if (this.players.size >= SEAT_COUNT + SPECTATOR_CAP) {
				throw new SalaError(
					"sala_cheia",
					`Sala ${this.code} cheia para espectadores.`,
				);
			}
			const watching: Player = { ...player, seatIndex: -1 };
			this.players.set(watching.id, watching);
			return watching;
		}
		let seatedCount = 0;
		for (const p of this.players.values()) {
			if (p.seatIndex >= 0) seatedCount += 1;
		}
		if (seatedCount >= SEAT_COUNT) {
			throw new SalaError(
				"sala_cheia",
				`Sala ${this.code} tem ${SEAT_COUNT}/${SEAT_COUNT} jogadores.`,
			);
		}
		const seatIndex = this.firstFreeSeat();
		const base: Player = { ...player, seatIndex };
		// Sala criada por espectador fica sem host até o primeiro votante
		// entrar — esse votante assume o host automaticamente.
		if (this.hostId == null) {
			const hosted: Player = { ...base, role: "host" };
			this.players.set(hosted.id, hosted);
			this.hostId = hosted.id;
			return hosted;
		}
		this.players.set(base.id, base);
		return base;
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
		this.lastInteractionAt.delete(playerId);
		this.lastInteractionType.delete(playerId);

		// Host saiu e ainda há outros → promove mais antigo
		// (espectador nunca vira host; se só restarem espectadores, hostId zera).
		let promoted: string | null = null;
		if (this.players.size > 0 && this.hostId === playerId) {
			promoted = this.promoteOldestPlayer()?.id ?? null;
			if (promoted == null) this.hostId = null;
		}
		const promotedId = promoted;

		// Sala ficou vazia: limpa hostId e reseta estado
		if (this.players.size === 0) {
			this.hostId = null;
			this.phase = "idle";
			// Pauta efêmera some junto com a Sala (#160: sem persistência).
			this.pauta.length = 0;
			this.historiaAtualId = null;
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
	 * Define ou remove o avatar do player (avatar-perfil-mesa AV-06).
	 * `null` remove o campo (volta a iniciais). Lança `SalaError`
	 * (`invalid_phase`) se o player não está na sala.
	 */
	setAvatar(playerId: string, avatar: string | null): void {
		const player = this.players.get(playerId);
		if (!player) {
			throw new SalaError(
				"invalid_phase",
				`Player ${playerId} não está na sala.`,
			);
		}
		if (avatar === null) {
			const { avatar: _dropped, ...rest } = player;
			void _dropped;
			this.players.set(playerId, rest);
			return;
		}
		this.players.set(playerId, { ...player, avatar });
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
	 * Promove o votante com menor `joinedAt` a host. Null se sala vazia
	 * ou só com espectadores. Idempotente: se já existe um host válido,
	 * retorna esse host sem mexer.
	 *
	 * F-048 (grilling 2026-07-04): host é "criador", não "governante".
	 * Reveal/new_round continuam democráticos. Espectador nunca vira host.
	 */
	promoteOldestPlayer(): Player | null {
		if (this.players.size === 0) return null;
		if (this.hostId && this.players.has(this.hostId)) {
			const current = this.players.get(this.hostId)!;
			if (current.role === "host") return current;
		}
		let oldest: Player | null = null;
		for (const p of this.players.values()) {
			if (p.role === "spectator") continue;
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
	 * Delega ao helper exportado (SSOT — antes loop duplicado aqui e
	 * em `computeFirstFreeSeat`).
	 */
	private firstFreeSeat(): number {
		return computeFirstFreeSeat([...this.players.values()]);
	}

	// -----------------------------------------------------------------------
	// Voting
	// -----------------------------------------------------------------------

	/**
	 * Registra/atualiza voto de um player. Idempotente em `value`.
	 *
	 * Regras:
	 *  - `phase` aceita: idle|voting|revealable (voto) + revealed (edição pós-reveal EVR-01)
	 *  - `value === null` → `invalid_vote` (un-vote proibido — spec F-012)
	 *  - `value ∉ DECK_VALUES` → `invalid_vote`
	 *  - Marca `hasVoted = true`, atualiza in-place (F-011 idempotência)
	 *  - Se primeiro voto da rodada, phase → 'voting'
	 *  - Se todos os conectados votaram, phase → 'revealable'
	 *
	 * @returns `{ changed: boolean }` — `false` quando o voto é idêntico
	 *   ao já registrado (F-011 + EVR-14). Útil para o handler
	 *   suprimir broadcasts em no-op. Lança `SalaError` em falha de
	 *   validação.
	 */
	castVote(playerId: string, value: Vote | null): { changed: boolean } {
		const player = this.players.get(playerId);
		if (!player) {
			throw new SalaError(
				"invalid_vote",
				`Player ${playerId} não está na sala.`,
			);
		}
		if (player.role === "spectator") {
			throw new SalaError("role_denied", "Espectadores não votam.");
		}
		if (value === null) {
			throw new SalaError("invalid_vote", "Un-vote (value=null) é proibido.");
		}
		if (!DECK_VALUES.includes(value as Vote)) {
			throw new SalaError("invalid_vote", `Valor fora do deck: ${value}`);
		}
		if (
			this.phase !== "idle" &&
			this.phase !== "voting" &&
			this.phase !== "revealable" &&
			this.phase !== "revealed"
		) {
			throw new SalaError(
				"invalid_phase",
				`invalid_phase: cast_vote requer phase=idle|voting|revealable; atual=${this.phase}`,
			);
		}

		// EVR-14: idempotência servidor-side — clicar na mesma carta
		// duas vezes não deve disparar mutação nem broadcast.
		const previous = player.value;
		if (previous === value) {
			return { changed: false };
		}

		// Update in-place (F-011 idempotência)
		const updated: Player = { ...player, value, hasVoted: true };
		this.players.set(playerId, updated);
		this.votes.set(playerId, value);

		// EVR-04/EVR-05: edição pós-reveal marca consensus como dirty.
		// `recomputeConsensus()` é side-effect-free (valor descartado) —
		// só executamos pra forçar a checagem de invariantes e dar
		// cobertura testável. WS handler consome o flag em T5.
		// #162: Pontuação da ativa segue o recompute (mediana atual).
		if (this.phase === "revealed") {
			const stats = this.recomputeConsensus();
			this.markConsensusDirty();
			this.stampActivePontos(stats.median);
		}

		// Primeira transição da rodada: idle → voting (F-013)
		if (this.phase === "idle") {
			this.phase = "voting";
		}

		// Phase 'voting' → 'revealable' se todos conectados votaram (F-014 prep)
		if (this.allConnectedVoted() && this.phase === "voting") {
			this.phase = "revealable";
		}

		return { changed: true };
	}

	/**
	 * Qualquer player pode revelar (sem role check — ADR-0002 grilling).
	 *
	 * Regras:
	 *  - `phase === 'voting' || phase === 'revealable'` aceito
	 *  - Calcula stats via `computeConsensus` (F-020)
	 *  - Detecta unanimous via `isUnanimous`
	 *  - Phase → 'revealed'
	 */
	reveal(_playerId: string): RevealOutcome {
		if (this.phase !== "voting" && this.phase !== "revealable") {
			throw new SalaError(
				"invalid_phase",
				`invalid_phase: reveal requer phase=voting|revealable; atual=${this.phase}`,
			);
		}

		const stats = this.consensusSnapshot();
		this.phase = "revealed";

		// #162: Pontuação = mediana atual carimbada na ativa enquanto
		// revealed (sem override manual no v1). Sem ativa = sala legada.
		this.stampActivePontos(stats.median);

		return {
			votes: Object.fromEntries(this.votes),
			median: stats.median,
			mean: stats.mean,
			range: stats.range,
			unanimous: stats.unanimous,
		};
	}

	/**
	 * Valida e registra o arremesso de um projétil de um player.
	 * Disponível em qualquer fase; cooldown de 1 segundo por participante
	 * (8 segundos para a cadeirada épica).
	 */
	throwProjectile(senderId: string, now: number = Date.now(), projectileType = "paper_ball"): void {
		const cooldown = projectileType === "chair"
			? PROJECTILE_CHAIR_COOLDOWN_MS
			: PROJECTILE_COOLDOWN_MS;
		this.assertCooldown(
			senderId,
			now,
			cooldown,
			projectileType,
			"Aguarde o cooldown para arremessar novamente.",
		);
	}

	/**
	 * Cutucada (issue #172): registra a interação de um player. Mesmo portão
	 * de cooldown do arremesso (roadmap: "sob o mesmo cooldown dos
	 * projéteis") — cutucar e arremessar competem pela mesma recarga.
	 */
	sendNudge(senderId: string, now: number = Date.now()): void {
		this.assertCooldown(
			senderId,
			now,
			PROJECTILE_COOLDOWN_MS,
			"nudge",
			"Aguarde o cooldown para cutucar novamente.",
		);
	}

	/**
	 * Portão único de cooldown das interações (arremesso e cutucada).
	 * A recarga efetiva é o maior valor entre a do item atual e a do último
	 * usado — cadeirada épica segura o gate por 8s para o próximo item.
	 * Registra a interação quando libera.
	 */
	private assertCooldown(
		senderId: string,
		now: number,
		nextCooldownMs: number,
		type: string,
		message: string,
	): void {
		const lastType = this.lastInteractionType.get(senderId);
		const lastCooldown = lastType === "chair"
			? PROJECTILE_CHAIR_COOLDOWN_MS
			: PROJECTILE_COOLDOWN_MS;
		const cooldown = Math.max(nextCooldownMs, lastCooldown);
		const last = this.lastInteractionAt.get(senderId);
		if (last !== undefined && now - last < cooldown) {
			throw new SalaError("invalid_phase", message);
		}
		this.lastInteractionAt.set(senderId, now);
		this.lastInteractionType.set(senderId, type);
	}

	/**
	 * Qualquer player pode iniciar nova rodada (sem role check — ADR-0002).
	 *
	 * Regras:
	 *  - `phase === 'revealed'` aceito
	 *  - Limpa votes e hasVoted de todos players
	 *  - Incrementa round
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
		this.phase = "voting";
		// #162: Nova Rodada auto-avança para a próxima não-pontuada.
		// Última pontuada → sem ativa (null).
		this.advancePautaToNextUnscored();
	}

	// -----------------------------------------------------------------------
	// Pauta — domínio em memória (#162, parent #160)
	// -----------------------------------------------------------------------

	/**
	 * História por id. `undefined` se não existe.
	 */
	getHistoria(id: string): Historia | undefined {
		return this.pauta.find((h) => h.id === id);
	}

	/**
	 * Cria história no fim da pauta. Primeira criada auto-seleciona
	 * (quando não há ativa). Democrático: host/player podem; espectador
	 * recebe `role_denied`. Pauta cheia (50) → `pauta_cheia`.
	 */
	addHistoria(
		callerId: string,
		input: { titulo: string; criterio?: string },
	): Historia {
		this.requirePautaEditor(callerId);
		if (this.pauta.length >= PAUTA_MAX_HISTORIAS) {
			throw new SalaError(
				"pauta_cheia",
				`pauta_cheia: máximo ${PAUTA_MAX_HISTORIAS} histórias`,
			);
		}
		const titulo = HistoriaTituloSchema.parse(input.titulo);
		let criterio: string | undefined;
		if (input.criterio !== undefined) {
			criterio = HistoriaCriterioSchema.parse(input.criterio);
		}
		const historia: Historia = {
			id: makeHistoriaId(new Set(this.pauta.map((h) => h.id))),
			titulo,
			...(criterio !== undefined ? { criterio } : {}),
			pontos: null,
			ordem: this.pauta.length,
		};
		this.pauta.push(historia);
		// Primeira criada (ou pauta sem ativa) auto-seleciona.
		if (this.historiaAtualId == null) {
			this.historiaAtualId = historia.id;
		}
		return { ...historia };
	}

	/**
	 * Edição parcial de texto (last-write-wins). Sempre editável —
	 * inclusive pontuada e inclusive a ativa em voting/revealable (só
	 * texto, não invalida voto). Nunca toca `pontos`/`ordem` (sem
	 * override manual no v1). `criterio: null` limpa o critério.
	 */
	updateHistoria(
		callerId: string,
		id: string,
		patch: { titulo?: string; criterio?: string | null },
	): Historia {
		this.requirePautaEditor(callerId);
		const idx = this.pauta.findIndex((h) => h.id === id);
		if (idx === -1) {
			throw new SalaError(
				"historia_nao_encontrada",
				`História ${id} não encontrada.`,
			);
		}
		const cur = this.pauta[idx]!;
		let nextTitulo = cur.titulo;
		let nextCriterio = cur.criterio;
		if (patch.titulo !== undefined) {
			nextTitulo = HistoriaTituloSchema.parse(patch.titulo);
		}
		if (patch.criterio !== undefined) {
			nextCriterio =
				patch.criterio === null
					? undefined
					: HistoriaCriterioSchema.parse(patch.criterio);
		}
		const next: Historia = {
			...cur,
			titulo: nextTitulo,
			...(nextCriterio === undefined ? {} : { criterio: nextCriterio }),
			pontos: cur.pontos,
			ordem: cur.ordem,
		};
		if (nextCriterio === undefined) {
			const { criterio: _dropped, ...rest } = next;
			void _dropped;
			this.pauta[idx] = rest as Historia;
			return { ...(this.pauta[idx] as Historia) };
		}
		this.pauta[idx] = next;
		return { ...next };
	}

	/**
	 * Reordena por índice explícito (sem drag na UI). Move só a
	 * história-alvo; `ordem` reindexada 0..n-1. Mover a ativa em
	 * voting/revealable → `invalid_phase`; mover não-ativa é livre.
	 * `toIndex` fora da pauta real → `historia_nao_encontrada`.
	 */
	moveHistoria(callerId: string, id: string, toIndex: number): Historia[] {
		this.requirePautaEditor(callerId);
		const from = this.pauta.findIndex((h) => h.id === id);
		if (from === -1) {
			throw new SalaError(
				"historia_nao_encontrada",
				`História ${id} não encontrada.`,
			);
		}
		if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= this.pauta.length) {
			throw new SalaError(
				"historia_nao_encontrada",
				`Destino ${toIndex} fora da pauta (0..${this.pauta.length - 1}).`,
			);
		}
		this.assertActiveNotLocked(id, "reordenar");
		const [item] = this.pauta.splice(from, 1);
		this.pauta.splice(toIndex, 0, item!);
		this.reindexPauta();
		return this.pauta.map((h) => ({ ...h }));
	}

	/**
	 * Remove da pauta e reindexa. Apagar a ativa em voting/revealable →
	 * `invalid_phase` (rodada intacta). Apagar pontuada exige
	 * `confirmScored: true`, senão `invalid_phase`. Remover a ativa
	 * (em idle/revealed) limpa `historiaAtualId`.
	 */
	removeHistoria(
		callerId: string,
		id: string,
		opts?: { confirmScored?: boolean },
	): Historia {
		this.requirePautaEditor(callerId);
		const idx = this.pauta.findIndex((h) => h.id === id);
		if (idx === -1) {
			throw new SalaError(
				"historia_nao_encontrada",
				`História ${id} não encontrada.`,
			);
		}
		this.assertActiveNotLocked(id, "apagar");
		const target = this.pauta[idx]!;
		if (target.pontos !== null && opts?.confirmScored !== true) {
			throw new SalaError(
				"invalid_phase",
				"História pontuada exige confirmação (confirmScored).",
			);
		}
		const [removed] = this.pauta.splice(idx, 1);
		this.reindexPauta();
		if (this.historiaAtualId === id) {
			this.historiaAtualId = null;
		}
		return { ...removed! };
	}

	/**
	 * Define a história ativa. `null` limpa. Liberada apenas em
	 * idle/revealed; em voting/revealable qualquer troca (inclusive
	 * limpar) → `invalid_phase` sem invalidar votos. No-op (mesmo id
	 * ou null repetido) é permitido em qualquer fase.
	 */
	selectHistoria(callerId: string, historiaId: string | null): void {
		this.requirePautaEditor(callerId);
		if (historiaId === this.historiaAtualId) return;
		if (this.isVotingPhase()) {
			throw new SalaError(
				"invalid_phase",
				"invalid_phase: historia_select requer phase=idle|revealed; atual=" +
					this.phase,
			);
		}
		if (historiaId === null) {
			this.historiaAtualId = null;
			return;
		}
		const found = this.pauta.some((h) => h.id === historiaId);
		if (!found) {
			throw new SalaError(
				"historia_nao_encontrada",
				`História ${historiaId} não encontrada.`,
			);
		}
		this.historiaAtualId = historiaId;
	}

	// -----------------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------------

	/**
	 * Verdade se todos os votantes conectados votaram. Usado na transição
	 * voting → revealable. Disconnected e spectators não contam.
	 */
	private allConnectedVoted(): boolean {
		let connectedCount = 0;
		let connectedVoted = 0;
		for (const p of this.players.values()) {
			if (p.status !== "connected") continue;
			if (p.role === "spectator") continue;
			connectedCount += 1;
			if (p.hasVoted) connectedVoted += 1;
		}
		return connectedCount > 0 && connectedCount === connectedVoted;
	}

	/**
	 * #162: garante que o chamador pode editar a pauta. Espectador →
	 * `role_denied`; chamador fora da sala → `historia_nao_encontrada`.
	 */
	private requirePautaEditor(callerId: string): Player {
		const caller = this.players.get(callerId);
		if (!caller) {
			throw new SalaError(
				"historia_nao_encontrada",
				`Player ${callerId} não está na sala.`,
			);
		}
		if (caller.role === "spectator") {
			throw new SalaError("role_denied", "Espectadores não editam a pauta.");
		}
		return caller;
	}

	/**
	 * #162: `true` em voting/revealable (votos em curso).
	 */
	private isVotingPhase(): boolean {
		return this.phase === "voting" || this.phase === "revealable";
	}

	/**
	 * #162: apagar/reordenar a ativa em voting/revealable é
	 * `invalid_phase` (rodada intacta — chamador não muta nada).
	 */
	private assertActiveNotLocked(id: string, verbo: string): void {
		if (this.isVotingPhase() && this.historiaAtualId === id) {
			throw new SalaError(
				"invalid_phase",
				`invalid_phase: não é possível ${verbo} a ativa em ${this.phase}`,
			);
		}
	}

	/**
	 * #162: `ordem` espelha o índice (0..n-1) após move/remove.
	 */
	private reindexPauta(): void {
		for (let i = 0; i < this.pauta.length; i++) {
			this.pauta[i]!.ordem = i;
		}
	}

	/**
	 * #162: Pontuação = mediana atual carimbada na ativa. Chamada no
	 * reveal e no recompute pós-reveal. Sem ativa = no-op (sala legada).
	 */
	private stampActivePontos(median: number | null): void {
		if (this.historiaAtualId == null) return;
		const idx = this.pauta.findIndex((h) => h.id === this.historiaAtualId);
		if (idx === -1) return;
		this.pauta[idx] = { ...this.pauta[idx]!, pontos: median };
	}

	/**
	 * #162: Nova Rodada auto-avança para a próxima não-pontuada após a
	 * ativa atual. Atual ainda não-pontuada (ex. mediana null) = mantém.
	 * Nenhuma à frente → sem ativa (null). Sem ativa atual = primeira
	 * não-pontuada do início.
	 */
	private advancePautaToNextUnscored(): void {
		if (this.pauta.length === 0) {
			this.historiaAtualId = null;
			return;
		}
		if (this.historiaAtualId == null) {
			const first = this.pauta.find((h) => h.pontos == null);
			this.historiaAtualId = first ? first.id : null;
			return;
		}
		const idx = this.pauta.findIndex((h) => h.id === this.historiaAtualId);
		if (idx === -1) {
			const first = this.pauta.find((h) => h.pontos == null);
			this.historiaAtualId = first ? first.id : null;
			return;
		}
		if (this.pauta[idx]!.pontos == null) return;
		for (let i = idx + 1; i < this.pauta.length; i++) {
			if (this.pauta[i]!.pontos == null) {
				this.historiaAtualId = this.pauta[i]!.id;
				return;
			}
		}
		this.historiaAtualId = null;
	}

	/**
	 * Ponto único de cálculo de consenso sobre `this.votes` (SSOT).
	 * Antes o trio `computeConsensus + isUnanimous + fromEntries` estava
	 * copiado em `reveal()`, `recomputeConsensus()` e no `ws.ts`.
	 */
	private consensusSnapshot(): ConsensusStats & { unanimous: boolean } {
		const voteList = Array.from(this.votes.values());
		return { ...computeConsensus(voteList), unanimous: isUnanimous(voteList) };
	}

	/**
	 * EVR-04: recalcula consensus a partir do estado atual de `votes`.
	 * Side-effect-free (apenas lê `this.votes` e devolve stats).
	 * Exposto como helper público para testes unitários (T6) e como
	 * ponto único de recompute pós-reveal.
	 */
	recomputeConsensus(): ConsensusStats & { unanimous: boolean } {
		return this.consensusSnapshot();
	}

	/**
	 * Consenso pronto para broadcast `votes_revealed` (usado pelo WS
	 * em vez de recomputar `computeConsensus/isUnanimous` inline).
	 */
	getConsensusEvent(): RevealOutcome {
		return {
			votes: Object.fromEntries(this.votes),
			...this.consensusSnapshot(),
		};
	}

	/**
	 * EVR-04: marca a flag `consensusDirty`. Idempotente.
	 */
	markConsensusDirty(): void {
		this.consensusDirty = true;
	}

	/**
	 * EVR-05: lê-e-limpa atomicamente. WS handler chama em cada
	 * `broadcastRoomState` para rastreabilidade. Retorna o estado
	 * anterior e zera a flag.
	 */
	consumeConsensusDirty(): boolean {
		const was = this.consensusDirty;
		this.consensusDirty = false;
		return was;
	}

	// -----------------------------------------------------------------------
	// Wire format
	// -----------------------------------------------------------------------

	/**
	 * Snapshot serializável para broadcast `room_state` (F sala_state_event).
	 */
	toState(): SalaState {
		return {
			code: this.code,
			hostId: this.hostId,
			players: Array.from(this.players.values()),
			phase: this.phase,
			round: this.round,
			votes: Object.fromEntries(this.votes),
			createdAt: this.createdAt,
			pauta: this.pauta.map((h) => ({ ...h })),
			historiaAtualId: this.historiaAtualId,
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
 * Gera id único de história (`h_<12 hex>`). Colisão improvável, mas o
 * loop garante unicidade dentro da pauta.
 */
function makeHistoriaId(existing: Set<string>): string {
	let id = `h_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
	while (existing.has(id)) {
		id = `h_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
	}
	return id;
}

/**
 * Constante exportada para hubs/UI: 12 assentos é o limite duro.
 */
export const SALA_SEAT_COUNT = SEAT_COUNT;
/** Espectadores extras além dos 12 assentos. */
export const SALA_SPECTATOR_CAP = SPECTATOR_CAP;
/** Constante: grace period pra remover player disconnected. */
export const SALA_DISCONNECT_GRACE_MS = DISCONNECT_GRACE_MS;
