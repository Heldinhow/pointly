/**
 * Regression tests — bug "criar sala não aparece código de compartilhamento" (prod)
 *
 * Sintoma:
 *   - User navega para /arena depois de /join (com nick válido em sessionStorage).
 *   - WS conectou (server logs mostram ws.connect), mas `hello` nunca chega.
 *   - Tela fica com `SALA — / COMPARTILHAR: — / VOCÊ —`.
 *
 * Root cause (no código atual):
 *   1. `useArenaLoop` cria WS e faz `setInterval` que se autolimpa na 1ª transição
 *      para status `'open'`, chamando `sendHello` UMA ÚNICA vez.
 *   2. Se nesse momento `nickRef.current` ainda é vazio (ou inválido),
 *      `sendHello` retorna silenciosamente.
 *   3. Auto-reconnect subsequente também não reenvia `hello` (interval já parado).
 *
 * Cenários que cobrem:
 *   A. nick vazio no mount, mas preenchido depois → hello deve sair.
 *   B. reconnect depois de close → hello deve sair de novo.
 *   C. createWSClient deve expor `onOpen` (callback por conexão, cobre C).
 *   D. Se nick está válido já no mount, hello sai no primeiro 'open'.
 */

import {
	afterEach,
	beforeEach,
	describe,
	expect,
	test,
} from "bun:test";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../components/ui/toast";
import { renderHook } from "../components/ui/test-helpers";
import { useArenaLoop } from "./use-arena-loop";
import { createWSClient, type WSClient } from "./ws-client";

// ---------------------------------------------------------------------------
// Mock WebSocket (mesmo padrão de ws-client.test.ts — cópia mínima)
// ---------------------------------------------------------------------------

class MockWebSocket {
	static readonly CONNECTING = 0;
	static readonly OPEN = 1;
	static readonly CLOSING = 2;
	static readonly CLOSED = 3;

	readonly url: string;
	readyState: number = MockWebSocket.CONNECTING;
	sent: string[] = [];

	private listeners: Record<string, Array<(ev: unknown) => void>> = {
		open: [],
		message: [],
		close: [],
		error: [],
	};

	static instances: MockWebSocket[] = [];

	constructor(url: string) {
		this.url = url;
		MockWebSocket.instances.push(this);
	}

	addEventListener(type: string, fn: (ev: unknown) => void): void {
		const list = this.listeners[type];
		if (list) list.push(fn);
	}

	simulateOpen(): void {
		this.readyState = MockWebSocket.OPEN;
		for (const fn of this.listeners.open ?? []) fn({});
	}

	simulateMessage(data: unknown): void {
		const payload = typeof data === "string" ? data : JSON.stringify(data);
		for (const fn of this.listeners.message ?? []) fn({ data: payload });
	}

	simulateClose(): void {
		if (this.readyState === MockWebSocket.CLOSED) return;
		this.readyState = MockWebSocket.CLOSED;
		for (const fn of this.listeners.close ?? []) fn({});
	}

	simulateError(): void {
		for (const fn of this.listeners.error ?? []) fn({});
	}

	send(data: string): void {
		this.sent.push(data);
	}

	close(): void {
		if (this.readyState === MockWebSocket.CLOSED) return;
		this.readyState = MockWebSocket.CLOSED;
		for (const fn of this.listeners.close ?? []) fn({});
	}
}

beforeEach(() => {
	MockWebSocket.instances = [];
	(globalThis as unknown as { WebSocket: typeof MockWebSocket }).WebSocket =
		MockWebSocket;
	// sessionStorage real do jsdom já está disponível (preload test-jsdom.ts).
	// Limpa pra cada teste pra evitar nick persistido de testes anteriores.
	try {
		sessionStorage.clear();
	} catch {
		/* ignore — SSR-ish */
	}
});

afterEach(() => {
	try {
		sessionStorage.clear();
	} catch {
		/* ignore */
	}
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function withProviders(node: ReactNode): ReactNode {
	return (
		<ToastProvider>
			<MemoryRouter>{node}</MemoryRouter>
		</ToastProvider>
	);
}

/** Procura a primeira mensagem `hello` enviada por `ws` retornando seu payload. */
function firstHello(ws: MockWebSocket): { uuid: string; nick: string; code?: string } | null {
	for (const raw of ws.sent) {
		try {
			const parsed = JSON.parse(raw) as {
				type?: string;
				payload?: { uuid?: string; nick?: string; code?: string };
			};
			if (parsed.type === "hello" && parsed.payload) {
				return {
					uuid: parsed.payload.uuid ?? "",
					nick: parsed.payload.nick ?? "",
					code: parsed.payload.code,
				};
			}
		} catch {
			/* ignore */
		}
	}
	return null;
}

/** Avança o tempo em `ms` milissegundos (setInterval tick). */
function tick(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Cenário D (sintoma positivo — garantia de não-regredir)
// ---------------------------------------------------------------------------

describe("useArenaLoop — sendHello regression: nick válido no mount", () => {
	test("dispara hello após WS abrir", async () => {
		const { result } = renderHook(
			({ nick, code, uuid }: { nick: string; code: string; uuid: string }) =>
				useArenaLoop({ nick, code, uuid }),
			{
				wrapper: ({ children }) => withProviders(children),
				initialProps: {
					nick: "Helder",
					code: "",
					uuid: "00000000-0000-4000-8000-000000000099",
				},
			},
		);

		// Hook montou, WS foi criada e connect() chamado.
		expect(MockWebSocket.instances).toHaveLength(1);
		const ws = MockWebSocket.instances[0]!;

		// Antes do 'open' → nada enviado.
		expect(ws.sent).toHaveLength(0);

		// Simula server aceitando conexão → status='open' → sendHello dispara.
		ws.simulateOpen();
		await tick(150); // janela do setInterval(100ms)

		const hello = firstHello(ws);
		expect(hello).not.toBeNull();
		expect(hello!.nick).toBe("Helder");
		expect(hello!.uuid).toBe("00000000-0000-4000-8000-000000000099");

		// useArenaLoop retornou os helpers esperados.
		expect(typeof result.current.castVote).toBe("function");
	});
});

// ---------------------------------------------------------------------------
// Cenário A — o bug que o user viu em produção
// ---------------------------------------------------------------------------

describe("useArenaLoop — sendHello regression: nick atualiza DEPOIS do open", () => {
	test("dispara hello quando nick passa de vazio para válido com WS já aberta", async () => {
		// Mount inicial: nick vazio (simula entrar em /arena com sessionStorage zerado).
		const { rerender } = renderHook(
			({ nick, code, uuid }: { nick: string; code: string; uuid: string }) =>
				useArenaLoop({ nick, code, uuid }),
			{
				wrapper: ({ children }) => withProviders(children),
				initialProps: {
					nick: "",
					code: "",
					uuid: "00000000-0000-4000-8000-0000000000aa",
				},
			},
		);

		// WS foi instanciada.
		expect(MockWebSocket.instances).toHaveLength(1);
		const ws = MockWebSocket.instances[0]!;

		// WS abre → polling atual chama sendHello → nick vazio → NADA enviado.
		ws.simulateOpen();
		await tick(200);
		expect(firstHello(ws)).toBeNull();

		// User digita o nick — re-render com nick válido.
		rerender({
			nick: "Helder",
			code: "",
			uuid: "00000000-0000-4000-8000-0000000000aa",
		});
		await tick(100);

		// O bug atual do código: hello NUNCA sai (setInterval já se auto-limpou).
		// O fix esperado: hello SAI porque algum efeito reativo observa o nick
		// e dispara sendHello quando nick vira válido E ws está 'open'.
		const hello = firstHello(ws);
		expect(hello).not.toBeNull();
		expect(hello!.nick).toBe("Helder");
		expect(hello!.uuid).toBe("00000000-0000-4000-8000-0000000000aa");
	});
});

// ---------------------------------------------------------------------------
// Cenário B — reconexão
// ---------------------------------------------------------------------------

describe("useArenaLoop — sendHello regression: hello reenvia após reconnect", () => {
	test("reenvia hello após WS reconectar (close → open)", async () => {
		renderHook(
			({ nick, code, uuid }: { nick: string; code: string; uuid: string }) =>
				useArenaLoop({ nick, code, uuid }),
			{
				wrapper: ({ children }) => withProviders(children),
				initialProps: {
					nick: "Helder",
					code: "",
					uuid: "00000000-0000-4000-8000-0000000000bb",
				},
			},
		);

		const ws1 = MockWebSocket.instances[0]!;
		ws1.simulateOpen();
		await tick(150);
		const first = firstHello(ws1);
		expect(first).not.toBeNull();

		// Server some / rede pisca → ws1 fecha → cliente agenda reconnect.
		ws1.simulateClose();
		// Backoff: 1s no primeiro retry. Avança tempo pra setTimeoutFn disparar.
		await tick(1200);

		// Espera um 2º MockWebSocket ter sido instanciado pelo reconnect.
		const ws2 = MockWebSocket.instances[1];
		expect(ws2).toBeDefined();

		// Novo WS abre → onOpen atual dispara sendHello → hello reenviado.
		ws2!.simulateOpen();
		await tick(150);
		const second = firstHello(ws2!);
		expect(second).not.toBeNull();
		expect(second!.uuid).toBe("00000000-0000-4000-8000-0000000000bb");
		expect(second!.nick).toBe("Helder");
	});
});

// ---------------------------------------------------------------------------
// Cenário C — API de createWSClient deve expor `onOpen`
// ---------------------------------------------------------------------------

describe("createWSClient — expõe onOpen", () => {
	test("onOpen é invocado uma vez por conexão (inclui reconnects)", async () => {
		const opens: number[] = [0, 0];
		const wsClient: WSClient = createWSClient({
			url: "ws://test/ws",
			onEvent: () => {},
			onOpen: () => {
				opens[0]! += 1;
			},
		});

		// 1ª conexão
		wsClient.connect();
		MockWebSocket.instances[0]!.simulateOpen();
		expect(opens[0]).toBe(1);

		// close → reconnect → 2ª conexão
		MockWebSocket.instances[0]!.simulateClose();
		await tick(1200);
		expect(MockWebSocket.instances).toHaveLength(2);
		MockWebSocket.instances[1]!.simulateOpen();
		expect(opens[0]).toBe(2);

		wsClient.close();
	});

	test("onOpen é opcional (não quebra se omitido)", () => {
		const wsClient: WSClient = createWSClient({
			url: "ws://test/ws",
			onEvent: () => {},
		});
		wsClient.connect();
		// Não deve throw quando onOpen é undefined.
		expect(() => MockWebSocket.instances[0]!.simulateOpen()).not.toThrow();
		wsClient.close();
	});
});
