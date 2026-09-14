import { JoinError } from "./errors";

/**
 * Endpoints do servidor fora do socket: base REST e URL do WebSocket.
 * Sobrescrevíveis via `.env` (`VITE_API_BASE`, `VITE_WS_URL`).
 */

export function apiBase(): string {
	const configured = import.meta.env.VITE_API_BASE as string | undefined;
	return configured && configured.length > 0 ? configured : "/api/v1";
}

export function resolveWsUrl(): string {
	const configured = import.meta.env.VITE_WS_URL as string | undefined;
	if (configured && configured.length > 0) return configured;
	if (import.meta.env.DEV) {
		return `ws://${window.location.hostname}:3001/ws`;
	}
	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${protocol}//${window.location.host}/ws`;
}

export type SalaCheck =
	| { status: "exists"; playerCount: number; phase: string }
	| { status: "missing" }
	| { status: "invalid" };

/**
 * Pré-check de existência antes do join: 200 existe, 404 não existe,
 * 400 código malformado. Falha de rede vira JoinError de conexão.
 */
export async function checkSala(
	code: string,
	fetchImpl: typeof fetch = fetch,
): Promise<SalaCheck> {
	let response: Response;
	try {
		response = await fetchImpl(`${apiBase()}/salas/${code}`);
	} catch {
		throw new JoinError("connection_failed");
	}
	if (response.status === 200) {
		const body = (await response.json()) as {
			playerCount?: unknown;
			phase?: unknown;
		};
		return {
			status: "exists",
			playerCount:
				typeof body.playerCount === "number" ? body.playerCount : 0,
			phase: typeof body.phase === "string" ? body.phase : "idle",
		};
	}
	if (response.status === 404) return { status: "missing" };
	return { status: "invalid" };
}
