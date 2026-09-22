import { create } from "zustand";
import {
	clearSession,
	getOrCreateUuid,
	loadNickDraft,
	saveNickDraft,
	saveSession,
} from "../lib/identity";
import type { Role, SalaState } from "@planning-poker/shared";
import type { PointlySocket } from "../lib/ws-client";

/**
 * Sessão da Sala: identidade (uuid/apelido), entrada (código/playerId/papel),
 * snapshot da sala e o socket vivo para handoff entre entrada e Arena.
 *
 * Ticket 09: `setConnected` persiste {code, nick} para o F5 reconectar com
 * o mesmo UUID (servidor reidrata sem duplicar); `disconnect` (saída
 * voluntária) limpa a sessão persistida. Queda de conexão NÃO limpa —
 * o reload reutiliza a sessão para recuperar voto, assento e fase.
 */
interface SessionState {
	uuid: string;
	nick: string;
	code: string;
	playerId: string | null;
	role: Role | null;
	sala: SalaState | null;
	socket: PointlySocket | null;
	setDraft: (nick: string, code: string) => void;
	setConnected: (input: {
		nick: string;
		code: string;
		playerId: string;
		role: Role;
		sala: SalaState;
		socket: PointlySocket;
		spectate?: boolean;
	}) => void;
	updateSala: (sala: SalaState) => void;
	disconnect: () => void;
}

export const useSession = create<SessionState>()((set) => ({
	uuid: getOrCreateUuid(),
	nick: loadNickDraft(),
	code: "",
	playerId: null,
	role: null,
	sala: null,
	socket: null,

	setDraft: (nick, code) => {
		saveNickDraft(nick);
		set({ nick, code });
	},

	setConnected: (input) => {
		saveNickDraft(input.nick);
		saveSession(input.code, input.nick, input.spectate === true || input.role === "spectator");
		set({
			nick: input.nick,
			code: input.code,
			playerId: input.playerId,
			role: input.role,
			sala: input.sala,
			socket: input.socket,
		});
	},

	updateSala: (sala) => {
		set({ sala });
	},

	disconnect: () => {
		set((state) => {
			try {
				state.socket?.close({ silent: true });
			} catch {
				// Socket já morto — nada a fazer.
			}
			try {
				clearSession();
			} catch {
				// Storage indisponível — sessão em memória já foi limpa.
			}
			return {
				playerId: null,
				role: null,
				sala: null,
				socket: null,
				code: "",
			};
		});
	},
}));
