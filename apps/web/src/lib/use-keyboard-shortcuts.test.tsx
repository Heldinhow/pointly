/**
 * useKeyboardShortcuts unit tests — ADR-007 / BUG-306 gate.
 */
import { describe, expect, mock, test } from "bun:test";
import { act, fireEvent, render, renderHook } from "../components/ui/test-helpers";
import { useState } from "react";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";

function triggerKey(key: string, target?: Element | null) {
	fireEvent.keyDown(target ?? window, { key });
}

describe("useKeyboardShortcuts — basics", () => {
	test("pressionar 'r' chama handler de 'r' (case-insensitive)", () => {
		const r = mock(() => {});
		renderHook(() =>
			useKeyboardShortcuts({
				shortcuts: { R: r },
			}),
		);
		act(() => triggerKey("r"));
		act(() => triggerKey("R"));
		expect(r).toHaveBeenCalledTimes(2);
	});

	test("pressionar 'Escape' chama handler de 'Escape'", () => {
		const esc = mock(() => {});
		renderHook(() =>
			useKeyboardShortcuts({
				shortcuts: { Escape: esc },
			}),
		);
		act(() => triggerKey("Escape"));
		expect(esc).toHaveBeenCalledTimes(1);
	});

	test("pressionar tecla sem handler registrado é no-op", () => {
		const r = mock(() => {});
		renderHook(() =>
			useKeyboardShortcuts({
				shortcuts: { R: r },
			}),
		);
		act(() => triggerKey("x"));
		expect(r).toHaveBeenCalledTimes(0);
	});
});

describe("useKeyboardShortcuts — input focus guard", () => {
	test("pressionar 'r' focado em <input> NÃO dispara handler", () => {
		const r = mock(() => {});
		// Renderiza input controlado e hook.
		const { container } = render(
			<>
				<input data-testid="nick" />
				<TestHook shortcut="R" handler={r} />
			</>,
		);
		const input = container.querySelector('[data-testid="nick"]')!;
		(input as HTMLElement).focus();
		act(() => triggerKey("r", input));
		expect(r).toHaveBeenCalledTimes(0);
	});

	test("pressionar 'r' focado em <textarea> NÃO dispara handler", () => {
		const r = mock(() => {});
		const { container } = render(
			<>
				<textarea data-testid="note" />
				<TestHook shortcut="R" handler={r} />
			</>,
		);
		const ta = container.querySelector('[data-testid="note"]')!;
		(ta as HTMLElement).focus();
		act(() => triggerKey("r", ta));
		expect(r).toHaveBeenCalledTimes(0);
	});

	test("pressionar 'r' com foco em <body> dispara handler normalmente", () => {
		const r = mock(() => {});
		renderHook(() =>
			useKeyboardShortcuts({ shortcuts: { R: r } }),
		);
		act(() => triggerKey("r", document.body));
		expect(r).toHaveBeenCalledTimes(1);
	});
});

describe("useKeyboardShortcuts — helpKey / ABNT /", () => {
	test("pressionar '/' chama handler de '?' via helpKey", () => {
		const help = mock(() => {});
		renderHook(() =>
			useKeyboardShortcuts({
				helpKey: "?",
				shortcuts: { "?": help },
			}),
		);
		act(() => triggerKey("/"));
		expect(help).toHaveBeenCalledTimes(1);
	});

	test("pressionar '?' chama handler de '?' diretamente", () => {
		const help = mock(() => {});
		renderHook(() =>
			useKeyboardShortcuts({
				helpKey: "?",
				shortcuts: { "?": help },
			}),
		);
		act(() => triggerKey("?"));
		expect(help).toHaveBeenCalledTimes(1);
	});
});

describe("useKeyboardShortcuts — enabled gate", () => {
	test("enabled=false: nenhum handler dispara", () => {
		const r = mock(() => {});
		renderHook(() =>
			useKeyboardShortcuts({
				enabled: false,
				shortcuts: { R: r },
			}),
		);
		act(() => triggerKey("r"));
		expect(r).toHaveBeenCalledTimes(0);
	});
});

describe("useKeyboardShortcuts — cleanup", () => {
	test("unmount remove window listener (handler não dispara mais)", () => {
		const r = mock(() => {});
		const { unmount } = renderHook(() =>
			useKeyboardShortcuts({ shortcuts: { R: r } }),
		);
		act(() => triggerKey("r"));
		expect(r).toHaveBeenCalledTimes(1);
		unmount();
		act(() => triggerKey("r"));
		expect(r).toHaveBeenCalledTimes(1); // count não incrementou
	});
});

describe("useKeyboardShortcuts — helpKey retorna openHelp/setOpenHelp", () => {
	test("hook com helpKey retorna state pair", () => {
		const { result } = renderHook(() =>
			useKeyboardShortcuts({
				helpKey: "?",
				shortcuts: { "?": () => {} },
			}),
		);
		expect(result.current).not.toBeNull();
		expect(typeof result.current?.setOpenHelp).toBe("function");
		expect(result.current?.openHelp).toBe(false);
	});

	test("hook sem helpKey retorna null", () => {
		const { result } = renderHook(() =>
			useKeyboardShortcuts({ shortcuts: { R: () => {} } }),
		);
		expect(result.current).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Test helper component: chama useKeyboardShortcuts internamente.
// ---------------------------------------------------------------------------

function TestHook({
	shortcut,
	handler,
}: {
	shortcut: string;
	handler: () => void;
}) {
	const [, setForce] = useState(0);
	useKeyboardShortcuts({
		shortcuts: { [shortcut]: handler },
	});
	// Force render w/ stable identity
	return <button onClick={() => setForce((x) => x + 1)}>x</button>;
}
