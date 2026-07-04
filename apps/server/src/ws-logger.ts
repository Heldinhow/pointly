/**
 * WS structured logger — Phase 3 / T17a
 *
 * Loga eventos `connect` / `disconnect` / `event` em JSON lines para stdout.
 * Caller pode redirecionar para aggregation (Datadog, Grafana, etc).
 *
 * Schema:
 *   { ts: ISO8601, level, event, ip?, playerId?, salaCode?, detail? }
 *
 * @see spec AC US-1 (latência < 200ms) — log timestamps viabilizam SLO auditing.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEvent =
	| { type: "ws.connect"; ip: string; playerId?: string; salaCode?: string }
	| {
			type: "ws.disconnect";
			playerId: string;
			salaCode?: string;
			reason?: string;
	  }
	| {
			type: "ws.event";
			direction: "c2s" | "s2c";
			event: string;
			playerId?: string;
			salaCode?: string;
			payloadSummary?: string;
	  }
	| {
			type: "ws.error";
			code: string;
			playerId?: string;
			salaCode?: string;
			message: string;
	  }
	| {
			type: "ws.ratelimit";
			ip: string;
			rejected: boolean;
	  }
	| { type: "ws.shutdown"; salasActive: number };

export interface LoggerSink {
	log(entry: LogEntry): void;
}

export type LogEntry = {
	ts: string;
	level: LogLevel;
	event: LogEvent;
};

/**
 * Logger para stdout (Bun). Cada log é um JSON line.
 * Em prod, substitua por outro sink (Datadog, Grafana, etc).
 */
export class StdoutSink implements LoggerSink {
	log(entry: LogEntry): void {
		// Single-line JSON para ferramentas de log estruturado
		console.log(JSON.stringify(entry));
	}
}

/**
 * Coletor in-memory para testes — acumula entries ao invés de imprimir.
 */
export class MemorySink implements LoggerSink {
	readonly entries: LogEntry[] = [];
	log(entry: LogEntry): void {
		this.entries.push(entry);
	}
	clear(): void {
		this.entries.length = 0;
	}
}

export class Logger {
	private readonly sink: LoggerSink;

	constructor(sink: LoggerSink = new StdoutSink()) {
		this.sink = sink;
	}

	log(event: LogEvent, level: LogLevel = "info"): void {
		this.sink.log({ ts: new Date().toISOString(), level, event });
	}

	// Convenience wrappers ---------------------------------------------------

	connect(ip: string, playerId?: string, salaCode?: string): void {
		this.log({ type: "ws.connect", ip, playerId, salaCode });
	}

	disconnect(playerId: string, salaCode?: string, reason?: string): void {
		this.log({ type: "ws.disconnect", playerId, salaCode, reason });
	}

	event(
		direction: "c2s" | "s2c",
		eventName: string,
		playerId?: string,
		salaCode?: string,
		payloadSummary?: string,
	): void {
		this.log({
			type: "ws.event",
			direction,
			event: eventName,
			playerId,
			salaCode,
			payloadSummary,
		});
	}

	error(
		code: string,
		message: string,
		playerId?: string,
		salaCode?: string,
	): void {
		this.log({ type: "ws.error", code, message, playerId, salaCode }, "warn");
	}

	ratelimit(ip: string, rejected: boolean): void {
		this.log(
			{ type: "ws.ratelimit", ip, rejected },
			rejected ? "warn" : "info",
		);
	}

	shutdown(salasActive: number): void {
		this.log({ type: "ws.shutdown", salasActive }, "info");
	}
}
