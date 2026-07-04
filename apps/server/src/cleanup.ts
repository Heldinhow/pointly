/**
 * Cleanup — Phase 3 / T18
 *
 * Coordena:
 *  - Remoção de sala quando último player sai (Map.delete)
 *  - Promoção de host quando host sai com outros (T12a já faz)
 *  - Grace period de 60s pra jogadores disconnected (Hub.tickGracePeriod)
 *  - Graceful shutdown em SIGTERM — broadcast sala_ended (server_restart)
 *
 * Roda como job periódico a cada 10s (setInterval).
 *
 * @see spec edge case "Server restart mid-rodada | Sala some do Map;
 *       clientes recebem sala_ended { reason: 'server_restart' }"
 */

import type { Hub } from "./hub";
import type { Logger } from "./ws-logger";

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export type { Logger } from "./ws-logger";

const CLEANUP_TICK_MS = 10_000;

/**
 * CleanupService — job periódico de manutenção.
 *
 * Não escreve nas Salas diretamente; delega ao Hub que tem a verdade única.
 */
export class CleanupService {
	private readonly hub: Hub;
	private readonly onSalaEnded: (
		code: string,
		reason: "last_left" | "server_restart",
	) => void;
	private interval: ReturnType<typeof setInterval> | null = null;

	constructor(
		hub: Hub,
		_logger: Logger,
		onSalaEnded: (code: string, reason: "last_left" | "server_restart") => void,
	) {
		this.hub = hub;
		this.onSalaEnded = onSalaEnded;
	}

	/**
	 * Inicia job periódico. Idempotente.
	 */
	start(): void {
		if (this.interval) return;
		this.interval = setInterval(() => this.tick(), CLEANUP_TICK_MS);
		// Não bloqueia shutdown do processo
		if (
			this.interval &&
			typeof (this.interval as { unref?: () => void }).unref === "function"
		) {
			(this.interval as { unref: () => void }).unref();
		}
	}

	stop(): void {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
	}

	/**
	 * Tick: roda grace period. Salas que ficarem vazias após remoção disparam
	 * `sala_ended { reason: 'last_left' }` via callback do WS layer.
	 */
	tick(now: number = Date.now()): { code: string; playerId: string }[] {
		const removed = this.hub.tickGracePeriod(now);
		// Quais salas ficaram vazias após remoção? hub ativa comparando
		// activeCodes antes/depois.
		// (tickGracePeriod já remove do Map se sala vazia.)
		return removed;
	}

	/**
	 * Detecta salas que ficaram vazias comparando snapshots antes/depois.
	 * Usado pelo WS layer em tick() para broadcast sala_ended.
	 */
	detectEndedSalas(codesBefore: string[], codesAfter: string[]): string[] {
		const before = new Set(codesBefore);
		const after = new Set(codesAfter);
		const ended: string[] = [];
		for (const code of before) {
			if (!after.has(code)) ended.push(code);
		}
		return ended;
	}

	/**
	 * Graceful shutdown — SIGTERM handler. Para o job e limpa estado.
	 * WS layer é responsável por broadcast `sala_ended server_restart`
	 * ANTES de chamar isto (precisa das conexões abertas).
	 */
	shutdown(): void {
		this.stop();
		const activeCodes = this.hub.activeCodes();
		for (const code of activeCodes) {
			this.onSalaEnded(code, "server_restart");
		}
		this.hub.shutdown();
	}
}

/**
 * Helper: registra handlers SIGTERM/SIGINT que disparam graceful shutdown.
 * @param cleanup instância de CleanupService
 * @param onSignal callback adicional pra fechar servidor HTTP/WS
 */
export function installSignalHandlers(
	cleanup: CleanupService,
	onSignal: () => Promise<void> | void,
): void {
	const handler = async (signal: NodeJS.Signals) => {
		// Idempotência: SIGTERM durante shutdown não dispara 2x
		process.removeListener(signal, handler);
		cleanup.shutdown();
		await onSignal();
		process.exit(0);
	};
	process.on("SIGTERM", handler);
	process.on("SIGINT", handler);
}
