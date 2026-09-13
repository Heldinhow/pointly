/**
 * use-desktop.test — o default precisa ser `false` sem matchMedia
 * (é o que mantém a grade da arena nos testes jsdom existentes).
 */
import "../test-jsdom";
import { describe, expect, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useDesktop } from "./use-desktop";

describe("useDesktop", () => {
	test("default false sem matchMedia (jsdom)", () => {
		const { result } = renderHook(() => useDesktop());
		expect(result.current).toBe(false);
	});

	test("espelha o matchMedia quando disponível", () => {
		const listeners = new Set<(e: { matches: boolean }) => void>();
		const mq = {
			matches: true,
			addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => {
				listeners.add(fn);
			},
			removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) => {
				listeners.delete(fn);
			},
		};
		const g = window as unknown as Record<string, unknown>;
		const prev = g.matchMedia;
		g.matchMedia = () => mq;
		try {
			const { result, unmount } = renderHook(() => useDesktop());
			expect(result.current).toBe(true);
			act(() => {
				for (const fn of listeners) fn({ matches: false });
			});
			expect(result.current).toBe(false);
			unmount();
		} finally {
			if (prev === undefined) delete g.matchMedia;
			else g.matchMedia = prev;
		}
	});
});
