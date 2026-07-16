/**
 * sala_ended + sala_cheia UX tests — T41 verify (≥3 tests).
 */
import { beforeEach, describe, expect, mock, test } from "bun:test";
import type {
	ErrorEvent,
	SalaEndedEvent,
	SalaEndedReason,
} from "@planning-poker/shared";
import { useSalaStore } from "../store/sala";
import {
	applyErrorEvent,
	applySalaEndedEvent,
	createSalaEndLoop,
} from "./sala-end-loop";
import type { SalaEndHooks } from "./sala-end-loop";

/** Mock de hooks pra testabilidade (sem React Router / ToastProvider). */
function makeHooks() {
	return {
		navigate: mock((_path: string) => {}),
		pushToast: mock((_text: string, _kind?: string) => {}),
	};
}

beforeEach(() => {
	useSalaStore.getState().reset();
});

describe("applySalaEndedEvent — T41", () => {
	const cases: Array<{
		reason: SalaEndedReason;
		expectedToast: RegExp;
		expectedPath: string;
		expectedKind?: string;
	}> = [
		{
			reason: "last_left",
			expectedToast: /sala encerrada.*último jogador/i,
			expectedPath: "/",
			expectedKind: "info",
		},
		{
			reason: "server_restart",
			expectedToast: /servidor reiniciou/i,
			expectedPath: "/",
			expectedKind: "error",
		},
		{
			reason: "replaced",
			expectedToast: /outra aba assumiu/i,
			expectedPath: "/",
			expectedKind: "info",
		},
	];

	for (const c of cases) {
		test(`sala_ended { reason: '${c.reason}' } → redirect / + toast`, () => {
			const hooks = makeHooks();
			const event: SalaEndedEvent = { reason: c.reason };

			applySalaEndedEvent(useSalaStore.getState(), event, hooks);

			// Store atualizado
			expect(useSalaStore.getState().salaEndedReason).toBe(c.reason);
			// Toast
			expect(hooks.pushToast).toHaveBeenCalledTimes(1);
			const lastCall =
				hooks.pushToast.mock.calls[hooks.pushToast.mock.calls.length - 1];
			expect(lastCall?.[0]).toMatch(c.expectedToast);
			if (c.expectedKind) {
				expect(lastCall?.[1]).toBe(c.expectedKind);
			}
			// Redirect
			expect(hooks.navigate).toHaveBeenCalledWith(c.expectedPath);
		});
	}
});

describe("applyErrorEvent — T41", () => {
	test("error { code: 'sala_cheia' } → redirect /full + error toast (F-007)", () => {
		const hooks = makeHooks();
		const event: ErrorEvent = {
			code: "sala_cheia",
			message: "Sala cheia.",
		};

		applyErrorEvent(useSalaStore.getState(), event, hooks);

		// Store atualizado com salaEndedReason
		expect(useSalaStore.getState().salaEndedReason).toBe("last_left");
		// Toast error
		expect(hooks.pushToast).toHaveBeenCalledTimes(1);
		const lastCall =
			hooks.pushToast.mock.calls[hooks.pushToast.mock.calls.length - 1];
		expect(lastCall?.[0]).toMatch(/sala cheia/i);
		expect(lastCall?.[1]).toBe("error");
		// Redirect /full
		expect(hooks.navigate).toHaveBeenCalledWith("/full");
	});

	test("error { code: 'sala_nao_encontrada' } → toast apenas (sem redirect)", () => {
		const hooks = makeHooks();
		const event: ErrorEvent = {
			code: "sala_nao_encontrada",
			message: "Sala não encontrada.",
		};

		applyErrorEvent(useSalaStore.getState(), event, hooks);

		expect(hooks.pushToast).toHaveBeenCalledTimes(1);
		expect(hooks.navigate).not.toHaveBeenCalled();
	});

	test("error { code: 'invalid_nick' } → toast error (sem redirect)", () => {
		const hooks = makeHooks();
		const event: ErrorEvent = {
			code: "invalid_nick",
			message: "Mínimo 2 caracteres.",
		};

		applyErrorEvent(useSalaStore.getState(), event, hooks);

		expect(hooks.pushToast).toHaveBeenCalledTimes(1);
		expect(hooks.navigate).not.toHaveBeenCalled();
	});

	test("error { code: 'invalid_phase' } → toast error (sem redirect)", () => {
		const hooks = makeHooks();
		const event: ErrorEvent = { code: "invalid_phase" };

		applyErrorEvent(useSalaStore.getState(), event, hooks);

		expect(hooks.pushToast).toHaveBeenCalledTimes(1);
		expect(hooks.navigate).not.toHaveBeenCalled();
	});

	test("error sem message usa fallback com code", () => {
		const hooks = makeHooks();
		const event: ErrorEvent = { code: "internal_error" };

		applyErrorEvent(useSalaStore.getState(), event, hooks);

		const lastCall =
			hooks.pushToast.mock.calls[hooks.pushToast.mock.calls.length - 1];
		expect(lastCall?.[0]).toMatch(/internal_error/i);
	});
});

describe("createSalaEndLoop — T41 dispatch", () => {
	test("dispatch: sala_ended chama applySalaEndedEvent", () => {
		const hooks = makeHooks();
		const loop = createSalaEndLoop(useSalaStore.getState(), hooks);

		loop.dispatch({
			type: "sala_ended",
			payload: { reason: "last_left" },
		});

		expect(hooks.navigate).toHaveBeenCalledWith("/");
		expect(useSalaStore.getState().salaEndedReason).toBe("last_left");
	});

	test("dispatch: error sala_cheia chama applyErrorEvent + redirect /full", () => {
		const hooks = makeHooks();
		const loop = createSalaEndLoop(useSalaStore.getState(), hooks);

		loop.dispatch({
			type: "error",
			payload: { code: "sala_cheia" },
		});

		expect(hooks.navigate).toHaveBeenCalledWith("/full");
	});

	test("dispatch: ignora outros eventos", () => {
		const hooks = makeHooks();
		const loop = createSalaEndLoop(useSalaStore.getState(), hooks);

		loop.dispatch({
			type: "vote_cast",
			payload: { kind: "aggregate", count: 2 },
		});
		loop.dispatch({
			type: "votes_revealed",
			payload: {
				votes: {},
				median: 5,
				mean: 5,
				range: [5, 5],
				unanimous: false,
			},
		});

		expect(hooks.navigate).not.toHaveBeenCalled();
		expect(hooks.pushToast).not.toHaveBeenCalled();
	});
});

describe("SalaEndHooks type — sanity", () => {
	test("hooks aceita pushToast com 1 ou 2 args", () => {
		const hooks: SalaEndHooks = {
			navigate: () => {},
			pushToast: (text, kind) => {
				// aceita ambos
				void text;
				void kind;
			},
		};
		hooks.pushToast("hi");
		hooks.pushToast("hi", "error");
		expect(true).toBe(true);
	});
});
