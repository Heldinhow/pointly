import { afterEach, describe, expect, test } from "bun:test";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useSession } from "../store/session";
import { JoinPage } from "./join";

class MockSocket {
	static instances: MockSocket[] = [];
	onopen: ((event: Event) => void) | null = null;
	onmessage: ((event: MessageEvent) => void) | null = null;
	onerror: ((event: Event) => void) | null = null;
	onclose: ((event: Event) => void) | null = null;
	sent: string[] = [];
	readyState = 0;
	url: string;

	constructor(url: string) {
		this.url = url;
		MockSocket.instances.push(this);
	}

	send(data: string): void {
		this.sent.push(data);
	}

	close(): void {
		this.readyState = 3;
	}

	open(): void {
		this.readyState = 1;
		this.onopen?.(new Event("open"));
	}

	receive(raw: string): void {
		this.onmessage?.(
			new MessageEvent("message", { data: raw }) as MessageEvent,
		);
	}
}

const REAL_WS = globalThis.WebSocket;
const REAL_FETCH = globalThis.fetch;

function installMocks(fetchImpl: typeof fetch): void {
	MockSocket.instances = [];
	globalThis.WebSocket = MockSocket as unknown as typeof WebSocket;
	globalThis.fetch = fetchImpl;
}

afterEach(() => {
	globalThis.WebSocket = REAL_WS;
	globalThis.fetch = REAL_FETCH;
	cleanup();
	window.localStorage.clear();
	useSession.setState({
		nick: "",
		code: "",
		playerId: null,
		role: null,
		sala: null,
		socket: null,
	});
});

function renderJoin(initial = "/join"): void {
	render(
		<MemoryRouter initialEntries={[initial]}>
			<Routes>
				<Route path="/join" element={<JoinPage />} />
				<Route path="/s/:code" element={<div>ARENA</div>} />
			</Routes>
		</MemoryRouter>,
	);
}

function submitButton(name: string): HTMLButtonElement {
	const found = screen
		.getAllByRole("button", { name })
		.find((button) => (button as HTMLButtonElement).type === "submit");
	if (!found) throw new Error(`submit "${name}" não encontrado`);
	return found as HTMLButtonElement;
}

function welcomeMessage(code: string): string {
	return JSON.stringify({
		type: "welcome",
		payload: {
			playerId: "p_x",
			role: "player",
			sala: {
				code,
				hostId: "p_h",
				players: [],
				phase: "idle",
				round: 1,
				timer: 60,
				votes: {},
				createdAt: 1,
			},
		},
	});
}

function jsonFetch(status: number, body: unknown): typeof fetch {
	return (async () =>
		new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
}

describe("JoinPage", () => {
	test("mostra o ritual em 3 passos sem imagem de cartas", () => {
		installMocks(jsonFetch(200, {}));
		renderJoin();
		expect(document.querySelector(".join-intro img")).toBeNull();
		const ritual = screen.getByRole("list", { name: "Como funciona" });
		const steps = ritual.querySelectorAll(":scope > li");
		expect(steps).toHaveLength(3);
		expect(ritual.textContent).toMatch("Crie a sala");
		expect(ritual.textContent).toMatch("Compartilhe o código");
		expect(ritual.textContent).toMatch("Estimem juntos");
	});

	test("bloqueia envio com apelido inválido sem chamar rede", () => {
		let fetchCalls = 0;
		installMocks((async () => {
			fetchCalls += 1;
			return new Response("{}", { status: 200 });
		}) as unknown as typeof fetch);
		renderJoin();
		fireEvent.click(submitButton("Criar sala"));
		expect(
			screen.getByText("Apelido precisa de ao menos 2 caracteres."),
		).toBeTruthy();
		expect(fetchCalls).toBe(0);
		expect(MockSocket.instances).toHaveLength(0);
	});

	test("converte código digitado para maiúsculas", () => {
		installMocks(jsonFetch(200, {}));
		renderJoin();
		fireEvent.click(screen.getByRole("button", { name: "Entrar com código" }));
		const slots = document.querySelectorAll('input[inputmode="text"]');
		const first = slots[0] as HTMLInputElement;
		fireEvent.change(first, { target: { value: "a" } });
		expect(first.value).toBe("A");
	});

	test("modo join na query abre o campo de código", () => {
		installMocks(jsonFetch(200, {}));
		renderJoin("/join?mode=join");
		expect(screen.getByRole("group", { name: "Código da sala" })).toBeTruthy();
		expect(submitButton("Entrar na sala")).toBeTruthy();
	});

	test("link de convite preenche o código e entrar navega para a arena", async () => {
		const seen: string[] = [];
		installMocks((async (input: string | URL | Request) => {
			seen.push(String(input));
			return new Response(
				JSON.stringify({ exists: true, playerCount: 1, phase: "idle" }),
				{ status: 200 },
			);
		}) as unknown as typeof fetch);
		renderJoin("/join?code=zz99");
		fireEvent.change(screen.getByLabelText("Apelido"), {
			target: { value: "Ana" },
		});
		fireEvent.click(submitButton("Entrar na sala"));
		await waitFor(() => expect(MockSocket.instances).toHaveLength(1));
		expect(seen[0]).toMatch(/\/api\/v1\/salas\/ZZ99$/);
		const socket = MockSocket.instances[0]!;
		await act(async () => {
			socket.open();
			socket.receive(welcomeMessage("QWER"));
		});
		expect(await screen.findByText("ARENA")).toBeTruthy();
		const hello = JSON.parse(socket.sent[0] as string) as {
			type: string;
			payload: { uuid: string; nick: string; code: string };
		};
		expect(hello.type).toBe("hello");
		expect(hello.payload.nick).toBe("Ana");
		expect(hello.payload.code).toBe("ZZ99");
		expect(hello.payload.uuid).toMatch(/^[0-9a-f-]{36}$/i);
	});

	test("código inexistente mostra Sala não encontrada sem abrir socket", async () => {
		installMocks(jsonFetch(404, { code: "ZZZZ", exists: false }));
		renderJoin("/join?code=zzzz");
		fireEvent.change(screen.getByLabelText("Apelido"), {
			target: { value: "Ana" },
		});
		fireEvent.click(submitButton("Entrar na sala"));
		expect(
			await screen.findByText("Sala não encontrada. Confira o código."),
		).toBeTruthy();
		expect(MockSocket.instances).toHaveLength(0);
	});

	test("reload na entrada mantém o apelido digitado", () => {
		installMocks(jsonFetch(200, {}));
		renderJoin();
		fireEvent.change(screen.getByLabelText("Apelido"), {
			target: { value: "Dev" },
		});
		cleanup();
		renderJoin();
		expect(
			(screen.getByLabelText("Apelido") as HTMLInputElement).value,
		).toBe("Dev");
	});
});
