/**
 * Hub — orquestrador de salas do servidor Pointly (Phase 3 — T17, T13-T18 glue)
 *
 * Responsabilidades:
 *  - Mantém `Map<code, Sala>` indexada por código curto de 4 chars (ADR-0005)
 *  - Mantém `Map<playerId, Sala>` para roteamento rápido de eventos
 *  - Coordena os handlers (hello/cast_vote/reveal/...) — cada um chama Hub,
 *    Hub aplica a mutação na Sala e devolve outcome para o broadcast
 *  - Fornece `findPlayerForConnection()` para T13a reconnect
 *  - Owns o periodic cleanup do grace period (60s) e timer ticks (1s)
 *
 * O Hub é o único lugar que tem autorização pra chamar mutações em Sala.
 * Handlers T13-T16 são wrappers finos que validam input e delegam ao Hub.
 *
 * @see docs/adr/0005-v1-functional-in-memory-state.md
 * @see docs/adr/0009-reconnect-uuid-strategy.md
 */

import { randomUUID } from "node:crypto";
import {
	generateUniqueCode,
	type SalaState,
	type Player,
} from "@planning-poker/shared";
import { computeFirstFreeSeat, Sala, SALA_SEAT_COUNT } from "./sala";

// ---------------------------------------------------------------------------
// Hub — connection tracking
// ---------------------------------------------------------------------------

/**
 * Hub é uma classe por processo Bun. Estado em memória, sem DB.
 *
 * Separamos:
 *  - `salas`  — Map<codigo, Sala>
 *  - `byPlayerId` — Map<playerId, code>  (qual sala esse player está?)
 *  - `byUUID`     — Map<uuid, playerId> (busca por UUID pra reconnect)
 *
 * byPlayerId + byUUID são server-only e NUNCA vão no wire format.
 */
export class Hub {
	readonly salas: Map<string, Sala> = new Map();
	private readonly byPlayerId: Map<string, string> = new Map();
	private readonly byUUID: Map<string, string> = new Map();

	// -------------------------------------------------------------------------
	// Sala lookup
	// -------------------------------------------------------------------------

	/**
	 * @returns Sala por código. Null se não existe.
	 */
	getSala(code: string): Sala | null {
		return this.salas.get(code) ?? null;
	}

	/**
	 * @returns Sala onde esse playerId está conectado (status='connected').
	 * Null se player não existe, está disconnected, ou foi removido.
	 */
	getSalaForPlayer(playerId: string): Sala | null {
		const code = this.byPlayerId.get(playerId);
		if (!code) return null;
		return this.salas.get(code) ?? null;
	}

	/**
	 * @returns Player por UUID em qualquer sala. Null se não existe.
	 * Usado por reconnect (T13a) e cleanup (T18).
	 */
	findPlayerByUUID(uuid: string): Player | null {
		const playerId = this.byUUID.get(uuid);
		if (!playerId) return null;
		const sala = this.getSalaForPlayer(playerId);
		return sala?.getPlayer(playerId) ?? null;
	}

	/**
	 * @returns código da sala onde esse UUID está. Null se não existe.
	 */
	getCodeForUUID(uuid: string): string | null {
		const playerId = this.byUUID.get(uuid);
		if (!playerId) return null;
		return this.byPlayerId.get(playerId) ?? null;
	}

	/**
	 * Lista todos os códigos ativos. Usado por graceful shutdown (T18)
	 * pra broadcast `sala_ended` em cada sala antes do processo encerrar.
	 */
	activeCodes(): string[] {
		return Array.from(this.salas.keys());
	}

	// -------------------------------------------------------------------------
	// Sala lifecycle
	// -------------------------------------------------------------------------

	/**
	 * Cria nova sala. Gera código único (T7a). Adiciona player como host.
	 *
	 * @returns `{ playerId, sala }` para o hello handler retornar welcome.
	 * @throws SalaError sala_cheia impossível, mas geramos CodeCollisionError.
	 */
	createSala(host: Player): { playerId: string; sala: Sala } {
		const existingCodes = new Set(this.salas.keys());
		const code = generateUniqueCode(existingCodes);
		const sala = new Sala(code, host);
		this.salas.set(code, sala);
		this.byPlayerId.set(host.id, code);
		this.byUUID.set(host.uuid, host.id);
		return { playerId: host.id, sala };
	}

	/**
	 * Adiciona player a sala existente.
	 * Lança `SalaError` se sala_cheia, sala_nao_encontrada, ou uuid duplicado.
	 *
	 * @returns playerId atribuído (mesmo do input.Player.id).
	 */
	addPlayer(code: string, player: Player): { playerId: string; sala: Sala } {
		const sala = this.salas.get(code);
		if (!sala) {
			throw new HubError("sala_nao_encontrada", `Sala ${code} não existe.`);
		}
		// Reject se UUID já está nesta sala (double-join)
		if (this.byUUID.get(player.uuid) === player.id) {
			// Já está, idempotente
			return { playerId: player.id, sala };
		}
		if (this.byUUID.has(player.uuid)) {
			throw new HubError(
				"internal_error",
				`UUID ${player.uuid} já está em uso por outro player.`,
			);
		}
		const seated = sala.addPlayer(player);
		this.byPlayerId.set(seated.id, code);
		this.byUUID.set(seated.uuid, seated.id);
		return { playerId: seated.id, sala };
	}

	/**
	 * Remove player da sala. Promove novo host se host saiu com outros.
	 * Se sala ficou vazia, remove do Map.
	 *
	 * @returns `{ code, promotedPlayerId }` — null promoted se sala vazia
	 */
	removePlayer(playerId: string): {
		code: string | null;
		promoted: string | null;
	} {
		const code = this.byPlayerId.get(playerId);
		if (!code) return { code: null, promoted: null };
		const sala = this.salas.get(code);
		if (!sala) {
			// Sala sumiu (cleanup raced) — limpa índice
			this.byPlayerId.delete(playerId);
			return { code: null, promoted: null };
		}
		const { promoted } = sala.removePlayer(playerId);
		this.byPlayerId.delete(playerId);
		// UUID lookup é mantido até o hub.findPlayerByUUID checar status.
		// (Player ainda existe na sala como disconnected no grafo, mas
		// removemos do byUUID pra hello novo com mesmo UUID criar player novo.)
		const player = sala.getPlayer(playerId);
		if (player && player.status === "connected") {
			this.byUUID.delete(player.uuid);
		}
		// Sala vazia → remove do Map (T18)
		if (sala.playerCount === 0) {
			this.salas.delete(code);
			return { code, promoted: null };
		}
		return { code, promoted };
	}

	/**
	 * Reconnect: encontra player por UUID, marca como connected.
	 * Hub centraliza a busca pra evitar double-lookup entre handlers.
	 */
	reconnect(
		uuid: string,
	): { playerId: string; sala: Sala; code: string } | null {
		const playerId = this.byUUID.get(uuid);
		if (!playerId) return null;
		const code = this.byPlayerId.get(playerId);
		if (!code) {
			this.byUUID.delete(uuid);
			return null;
		}
		const sala = this.salas.get(code);
		if (!sala) {
			this.byPlayerId.delete(playerId);
			this.byUUID.delete(uuid);
			return null;
		}
		const reconnected = sala.markConnected(uuid);
		if (!reconnected) return null;
		return { playerId, sala, code };
	}

	/**
	 * Marca player como disconnected (websocket closed, mas grace period).
	 * NÃO remove ainda — T18 cleanup remove após 60s.
	 */
	markDisconnected(playerId: string, now: number = Date.now()): void {
		const sala = this.getSalaForPlayer(playerId);
		if (!sala) return;
		sala.markDisconnected(playerId, now);
	}

	// -------------------------------------------------------------------------
	// Cleanup (T18)
	// -------------------------------------------------------------------------

	/**
	 * Roda a cada 10s. Remove players disconnected há mais de 60s.
	 * Se sala fica vazia como resultado, T18 logic remove do Map.
	 *
	 * @returns lista de (code, playerId) removidos (para broadcast ou log)
	 */
	tickGracePeriod(
		now: number = Date.now(),
	): { code: string; playerId: string }[] {
		const removed: { code: string; playerId: string }[] = [];
		for (const [code, sala] of this.salas) {
			const salaRemovals = sala.tickGracePeriod(now);
			for (const playerId of salaRemovals) {
				const player = sala.getPlayer(playerId); // já removido
				if (player) this.byUUID.delete(player.uuid);
				this.byPlayerId.delete(playerId);
				removed.push({ code, playerId });
				if (sala.playerCount === 0) {
					this.salas.delete(code);
				}
			}
		}
		return removed;
	}

	/**
	 * Timer tick: cada Sala roda seu próprio decrement. Hub chama tick() em cada.
	 * @returns lista de (code, sala) que auto-revelaram neste tick
	 */
	tickAllTimers(): { code: string; sala: Sala }[] {
		const fired: { code: string; sala: Sala }[] = [];
		for (const [code, sala] of this.salas) {
			if (sala.tick()) {
				fired.push({ code, sala });
			}
		}
		return fired;
	}

	/**
	 * Shutdown gracioso — T18 SIGTERM. Para todos os timers das salas.
	 * Sala é removida do Map in-memory; clientes recebem `sala_ended` no broadcast.
	 */
	shutdown(): void {
		// Salas em memória são descartadas quando o processo morre.
		// Hub não tem responsabilidade de persistir — broadcast é responsabilidade
		// do WS layer (T17) que envia `sala_ended` antes de fechar conexões.
		this.salas.clear();
		this.byPlayerId.clear();
		this.byUUID.clear();
	}
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Erros lançados pelo Hub. Handlers mapeiam para `error { code }` no WS.
 */
export class HubError extends Error {
	readonly code:
		| "sala_cheia"
		| "sala_nao_encontrada"
		| "invalid_nick"
		| "internal_error";
	constructor(code: HubError["code"], message: string) {
		super(message);
		this.name = "HubError";
		this.code = code;
	}
}

// ---------------------------------------------------------------------------
// ID helpers
// ---------------------------------------------------------------------------

/**
 * Gera ID de player e uuid se input não os fornece. Hub usa pra criar player.
 * Centraliza a random generation pra testes poderem mockar.
 */
export function makePlayerId(): string {
	return `p_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

/**
 * Helper pra formatar SalaState pro wire format (re-export para uso dos handlers).
 */
export function snapshotSala(sala: Sala): SalaState & { critical: boolean } {
	return sala.toState();
}

/**
 * Re-exports para evitar import circular em handlers.
 */
export { SALA_SEAT_COUNT, computeFirstFreeSeat };
