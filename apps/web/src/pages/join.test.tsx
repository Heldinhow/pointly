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
import type { Lang } from "@/lib/i18n";

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

function renderJoin(initial = "/join", lang: Lang = "pt-BR"): void {
	render(
		<MemoryRouter initialEntries={[initial]}>
			<Routes>
				<Route path="/join" element={<JoinPage lang={lang} />} />
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

function mockAvatarPipeline(): void {
	const ctor = (window as unknown as Record<string, unknown>)
		.HTMLCanvasElement as unknown as { prototype: Record<string, unknown> };
	ctor.prototype.getContext = () => ({ drawImage: () => {} });
	ctor.prototype.toDataURL = () => "data:image/jpeg;base64,MOCK128";
	(globalThis as Record<string, unknown>).createImageBitmap = async () => ({
		width: 200,
		height: 100,
		close: () => {},
	});
}

describe("JoinPage", () => {
	test("mantém os dados e o modo bloqueados enquanto a sala é criada", () => {
		installMocks(jsonFetch(200, {}));
		renderJoin();
		fireEvent.change(screen.getByLabelText("Apelido"), {
			target: { value: "Ana" },
		});
		fireEvent.click(submitButton("Criar sala"));
		expect(MockSocket.instances).toHaveLength(1);
		for (const control of document.querySelectorAll("#join-form input, #join-form button")) {
			expect(control.matches(":disabled")).toBe(true);
		}
		expect(screen.getByText("Criando sala…")).toBeTruthy();
		expect(submitButton("Criar sala").getAttribute("aria-busy")).toBe("true");
	});
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

	test("renderiza em inglês quando lang=en (inclui validação)", () => {
		installMocks(jsonFetch(200, {}));
		renderJoin("/join", "en");
		expect(screen.getByRole("list", { name: "How it works" })).toBeTruthy();
		fireEvent.click(submitButton("Create room"));
		expect(
			screen.getByText("Nickname needs at least 2 characters."),
		).toBeTruthy();
		fireEvent.click(screen.getByRole("radio", { name: "Join with code" }));
		expect(screen.getByRole("group", { name: "Room code" })).toBeTruthy();
		expect(submitButton("Join the room")).toBeTruthy();
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

	test("trocar de modo limpa o erro de apelido", () => {
		installMocks(jsonFetch(200, {}));
		renderJoin();
		fireEvent.click(submitButton("Criar sala"));
		expect(
			screen.getByText("Apelido precisa de ao menos 2 caracteres."),
		).toBeTruthy();
		fireEvent.click(screen.getByRole("radio", { name: "Entrar com código" }));
		expect(
			screen.queryByText("Apelido precisa de ao menos 2 caracteres."),
		).toBeNull();
	});

	test("converte código digitado para maiúsculas", () => {
		installMocks(jsonFetch(200, {}));
		renderJoin();
		fireEvent.click(screen.getByRole("radio", { name: "Entrar com código" }));
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

	test("modo join mostra entrar como espectador e envia spectate no hello", async () => {
		installMocks((async () =>
			new Response(
				JSON.stringify({ exists: true, playerCount: 1, phase: "idle" }),
				{ status: 200 },
			)) as unknown as typeof fetch);
		renderJoin("/join?mode=join");
		const toggle = screen.getByLabelText(/Entrar como espectador/) as HTMLInputElement;
		expect(toggle.checked).toBe(false);
		fireEvent.click(toggle);
		expect(toggle.checked).toBe(true);
		fireEvent.change(screen.getByLabelText("Apelido"), {
			target: { value: "Olho" },
		});
		const slots = document.querySelectorAll('input[inputmode="text"]');
		for (const [i, ch] of ["A", "B", "1", "2"].entries()) {
			fireEvent.change(slots[i]!, { target: { value: ch } });
		}
		fireEvent.click(submitButton("Entrar na sala"));
		await waitFor(() => expect(MockSocket.instances).toHaveLength(1));
		const socket = MockSocket.instances[0]!;
		await act(async () => {
			socket.open();
			socket.receive(welcomeMessage("AB12"));
		});
		const hello = JSON.parse(socket.sent[0] as string) as {
			type: string;
			payload: { nick: string; code: string; spectate?: boolean };
		};
		expect(hello.payload.spectate).toBe(true);
	});

	test("modo create não oferece entrar como espectador", () => {
		installMocks(jsonFetch(200, {}));
		renderJoin("/join");
		expect(screen.queryByLabelText(/Entrar como espectador/)).toBeNull();
	});

	test("join com avatar envia no hello e persiste no dispositivo", async () => {
		mockAvatarPipeline();
		installMocks(jsonFetch(200, {}));
		renderJoin("/join");
		fireEvent.change(screen.getByLabelText("Apelido"), {
			target: { value: "Ana" },
		});
		const input = screen.getByLabelText("Escolher foto") as HTMLInputElement;
		fireEvent.change(input, {
			target: {
				files: [new File([new Uint8Array([1, 2, 3])], "foto.png", { type: "image/png" })],
			},
		});
		await waitFor(() =>
			expect(
				(window.localStorage.getItem("pointly-avatar") ?? "").startsWith(
					"data:image/jpeg;base64,",
				),
			).toBe(true),
		);
		fireEvent.click(submitButton("Criar sala"));
		await waitFor(() => expect(MockSocket.instances).toHaveLength(1));
		const socket = MockSocket.instances[0]!;
		await act(async () => {
			socket.open();
			socket.receive(welcomeMessage("AB12"));
		});
		expect(await screen.findByText("ARENA")).toBeTruthy();
		const hello = JSON.parse(socket.sent[0] as string) as {
			type: string;
			payload: { nick: string; avatar?: string };
		};
		expect(hello.type).toBe("hello");
		expect(hello.payload.avatar?.startsWith("data:image/jpeg;base64,")).toBe(
			true,
		);
	});

	test("erro de arquivo não bloqueia o join", async () => {
		installMocks(jsonFetch(200, {}));
		renderJoin("/join");
		fireEvent.change(screen.getByLabelText("Apelido"), {
			target: { value: "Ana" },
		});
		const input = screen.getByLabelText("Escolher foto") as HTMLInputElement;
		fireEvent.change(input, {
			target: {
				files: [new File([new Uint8Array([1])], "a.gif", { type: "image/gif" })],
			},
		});
		expect(await screen.findByText(/png, jpeg ou webp/i)).toBeTruthy();
		fireEvent.click(submitButton("Criar sala"));
		await waitFor(() => expect(MockSocket.instances).toHaveLength(1));
		const socket = MockSocket.instances[0]!;
		await act(async () => {
			socket.open();
			socket.receive(welcomeMessage("AB12"));
		});
		expect(await screen.findByText("ARENA")).toBeTruthy();
		const hello = JSON.parse(socket.sent[0] as string) as {
			type: string;
			payload: Record<string, string>;
		};
		expect("avatar" in hello.payload).toBe(false);
	});
});
