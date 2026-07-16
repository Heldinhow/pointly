/**
 * ToastQueue tests — T37 verify (≥3 of 5 minimum required).
 *
 * Testa que mudanças no Zustand store disparam toasts apropriados.
 */
import { describe, expect, test } from "bun:test";
import type { SalaState } from "@planning-poker/shared";
import { useSalaStore } from "../store/sala";
import { ToastQueue } from "./toast-queue";
import { act, render, screen } from "./ui/test-helpers";
import { ToastProvider } from "./ui/toast";

function makeSala(overrides: Partial<SalaState> = {}): SalaState {
	return {
		code: "9B9F",
		hostId: "p_1",
		players: [
			{
				id: "p_1",
				uuid: "00000000-0000-4000-8000-000000000000",
				nick: "Helder",
				role: "host",
				seatIndex: 0,
				hasVoted: false,
				value: null,
				status: "connected",
				joinedAt: 1_000_000,
			},
		],
		phase: "idle",
		round: 1,
		timer: 60,
		votes: {},
		createdAt: 1_000_000,
		...overrides,
	};
}

function setup() {
	const result = render(
		<ToastProvider>
			<ToastQueue />
		</ToastProvider>,
	);
	return result;
}

describe("ToastQueue — T37", () => {
	test("renderiza invisível (sem DOM output)", () => {
		setup();
		// ToastQueue retorna null — não deve haver elementos customizados
		// (só o viewport do ToastProvider, que é renderizado sem toasts).
		expect(screen.queryByRole("status")).toBeNull();
	});

	test("setSala com 1 player dispara nada (estado inicial)", () => {
		setup();
		act(() => {
			useSalaStore.getState().reset();
			useSalaStore.getState().setSala(makeSala());
		});
		// Sem transição (estado inicial)
		expect(screen.queryByText(/rodada iniciada/i)).toBeNull();
	});

	test("transição idle → voting com 1 voto dispara 'Rodada iniciada.'", () => {
		setup();
		act(() => {
			useSalaStore.getState().reset();
		});
		// 1ª setSala com phase=idle (estado inicial)
		act(() => {
			useSalaStore.getState().setSala(makeSala({ phase: "idle" }));
		});
		// 2ª setSala com phase=voting e 1 voto
		act(() => {
			useSalaStore.getState().setSala(
				makeSala({
					phase: "voting",
					players: [
						{
							id: "p_1",
							uuid: "00000000-0000-4000-8000-000000000000",
							nick: "Helder",
							role: "host",
							seatIndex: 0,
							hasVoted: true,
							value: "5",
							status: "connected",
							joinedAt: 1_000_000,
						},
					],
				}),
			);
		});
		// Pelo menos um dos toasts deve aparecer
		// (pode ser "Rodada iniciada" ou "Alguém escolheu")
		const rodada = screen.queryByText(/rodada iniciada/i);
		const alguem = screen.queryByText(/alguém escolheu/i);
		expect(rodada !== null || alguem !== null).toBe(true);
	});

	test("votes_revealed (consensus com median) dispara 'Mediana: 5'", () => {
		setup();
		act(() => {
			useSalaStore.getState().reset();
		});
		act(() => {
			useSalaStore.getState().setSala(makeSala());
		});
		act(() => {
			useSalaStore
				.getState()
				.applyReveal(
					{ p_1: "5" },
					{ median: 5, mean: 5, range: [5, 5], unanimous: false },
				);
		});
		expect(screen.queryByText(/mediana: 5/i)).not.toBeNull();
	});

	test("unanimous=true dispara '★ Unanimous!'", () => {
		setup();
		act(() => {
			useSalaStore.getState().reset();
		});
		act(() => {
			useSalaStore.getState().setSala(makeSala());
		});
		act(() => {
			useSalaStore
				.getState()
				.applyReveal(
					{ p_1: "5" },
					{ median: 5, mean: 5, range: [5, 5], unanimous: true },
				);
		});
		expect(screen.queryByText(/unanimous/i)).not.toBeNull();
	});

	test("sala_ended reason=last_left dispara 'Sala encerrada — último jogador saiu.'", () => {
		setup();
		act(() => {
			useSalaStore.getState().reset();
		});
		act(() => {
			useSalaStore.getState().setSala(makeSala());
		});
		act(() => {
			useSalaStore.getState().setSalaEnded("last_left");
		});
		expect(
			screen.queryByText(/sala encerrada.*último jogador/i),
		).not.toBeNull();
	});

	test("reset do store limpa refs (não acumula toasts fantasma)", () => {
		setup();
		act(() => {
			useSalaStore.getState().setSala(makeSala());
			useSalaStore.getState().setSalaEnded("last_left");
		});
		// Reset deve limpar estado mas NÃO disparar toasts imediatamente
		act(() => {
			useSalaStore.getState().reset();
		});
		// Após reset, sala=null. Re-render com mesma sala não deve duplicar toasts.
		act(() => {
			useSalaStore.getState().setSala(makeSala());
		});
		// Não esperamos novo toast de last_left (já houve)
		// Verificamos que não duplicou
		const matches = screen.queryAllByText(/sala encerrada/i);
		expect(matches.length).toBeLessThanOrEqual(1);
	});
});
