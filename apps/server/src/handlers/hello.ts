/**
 * hello handler — Phase 3 / T13 + T13a
 *
 * Valida nick (2-20 chars, sem espaços duplos/nas pontas).
 * Cria sala (sem code) ou faz join (com code).
 * Reconnect: UUID já em sala → reidrata player (F-037/F-038).
 *
 * **Room migration** (reg 2026-07-06): se o UUID está em uma sala A e o
 * cliente envia `code` apontando para sala B, evict de A e add em B.
 * Sem isso, `addPlayer` lançava `internal_error` ("UUID em uso") porque
 * `hub.reconnect` chamava `sala.markConnected` como side-effect mesmo
 * quando o caller abortava o reconnect (deletava `disconnectedAt` e
 * deixava o player órfão sem WS real). O caller é quem commita o
 * reconnect com `sala.markConnected` AGORA, após validar code.
 *
 * @see spec US-1
 */

import {
	NickSchema,
	type HelloPayload,
	type Player,
	type SalaState,
} from "@planning-poker/shared";
import { type Hub, HubError, makePlayerId } from "../hub";
import { SalaError } from "../sala";

/**
 * Outcome do hello: ou sucesso (welcome) ou erro (oneof code).
 *
 * `evictedFrom` é populado quando o handler fez room migration (UUID
 * estava em sala A, cliente pediu code B): o caller (ws.ts) usa para
 * fazer broadcast `player_left` na sala A.
 */
export type HelloOutcome =
	| {
			ok: true;
			playerId: string;
			sala: SalaState & { critical: boolean };
			role: "host" | "player";
			reconnected: boolean;
			evictedFrom?: { code: string; playerId: string };
	  }
	| {
			ok: false;
			code:
				| "invalid_nick"
				| "sala_nao_encontrada"
				| "sala_cheia"
				| "internal_error";
			message: string;
	  };

/**
 * Processa `hello` do cliente.
 *
 * @param hub  Hub global do processo
 * @param payload  HelloPayload validado por Zod (vindo do WS dispatch)
 * @returns outcome com sala, playerId, role; ou erro mapeável para `error` event
 */
export function handleHello(hub: Hub, payload: HelloPayload): HelloOutcome {
	// 1. Validação de nick (defesa em profundidade — NickSchema já valida
	//    mas checamos explicitamente para mensagem de erro amigável)
	const parsed = NickSchema.safeParse(payload.nick);
	if (!parsed.success) {
		const issue = parsed.error.issues[0]?.message ?? "Nick inválido.";
		return {
			ok: false,
			code: "invalid_nick",
			message: issue,
		};
	}
	const nick = parsed.data;
	const { uuid } = payload;

	// 2. Reconnect: UUID conhecido → tenta reidratar.
	//    `hub.reconnect` é puro (sem side-effect). Caller decide se commita
	//    chamando `sala.markConnected(uuid)` após validar code.
	//    - Sem code: sempre tenta reconnect (cenário app refresh)
	//    - Com code: tenta reconnect SÓ se UUID bate esta sala
	//      (caso contrário, room migration → evict + join)
	const reconnected = hub.reconnect(uuid);
	let evictedFrom: { code: string; playerId: string } | undefined;

	if (reconnected) {
		const { code: reconnectCode, playerId, sala } = reconnected;
		// Se code foi passado e bate → reconnect (commit agora)
		if (!payload.code || payload.code === reconnectCode) {
			const reconnectedPlayer = sala.markConnected(uuid);
			if (reconnectedPlayer) {
				const player = sala.getPlayer(playerId)!;
				return {
					ok: true,
					playerId,
					role: player.role,
					sala: sala.toState(),
					reconnected: true,
				};
			}
			// markConnected falhou (race com tickGracePeriod removeu o player).
			// byUUID já foi limpo pelo tick. Fall through para addPlayer/createSala.
		} else {
			// UUID em outra sala + code DIFERENTE presente → room migration.
			// Evict da sala antiga: hub.removePlayer limpa byUUID (e dispara
			// remoção da sala se ficar vazia) para que addPlayer subsequente
			// não caia no "UUID em uso".
			hub.removePlayer(playerId);
			evictedFrom = { code: reconnectCode, playerId };
		}
	}

	// 3. Constrói Player (id gerado agora; sala pode atribuir outro seatIndex)
	const playerId = makePlayerId();
	const candidate: Player = {
		id: playerId,
		uuid,
		nick,
		role: payload.code ? "player" : "host", // host só se criando (sem code)
		seatIndex: 0, // sala preenche (first free)
		hasVoted: false,
		value: null,
		status: "connected",
		joinedAt: Date.now(),
	};

	try {
		if (!payload.code) {
			// 4a. Criar sala (host)
			const { sala: newSala } = hub.createSala({
				...candidate,
				role: "host",
			});
			return {
				ok: true,
				playerId,
				role: "host",
				sala: newSala.toState(),
				reconnected: false,
				...(evictedFrom ? { evictedFrom } : {}),
			};
		}

		// 4b. Join com código
		const { sala } = hub.addPlayer(payload.code, candidate);
		return {
			ok: true,
			playerId,
			role: "player",
			sala: sala.toState(),
			reconnected: false,
			...(evictedFrom ? { evictedFrom } : {}),
		};
	} catch (e) {
		// Mapear SalaError / HubError para outcome
		if (e instanceof HubError || e instanceof SalaError) {
			const err = e as HubError | SalaError;
			if (
				err.code === "sala_cheia" ||
				err.code === "sala_nao_encontrada" ||
				err.code === "invalid_nick" ||
				err.code === "internal_error"
			) {
				return {
					ok: false,
					code: err.code,
					message: err.message,
				};
			}
			// Erros que não devem chegar aqui (invalid_vote, invalid_phase)
			return {
				ok: false,
				code: "internal_error",
				message: err.message,
			};
		}
		const message = e instanceof Error ? e.message : String(e);
		return { ok: false, code: "internal_error", message };
	}
}