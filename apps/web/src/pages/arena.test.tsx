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
import type { Player, SalaState, Vote } from "../lib/protocol";
import { useSession } from "../store/session";
import { ArenaPage } from "./arena";

type RoomHandler = (sala: SalaState) => void;

class FakeSocket {
	handlers: {
		onRoomState?: RoomHandler;
		onClose?: () => void;
		onError?: (code: string, message: string) => void;
		onProjectileThrown?: (event: {
			senderPlayerId: string;
			targetPlayerId: string;
			projectileType: string;
			outcome: "hit" | "dodge" | "deflect";
		}) => void;
	} = {};
	closed = false;
	sentVotes: string[] = [];
	sentReveals = 0;
	sentNewRounds = 0;
	sentProjectiles: Array<{ targetPlayerId: string; projectileType: string }> =
		[];

	setHandlers(handlers: {
		onRoomState?: RoomHandler;
		onClose?: () => void;
		onError?: (code: string, message: string) => void;
		onProjectileThrown?: (event: {
			senderPlayerId: string;
			targetPlayerId: string;
			projectileType: string;
			outcome: "hit" | "dodge" | "deflect";
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
		timer: 60,
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

function renderArena(route = "/s/AB12"): void {
	render(
		<MemoryRouter initialEntries={[route]}>
			<Routes>
				<Route path="/s/:code" element={<ArenaPage />} />
				<Route path="/join" element={<div>JOIN</div>} />
			</Routes>
		</MemoryRouter>,
	);
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
		expect(screen.getByTestId("seat-1-you")).toBeTruthy();
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
				sala({ players: [host, carol], phase: "voting", timer: 55 }),
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

	test("entrada tardia com rodada em andamento mostra fase, votos e timer", () => {
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
				timer: 42,
			}),
			playerId: late.id,
			socket,
			nick: "Tardio",
		});
		renderArena();

		expect(screen.getByTestId("round-label").textContent).toMatch(
			/Rodada 3 · Votando/,
		);
		expect(screen.getByTestId("timer-line").textContent).toMatch(/42s/);
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

describe("ArenaPage (ticket 06 — Timer e Reveal)", () => {
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
			sala: sala({ players: [host], phase: "voting", timer: 55 }),
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
			sala: sala({ players: [host], phase: "voting", timer: 50 }),
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
				timer: 44,
			}),
			playerId: host.id,
			socket,
		});
		renderArena();

		expect(screen.getByTestId("round-label").textContent).toMatch(
			/Pronta para revelar/,
		);
		expect(screen.getByTestId("reveal-hint").textContent).toMatch(
			/Todos votaram.*no zero, revela sozinho/,
		);
		// Sem auto-reveal: continua pré-reveal com botão habilitado.
		expect(screen.queryByTestId("reveal-done")).toBeNull();
		const button = screen.getByTestId("reveal-button") as HTMLButtonElement;
		expect(button.disabled).toBe(false);
		expect(screen.getByTestId("timer-line").textContent).toMatch(/44s/);

		await act(async () => {
			socket.emitRoomState(
				sala({
					players: [host, beto],
					phase: "revealable",
					timer: 43,
				}),
			);
		});
		// Novo room_state reconcilia o timer sem revelar sozinho.
		await waitFor(() =>
			expect(screen.getByTestId("timer-line").textContent).toMatch(/43s/),
		);
		expect(screen.queryByTestId("reveal-done")).toBeNull();
	});

	test("zerar o timer revela sozinho via room_state", async () => {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		const beto = player({ id: "p_beto", nick: "Beto" }, 1);
		seed({
			sala: sala({ players: [host, beto], phase: "voting", timer: 1 }),
			playerId: host.id,
			socket,
		});
		renderArena();

		expect(screen.queryByTestId("reveal-done")).toBeNull();

		await act(async () => {
			socket.emitRoomState(
				sala({
					players: [
						host,
						{ ...beto, hasVoted: false, value: null },
					],
					phase: "revealed",
					timer: 0,
				}),
			);
		});

		await waitFor(() =>
			expect(screen.getByTestId("round-label").textContent).toMatch(
				/Revelada/,
			),
		);
		expect(screen.getByTestId("reveal-done")).toBeTruthy();
		expect(screen.queryByTestId("reveal-button")).toBeNull();
		expect(screen.getByTestId("timer-line").textContent).toMatch(/0s/);
	});

	test("timer parado nos 60s sem votos e em contagem após o primeiro voto", async () => {
		const socket = new FakeSocket();
		seed({ sala: sala(), playerId: "p_host", socket });
		renderArena();

		expect(screen.getByTestId("timer-line").textContent).toMatch(/60s/);
		// 1,2s parado sem votos: continua 60s.
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 1200));
		});
		expect(screen.getByTestId("timer-line").textContent).toMatch(/60s/);

		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		await act(async () => {
			socket.emitRoomState(
				sala({ players: [host], phase: "voting", timer: 60 }),
			);
		});
		// Após o primeiro voto a contagem local decrementa no mesmo valor
		// nos dois navegadores (mesmo baseline do room_state).
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 1200));
		});
		const text = screen.getByTestId("timer-line").textContent ?? "";
		expect(/59s|58s/.test(text)).toBe(true);
	});

	test("estado crítico na reta final usa estilo destrutivo e live assertivo", () => {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		seed({
			sala: sala({ players: [host], phase: "voting", timer: 30 }),
			playerId: host.id,
			socket,
		});
		renderArena();

		const line = screen.getByTestId("timer-line");
		expect(line.textContent).toMatch(/30s/);
		expect(line.getAttribute("aria-live")).toBe("assertive");
		expect(line.className).toMatch(/text-destructive/);
	});

	test("erro de reveal mostra alerta próprio sem quebrar a mesa", async () => {
		const socket = new FakeSocket();
		const host = player(
			{ id: "p_host", nick: "Ana", role: "host", hasVoted: true, value: "5" },
			0,
		);
		seed({
			sala: sala({ players: [host], phase: "voting", timer: 55 }),
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
			timer: 0,
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
			sala: sala({ players: [host], phase: "revealed", timer: 0, votes: {} }),
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
			sala: sala({ players: [host], phase: "voting", timer: 55 }),
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
				timer: 0,
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
					timer: 0,
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
				timer: 0,
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
				timer: 0,
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
			sala: sala({ players: [host], phase: "voting", timer: 55 }),
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

	test("após a troca: número incrementado, votos zerados, timer em 60s, mesmos players", async () => {
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
					timer: 60,
					votes: {},
				}),
			);
		});

		await waitFor(() =>
			expect(screen.getByTestId("round-label").textContent).toMatch(
				/Rodada 2/,
			),
		);
		expect(screen.getByTestId("timer-line").textContent).toMatch(/60s/);
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
					timer: 55,
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
				timer: 50,
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
					timer: 49,
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

	test("durante a votação o envio fica indisponível com explicação", () => {
		const socket = new FakeSocket();
		const host = player({ id: "p_host", nick: "Ana", role: "host" }, 0);
		const beto = player({ id: "p_beto", nick: "Beto" }, 1);
		seed({
			sala: sala({ players: [host, beto], phase: "voting", timer: 50 }),
			playerId: host.id,
			socket,
		});
		renderArena();

		expect(screen.getByTestId("projectile-hint").textContent).toMatch(
			/depois de revelar as cartas/i,
		);
		expect(screen.getByTestId("projectile-unavailable").textContent).toMatch(
			/indisponível durante a votação/i,
		);
		// Nenhum botão de interação acessível antes do reveal.
		expect(screen.queryByTestId("projectile-tomato")).toBeNull();
		expect(screen.queryByTestId("projectile-feed")).toBeNull();
	});

	test("pós-reveal lista as 7 interações com alvo e envia ao clicar", () => {
		const { socket, beto } = revealedSalaWithPair();
		renderArena();

		expect(screen.queryByTestId("projectile-unavailable")).toBeNull();
		for (const type of [
			"paper_ball",
			"tomato",
			"coffee",
			"rubber_duck",
			"star",
			"heart",
			"claps",
		]) {
			expect(screen.getByTestId(`projectile-${type}`)).toBeTruthy();
		}
		const target = screen.getByTestId(
			"projectile-target",
		) as HTMLSelectElement;
		expect(target.value).toBe(beto.id);

		fireEvent.click(screen.getByTestId("projectile-tomato"));
		expect(socket.sentProjectiles).toEqual([
			{ targetPlayerId: beto.id, projectileType: "tomato" },
		]);
	});

	test("segundo envio no cooldown é recusado com feedback e sem quebrar", () => {
		const { socket } = revealedSalaWithPair();
		renderArena();

		fireEvent.click(screen.getByTestId("projectile-tomato"));
		expect(socket.sentProjectiles).toHaveLength(1);

		// Segundo envio imediato (<5s): bloqueado client-side com feedback,
		// sem trafegar e sem quebrar a sala.
		fireEvent.click(screen.getByTestId("projectile-heart"));
		expect(socket.sentProjectiles).toHaveLength(1);
		expect(screen.getByTestId("projectile-error").textContent).toMatch(
			/Recarregando/i,
		);
		expect(screen.getByTestId("projectile-cooldown").textContent).toMatch(
			/Recarregando/i,
		);
		// A sala continua funcional: deck e nova rodada intactos.
		expect(screen.getByTestId("deck")).toBeTruthy();
		expect(screen.getByTestId("new-round-button")).toBeTruthy();
	});

	test("sala vê a interação com origem e destino claros", async () => {
		const { socket, ana, beto } = revealedSalaWithPair();
		renderArena();

		expect(screen.queryByTestId("projectile-feed")).toBeNull();

		await act(async () => {
			socket.emitProjectile({
				senderPlayerId: ana.id,
				targetPlayerId: beto.id,
				projectileType: "tomato",
				outcome: "hit",
			});
		});

		const feed = await screen.findByTestId("projectile-feed");
		expect(feed).toBeTruthy();
		const item = screen.getByTestId("projectile-feed-item");
		expect(item.getAttribute("data-sender")).toBe(ana.id);
		expect(item.getAttribute("data-target")).toBe(beto.id);
		expect(item.getAttribute("data-outcome")).toBe("hit");
		expect(item.textContent).toMatch(/Ana/);
		expect(item.textContent).toMatch(/Beto/);
		expect(item.textContent).toMatch(/Tomate/);
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

	test("seletor de alvo tem rótulo visível e foco alcançável por teclado", () => {
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

		const select = screen.getByTestId("projectile-target") as HTMLSelectElement;
		expect(select.tagName).toBe("SELECT");
		// Rótulo "Alvo" associado via htmlFor/id.
		expect(select.getAttribute("id")).toBe("projectile-target");
		expect(select.hasAttribute("tabindex")).toBe(false);
		// Foco visível: anel de foco explícito (guarda de regressão da auditoria).
		expect(select.className).toMatch(/focus-visible:ring-2/);
	});
});
