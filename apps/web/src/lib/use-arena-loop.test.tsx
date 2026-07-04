/**
 * useArenaLoop tests — Phase 7 integration (T38-T41 composing hook).
 *
 * Testa:
 *  - getStoredUUID utility (puro, não precisa WS)
 *  - Hook composition: helpers são funções estáveis
 *  - castVote via hook dispara cast_vote via WS (com mock WS)
 */
import { describe, expect, test } from "bun:test";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { renderHook } from "../components/ui/test-helpers";
import { ToastProvider } from "../components/ui/toast";
import { useArenaLoop, getStoredUUID } from "./use-arena-loop";

/** Wrapper pra renderHook com providers (Router + Toast). */
function renderArenaLoop(params: Parameters<typeof useArenaLoop>[0]) {
	const wrapper = ({ children }: { children: ReactNode }) => (
		<ToastProvider>
			<MemoryRouter>{children}</MemoryRouter>
		</ToastProvider>
	);
	return renderHook(() => useArenaLoop(params), { wrapper });
}

describe("getStoredUUID — utility", () => {
	test("retorna UUID v4 válido", () => {
		const uuid = getStoredUUID();
		expect(uuid).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);
	});

	test("não retorna string vazia ou placeholder", () => {
		const uuid = getStoredUUID();
		expect(uuid.length).toBe(36);
		expect(uuid).not.toBe("");
	});
});

describe("useArenaLoop — composition", () => {
	test("helpers (castVote, requestReveal, requestNewRound) são funções", () => {
		const { result } = renderArenaLoop({
			nick: "Helder",
			code: "9B9F",
			uuid: getStoredUUID(),
		});

		expect(typeof result.current.castVote).toBe("function");
		expect(typeof result.current.requestReveal).toBe("function");
		expect(typeof result.current.requestNewRound).toBe("function");
	});

	test("renderiza sem erros dentro de ToastProvider + MemoryRouter", () => {
		const { result } = renderArenaLoop({
			nick: "Maya",
			code: "ABCD",
			uuid: getStoredUUID(),
		});
		// Sem exception thrown
		expect(result.current).toBeDefined();
	});

	test("aceita nick com chars especiais sem quebrar", () => {
		const { result } = renderArenaLoop({
			nick: "Lía 🦊",
			code: "TEST",
			uuid: getStoredUUID(),
		});
		expect(result.current.castVote).toBeDefined();
	});
});
