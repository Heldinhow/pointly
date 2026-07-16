/**
 * multi-client — fixture Playwright que sobe 2+ browser contexts contra
 * o Pointly real (Vite 5173 + Bun server 3001 via Vite proxy).
 *
 * Phase 8 (T42).
 *
 * **Responsabilidades**:
 *  1. Cria 2+ `BrowserContext`s (isolados, sem cookies compartilhados).
 *  2. Cada contexto vira um "client" com um nick estável.
 *  3. Helpers para criar/entrar em sala, votar, revelar, nova rodada,
 *     inspecionar `salaState`, esperar eventos.
 *  4. Captura logs de WebSocket no `console.log` (debug facilitado).
 *
 * **Por que contexts separados?** Cada contexto = cookies + localStorage
 * isolados, simulando usuários diferentes. Vite serve a página em ambos
 * os contexts; o Bun server fala com cada um por WS upgrade.
 *
 * **Por que helpers de UI?** A spec F-001..F-026 diz que a navegação é via
 * landing → join → arena. Os helpers refletem esse fluxo de produto.
 *
 * **Importante**: a fixture NÃO manipula o store Zustand diretamente.
 * Drive o app pela UI (forms + buttons), e o WebSocket atualiza o store
 * server-driven. Isso garante que estamos testando o sistema real, não
 * um mock parcial.
 *
 * @see .specs/features/planning-poker-v1/tasks.md T42
 */
import type {
	APIRequestContext,
	Browser,
	BrowserContext,
	Page,
} from "@playwright/test";

/** Resposta do server `/health`. */
export type HealthResponse = {
	status: string;
	service: string;
	version: string;
	timestamp: string;
};

/** Snapshot do estado da sala lido via WS (helper do fixture). */
export type SalaSnapshot = {
	code: string;
	hostId: string | null;
	players: Array<{
		id: string;
		nick: string;
		role: "host" | "player";
		seatIndex: number;
		hasVoted: boolean;
		value: string | null;
		status: "connected" | "disconnected";
	}>;
	phase: "idle" | "voting" | "revealable" | "revealed";
	round: number;
	timer: number;
	votes: Record<string, string>;
};

/** Stats de consensus pós-reveal. */
export type ConsensusStats = {
	median: number | null;
	mean: number | null;
	range: [number, number] | null;
	unanimous: boolean;
};

/** Logger captador de eventos de WS. */
export type WSLog = {
	timestamp: number;
	kind: "c2s" | "s2c" | "log" | "error";
	event?: string;
	data?: unknown;
};

/** Identifica um client individual dentro do suite. */
export type Client = {
	/** Apelido deste client. */
	nick: string;
	/** Contexto isolado (cookies + localStorage próprios). */
	context: BrowserContext;
	/** Página ativa (mesma instância reutilizada entre actions). */
	page: Page;
	/** Player ID atribuído pelo server (set em welcome). */
	playerId: string | null;
	/** Logs de console capturados. */
	wsLogs: WSLog[];
};

/** Opções do suite. */
export type MultiClientOptions = {
	/** Quantos clients criar. Default: 2. */
	clientCount?: number;
	/** Nicks por client (default: Helder, Test, Other). */
	nicks?: string[];
	/** Captura logs de console dos clients. Default: true. */
	captureLogs?: boolean;
	/** Trace em caso de erro. Default: 'retain-on-failure'. */
	traceMode?: "on" | "off" | "retain-on-failure";
	/** Viewport dos contexts. Default: 1440×900 (desktop). Specs mobile passam
	 *  o viewport desejado (ex: 320×568). Sobrepõe o default do project Playwright. */
	viewport?: { width: number; height: number };
};

/** Suite com 2+ clients + helpers de produto. */
export type MultiClientSuite = {
	clients: Client[];
	/** Cria uma sala: client[0] clica "Criar sala" no landing, preenche nick, navega para arena. */
	createRoom: (clientIndex?: number) => Promise<string>;
	/** Outro client entra via `join.html?code=XXXX` com seu nick pré-configurado. */
	joinRoom: (code: string, clientIndex: number) => Promise<void>;
	/** Client vota no valor Fibonacci (0|½|1|2|3|5|8|13|☕). */
	vote: (clientIndex: number, value: string) => Promise<void>;
	/** Client revela a rodada. */
	reveal: (clientIndex: number) => Promise<void>;
	/** Client inicia nova rodada (pós-reveal). */
	newRound: (clientIndex: number) => Promise<void>;
	/** Lê estado da sala do `window` (debug) — espelha o Zustand store. */
	salaState: (clientIndex: number) => Promise<SalaSnapshot | null>;
	/** Lê stats de consensus (após reveal). */
	consensus: (clientIndex: number) => Promise<ConsensusStats | null>;
	/** Espera até que `predicate(sala)` seja truthy. Timeout default: 5000ms. */
	waitForSala: (
		clientIndex: number,
		predicate: (s: SalaSnapshot) => boolean,
		timeoutMs?: number,
	) => Promise<SalaSnapshot>;
	/** Lê playerId do client (lê de `window` que sincroniza via `useArenaLoop`). */
	playerId: (clientIndex: number) => Promise<string | null>;
	/** Cleanup: fecha contexts. */
	dispose: () => Promise<void>;
};

/** Default nicks pra 3 clients (extensível). */
const DEFAULT_NICKS = ["Helder", "Test", "Other"];

/**
 * Sobe o suite multi-client.
 *
 * @param browser Playwright Browser (passado pelo test via `use`)
 * @param options  Configuração
 */
export async function multiClient(
	browser: Browser,
	options: MultiClientOptions = {},
): Promise<MultiClientSuite> {
	const count = options.clientCount ?? 2;
	const nicks = options.nicks ?? DEFAULT_NICKS.slice(0, count);
	const captureLogs = options.captureLogs ?? true;
	const viewport = options.viewport ?? { width: 1440, height: 900 };

	if (nicks.length < count) {
		throw new Error(
			`multiClient: precisa de ${count} nicks, recebi ${nicks.length}`,
		);
	}

	const clients: Client[] = [];

	for (let i = 0; i < count; i++) {
		const context = await browser.newContext({
			viewport,
			locale: "pt-BR",
		});
		const page = await context.newPage();
		const wsLogs: WSLog[] = [];
		if (captureLogs) {
			page.on("console", (msg) => {
				// Captura `[ws-client]` e `[ws-server]` pra debug
				const text = msg.text();
				if (
					text.includes("[ws-client]") ||
					text.includes("[ws-server]") ||
					text.includes("[useArenaLoop]") ||
					text.includes("WS")
				) {
					wsLogs.push({
						timestamp: Date.now(),
						kind: "log",
						data: text,
					});
				}
			});
			page.on("pageerror", (err) => {
				wsLogs.push({
					timestamp: Date.now(),
					kind: "error",
					data: err.message,
				});
			});
		}
		clients.push({
			nick: nicks[i]!,
			context,
			page,
			playerId: null,
			wsLogs,
		});
	}

	// -----------------------------------------------------------------------
	// Helpers de fluxo de produto
	// -----------------------------------------------------------------------

	/** Aguarda navegação completa + handler de erros inesperado. */
	async function gotoAndWait(
		page: Page,
		url: string,
		opts: { expectTestId?: string; timeoutMs?: number } = {},
	): Promise<void> {
		const timeout = opts.timeoutMs ?? 10_000;
		await page.goto(url, { waitUntil: "domcontentloaded", timeout });
		if (opts.expectTestId) {
			await page.waitForSelector(`[data-testid="${opts.expectTestId}"]`, {
				timeout,
			});
		}
	}

	/** Gera 4-char code determinístico (sala sempre 4 chars A-Z0-9). */
	function isValidCode(code: string): boolean {
		return /^[A-Z0-9]{4}$/.test(code);
	}

	async function createRoom(clientIndex = 0): Promise<string> {
		const client = clients[clientIndex]!;
		const { page, nick } = client;
		// 1. Landing → clicar "Criar sala"
		await gotoAndWait(page, "/", { expectTestId: "page-landing" });
		await page.getByTestId("cta-create-room").click();

		// 2. Join screen com ?host=1 — preencher nick e enviar
		await page.waitForURL(/\/join/, { timeout: 10_000 });
		await page.waitForSelector('[data-testid="page-join"]');
		await page.getByTestId("nick-input").fill(nick);
		await page.getByTestId("join-submit").click();

		// 3. Aguarda /arena?code=XXXX OU /arena (host:1 — server cria code).
		//    O timeout de 200ms do join submit precisa ser absorvido aqui.
		await page.waitForURL(/\/arena(\?code=[A-Z0-9]{4})?$/, { timeout: 10_000 });
		await page.waitForSelector('[data-testid="page-arena"]');

		// 4. Extrai o code: da URL se veio via join?code=, OU do store
		//    Zustand (`__POINTLY_SALA__`) se veio via host=1 (server cria).
		//    Para host=1, espera o welcome popular o store antes de ler.
		await page.waitForFunction(
			() => {
				const w = window as unknown as { __POINTLY_SALA__?: { code?: string } };
				const c = w.__POINTLY_SALA__?.code;
				return typeof c === "string" && /^[A-Z0-9]{4}$/.test(c);
			},
			undefined,
			{ timeout: 10_000 },
		);
		let code = "";
		try {
			const url = new URL(page.url());
			code = (url.searchParams.get("code") || "").toUpperCase();
		} catch (err) {
			throw new Error(
				`createRoom: URL inválida: ${page.url()} (${(err as Error).message})`,
			);
		}
		if (!isValidCode(code)) {
			// Host flow: server gera o code no `welcome` → ler do store.
			code = await page.evaluate(() => {
				const w = window as unknown as {
					__POINTLY_SALA__?: { code?: string };
				};
				return (w.__POINTLY_SALA__?.code ?? "").toUpperCase();
			});
		}
		if (!isValidCode(code)) {
			// DEBUG: dump all console logs
			console.error("[createRoom] client wsLogs:");
			for (const log of client.wsLogs) {
				console.error(
					`  [${new Date(log.timestamp).toISOString()}] ${log.kind}:`,
					log.data,
				);
			}
			throw new Error(
				`createRoom: code inválido (url=${page.url()}, store=${JSON.stringify(await page.evaluate(() => (window as unknown as { __POINTLY_SALA__?: { code?: string } }).__POINTLY_SALA__))})`,
			);
		}
		return code;
	}

	async function joinRoom(code: string, clientIndex: number): Promise<void> {
		const client = clients[clientIndex]!;
		const { page, nick } = client;
		if (!isValidCode(code)) {
			throw new Error(`joinRoom: code inválido: "${code}"`);
		}
		// 1. /join?code=XXXX — preenche nick e envia
		await gotoAndWait(page, `/join?code=${code}`, {
			expectTestId: "page-join",
		});
		await page.getByTestId("nick-input").fill(nick);
		await page.getByTestId("join-submit").click();

		// 2. Aguarda /arena?code=XXXX
		await page.waitForURL(/\/arena\?code=[A-Z0-9]{4}$/, { timeout: 10_000 });
		await page.waitForSelector('[data-testid="page-arena"]');

		// 3. Confirma via store: o `__POINTLY_SALA__.code` foi populado.
		//    Mais robusto que só o topbar, pois a Sala só é válida após
		//    o welcome do server.
		await page.waitForFunction(
			(expected: string) => {
				const w = window as unknown as { __POINTLY_SALA__?: { code?: string } };
				return w.__POINTLY_SALA__?.code === expected;
			},
			code,
			{ timeout: 10_000 },
		);
	}

	async function vote(clientIndex: number, value: string): Promise<void> {
		const client = clients[clientIndex]!;
		const { page } = client;
		const testId = `deck-card-${value}`;
		// Aguarda carta estar visível e habilitada
		await page.waitForSelector(`[data-testid="${testId}"]:not([disabled])`, {
			timeout: 10_000,
		});
		await page.getByTestId(testId).click();
		// Confirma via store: o `__POINTLY_SALA__` tem `players[current].value === value`.
		// Mais robusto que `aria-pressed` pois reflete a verdade server-driven.
		try {
			await page.waitForFunction(
				(target: string) => {
					const w = window as unknown as {
						__POINTLY_SALA__?: {
							players?: Array<{ value: string | null; hasVoted: boolean }>;
						};
					};
					const players = w.__POINTLY_SALA__?.players ?? [];
					return players.some((p) => p.value === target && p.hasVoted === true);
				},
				value,
				{ timeout: 8_000 },
			);
		} catch (err) {
			// Debug: dump browser console + window state
			console.error(`[vote ${value}] client ${clientIndex} wsLogs:`);
			for (const log of client.wsLogs) {
				console.error(
					`  [${new Date(log.timestamp).toISOString()}] ${log.kind}:`,
					log.data,
				);
			}
			const salaSnapshot = await page.evaluate(() => {
				const w = window as unknown as { __POINTLY_SALA__?: unknown };
				return w.__POINTLY_SALA__;
			});
			console.error(
				`[vote ${value}] window.__POINTLY_SALA__ =`,
				JSON.stringify(salaSnapshot, null, 2),
			);
			throw err;
		}
		// Confirma que a carta ficou visualmente selecionada (UI refletiu).
		await page.waitForFunction(
			(id: string) => {
				const btn = document.querySelector(`[data-testid="${id}"]`);
				return btn?.getAttribute("aria-pressed") === "true";
			},
			testId,
			{ timeout: 5_000 },
		);
	}

	async function reveal(clientIndex: number): Promise<void> {
		const client = clients[clientIndex]!;
		const { page } = client;
		await page.waitForSelector(
			'[data-testid="reveal-button"]:not([disabled])',
			{
				timeout: 10_000,
			},
		);
		await page.getByTestId("reveal-button").click();
		// Espera a phase virar 'revealed' (RevealButton fica post-reveal)
		await page.waitForFunction(
			() => {
				const btn = document.querySelector('[data-testid="reveal-button"]');
				return btn?.getAttribute("data-reveal-state") === "post-reveal";
			},
			undefined,
			{ timeout: 5_000 },
		);
	}

	async function newRound(clientIndex: number): Promise<void> {
		const client = clients[clientIndex]!;
		const { page } = client;
		// O reveal button após reveal vira ghost "Nova rodada"
		await page.waitForFunction(
			() => {
				const btn = document.querySelector('[data-testid="reveal-button"]');
				return btn?.getAttribute("data-reveal-state") === "post-reveal";
			},
			undefined,
			{ timeout: 10_000 },
		);
		await page.getByTestId("reveal-button").click();
		// Volta para 'awaiting' ou 'voting' (phase mudou)
		await page.waitForFunction(
			() => {
				const btn = document.querySelector('[data-testid="reveal-button"]');
				const state = btn?.getAttribute("data-reveal-state");
				return state === "awaiting" || state === "ready";
			},
			undefined,
			{ timeout: 5_000 },
		);
	}

	async function salaState(clientIndex: number): Promise<SalaSnapshot | null> {
		const client = clients[clientIndex]!;
		return client.page.evaluate(() => {
			const w = window as unknown as {
				__POINTLY_SALA__?: SalaSnapshot;
			};
			return w.__POINTLY_SALA__ ?? null;
		});
	}

	async function consensus(
		clientIndex: number,
	): Promise<ConsensusStats | null> {
		const client = clients[clientIndex]!;
		return client.page.evaluate(() => {
			const w = window as unknown as {
				__POINTLY_CONSENSUS__?: ConsensusStats;
			};
			return w.__POINTLY_CONSENSUS__ ?? null;
		});
	}

	async function waitForSala(
		clientIndex: number,
		predicate: (s: SalaSnapshot) => boolean,
		timeoutMs = 5_000,
	): Promise<SalaSnapshot> {
		const client = clients[clientIndex]!;
		const start = Date.now();
		while (Date.now() - start < timeoutMs) {
			const s = await salaState(clientIndex);
			if (s && predicate(s)) return s;
			await client.page.waitForTimeout(50);
		}
		const last = await salaState(clientIndex);
		throw new Error(
			`waitForSala: predicate não satisfeita em ${timeoutMs}ms. ` +
				`Último estado: ${JSON.stringify(last)}`,
		);
	}

	async function playerId(clientIndex: number): Promise<string | null> {
		const client = clients[clientIndex]!;
		return client.page.evaluate(() => {
			const w = window as unknown as {
				__POINTLY_PLAYER_ID__?: string;
			};
			return w.__POINTLY_PLAYER_ID__ ?? null;
		});
	}

	async function dispose(): Promise<void> {
		for (const c of clients) {
			try {
				await c.context.close();
			} catch {
				// ignore — context pode já estar fechado
			}
		}
	}

	return {
		clients,
		createRoom,
		joinRoom,
		vote,
		reveal,
		newRound,
		salaState,
		consensus,
		waitForSala,
		playerId,
		dispose,
	};
}

// ---------------------------------------------------------------------------
// Helpers utilitários (exportados para specs que precisem)
// ---------------------------------------------------------------------------

/** Ping /health (default :3001; usa APIRequestContext). */
export async function pingHealth(
	request: APIRequestContext,
	port = 3001,
): Promise<HealthResponse | null> {
	try {
		const res = await request.get(`http://localhost:${port}/health`);
		if (!res.ok()) return null;
		return (await res.json()) as HealthResponse;
	} catch {
		return null;
	}
}

/** Espera fixa (helper pra testes que precisam de poll). */
export const sleep = (ms: number): Promise<void> =>
	new Promise((r) => setTimeout(r, ms));
