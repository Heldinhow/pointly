/**
 * First-party visit counting (display do ESP32).
 *
 * - `POST /api/stats/pageview` registra 1 visita por visitante por dia
 *   (America/Sao_Paulo). Dedupe via hash(salt diário + IP + UA); IP e UA
 *   crus nunca são persistidos — só o digest em memória — e o salt é
 *   descartado na virada do dia.
 * - `GET /api/stats/visits` (token `STATS_API_TOKEN`) resume
 *   `{today, last7d, live5m}`.
 * - `live5m` = digests distintos vistos nos últimos 5 minutos (memória).
 * - Contadores por dia persistem em JSON (`VISITS_DATA_FILE`); o arquivo
 *   guarda só `{dia: total}` — nenhum identificador.
 */

import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const VISITS_TZ = "America/Sao_Paulo";
/** Janela de "ao vivo": digests distintos vistos neste intervalo. */
export const LIVE_WINDOW_MS = 5 * 60 * 1000;
/** Teto do corpo do beacon (o beacon é vazio; qualquer payload é ignorado). */
export const MAX_BEACON_BYTES = 1024;
/** Teto de dias guardados no arquivo (limite do crescimento do JSON). */
const MAX_STORED_DAYS = 90;

const spDayFmt = new Intl.DateTimeFormat("en-CA", {
	timeZone: VISITS_TZ,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

/** Dia corrente em America/Sao_Paulo como `YYYY-MM-DD`. */
export function saoPauloDay(nowMs: number = Date.now()): string {
	return spDayFmt.format(new Date(nowMs));
}

/**
 * UA de robô/crawler/headless/automação. O beacon responde 204 do mesmo
 * jeito (não revela a classificação), só não conta.
 */
const BOT_RE =
	/bot|crawl|spider|slurp|mediapartners|baidu|yandex|sogou|exabot|facebot|ia_archiver|headless|playwright|selenium|puppeteer|phantomjs|lighthouse|axe-core|curl|wget|python-requests|python-urllib|go-http|okhttp|java\/|libwww-perl|ahrefs|semrush|mj12bot|dotbot|pingdom|uptimerobot|monitor/i;

export function isBotUserAgent(ua: string | null | undefined): boolean {
	if (!ua) return false;
	return BOT_RE.test(ua);
}

/** Arquivo de contadores: env explícito ou `data/` relativo ao cwd. */
export function visitsDataFile(): string {
	const raw = process.env.VISITS_DATA_FILE?.trim();
	return raw && raw.length > 0 ? raw : "data/visits.json";
}

export interface VisitSnapshot {
	today: number;
	last7d: number;
	live5m: number;
	updatedAt: string;
}

export type PageviewOutcome = "counted" | "duplicate" | "bot";

export class VisitCounter {
	private days = new Map<string, number>();
	private seenToday = new Set<string>();
	private live = new Map<string, number>();
	private salt = randomBytes(16).toString("hex");
	private currentDay: string;
	private readonly now: () => number;
	private readonly dataFile: string | undefined;

	constructor(opts: { dataFile?: string; now?: () => number } = {}) {
		this.now = opts.now ?? Date.now;
		this.dataFile = opts.dataFile;
		this.currentDay = saoPauloDay(this.now());
		this.load();
	}

	/**
	 * Registra um pageview. Corpo do beacon é ignorado (nunca contém —
	 * e nunca persistimos — códigos de sala ou qualquer identificador).
	 */
	record(ip: string, ua: string): PageviewOutcome {
		if (isBotUserAgent(ua)) return "bot";
		const now = this.now();
		const day = saoPauloDay(now);
		if (day !== this.currentDay) {
			// Virada do dia em SP: salt novo, vistos de ontem descartados.
			// shortcut: restart no mesmo dia também zera `seenToday`
			// (uma revisita conta 1x a mais); persistir o salt quebraria
			// a unlinkability diária, então aceitamos a margem.
			this.currentDay = day;
			this.salt = randomBytes(16).toString("hex");
			this.seenToday.clear();
		}
		this.pruneLive(now);
		const key = createHash("sha256")
			.update(`${this.salt}\n${ip}\n${ua}`)
			.digest("hex");
		this.live.set(key, now);
		if (this.seenToday.has(key)) return "duplicate";
		this.seenToday.add(key);
		this.days.set(day, (this.days.get(day) ?? 0) + 1);
		this.save();
		return "counted";
	}

	snapshot(): VisitSnapshot {
		const now = this.now();
		this.pruneLive(now);
		const today = this.days.get(saoPauloDay(now)) ?? 0;
		let last7d = 0;
		for (let i = 0; i < 7; i++) {
			last7d += this.days.get(saoPauloDay(now - i * 86_400_000)) ?? 0;
		}
		return {
			today,
			last7d,
			live5m: this.live.size,
			updatedAt: new Date(now).toISOString(),
		};
	}

	private pruneLive(now: number): void {
		for (const [key, at] of this.live) {
			if (now - at >= LIVE_WINDOW_MS) this.live.delete(key);
		}
	}

	private load(): void {
		if (!this.dataFile) return;
		let raw: string;
		try {
			raw = readFileSync(this.dataFile, "utf8");
		} catch {
			return; // primeira execução: arquivo ainda não existe
		}
		try {
			const parsed = JSON.parse(raw) as { days?: Record<string, unknown> };
			if (!parsed || typeof parsed.days !== "object" || !parsed.days) return;
			for (const [day, total] of Object.entries(parsed.days)) {
				if (/^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isInteger(total) && (total as number) >= 0) {
					this.days.set(day, total as number);
				}
			}
		} catch {
			// Arquivo corrompido: começa zerado em vez de derrubar o server.
		}
	}

	private save(): void {
		if (!this.dataFile) return;
		try {
			mkdirSync(dirname(this.dataFile), { recursive: true });
			const days = [...this.days.entries()]
				.sort(([a], [b]) => (a < b ? -1 : 1))
				.slice(-MAX_STORED_DAYS);
			writeFileSync(
				this.dataFile,
				JSON.stringify({ days: Object.fromEntries(days) }),
			);
		} catch {
			// Contagem é best-effort: disco cheio/permissão não pode quebrar o beacon.
		}
	}
}
