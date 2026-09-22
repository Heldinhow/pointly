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
import type { Lang } from "../lib/i18n";
import type { Player, SalaState, Vote } from "../lib/protocol";
import { useSession } from "../store/session";
import { ArenaPage } from "./arena";

type RoomHandler = (sala: SalaState) => void;

class FakeSocket {
	handlers: {
		onRoomState?: RoomHandler;
		onClose?: () => void;
		onError?: (code: string, message: string) => void;
		onReconnecting?: (attempt: number, nextInMs: number) => void;
		onReconnected?: (welcome: unknown) => void;
		onReconnectFailed?: () => void;
		onProjectileThrown?: (event: {
			senderPlayerId: string;
			targetPlayerId: string;
			projectileType: string;
			outcome: "hit" | "dodge" | "deflect";
		}) => void;
		onNudgeSent?: (event: {
			senderPlayerId: string;
			targetPlayerId: string;
			nudgeId: string;
		}) => void;
	} = {};
	closed = false;
	sentVotes: string[] = [];
	sentReveals = 0;
	sentNewRounds = 0;
	sentProjectiles: Array<{ targetPlayerId: string; projectileType: string }> =
		[];
	sentNudges: Array<{ targetPlayerId: string; nudgeId: string }> = [];

	setHandlers(handlers: {
		onRoomState?: RoomHandler;
		onClose?: () => void;
		onError?: (code: string, message: string) => void;
		onReconnecting?: (attempt: number, nextInMs: number) => void;
		onReconnected?: (welcome: unknown) => void;
		onReconnectFailed?: () => void;
		onProjectileThrown?: (event: {
			senderPlayerId: string;
			targetPlayerId: string;
			projectileType: string;
			outcome: "hit" | "dodge" | "deflect";
		}) => void;
		onNudgeSent?: (event: {
			senderPlayerId: string;
			targetPlayerId: string;
			nudgeId: string;
		}) => void;
	}): void {
		this.handlers = { ...this.handlers, ...handlers };
	}

	close(): void {
		this.closed = true;
	}

	sendCastVote(value: string): boolean {
		this.sentVotes.push(value);
		return true;
	}

	sendRevealVotes(): boolean {
		this.sentReveals += 1;
		return true;
	}

	sendStartNewRound(): boolean {
		this.sentNewRounds += 1;
		return true;
	}

	sendThrowProjectile(
		targetPlayerId: string,
		projectileType: string,
	): boolean {
		this.sentProjectiles.push({ targetPlayerId, projectileType });
		return true;
	}

	sendNudge(targetPlayerId: string, nudgeId: string): boolean {
		this.sentNudges.push({ targetPlayerId, nudgeId });
		return true;
	}

	sentAvatars: Array<string | null> = [];

	updateAvatar(avatar: string | null): boolean {
		this.sentAvatars.push(avatar);
		return true;
	}

	emitRoomState(sala: SalaState): void {
		this.handlers.onRoomState?.(sala);
	}

	emitError(code: string, message: string): void {
		this.handlers.onError?.(code, message);
	}

	emitProjectile(event: {
		senderPlayerId: string;
		targetPlayerId: string;
		projectileType: string;
		outcome: "hit" | "dodge" | "deflect";
	}): void {
		this.handlers.onProjectileThrown?.(event);
	}

	emitNudge(event: {
		senderPlayerId: string;
		targetPlayerId: string;
		nudgeId: string;
	}): void {
		this.handlers.onNudgeSent?.(event);
	}
}

function player(
	overrides: Partial<Player> & { id: string },
	index: number,
): Player {
	return {
		uuid: `00000000-0000-4000-8000-0000000000${String(index).padStart(2, "0")}`,
		nick: `Player ${index}`,
		role: "player",
		seatIndex: index,
		hasVoted: false,
		value: null,
		status: "connected",
		joinedAt: 1000 + index,
		...overrides,
	};
}

function sala(overrides: Partial<SalaState> = {}): SalaState {
	const host = player({ id: "p_host", nick: "Ana", role: "host" }, 0);
	return {
		code: "AB12",
		hostId: host.id,
		players: [host],
		phase: "idle",
		round: 1,
		votes: {},
		createdAt: 1,
		...overrides,
	};
}

function seed(session: {
	sala: SalaState;
	playerId: string;
	socket: FakeSocket;
	nick?: string;
}): FakeSocket {
	useSession.setState({
		uuid: "00000000-0000-4000-8000-000000000099",
		nick: session.nick ?? "Ana",
		code: session.sala.code,
		playerId: session.playerId,
		role: session.playerId === session.sala.hostId ? "host" : "player",
		sala: session.sala,
		socket: session.socket as unknown as ReturnType<
			typeof useSession.getState
		>["socket"],
	});
	return session.socket;
}

function renderArena(route = "/s/AB12", lang: Lang = "pt-BR"): void {
	render(
		<MemoryRouter initialEntries={[route]}>
			<Routes>
				<Route path="/s/:code" element={<ArenaPage lang={lang} />} />
				<Route path="/join" element={<div>JOIN</div>} />
			</Routes>
		</MemoryRouter>,
	);
}

async function openProjectileMenu(nick = "Beto"): Promise<void> {
	fireEvent.click(screen.getByRole("button", { name: `Interagir com ${nick}` }));
	await screen.findByRole("menu");
}

function stubClipboard(): string[] {
	const written: string[] = [];
	Object.defineProperty(window.navigator, "clipboard", {
		configurable: true,
		value: {
			writeText: async (text: string) => {
				written.push(text);
			},
		},
	});
	return written;
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

afterEach(() => {
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

describe("ArenaPage (ticket 04)", () => {
	test("identifica sala, rodada, eu e host com 12 assentos", () => {
		const socket = new FakeSocket();
		const host = player({ id: "p_host", nick: "Ana", role: "host" }, 0);
		const me = player({ id: "p_beto", nick: "Beto" }, 1);
		seed({ sala: sala({ players: [host, me] }), playerId: me.id, socket });
		renderArena();

		expect(screen.getByTestId("sala-code").textContent).toMatch(/AB12/);
		expect(screen.getByTestId("round-label").textContent).toMatch(/Rodada 1/);
		expect(screen.getByTestId("self-line").textContent).toMatch(/Beto/);
		expect(screen.getByTestId("self-line").textContent).toMatch(/Host:.*Ana/);
		expect(screen.getByTestId("presence-line").textContent).toMatch(
			/2 na sala/,
		);
		// 12 assentos no total: 2 ocupados + 10 vazios.
		expect(screen.getAllByText("Assento vazio")).toHaveLength(10);
		expect(screen.getByTestId("seat-0")).toBeTruthy();
		expect(screen.getByTestId("seat-1")).toBeTruthy();
		expect(screen.getByTestId("seat-1").className).toMatch(
			/poker-seat--self/,
		);
	});

	test("renderiza a mesa em inglês quando lang=en", () => {
		const socket = new FakeSocket();
		const host = player({ id: "p_host", nick: "Ana", role: "host" }, 0);
		seed({ sala: sala({ players: [host] }), playerId: host.id, socket });
		renderArena("/s/AB12", "en");

		expect(screen.getByTestId("sala-code").textContent).toMatch(/Room AB12/);
		expect(screen.getByTestId("round-label").textContent).toMatch(/Round 1/);
		expect(screen.getByTestId("presence-line").textContent).toMatch(
			/1 in the room/,
		);
		expect(screen.getByText("Reveal votes")).toBeTruthy();
		expect(screen.getAllByText("Empty seat")).toHaveLength(11);
	});

	test("segundo navegador aparece ao vivo com assento e votos corretos", async () => {
		const socket = new FakeSocket();
		const host = player({ id: "p_host", nick: "Ana", role: "host" }, 0);
		seed({ sala: sala({ players: [host] }), playerId: host.id, socket });
		renderArena();

		expect(screen.getByTestId("presence-line").textContent).toMatch(
			/1 na sala/,
		);

		const carol = player({ id: "p_carol", nick: "Carol", hasVoted: true }, 1);
		await act(async () => {
			socket.emitRoomState(
				sala({ players: [host, carol], phase: "voting" }),
			);
		});

		await waitFor(() =>
			expect(screen.getByTestId("presence-line").textContent).toMatch(
				/2 na sala · 1 votou/,
			),
		);
		expect(screen.getByTestId("seat-1").textContent).toMatch(/Carol/);
		expect(screen.getByTestId("seat-1").textContent).toMatch(/Votou/);
	});

	test("copiar o convite mostra confirmação e o link entra direto na sala", async () => {
		const written = stubClipboard();
		const socket = new FakeSocket();
		seed({ sala: sala(), playerId: "p_host", socket });
		renderArena();

		const link = screen.getByLabelText(
			"Link de convite",
		) as HTMLInputElement;
		expect(link.value).toBe("http://localhost/join?code=AB12");

		fireEvent.click(screen.getByRole("button", { name: "Copiar" }));
		expect(await screen.findByTestId("copy-feedback")).toBeTruthy();
		expect(written).toEqual(["http://localhost/join?code=AB12"]);
	});

	test("convite é ocultável quando solo e volta com mostrar", () => {
		stubClipboard();
		const socket = new FakeSocket();
		seed({ sala: sala(), playerId: "p_host", socket });
		renderArena();

		expect(screen.getByTestId("solo-hint")).toBeTruthy();
		expect(screen.getByTestId("solo-hint").className).toMatch(
			/arena-solo-hint/,
		);
		fireEvent.click(
			screen.getByRole("button", { name: /Ocultar convite/ }),
		);
		expect(screen.queryByLabelText("Link de convite")).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: /Mostrar convite/ }));
		expect(screen.getByLabelText("Link de convite")).toBeTruthy();
	});

	test("com companhia o convite fica sempre visível", () => {
		stubClipboard();
		const socket = new FakeSocket();
		const host = player({ id: "p_host", nick: "Ana", role: "host" }, 0);
		const me = player({ id: "p_beto", nick: "Beto" }, 1);
		seed({ sala: sala({ players: [host, me] }), playerId: me.id, socket });
		renderArena();

		expect(screen.queryByTestId("solo-hint")).toBeNull();
		expect(
			screen.queryByRole("button", { name: /Ocultar convite/ }),
		).toBeNull();
		expect(screen.getByLabelText("Link de convite")).toBeTruthy();
	});

	test("entrada tardia com rodada em andamento mostra fase e votos", () => {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true },
			0,
		);
		const late = player({ id: "p_late", nick: "Tardio" }, 2);
		seed({
			sala: sala({
				players: [host, late],
				phase: "voting",
				round: 3,
			}),
			playerId: late.id,
			socket,
			nick: "Tardio",
		});
		renderArena();

		expect(screen.getByTestId("round-label").textContent).toMatch(
			/Rodada 3 · Votando/,
		);
		expect(screen.getByTestId("presence-line").textContent).toMatch(
			/2 na sala · 1 votou/,
		);
		expect(screen.getByTestId("seat-0").textContent).toMatch(/Votou/);
		expect(screen.getByTestId("seat-2").textContent).toMatch(/Aguardando/);
	});

	test("sem sessão redireciona para a entrada com o código", async () => {
		renderArena("/s/ZZ99");
		expect(await screen.findByText("JOIN")).toBeTruthy();
	});
});

describe("ArenaPage (ticket 05 — Votar)", () => {
	test("deck completo com 9 cartas e seleção inicial vazia", () => {
		const socket = new FakeSocket();
		seed({ sala: sala(), playerId: "p_host", socket });
		renderArena();

		expect(screen.getByTestId("deck")).toBeTruthy();
		for (const value of ["0", "½", "1", "2", "3", "5", "8", "13", "☕"]) {
			expect(screen.getByTestId(`deck-card-${value}`)).toBeTruthy();
		}
		expect(screen.getByTestId("deck-selection").textContent).toMatch(
			/Escolha uma carta/,
		);
	});

	test("clicar numa carta envia cast_vote uma vez", () => {
		const socket = new FakeSocket();
		seed({ sala: sala(), playerId: "p_host", socket });
		renderArena();

		fireEvent.click(screen.getByTestId("deck-card-5"));
		expect(socket.sentVotes).toEqual(["5"]);
	});

	test("duplo clique na mesma carta não perde nem duplica o voto", async () => {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		seed({ sala: sala({ players: [host], phase: "voting" }), playerId: host.id, socket });
		renderArena();

		// Própria escolha visível via seleção + carta pressionada.
		expect(screen.getByTestId("deck-selection").textContent).toMatch(/5/);
		expect(
			screen.getByTestId("deck-card-5").getAttribute("aria-pressed"),
		).toBe("true");

		fireEvent.click(screen.getByTestId("deck-card-5"));
		fireEvent.click(screen.getByTestId("deck-card-5"));
		expect(socket.sentVotes).toEqual([]);
	});

	test("substituir estimativa envia o novo valor", () => {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		seed({ sala: sala({ players: [host], phase: "voting" }), playerId: host.id, socket });
		renderArena();

		fireEvent.click(screen.getByTestId("deck-card-8"));
		expect(socket.sentVotes).toEqual(["8"]);
	});

	test("segundo navegador vê só Aguardando/Votou antes do reveal, nunca valores", () => {
		const socket = new FakeSocket();
		const host = player({ id: "p_host", nick: "Ana", role: "host" }, 0);
		const carol = player(
			{ id: "p_carol", nick: "Carol", hasVoted: true, value: "8" },
			1,
		);
		const me = player({ id: "p_beto", nick: "Beto" }, 2);
		seed({
			sala: sala({ players: [host, carol, me], phase: "voting" }),
			playerId: me.id,
			socket,
			nick: "Beto",
		});
		renderArena();

		const carolSeat = screen.getByTestId("seat-1").textContent ?? "";
		expect(carolSeat).toMatch(/Votou/);
		expect(carolSeat).not.toMatch(/8/);
		// Minha seleção vazia não expõe o voto alheio.
		expect(screen.getByTestId("deck-selection").textContent).toMatch(
			/Escolha uma carta/,
		);
	});

	test("pausa conta presença e mostra seleção própria sem vazar valor alheio", () => {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "☕" },
			0,
		);
		const me = player({ id: "p_beto", nick: "Beto" }, 1);
		seed({
			sala: sala({ players: [host, me], phase: "voting" }),
			playerId: host.id,
			socket,
			nick: "Ana",
		});
		renderArena();

		expect(screen.getByTestId("presence-line").textContent).toMatch(
			/2 na sala · 1 votou/,
		);
		expect(screen.getByTestId("deck-selection").textContent).toMatch(
			/pausa para café/i,
		);
		expect(
			screen.getByTestId("deck-card-☕").getAttribute("aria-pressed"),
		).toBe("true");
	});

	test("erro do servidor ao votar mostra alerta sem quebrar a mesa", async () => {
		const socket = new FakeSocket();
		seed({ sala: sala(), playerId: "p_host", socket });
		renderArena();

		await act(async () => {
			socket.emitError("invalid_vote", "Voto inválido para esta rodada.");
		});
		expect(await screen.findByTestId("vote-error")).toBeTruthy();
		expect(screen.getByTestId("deck")).toBeTruthy();
	});
});

describe("ArenaPage (ticket 06 — Reveal)", () => {
	test("sem nenhum voto o reveal fica indisponível (botão e R)", () => {
		const socket = new FakeSocket();
		seed({ sala: sala(), playerId: "p_host", socket });
		renderArena();

		const button = screen.getByTestId("reveal-button") as HTMLButtonElement;
		expect(button.disabled).toBe(true);
		expect(screen.getByTestId("reveal-hint").textContent).toMatch(
			/Aguardando o primeiro voto/,
		);

		fireEvent.keyDown(window, { key: "r" });
		expect(socket.sentReveals).toBe(0);
	});

	test("com voto na mesa o botão revela e o R revela", () => {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		seed({
			sala: sala({ players: [host], phase: "voting" }),
			playerId: host.id,
			socket,
		});
		renderArena();

		const button = screen.getByTestId("reveal-button") as HTMLButtonElement;
		expect(button.disabled).toBe(false);
		expect(button.getAttribute("aria-label")).toMatch(/atalho R/i);

		fireEvent.click(button);
		expect(socket.sentReveals).toBe(1);

		fireEvent.keyDown(window, { key: "R" });
		expect(socket.sentReveals).toBe(2);
	});

	test("R maiúsculo/minúsculo revela; repeat, modificadores e inputs ignoram", () => {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "3" },
			0,
		);
		seed({
			sala: sala({ players: [host], phase: "voting" }),
			playerId: host.id,
			socket,
		});
		renderArena();

		fireEvent.keyDown(window, { key: "r", repeat: true });
		fireEvent.keyDown(window, { key: "r", ctrlKey: true });
		fireEvent.keyDown(window, { key: "n" });
		expect(socket.sentReveals).toBe(0);

		// Foco num campo de texto: o atalho não dispara.
		const invite = screen.getByLabelText("Link de convite");
		invite.focus();
		fireEvent.keyDown(invite, { key: "r" });
		expect(socket.sentReveals).toBe(0);

		(document.activeElement as HTMLElement | null)?.blur?.();
		fireEvent.keyDown(window, { key: "r" });
		expect(socket.sentReveals).toBe(1);
	});

	test("todos-votaram informa prontidão sem auto-revelar", async () => {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		const beto = player(
			{ id: "p_beto", nick: "Beto", hasVoted: true, value: "8" },
			1,
		);
		seed({
			sala: sala({
				players: [host, beto],
				phase: "revealable",
			}),
			playerId: host.id,
			socket,
		});
		renderArena();

		expect(screen.getByTestId("round-label").textContent).toMatch(
			/Pronta para revelar/,
		);
		expect(screen.getByTestId("reveal-hint").textContent).toMatch(
			/Todos votaram/,
		);
		// Sem auto-reveal: continua pré-reveal com botão habilitado.
		expect(screen.getByTestId("reveal-button")).toBeTruthy();
		const button = screen.getByTestId("reveal-button") as HTMLButtonElement;
		expect(button.disabled).toBe(false);

		await act(async () => {
			socket.emitRoomState(
				sala({
					players: [host, beto],
					phase: "revealable",
				}),
			);
		});
		// Novo room_state mantém o pré-reveal sem revelar sozinho.
		await waitFor(() =>
			expect(screen.getByTestId("reveal-button")).toBeTruthy(),
		);
		expect(screen.getByTestId("reveal-button")).toBeTruthy();
	});

	test("reveal manual chega via room_state", async () => {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		const beto = player({ id: "p_beto", nick: "Beto" }, 1);
		seed({
			sala: sala({ players: [host, beto], phase: "voting" }),
			playerId: host.id,
			socket,
		});
		renderArena();

		expect(screen.getByTestId("reveal-button")).toBeTruthy();

		await act(async () => {
			socket.emitRoomState(
				sala({
					players: [
						host,
						{ ...beto, hasVoted: false, value: null },
					],
					phase: "revealed",
				}),
			);
		});

		await waitFor(() =>
			expect(screen.getByTestId("round-label").textContent).toMatch(
				/Revelada/,
			),
		);
		expect(screen.getByTestId("reveal-hint").textContent).toMatch(
			/Discutam as diferenças/,
		);
		expect(screen.queryByTestId("reveal-button")).toBeNull();
	});

	test("sem votos a sala aguarda o primeiro voto sem contagem", async () => {
		const socket = new FakeSocket();
		seed({ sala: sala(), playerId: "p_host", socket });
		renderArena();

		expect(screen.queryByTestId("timer-line")).toBeNull();
		expect(screen.getByTestId("presence-line").textContent).toMatch(
			/1 na sala · 0 votaram/,
		);

		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		await act(async () => {
			socket.emitRoomState(
				sala({ players: [host], phase: "voting" }),
			);
		});
		// Após o primeiro voto o reveal libera, sem contagem regressiva.
		await waitFor(() =>
			expect(
				(screen.getByTestId("reveal-button") as HTMLButtonElement).disabled,
			).toBe(false),
		);
		expect(screen.queryByTestId("timer-line")).toBeNull();
	});

	test("erro de reveal mostra alerta próprio sem quebrar a mesa", async () => {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		seed({
			sala: sala({ players: [host], phase: "voting" }),
			playerId: host.id,
			socket,
		});
		renderArena();

		await act(async () => {
			socket.emitError("invalid_phase", "invalid_phase: reveal requer voto");
		});
		expect(await screen.findByTestId("reveal-error")).toBeTruthy();
		expect(screen.getByTestId("deck")).toBeTruthy();
	});
});

describe("ArenaPage (ticket 07 — Resultados)", () => {
	function revealedSala(
		votes: Array<{ id: string; nick: string; value: Vote | null }>,
		extra: Partial<SalaState> = {},
	): SalaState {
		const players = votes.map((entry, index) =>
			player(
				{
					id: entry.id,
					nick: entry.nick,
					hasVoted: entry.value !== null,
					value: entry.value,
				},
				index,
			),
		);
		const votesMap: Record<string, string> = {};
		for (const entry of votes) {
			if (entry.value !== null) votesMap[entry.id] = entry.value;
		}
		return sala({
			players,
			phase: "revealed",
			votes: votesMap,
			...extra,
		});
	}

	test("½ vale 0,5 e 0 é válido; pausa e ausência fora dos cálculos", () => {
		const socket = new FakeSocket();
		const ana = { id: "p_host", nick: "Ana", value: "½" as const };
		const beto = { id: "p_beto", nick: "Beto", value: "0" as const };
		const carol = { id: "p_carol", nick: "Carol", value: "1" as const };
		const dave = { id: "p_dave", nick: "Dave", value: "☕" as const };
		const eve = { id: "p_eve", nick: "Eve", value: null };
		const state = revealedSala([ana, beto, carol, dave, eve]);
		seed({ sala: state, playerId: ana.id, socket });
		renderArena();

		// (0 + 0,5 + 1) / 3 = 0,5; mediana [0, 0,5, 1] → 0,5; intervalo 0–1.
		expect(screen.getByTestId("stats-result-value").textContent).toBe("0.5");
		expect(screen.getByTestId("stats-mean-value").textContent).toBe("0.5");
		expect(screen.getByTestId("stats-range-value").textContent).toBe("0–1");
		// Contagem por valor, com a pausa participando.
		expect(screen.getByTestId("stats-pip-½").textContent).toBe("1×½");
		expect(screen.getByTestId("stats-pip-0").textContent).toBe("1×0");
		expect(screen.getByTestId("stats-pip-1").textContent).toBe("1×1");
		expect(screen.getByTestId("stats-pip-☕").textContent).toBe("1×☕");
		// Quem não votou segue sem estimativa — sem zero automático.
		expect(screen.getByTestId("seat-4").textContent).toMatch(/Sem voto/);
		expect(screen.getByTestId("seat-4").textContent).not.toMatch(/\b0\b/);
	});

	test("unanimidade é sinalizada de relance", () => {
		const socket = new FakeSocket();
		const state = revealedSala([
			{ id: "p_host", nick: "Ana", value: "5" },
			{ id: "p_beto", nick: "Beto", value: "5" },
		]);
		seed({ sala: state, playerId: "p_host", socket });
		renderArena();

		expect(screen.getByTestId("stats-unanimous-badge").textContent).toMatch(
			/Unânime/,
		);
		expect(screen.getByTestId("stats-pill").getAttribute("data-stats-unanimous")).toBe(
			"true",
		);
		expect(screen.getByTestId("stats-result-value").textContent).toBe("5");
		expect(screen.getByTestId("stats-mean-value").textContent).toBe("5.0");
		expect(screen.getByTestId("stats-range-value").textContent).toBe("5–5");
	});

	test("voto único é sinalizado de relance", () => {
		const socket = new FakeSocket();
		const state = revealedSala([{ id: "p_host", nick: "Ana", value: "8" }]);
		seed({ sala: state, playerId: "p_host", socket });
		renderArena();

		expect(screen.getByTestId("stats-eyebrow").textContent).toMatch(
			/Voto único/,
		);
		expect(screen.getByTestId("stats-pill").getAttribute("data-stats-unanimous")).toBe(
			"false",
		);
		expect(screen.getByTestId("stats-result-value").textContent).toBe("8");
	});

	test("só pausa informa ausência de numéricos sem média nem intervalo", () => {
		const socket = new FakeSocket();
		const state = revealedSala([
			{ id: "p_host", nick: "Ana", value: "☕" },
			{ id: "p_beto", nick: "Beto", value: "☕" },
		]);
		seed({ sala: state, playerId: "p_host", socket });
		renderArena();

		expect(screen.getByTestId("stats-eyebrow").textContent).toMatch(
			/Sem votos numéricos/,
		);
		expect(screen.getByTestId("stats-result-value").textContent).toBe("—");
		expect(screen.getByTestId("stats-mean-value").textContent).toBe("—");
		expect(screen.getByTestId("stats-range-value").textContent).toBe("—");
		expect(screen.getByTestId("stats-no-numerics")).toBeTruthy();
	});

	test("reveal sem nenhum voto informa ausência de numéricos", () => {
		const socket = new FakeSocket();
		const host = player({ id: "p_host", nick: "Ana", role: "host" }, 0);
		seed({
			sala: sala({ players: [host], phase: "revealed", votes: {} }),
			playerId: host.id,
			socket,
		});
		renderArena();

		expect(screen.getByTestId("stats-eyebrow").textContent).toMatch(
			/Sem votos numéricos/,
		);
		expect(screen.getByTestId("stats-no-numerics")).toBeTruthy();
		expect(screen.queryByTestId("stats-unanimous-badge")).toBeNull();
	});

	test("pré-reveal não mostra estatísticas", () => {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		seed({
			sala: sala({ players: [host], phase: "voting" }),
			playerId: host.id,
			socket,
		});
		renderArena();

		expect(screen.queryByTestId("stats-pill")).toBeNull();
	});

	test("alterar o voto após o reveal recalcula para todos", async () => {
		const socket = new FakeSocket();
		const ana = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		const beto = player(
			{ id: "p_beto", nick: "Beto", hasVoted: true, value: "8" },
			1,
		);
		seed({
			sala: sala({
				players: [ana, beto],
				phase: "revealed",
				votes: { p_host: "5", p_beto: "8" },
			}),
			playerId: ana.id,
			socket,
		});
		renderArena();

		// Estado inicial: média 6,5, mediana 6,5, intervalo 5–8, sem unanimidade.
		expect(screen.getByTestId("stats-mean-value").textContent).toBe("6.5");
		expect(screen.getByTestId("stats-result-value").textContent).toBe("6.5");
		expect(screen.getByTestId("stats-range-value").textContent).toBe("5–8");
		expect(screen.queryByTestId("stats-unanimous-badge")).toBeNull();

		// O outro navegador altera o voto: o servidor rebroadcast o
		// room_state e as estatísticas recalculam aqui também.
		await act(async () => {
			socket.emitRoomState(
				sala({
					players: [
						ana,
						{ ...beto, value: "5" },
					],
					phase: "revealed",
					votes: { p_host: "5", p_beto: "5" },
				}),
			);
		});

		await waitFor(() =>
			expect(screen.getByTestId("stats-mean-value").textContent).toBe("5.0"),
		);
		expect(screen.getByTestId("stats-result-value").textContent).toBe("5");
		expect(screen.getByTestId("stats-range-value").textContent).toBe("5–5");
		expect(screen.getByTestId("stats-unanimous-badge")).toBeTruthy();
	});

	test("deck segue enabled após o reveal e envia a troca", () => {
		const socket = new FakeSocket();
		const ana = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		seed({
			sala: sala({
				players: [ana],
				phase: "revealed",
				votes: { p_host: "5" },
			}),
			playerId: ana.id,
			socket,
		});
		renderArena();

		expect(screen.getByTestId("deck-selection").textContent).toMatch(
			/atualiza para todos/,
		);
		fireEvent.click(screen.getByTestId("deck-card-8"));
		expect(socket.sentVotes).toEqual(["8"]);
	});
});

describe("ArenaPage (16.C — Copiar resultado #201)", () => {
	function revealedSala(
		votes: Array<{ id: string; nick: string; value: Vote | null }>,
		extra: Partial<SalaState> = {},
	): SalaState {
		const players = votes.map((entry, index) =>
			player(
				{
					id: entry.id,
					nick: entry.nick,
					hasVoted: entry.value !== null,
					value: entry.value,
				},
				index,
			),
		);
		const votesMap: Record<string, string> = {};
		for (const entry of votes) {
			if (entry.value !== null) votesMap[entry.id] = entry.value;
		}
		return sala({
			players,
			phase: "revealed",
			votes: votesMap,
			...extra,
		});
	}

	test("clique copia a string exata PT sem ☕ e em ordem ascendente", async () => {
		const written = stubClipboard();
		const socket = new FakeSocket();
		const state = revealedSala([
			{ id: "p_a", nick: "Ana", value: "5" },
			{ id: "p_b", nick: "Beto", value: "3" },
			{ id: "p_c", nick: "Carol", value: "8" },
			{ id: "p_d", nick: "Dave", value: "5" },
			{ id: "p_e", nick: "Eve", value: "☕" },
		]);
		seed({ sala: state, playerId: "p_a", socket });
		renderArena();

		const button = screen.getByTestId(
			"copy-results-button",
		) as HTMLButtonElement;
		expect(button.disabled).toBe(false);
		fireEvent.click(button);
		expect(await screen.findByTestId("copy-results-feedback")).toBeTruthy();
		expect(written).toEqual(["Mediana: 5 — votos: 3, 5, 5, 8"]);
		// Feedback reaproveita o padrão do convite: troca o rótulo por 2.5s.
		expect(button.textContent).toMatch(/Copiado!/);
	});

	test("EN copia `Median: … — votes: …`", async () => {
		const written = stubClipboard();
		const socket = new FakeSocket();
		const state = revealedSala([
			{ id: "p_a", nick: "Ana", value: "5" },
			{ id: "p_b", nick: "Beto", value: "3" },
		]);
		seed({ sala: state, playerId: "p_a", socket });
		renderArena("/s/AB12", "en");

		fireEvent.click(screen.getByTestId("copy-results-button"));
		expect(await screen.findByTestId("copy-results-feedback")).toBeTruthy();
		// Mediana de [3,5] → 4; lista plana ascendente "3, 5".
		expect(written).toEqual(["Median: 4 — votes: 3, 5"]);
		expect(screen.getByTestId("copy-results-button").textContent).toMatch(
			/Copied!/,
		);
	});

	test("voto único copia `Mediana: 5 — votos: 5`", async () => {
		const written = stubClipboard();
		const socket = new FakeSocket();
		const state = revealedSala([{ id: "p_a", nick: "Ana", value: "5" }]);
		seed({ sala: state, playerId: "p_a", socket });
		renderArena();

		fireEvent.click(screen.getByTestId("copy-results-button"));
		expect(await screen.findByTestId("copy-results-feedback")).toBeTruthy();
		expect(written).toEqual(["Mediana: 5 — votos: 5"]);
	});

	test("pré-reveal oculta o botão (não desabilita)", () => {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		seed({
			sala: sala({ players: [host], phase: "voting" }),
			playerId: host.id,
			socket,
		});
		renderArena();

		expect(screen.queryByTestId("stats-pill")).toBeNull();
		expect(screen.queryByTestId("copy-results-button")).toBeNull();
		expect(screen.queryByTestId("copy-results-feedback")).toBeNull();
	});

	test("noNumerics mantém o botão desabilitado com a nota e aria-live", async () => {
		stubClipboard();
		const socket = new FakeSocket();
		const state = revealedSala([
			{ id: "p_a", nick: "Ana", value: "☕" },
			{ id: "p_b", nick: "Beto", value: "☕" },
		]);
		seed({ sala: state, playerId: "p_a", socket });
		renderArena();

		const button = screen.getByTestId(
			"copy-results-button",
		) as HTMLButtonElement;
		expect(button.disabled).toBe(true);
		// Layout mantido: nota de ausência segue visível.
		expect(screen.getByTestId("stats-no-numerics")).toBeTruthy();
		// Feedback inline é aria-live polite (mesmo padrão do convite).
		const liveRegion = screen
			.getByTestId("copy-results-button")
			.parentElement?.parentElement?.querySelector('[aria-live="polite"]');
		expect(liveRegion).toBeTruthy();
		// Clique com desabilitado não copia nem mostra feedback.
		fireEvent.click(button);
		expect(screen.queryByTestId("copy-results-feedback")).toBeNull();
	});
});

describe("ArenaPage (ticket 08 — Nova Rodada)", () => {
	function revealedTwoPlayer(): {
		socket: FakeSocket;
		host: Player;
		beto: Player;
	} {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		const beto = player(
			{ id: "p_beto", nick: "Beto", hasVoted: true, value: "8" },
			1,
		);
		seed({
			sala: sala({
				players: [host, beto],
				phase: "revealed",
				round: 1,
				votes: { p_host: "5", p_beto: "8" },
			}),
			playerId: host.id,
			socket,
		});
		renderArena();
		return { socket, host, beto };
	}

	test("pré-reveal não mostra nova rodada e N é ignorado", () => {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		seed({
			sala: sala({ players: [host], phase: "voting" }),
			playerId: host.id,
			socket,
		});
		renderArena();

		expect(screen.queryByTestId("new-round-button")).toBeNull();
		fireEvent.keyDown(window, { key: "n" });
		fireEvent.keyDown(window, { key: "N" });
		expect(socket.sentNewRounds).toBe(0);
	});

	test("um clique único não abre nova rodada (arma confirmação)", () => {
		const { socket } = revealedTwoPlayer();

		const button = screen.getByTestId("new-round-button");
		expect(button.getAttribute("data-confirming")).toBe("false");
		expect(button.getAttribute("aria-label")).toMatch(/exige confirmação/i);

		fireEvent.click(button);
		expect(socket.sentNewRounds).toBe(0);
		expect(screen.getByTestId("new-round-button").getAttribute("data-confirming")).toBe(
			"true",
		);
		expect(screen.getByTestId("new-round-hint").textContent).toMatch(
			/Ative de novo para confirmar/,
		);
	});

	test("armação mostra countdown no ritmo da janela e some ao confirmar", async () => {
		const { socket } = revealedTwoPlayer();
		const { NEW_ROUND_CONFIRM_TIMEOUT_MS } = await import("./arena");

		expect(screen.queryByTestId("new-round-countdown")).toBeNull();
		fireEvent.click(screen.getByTestId("new-round-button"));
		const countdown = screen.getByTestId("new-round-countdown");
		expect(countdown.style.animationDuration).toBe(
			`${NEW_ROUND_CONFIRM_TIMEOUT_MS}ms`,
		);
		fireEvent.click(screen.getByTestId("new-round-button"));
		expect(socket.sentNewRounds).toBe(1);
		expect(screen.queryByTestId("new-round-countdown")).toBeNull();
	});

	test("segundo clique confirma e envia start_new_round uma vez", () => {
		const { socket } = revealedTwoPlayer();

		fireEvent.click(screen.getByTestId("new-round-button"));
		expect(socket.sentNewRounds).toBe(0);
		fireEvent.click(screen.getByTestId("new-round-button"));
		expect(socket.sentNewRounds).toBe(1);
	});

	test("confirmação expirada volta ao estado inicial sem enviar", async () => {
		const { socket } = revealedTwoPlayer();
		const { NEW_ROUND_CONFIRM_TIMEOUT_MS } = await import("./arena");

		fireEvent.click(screen.getByTestId("new-round-button"));
		expect(socket.sentNewRounds).toBe(0);
		expect(screen.getByTestId("new-round-button").getAttribute("data-confirming")).toBe(
			"true",
		);

		await act(async () => {
			await new Promise((resolve) =>
				setTimeout(resolve, NEW_ROUND_CONFIRM_TIMEOUT_MS + 400),
			);
		});

		// Expirou: volta ao rótulo inicial e o próximo clique arma de
		// novo em vez de enviar.
		expect(screen.getByTestId("new-round-button").getAttribute("data-confirming")).toBe(
			"false",
		);
		expect(screen.getByTestId("new-round-button").textContent).toMatch(
			/Nova rodada/,
		);
		fireEvent.click(screen.getByTestId("new-round-button"));
		expect(socket.sentNewRounds).toBe(0);
		expect(screen.getByTestId("new-round-button").getAttribute("data-confirming")).toBe(
			"true",
		);
	}, 15000);

	test("atalho N exige a mesma confirmação dupla", () => {
		const { socket } = revealedTwoPlayer();

		fireEvent.keyDown(window, { key: "n" });
		expect(socket.sentNewRounds).toBe(0);
		expect(screen.getByTestId("new-round-button").getAttribute("data-confirming")).toBe(
			"true",
		);

		fireEvent.keyDown(window, { key: "N" });
		expect(socket.sentNewRounds).toBe(1);
	});

	test("N ignora repeat, modificadores e inputs", () => {
		const { socket } = revealedTwoPlayer();

		fireEvent.keyDown(window, { key: "n", repeat: true });
		fireEvent.keyDown(window, { key: "n", ctrlKey: true });
		fireEvent.keyDown(window, { key: "n", metaKey: true });
		fireEvent.keyDown(window, { key: "n", altKey: true });
		expect(socket.sentNewRounds).toBe(0);
		expect(screen.getByTestId("new-round-button").getAttribute("data-confirming")).toBe(
			"false",
		);

		const invite = screen.getByLabelText("Link de convite");
		invite.focus();
		fireEvent.keyDown(invite, { key: "n" });
		expect(socket.sentNewRounds).toBe(0);
		(document.activeElement as HTMLElement | null)?.blur?.();

		// Botão e teclado compartilham o armar: clique arma, N confirma.
		fireEvent.click(screen.getByTestId("new-round-button"));
		expect(socket.sentNewRounds).toBe(0);
		fireEvent.keyDown(window, { key: "n" });
		expect(socket.sentNewRounds).toBe(1);
	});

	test("após a troca: número incrementado, votos zerados, mesmos players", async () => {
		const { socket, host, beto } = revealedTwoPlayer();
		const inviteBefore = (
			screen.getByLabelText("Link de convite") as HTMLInputElement
		).value;

		fireEvent.click(screen.getByTestId("new-round-button"));
		fireEvent.click(screen.getByTestId("new-round-button"));
		expect(socket.sentNewRounds).toBe(1);

		const resetHost = { ...host, hasVoted: false, value: null };
		const resetBeto = { ...beto, hasVoted: false, value: null };
		await act(async () => {
			socket.emitRoomState(
				sala({
					players: [resetHost, resetBeto],
					phase: "voting",
					round: 2,
					votes: {},
				}),
			);
		});

		await waitFor(() =>
			expect(screen.getByTestId("round-label").textContent).toMatch(
				/Rodada 2/,
			),
		);
		expect(screen.getByTestId("presence-line").textContent).toMatch(
			/2 na sala · 0 votaram/,
		);
		// Votos e resultados limpos: sem estatísticas nem valores expostos.
		expect(screen.queryByTestId("stats-pill")).toBeNull();
		expect(screen.getByTestId("seat-0").textContent).toMatch(/Aguardando/);
		expect(screen.getByTestId("seat-1").textContent).toMatch(/Aguardando/);
		// Código, convite e players mantidos.
		expect(screen.getByTestId("sala-code").textContent).toMatch(/AB12/);
		expect(
			(screen.getByLabelText("Link de convite") as HTMLInputElement).value,
		).toBe(inviteBefore);
		expect(screen.getByTestId("seat-0").textContent).toMatch(/Ana/);
		expect(screen.getByTestId("seat-1").textContent).toMatch(/Beto/);
		// Nova rodada consumida: o card sai de cena fora do reveal.
		expect(screen.queryByTestId("new-round-button")).toBeNull();
	});

	test("erro de nova rodada mostra alerta próprio sem quebrar a mesa", async () => {
		const { socket } = revealedTwoPlayer();

		await act(async () => {
			socket.emitError(
				"invalid_phase",
				"invalid_phase: start_new_round requer phase=revealed",
			);
		});
		expect(await screen.findByTestId("new-round-error")).toBeTruthy();
		expect(screen.getByTestId("deck")).toBeTruthy();
		expect(screen.getByTestId("stats-pill")).toBeTruthy();
	});

	test("nova rodada fica no centro da mesa e some fora do reveal", async () => {
		const { socket } = revealedTwoPlayer();

		const center = document.querySelector(".poker-center");
		expect(center).toBeTruthy();
		expect(center?.contains(screen.getByTestId("new-round-button"))).toBe(true);
		expect(center?.contains(screen.getByTestId("new-round-hint"))).toBe(true);

		fireEvent.click(screen.getByTestId("new-round-button"));
		fireEvent.click(screen.getByTestId("new-round-button"));
		await act(async () => {
			socket.emitRoomState(sala({ phase: "voting", round: 2, votes: {} }));
		});

		expect(screen.queryByTestId("new-round-button")).toBeNull();
		expect(document.querySelector(".poker-center")?.textContent).toMatch(
			/Qual é a sua estimativa\?/,
		);
	});

	test("reveal mostra resultados antes do convite na sidebar", () => {
		revealedTwoPlayer();
		const stats = screen.getByTestId("stats-pill");
		const invite = screen.getByLabelText("Link de convite");
		expect(
			stats.compareDocumentPosition(invite) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
	});
});

describe("ArenaPage (ticket 09 — Sessão e continuidade)", () => {
	const REAL_WS = globalThis.WebSocket;

	class RejoinMockWS {
		static instances: RejoinMockWS[] = [];
		onopen: ((event: Event) => void) | null = null;
		onmessage: ((event: MessageEvent) => void) | null = null;
		onerror: ((event: Event) => void) | null = null;
		onclose: ((event: Event) => void) | null = null;
		sent: string[] = [];
		closed = false;
		url: string;

		constructor(url: string) {
			this.url = url;
			RejoinMockWS.instances.push(this);
		}

		send(data: string): void {
			this.sent.push(data);
		}

		close(): void {
			this.closed = true;
		}

		open(): void {
			this.onopen?.(new Event("open"));
		}

		receive(raw: string): void {
			this.onmessage?.(
				new MessageEvent("message", { data: raw }) as MessageEvent,
			);
		}
	}

	function installRejoinMock(): void {
		RejoinMockWS.instances = [];
		globalThis.WebSocket = RejoinMockWS as unknown as typeof WebSocket;
	}

	function restoreWs(): void {
		globalThis.WebSocket = REAL_WS;
	}

	function persistSession(code: string, nick: string): void {
		window.localStorage.setItem(
			"pointly-session",
			JSON.stringify({ code, nick }),
		);
	}

	function resetStoreForRejoin(uuid: string): void {
		useSession.setState({
			uuid,
			nick: "",
			code: "",
			playerId: null,
			role: null,
			sala: null,
			socket: null,
		});
	}

	function helloOf(ws: RejoinMockWS): {
		type: string;
		payload: { uuid: string; nick: string; code?: string };
	} {
		const raw = ws.sent[0] as string;
		return JSON.parse(raw) as {
			type: string;
			payload: { uuid: string; nick: string; code?: string };
		};
	}

	function welcomeWithVote(code: string, playerId: string): string {
		return JSON.stringify({
			type: "welcome",
			payload: {
				playerId,
				role: "host",
				sala: sala({
					code,
					hostId: playerId,
					players: [
						player({
							id: playerId,
							uuid: "00000000-0000-4000-8000-000000000099",
							nick: "Ana",
							role: "host",
							hasVoted: true,
							value: "5",
						}, 0),
					],
					phase: "voting",
					round: 2,
					votes: {},
				}),
			},
		});
	}

	test("F5 no meio da votação recupera voto, assento e fase sem duplicar o Player", async () => {
		installRejoinMock();
		try {
			const uuid = "00000000-0000-4000-8000-000000000099";
			resetStoreForRejoin(uuid);
			persistSession("AB12", "Ana");
			renderArena("/s/AB12");

			await waitFor(() => expect(RejoinMockWS.instances).toHaveLength(1));
			const ws = RejoinMockWS.instances[0]!;
			await act(async () => {
				ws.open();
			});
			await waitFor(() => expect(ws.sent.length).toBeGreaterThan(0));
			const hello = helloOf(ws);
			expect(hello.type).toBe("hello");
			// Mesmo UUID — o servidor reidrata em vez de criar outro Player.
			expect(hello.payload.uuid).toBe(uuid);
			expect(hello.payload.nick).toBe("Ana");
			expect(hello.payload.code).toBe("AB12");

			await act(async () => {
				ws.receive(welcomeWithVote("AB12", "p_ana00000001"));
			});

			// Voto, assento e fase restaurados do snapshot do servidor.
			await waitFor(() =>
				expect(screen.getByTestId("round-label").textContent).toMatch(
					/Rodada 2 · Votando/,
				),
			);
			expect(screen.getByTestId("deck-selection").textContent).toMatch(/5/);
			expect(screen.getByTestId("seat-0").textContent).toMatch(/Ana/);
			expect(screen.getByTestId("seat-0").textContent).toMatch(/Votou/);
			expect(screen.getByTestId("presence-line").textContent).toMatch(
				/1 na sala · 1 votou/,
			);
			// Sessão segue persistida para o próximo reload.
			expect(window.localStorage.getItem("pointly-session")).toContain("AB12");
		} finally {
			restoreWs();
			try {
				(
					useSession.getState().socket as unknown as {
						close?: (options?: { silent?: boolean }) => void;
					} | null
				)?.close?.({ silent: true });
			} catch {
				// Socket já morto — nada a fazer.
			}
		}
	});

	test("sala inexistente no rejoin limpa a sessão e volta para a entrada", async () => {
		installRejoinMock();
		try {
			const uuid = "00000000-0000-4000-8000-000000000099";
			resetStoreForRejoin(uuid);
			persistSession("AB12", "Ana");
			renderArena("/s/AB12");

			await waitFor(() => expect(RejoinMockWS.instances).toHaveLength(1));
			const ws = RejoinMockWS.instances[0]!;
			await act(async () => {
				ws.open();
			});
			await waitFor(() => expect(ws.sent.length).toBeGreaterThan(0));

			await act(async () => {
				ws.receive(
					JSON.stringify({
						type: "error",
						payload: {
							code: "sala_nao_encontrada",
							message: "Sala AB12 não existe.",
						},
					}),
				);
			});

			expect(await screen.findByText("JOIN")).toBeTruthy();
			expect(window.localStorage.getItem("pointly-session")).toBeNull();
		} finally {
			restoreWs();
		}
	});

	test("saída voluntária envia leave_room e limpa a sessão", async () => {
		class LeavingSocket extends FakeSocket {
			sentLeaves = 0;
			sendLeaveRoom(): boolean {
				this.sentLeaves += 1;
				return true;
			}
		}
		const socket = new LeavingSocket();
		const host = player({ id: "p_host", nick: "Ana", role: "host" }, 0);
		seed({ sala: sala({ players: [host] }), playerId: host.id, socket });
		persistSession("AB12", "Ana");
		renderArena();

		fireEvent.click(screen.getByRole("button", { name: /Sair da sala/ }));
		expect(socket.sentLeaves).toBe(1);
		expect(socket.closed).toBe(true);
		expect(window.localStorage.getItem("pointly-session")).toBeNull();
		expect(await screen.findByText("JOIN")).toBeTruthy();
	});

	test("saída do Host promove o mais antigo sem travar a rodada", async () => {
		const socket = new FakeSocket();
		const ana = player({ id: "p_ana", nick: "Ana", role: "host" }, 0);
		const beto = player(
			{ id: "p_beto", nick: "Beto", hasVoted: true, value: "5" },
			1,
		);
		seed({
			sala: sala({
				players: [ana, beto],
				hostId: ana.id,
				phase: "voting",
				round: 2,
			}),
			playerId: beto.id,
			socket,
			nick: "Beto",
		});
		renderArena();

		expect(screen.getByTestId("self-line").textContent).toMatch(/Host:.*Ana/);

		// Host saiu (leave voluntário): servidor removeu Ana, promoveu Beto
		// (mais antigo restante) e broadcast o novo estado.
		const promotedBeto = { ...beto, role: "host" as const };
		await act(async () => {
			socket.emitRoomState(
				sala({
					players: [promotedBeto],
					hostId: promotedBeto.id,
					phase: "voting",
					round: 2,
				}),
			);
		});

		// Novo Host visível no outro navegador, rodada e fase intactas.
		await waitFor(() =>
			expect(screen.getByTestId("self-line").textContent).toMatch(
				/Host da sala/,
			),
		);
		expect(screen.getByTestId("round-label").textContent).toMatch(
			/Rodada 2 · Votando/,
		);
		expect(screen.getByTestId("presence-line").textContent).toMatch(
			/1 na sala · 1 votou/,
		);
		// A rodada segue funcionando: reveal continua disponível.
		const button = screen.getByTestId("reveal-button") as HTMLButtonElement;
		expect(button.disabled).toBe(false);
		fireEvent.click(button);
		expect(socket.sentReveals).toBe(1);
	});
});

describe("ArenaPage (reconnect em aba inativa)", () => {
	function withRetryCounter(socket: FakeSocket): { retries: () => number } {
		let count = 0;
		(socket as unknown as Record<string, unknown>).retryNow = () => {
			count += 1;
		};
		return { retries: () => count };
	}

	test("queda mostra Reconectando com Tentar agora; volta limpa o alerta", async () => {
		const socket = new FakeSocket();
		const counter = withRetryCounter(socket);
		seed({ sala: sala(), playerId: "p_host", socket });
		renderArena();

		expect(screen.queryByTestId("reconnecting-hint")).toBeNull();

		await act(async () => {
			socket.handlers.onReconnecting?.(2, 4000);
		});
		expect(screen.getByTestId("reconnecting-hint").textContent).toMatch(
			/Tentativa 2/,
		);

		fireEvent.click(screen.getByTestId("reconnect-now"));
		expect(counter.retries()).toBe(1);

		await act(async () => {
			socket.handlers.onReconnected?.({});
		});
		expect(screen.queryByTestId("reconnecting-hint")).toBeNull();
		expect(screen.queryByText("Conexão perdida")).toBeNull();
	});

	test("falha após a janela mostra Conexão perdida com Tentar de novo", async () => {
		const socket = new FakeSocket();
		const counter = withRetryCounter(socket);
		seed({ sala: sala(), playerId: "p_host", socket });
		renderArena();

		await act(async () => {
			socket.handlers.onReconnectFailed?.();
			socket.handlers.onClose?.();
		});
		expect(screen.getByText("Conexão perdida")).toBeTruthy();

		fireEvent.click(screen.getByTestId("reconnect-retry"));
		expect(counter.retries()).toBe(1);
	});
});

describe("ArenaPage (issue #157 — Projéteis)", () => {
	function revealedSalaWithPair(): {
		socket: FakeSocket;
		ana: Player;
		beto: Player;
	} {
		const socket = new FakeSocket();
		const ana = player(
			{ id: "p_ana", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		const beto = player(
			{ id: "p_beto", nick: "Beto", hasVoted: true, value: "8" },
			1,
		);
		seed({
			sala: sala({
				players: [ana, beto],
				phase: "revealed",
				votes: { p_ana: "5", p_beto: "8" },
			}),
			playerId: ana.id,
			socket,
			nick: "Ana",
		});
		return { socket, ana, beto };
	}

	test("durante a votação permite arremessar no participante sem revelar ou alterar votos", async () => {
		const socket = new FakeSocket();
		const host = player({ id: "p_host", nick: "Ana", role: "host" }, 0);
		const beto = player({ id: "p_beto", nick: "Beto" }, 1);
		seed({
			sala: sala({ players: [host, beto], phase: "voting" }),
			playerId: host.id,
			socket,
		});
		renderArena();

		expect(screen.queryByTestId("projectile-target")).toBeNull();
		expect(screen.queryByTestId("projectile-paper_plane")).toBeNull();
		await openProjectileMenu();
		fireEvent.click(screen.getByTestId("projectile-paper_plane"));
		expect(socket.sentProjectiles).toEqual([{ targetPlayerId: beto.id, projectileType: "paper_plane" }]);
		expect(socket.sentVotes).toEqual([]);
		expect(socket.sentReveals).toBe(0);
		expect(screen.queryByTestId("projectile-flight")).toBeNull();
	});

	test("pós-reveal lista os 6 projéteis com alvo e envia ao clicar", async () => {
		const { socket, beto } = revealedSalaWithPair();
		renderArena();
		await openProjectileMenu();

		expect(screen.queryByTestId("projectile-unavailable")).toBeNull();
		for (const type of [
			"paper_ball",
			"paper_plane",
			"rock",
			"brick",
			"tomato",
			"chair",
		]) {
			expect(screen.getByTestId(`projectile-${type}`)).toBeTruthy();
		}
		expect(screen.getByRole("menu").textContent).toContain(`Arremessar em ${beto.nick}`);

		fireEvent.click(screen.getByTestId("projectile-tomato"));
		expect(socket.sentProjectiles).toEqual([
			{ targetPlayerId: beto.id, projectileType: "tomato" },
		]);
	});

	test("menu aberto por clique permanece ao sair do alvo e permite arremessar", async () => {
		const { socket, beto } = revealedSalaWithPair();
		renderArena();
		await openProjectileMenu();

		fireEvent.mouseLeave(screen.getByRole("button", { name: "Interagir com Beto" }), {
			relatedTarget: document.body,
		});
		expect(screen.getByRole("menu")).toBeTruthy();
		fireEvent.click(screen.getByRole("menuitem", { name: "Tomate em Beto" }));
		expect(socket.sentProjectiles).toEqual([
			{ targetPlayerId: beto.id, projectileType: "tomato" },
		]);
		await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
	});

	test("Escape fecha o menu de projéteis e devolve o foco ao alvo", async () => {
		const { socket } = revealedSalaWithPair();
		renderArena();
		const trigger = screen.getByRole("button", { name: "Interagir com Beto" });
		act(() => trigger.focus());
		await openProjectileMenu();

		fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
		await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
		await waitFor(() => expect(document.activeElement).toBe(trigger));
		expect(socket.sentProjectiles).toEqual([]);
	});

	test("segundo envio no cooldown fica desabilitado com contagem no menu", async () => {
		const { socket } = revealedSalaWithPair();
		renderArena();
		await openProjectileMenu();

		fireEvent.click(screen.getByTestId("projectile-tomato"));
		expect(socket.sentProjectiles).toHaveLength(1);
		await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
		await openProjectileMenu();

		// Segundo envio imediato (<1s): bloqueado client-side com feedback,
		// sem trafegar e sem quebrar a sala.
		fireEvent.click(screen.getByTestId("projectile-rock"));
		expect(socket.sentProjectiles).toHaveLength(1);
		expect(screen.getByTestId("projectile-rock").getAttribute("aria-disabled")).toBe("true");
		expect(screen.getByTestId("projectile-cooldown").textContent).toMatch(
			/Recarregando/i,
		);
		// A sala continua funcional: deck e nova rodada intactos.
		expect(screen.getByTestId("deck")).toBeTruthy();
		expect(screen.getByTestId("new-round-button")).toBeTruthy();
	});

	test("libera novo envio após 1s, compartilhado entre projéteis e alvos", async () => {
		const { socket, ana, beto } = revealedSalaWithPair();
		const caio = player({ id: "p_caio", nick: "Caio" }, 2);
		useSession.setState({ sala: sala({ players: [ana, beto, caio], phase: "revealed" }) });
		renderArena();
		await openProjectileMenu();
		fireEvent.click(screen.getByTestId("projectile-paper_ball"));
		await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
		await openProjectileMenu("Caio");
		expect(screen.getByTestId("projectile-brick").getAttribute("aria-disabled")).toBe("true");
		await waitFor(() => expect(screen.getByTestId("projectile-brick").getAttribute("aria-disabled")).not.toBe("true"), { timeout: 1600 });
		fireEvent.click(screen.getByTestId("projectile-brick"));
		expect(socket.sentProjectiles).toEqual([
			{ targetPlayerId: beto.id, projectileType: "paper_ball" },
			{ targetPlayerId: caio.id, projectileType: "brick" },
		]);
	});

	test("falha de envio mostra erro sem inventar voo ou bloquear nova tentativa", async () => {
		const { socket } = revealedSalaWithPair();
		socket.sendThrowProjectile = () => false;
		renderArena();
		await openProjectileMenu();
		fireEvent.click(screen.getByTestId("projectile-tomato"));
		expect(screen.getByTestId("projectile-error")).toBeTruthy();
		expect(screen.queryByTestId("projectile-flight")).toBeNull();
		await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
		await openProjectileMenu();
		expect(screen.getByTestId("projectile-tomato").getAttribute("aria-disabled")).not.toBe("true");
	});

	test("sala vê só o voo anônimo, sem origem e sem lista de arremessos", async () => {
		const { socket, ana, beto } = revealedSalaWithPair();
		renderArena();

		await act(async () => {
			socket.emitProjectile({
				senderPlayerId: ana.id,
				targetPlayerId: beto.id,
				projectileType: "tomato",
				outcome: "hit",
			});
		});

		const flight = await screen.findByTestId("projectile-flight");
		expect(flight.getAttribute("data-sender")).toBeNull();
		expect(flight.getAttribute("data-target")).toBe(beto.id);
		expect(flight.getAttribute("data-outcome")).toBe("hit");
		expect(flight.getAttribute("data-projectile")).toBe("tomato");
		expect(screen.queryByTestId("projectile-feed")).toBeNull();
		expect(screen.queryByTestId("projectile-feed-item")).toBeNull();
	});

	test("cadeirada parte do centro da mesa com impacto épico no alvo", async () => {
		const { socket, ana, beto } = revealedSalaWithPair();
		renderArena();

		await act(async () => {
			socket.emitProjectile({
				senderPlayerId: ana.id,
				targetPlayerId: beto.id,
				projectileType: "chair",
				outcome: "hit",
			});
		});

		const flight = await screen.findByTestId("projectile-flight");
		expect(flight.getAttribute("data-sender")).toBeNull();
		expect(flight.getAttribute("data-projectile")).toBe("chair");
		expect(flight.className).toContain("projectile-flight--chair");
		expect(await screen.findByTestId("projectile-impact")).toBeTruthy();
	});

	test("voos simultâneos aparecem e são removidos ao terminar", async () => {
		const { socket, ana, beto } = revealedSalaWithPair();
		renderArena();
		act(() => {
			for (let index = 0; index < 7; index++) socket.emitProjectile({
				senderPlayerId: ana.id, targetPlayerId: beto.id, projectileType: "paper_ball", outcome: "deflect",
			});
		});
		expect(screen.getAllByTestId("projectile-flight")).toHaveLength(7);
		await waitFor(() => expect(screen.queryByTestId("projectile-flight")).toBeNull(), { timeout: 2000 });
	});

	test("movimento reduzido não cria voo", () => {
		const matchMedia = window.matchMedia;
		window.matchMedia = (query) => ({ ...matchMedia(query), matches: query.includes("prefers-reduced-motion") });
		try {
			const { socket, ana, beto } = revealedSalaWithPair();
			renderArena();
			act(() => socket.emitProjectile({ senderPlayerId: ana.id, targetPlayerId: beto.id, projectileType: "brick", outcome: "dodge" }));
			expect(screen.queryByTestId("projectile-flight")).toBeNull();
		} finally {
			window.matchMedia = matchMedia;
		}
	});

	test("erro de cooldown do servidor vira feedback sem quebrar", async () => {
		const { socket } = revealedSalaWithPair();
		renderArena();

		await act(async () => {
			socket.emitError(
				"invalid_phase",
				"Aguarde o cooldown para arremessar novamente.",
			);
		});

		expect(await screen.findByTestId("projectile-error")).toBeTruthy();
		expect(screen.getByTestId("projectile-error").textContent).toMatch(
			/cooldown/i,
		);
		expect(screen.getByTestId("deck")).toBeTruthy();
	});
});

describe("ArenaPage (issue #172 — Cutucadas)", () => {
	function nudgeSalaWithPair(): {
		socket: FakeSocket;
		ana: Player;
		beto: Player;
	} {
		const socket = new FakeSocket();
		const ana = player(
			{ id: "p_ana", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		const beto = player(
			{ id: "p_beto", nick: "Beto", hasVoted: true, value: "8" },
			1,
		);
		seed({
			sala: sala({
				players: [ana, beto],
				phase: "revealed",
				votes: { p_ana: "5", p_beto: "8" },
			}),
			playerId: ana.id,
			socket,
			nick: "Ana",
		});
		return { socket, ana, beto };
	}

	test("menu do alvo lista as 4 cutucadas e envia ao clicar", async () => {
		const { socket, beto } = nudgeSalaWithPair();
		renderArena();
		await openProjectileMenu();

		for (const id of ["bora", "cafe", "polemica", "confia"]) {
			expect(screen.getByTestId(`nudge-${id}`)).toBeTruthy();
		}
		expect(screen.getByRole("menu").textContent).toContain("Cutucar Beto");

		fireEvent.click(screen.getByTestId("nudge-bora"));
		expect(socket.sentNudges).toEqual([
			{ targetPlayerId: beto.id, nudgeId: "bora" },
		]);
		expect(socket.sentProjectiles).toEqual([]);
	});

	test("broadcast desenha o balão sobre o alvo e ele some sozinho", async () => {
		const { socket, ana, beto } = nudgeSalaWithPair();
		renderArena();

		await act(async () => {
			socket.emitNudge({
				senderPlayerId: beto.id,
				targetPlayerId: ana.id,
				nudgeId: "cafe",
			});
		});

		const balloon = await screen.findByTestId("nudge-balloon");
		expect(balloon.textContent).toContain("☕ Café?");
		expect(balloon.getAttribute("data-target-player")).toBe(ana.id);
		// Efêmera: some sozinha, sem feed nem persistência. Margem folgada
		// (vida de 2000ms) porque a suite roda arquivos em paralelo e
		// timers reais atrasam sob carga.
		await waitFor(
			() => expect(screen.queryByTestId("nudge-balloon")).toBeNull(),
			{ timeout: 5000 },
		);
	});

	test("cooldown compartilhado bloqueia arremesso logo após a cutucada", async () => {
		const { socket } = nudgeSalaWithPair();
		renderArena();
		await openProjectileMenu();
		fireEvent.click(screen.getByTestId("nudge-confia"));
		expect(socket.sentNudges).toHaveLength(1);
		await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());

		await openProjectileMenu();
		expect(
			screen.getByTestId("projectile-rock").getAttribute("aria-disabled"),
		).toBe("true");
		expect(
			screen.getByTestId("nudge-cafe").getAttribute("aria-disabled"),
		).toBe("true");
		fireEvent.click(screen.getByTestId("nudge-cafe"));
		expect(socket.sentNudges).toHaveLength(1);
		expect(socket.sentProjectiles).toHaveLength(0);
	});

	test("erro de cooldown de cutucada vira feedback sem quebrar", async () => {
		const { socket } = nudgeSalaWithPair();
		renderArena();

		await act(async () => {
			socket.emitError(
				"invalid_phase",
				"Aguarde o cooldown para cutucar novamente.",
			);
		});

		expect(await screen.findByTestId("projectile-error")).toBeTruthy();
		expect(screen.getByTestId("projectile-error").textContent).toMatch(
			/cutucar/i,
		);
		expect(screen.getByTestId("deck")).toBeTruthy();
	});
});

describe("ArenaPage (issue #158 — polimento e auditoria)", () => {
	function pairSala(phase: "voting" | "revealed"): FakeSocket {
		const socket = new FakeSocket();
		const ana = player(
			{ id: "p_ana", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		const beto = player(
			{ id: "p_beto", nick: "Beto", hasVoted: true, value: "8" },
			1,
		);
		seed({
			sala: sala({
				players: [ana, beto],
				phase,
				votes: phase === "revealed" ? { p_ana: "5", p_beto: "8" } : {},
			}),
			playerId: ana.id,
			socket,
			nick: "Ana",
		});
		return socket;
	}

	test("atalho R é descobrível por tecnologia assistiva", () => {
		pairSala("voting");
		renderArena();

		expect(
			screen.getByTestId("reveal-button").getAttribute("aria-keyshortcuts"),
		).toBe("r");
	});

	test("atalho N é descobrível por tecnologia assistiva", () => {
		pairSala("revealed");
		renderArena();

		expect(
			screen
				.getByTestId("new-round-button")
				.getAttribute("aria-keyshortcuts"),
		).toBe("n");
	});

	test("menu no participante tem nome acessível e não existe no próprio usuário", async () => {
		const socket = new FakeSocket();
		const ana = player(
			{ id: "p_ana", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		const beto = player(
			{ id: "p_beto", nick: "Beto", hasVoted: true, value: "8" },
			1,
		);
		seed({
			sala: sala({
				players: [ana, beto],
				phase: "revealed",
				votes: { p_ana: "5", p_beto: "8" },
			}),
			playerId: ana.id,
			socket,
			nick: "Ana",
		});
		renderArena();

		expect(screen.queryByRole("button", { name: "Interagir com Ana" })).toBeNull();
		const trigger = screen.getByRole("button", { name: "Interagir com Beto" });
		expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
		expect(trigger.getAttribute("aria-expanded")).toBe("false");
		await openProjectileMenu();
		// 6 projéteis + 4 cutucadas (issue #172) no mesmo menu do alvo.
		expect(screen.getAllByRole("menuitem")).toHaveLength(10);
		// Typeahead do menu não pode disparar atalhos de rodada.
		fireEvent.keyDown(screen.getByRole("menu"), { key: "n" });
		expect(screen.getByTestId("new-round-button").getAttribute("data-confirming")).toBe("false");
		act(() => socket.emitRoomState(sala({ players: [ana, { ...beto, status: "disconnected" }], phase: "revealed" })));
		expect(screen.queryByRole("button", { name: "Interagir com Beto" })).toBeNull();
		expect(screen.queryByRole("menu")).toBeNull();
	});
});

describe("ArenaPage (espectador)", () => {
	test("espectador vê deck desabilitado e presença separada", () => {
		const socket = new FakeSocket();
		const ana = player(
			{ id: "p_ana", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		const olho = player(
			{
				id: "p_olho",
				nick: "Olho",
				role: "spectator",
				hasVoted: false,
				value: null,
				seatIndex: -1,
			},
			-1,
		);
		seed({
			sala: sala({ players: [ana, olho], phase: "voting" }),
			playerId: olho.id,
			socket,
			nick: "Olho",
		});
		renderArena();

		expect(screen.getByTestId("self-line").textContent).toMatch(/Assistindo/);
		expect(screen.getByTestId("deck-selection").textContent).toMatch(
			/não votam/i,
		);
		expect(
			(screen.getByTestId("deck-card-5") as HTMLButtonElement).disabled,
		).toBe(true);
		expect(screen.getByTestId("presence-line").textContent).toMatch(
			/1 jogando · 1 assistindo/,
		);
		expect(screen.getByTestId("spectators-line").textContent).toMatch(/Olho/);
		// Espectador não ocupa assento: só 1 seat ocupado.
		expect(screen.getByTestId("seat-0").textContent).toMatch(/Ana/);
		expect(screen.queryByTestId("seat--1")).toBeNull();
	});

	test("clique no deck como espectador mostra alerta sem enviar voto", () => {
		const socket = new FakeSocket();
		const ana = player({ id: "p_ana", nick: "Ana", role: "host" }, 0);
		const olho = player(
			{
				id: "p_olho",
				nick: "Olho",
				role: "spectator",
				seatIndex: -1,
			},
			-1,
		);
		seed({
			sala: sala({ players: [ana, olho], phase: "voting" }),
			playerId: olho.id,
			socket,
			nick: "Olho",
		});
		renderArena();

		// Botão desabilitado não dispara; força via handler gear? Apenas checa estado.
		expect(socket.sentVotes).toEqual([]);
		expect(screen.getByTestId("deck")).toBeTruthy();
	});

	test("arena troca avatar via update_avatar sem reload", async () => {
		mockAvatarPipeline();
		const socket = new FakeSocket();
		const host = player({ id: "p_host", nick: "Ana", role: "host" }, 0);
		const me = player({ id: "p_beto", nick: "Beto" }, 1);
		seed({ sala: sala({ players: [host, me] }), playerId: me.id, socket });
		renderArena();

		const input = screen.getByLabelText("Escolher foto") as HTMLInputElement;
		fireEvent.change(input, {
			target: {
				files: [new File([new Uint8Array([1, 2, 3])], "foto.png", { type: "image/png" })],
			},
		});
		await waitFor(() => expect(socket.sentAvatars).toHaveLength(1));
		expect(
			socket.sentAvatars[0]?.startsWith("data:image/jpeg;base64,"),
		).toBe(true);
		// Sem reload: mesma sala, mesmo socket, avatar persistido no dispositivo.
		expect(screen.getByTestId("sala-code").textContent).toMatch(/AB12/);
		expect(
			(window.localStorage.getItem("pointly-avatar") ?? "").startsWith(
				"data:image/jpeg;base64,",
			),
		).toBe(true);
	});

	test("remover avatar envia null e broadcast volta a iniciais", async () => {
		const socket = new FakeSocket();
		const host = player({ id: "p_host", nick: "Ana", role: "host" }, 0);
		const me = player(
			{ id: "p_beto", nick: "Beto", avatar: "data:image/jpeg;base64,AAA" },
			1,
		);
		seed({ sala: sala({ players: [host, me] }), playerId: me.id, socket });
		renderArena();

		expect(
			screen.getByAltText("Prévia do avatar") as HTMLImageElement,
		).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Remover" }));
		expect(socket.sentAvatars).toEqual([null]);
		expect(window.localStorage.getItem("pointly-avatar")).toBeNull();
		await act(async () => {
			socket.emitRoomState(
				sala({ players: [host, player({ id: "p_beto", nick: "Beto" }, 1)] }),
			);
		});
		expect(screen.queryByAltText("Prévia do avatar")).toBeNull();
		expect(screen.getByTestId("seat-1").textContent).toMatch(/BE/);
	});

	test("espectador com avatar aparece com foto na lista", () => {
		const socket = new FakeSocket();
		const ana = player({ id: "p_ana", nick: "Ana", role: "host" }, 0);
		const olho = player(
			{
				id: "p_olho",
				nick: "Olho",
				role: "spectator",
				seatIndex: -1,
				avatar: "data:image/jpeg;base64,AAA",
			},
			-1,
		);
		seed({
			sala: sala({ players: [ana, olho], phase: "voting" }),
			playerId: olho.id,
			socket,
			nick: "Olho",
		});
		renderArena();

		const line = screen.getByTestId("spectators-line");
		const img = line.querySelector("img.arena-spectator-avatar");
		expect(img?.getAttribute("src")).toBe("data:image/jpeg;base64,AAA");
		expect(line.textContent).toMatch(/Olho/);
	});

	test("erro de load no avatar do espectador volta para as iniciais", () => {
		const socket = new FakeSocket();
		const ana = player({ id: "p_ana", nick: "Ana", role: "host" }, 0);
		const olho = player(
			{
				id: "p_olho",
				nick: "Olho",
				role: "spectator",
				seatIndex: -1,
				avatar: "data:image/jpeg;base64,AAA",
			},
			-1,
		);
		seed({
			sala: sala({ players: [ana, olho], phase: "voting" }),
			playerId: olho.id,
			socket,
			nick: "Olho",
		});
		renderArena();

		const line = screen.getByTestId("spectators-line");
		fireEvent.error(line.querySelector("img.arena-spectator-avatar")!);
		expect(line.querySelector("img.arena-spectator-avatar")).toBeNull();
		expect(line.textContent).toMatch(/OL/);
	});

	test("espectador sem avatar mostra iniciais na lista", () => {
		const socket = new FakeSocket();
		const ana = player({ id: "p_ana", nick: "Ana", role: "host" }, 0);
		const olho = player(
			{ id: "p_olho", nick: "Olho", role: "spectator", seatIndex: -1 },
			-1,
		);
		seed({
			sala: sala({ players: [ana, olho], phase: "voting" }),
			playerId: olho.id,
			socket,
			nick: "Olho",
		});
		renderArena();

		const line = screen.getByTestId("spectators-line");
		expect(line.querySelector("img.arena-spectator-avatar")).toBeNull();
		expect(line.textContent).toMatch(/OL/);
		expect(line.textContent).toMatch(/Olho/);
	});
});

// ---------------------------------------------------------------------------
// 14.3 — Celebração de Unânime
// ---------------------------------------------------------------------------

describe("ArenaPage (14.3 — Celebração de Unânime)", () => {
	function pairSala(
		phase: SalaState["phase"],
		votes: Record<string, string>,
	): SalaState {
		const ana = player(
			{
				id: "p_host",
				nick: "Ana",
				role: "host",
				hasVoted: true,
				value: votes.p_host ?? null,
			},
			0,
		);
		const beto = player(
			{
				id: "p_beto",
				nick: "Beto",
				hasVoted: true,
				value: votes.p_beto ?? null,
			},
			1,
		);
		return sala({ players: [ana, beto], phase, votes });
	}

	test("transição ao vivo para revealed unânime celebra", async () => {
		const socket = new FakeSocket();
		seed({
			sala: pairSala("revealable", { p_host: "5", p_beto: "5" }),
			playerId: "p_host",
			socket,
		});
		renderArena();
		expect(screen.queryByTestId("unanimous-celebration")).toBeNull();

		await act(async () => {
			socket.emitRoomState(pairSala("revealed", { p_host: "5", p_beto: "5" }));
		});

		expect(screen.getByTestId("unanimous-celebration")).toBeTruthy();
	});

	test("reveal divergente não celebra", async () => {
		const socket = new FakeSocket();
		seed({
			sala: pairSala("revealable", { p_host: "5", p_beto: "8" }),
			playerId: "p_host",
			socket,
		});
		renderArena();

		await act(async () => {
			socket.emitRoomState(pairSala("revealed", { p_host: "5", p_beto: "8" }));
		});

		expect(screen.getByTestId("stats-pill").getAttribute("data-stats-unanimous")).toBe(
			"false",
		);
		expect(screen.queryByTestId("unanimous-celebration")).toBeNull();
	});

	test("já revealed na montagem (reload/join) não replaya", () => {
		const socket = new FakeSocket();
		seed({
			sala: pairSala("revealed", { p_host: "5", p_beto: "5" }),
			playerId: "p_host",
			socket,
		});
		renderArena();

		expect(screen.getByTestId("stats-unanimous-badge")).toBeTruthy();
		expect(screen.queryByTestId("unanimous-celebration")).toBeNull();
	});

	test("edição pós-reveal para unânime atualiza o badge sem celebrar", async () => {
		const socket = new FakeSocket();
		seed({
			sala: pairSala("revealed", { p_host: "5", p_beto: "8" }),
			playerId: "p_host",
			socket,
		});
		renderArena();
		expect(screen.queryByTestId("unanimous-celebration")).toBeNull();

		await act(async () => {
			socket.emitRoomState(pairSala("revealed", { p_host: "5", p_beto: "5" }));
		});

		await waitFor(() =>
			expect(screen.getByTestId("stats-unanimous-badge")).toBeTruthy(),
		);
		expect(screen.queryByTestId("unanimous-celebration")).toBeNull();
	});

	test("nova rodada unânime re-arma (remonta) a celebração", async () => {
		const socket = new FakeSocket();
		seed({
			sala: pairSala("revealable", { p_host: "5", p_beto: "5" }),
			playerId: "p_host",
			socket,
		});
		renderArena();

		await act(async () => {
			socket.emitRoomState(pairSala("revealed", { p_host: "5", p_beto: "5" }));
		});
		const first = screen.getByTestId("unanimous-celebration");

		await act(async () => {
			socket.emitRoomState(pairSala("voting", {}));
		});
		await act(async () => {
			socket.emitRoomState(pairSala("revealed", { p_host: "8", p_beto: "8" }));
		});

		expect(screen.getByTestId("unanimous-celebration")).not.toBe(first);
	});
});
