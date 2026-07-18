/**
 * Analytics unit tests — GA-01, GA-03, GA-05, GA-08, GA-11 + extras.
 *
 * Cobre:
 *  - GA-01: init() injeta snippet gtag.js + chama config com privacy flags
 *  - GA-03: init() em dev (sem ID) é no-op puro (zero side effects)
 *  - GA-05: init() idempotente (múltiplas calls = 1 snippet injetado)
 *  - GA-08: config tem anonymize_ip + ads_data_redaction + cookie_domain + client_storage
 *  - GA-19: trackPageview chama config (update:true) + event page_view
 *  - GA-20: prev=null no mount inicial → page_referrer=undefined (direct/none)
 *  - validateGaId: regex estrita, lowercase rejeitado, vazio rejeitado
 *  - isEnabled: false antes de init, true depois
 *
 * Estratégia de mocking: `__setGaMeasurementIdForTests` no analytics-config
 * permite controlar o ID lido sem mock.module. Stub de `document.createElement`
 * conta quantos `<script>` foram injetados. Stub de `window.gtag` captura
 * as chamadas pra assert.
 */

import {
	afterEach,
	beforeEach,
	describe,
	expect,
	test,
} from "bun:test";
import {
	__setGaMeasurementIdForTests,
} from "./analytics-config";
import {
	__resetForTests,
	getLastPathname,
	init,
	isEnabled,
	trackPageview,
	validateGaId,
} from "./analytics";

// ---------------------------------------------------------------------------
// Stubs
// ---------------------------------------------------------------------------

interface GtagCall {
	args: unknown[];
}

let gtagCalls: GtagCall[] = [];
let scriptAppendCount = 0;

function setupWindow() {
	gtagCalls = [];
	scriptAppendCount = 0;

	// analytics.ts lê `window`, não `globalThis`. Em Bun test, jsdom é
	// carregado via test-jsdom.ts e injeta `globalThis.window = dom.window`.
	// Setamos o spy em `window` pra casar com o que o código lê.
	const w = window as unknown as {
		dataLayer?: unknown[][];
		gtag?: (...args: unknown[]) => void;
		document: Document;
	};
	w.dataLayer = w.dataLayer || [];
	w.gtag = (...args: unknown[]) => {
		gtagCalls.push({ args });
		w.dataLayer?.push(args);
	};

	// Salva o createElement ORIGINAL apenas na primeira vez. Wrap-on-wrap
	// entre testes causaria double-counting (cada wrapper incrementa
	// scriptAppendCount para o mesmo script).
	if (!(w as { __origCreateSaved?: boolean }).__origCreateSaved) {
		const origCreate = w.document.createElement.bind(w.document);
		(w as { __origCreate?: typeof w.document.createElement }).__origCreate =
			origCreate;
		(w as { __origCreateSaved?: boolean }).__origCreateSaved = true;
	}
	const origCreate = (w as { __origCreate?: typeof w.document.createElement })
		.__origCreate!;
	w.document.createElement = ((tag: string) => {
		const el = origCreate(tag);
		if (tag === "script") {
			scriptAppendCount++;
		}
		return el;
	}) as typeof w.document.createElement;
}

beforeEach(() => {
	setupWindow();
	__setGaMeasurementIdForTests(undefined);
});

afterEach(() => {
	__resetForTests();
	__setGaMeasurementIdForTests(undefined);
});

// ---------------------------------------------------------------------------
// validateGaId
// ---------------------------------------------------------------------------

describe("validateGaId", () => {
	test("aceita G-XXXXXX uppercase", () => {
		expect(validateGaId("G-ABC123")).toBe("G-ABC123");
	});

	test("rejeita lowercase (GA IDs são case-sensitive)", () => {
		expect(validateGaId("g-abc123")).toBeNull();
	});

	test("rejeita vazio / undefined / null", () => {
		expect(validateGaId("")).toBeNull();
		expect(validateGaId(undefined)).toBeNull();
		expect(validateGaId(null)).toBeNull();
	});

	test("rejeita formato inválido", () => {
		expect(validateGaId("ABC123")).toBeNull();
		expect(validateGaId("G_ABC123")).toBeNull();
		expect(validateGaId("G-")).toBeNull();
	});

	test("aceita até 10 chars alfanuméricos após prefixo", () => {
		expect(validateGaId("G-1234567890")).toBe("G-1234567890");
		expect(validateGaId("G-12345678901")).toBeNull(); // 11 = too long
	});

	test("trim de whitespace", () => {
		expect(validateGaId("  G-ABC123  ")).toBe("G-ABC123");
	});
});

// ---------------------------------------------------------------------------
// init
// ---------------------------------------------------------------------------

describe("init()", () => {
	test("GA-03: no-op puro quando ID ausente (dev)", () => {
		__setGaMeasurementIdForTests(undefined);

		init();
		init(); // idempotente

		expect(isEnabled()).toBe(false);
		expect(scriptAppendCount).toBe(0);
		expect(gtagCalls).toHaveLength(0);
	});

	test("GA-01 + GA-08: injeta snippet + config com privacy flags quando ID presente", () => {
		__setGaMeasurementIdForTests("G-TEST123");

		init();

		expect(isEnabled()).toBe(true);
		expect(scriptAppendCount).toBe(1);

		// Calls esperadas: gtag('js', Date) + gtag('config', ID, {...})
		expect(gtagCalls.length).toBeGreaterThanOrEqual(2);

		const configCall = gtagCalls[gtagCalls.length - 1];
		expect(configCall?.args[0]).toBe("config");
		expect(configCall?.args[1]).toBe("G-TEST123");
		const flags = configCall?.args[2] as Record<string, unknown>;
		expect(flags.send_page_view).toBe(false);
		expect(flags.anonymize_ip).toBe(true);
		expect(flags.ads_data_redaction).toBe(true);
		expect(flags.cookie_domain).toBe("none");
		expect(flags.client_storage).toBe("none");
	});

	test("GA-05: idempotente — múltiplas calls injetam 1 snippet só", () => {
		__setGaMeasurementIdForTests("G-IDEMPOTENT");

		init();
		init();
		init();

		expect(scriptAppendCount).toBe(1);
	});

	test("ID malformado em prod → no-op + estado disabled", () => {
		__setGaMeasurementIdForTests("not-a-valid-id");
		// Silencia console.warn pra não poluir output.
		const origWarn = console.warn;
		console.warn = () => {};
		try {
			init();
			expect(isEnabled()).toBe(false);
			expect(scriptAppendCount).toBe(0);
		} finally {
			console.warn = origWarn;
		}
	});
});

// ---------------------------------------------------------------------------
// trackPageview
// ---------------------------------------------------------------------------

describe("trackPageview", () => {
	function setupInitialized() {
		__setGaMeasurementIdForTests("G-TRACK123");
		init();
		gtagCalls.length = 0; // limpa calls do init
	}

	test("chama config (com update:true) + event page_view", () => {
		setupInitialized();

		trackPageview("/landing", "/arena");

		expect(gtagCalls).toHaveLength(2);

		const [configCall, eventCall] = gtagCalls;
		expect(configCall?.args[0]).toBe("config");
		expect(configCall?.args[1]).toBe("G-TRACK123");
		const configFlags = configCall?.args[2] as Record<string, unknown>;
		expect(configFlags.update).toBe(true);
		expect(configFlags.send_page_view).toBe(false);
		expect(configFlags.page_referrer).toBe("/landing");
		expect(configFlags.page_location).toBe("/arena");

		expect(eventCall?.args[0]).toBe("event");
		expect(eventCall?.args[1]).toBe("page_view");
		const eventFlags = eventCall?.args[2] as Record<string, unknown>;
		expect(eventFlags.page_referrer).toBe("/landing");
		expect(eventFlags.page_location).toBe("/arena");
	});

	test("GA-20: prev=null no mount inicial (referrer = undefined, GA trata como direct)", () => {
		setupInitialized();

		trackPageview(null, "/");

		const configCall = gtagCalls[0];
		const flags = configCall?.args[2] as Record<string, unknown>;
		// prev=null → page_referrer vira undefined (omitido do payload GA).
		// GA interpreta ausência de referrer como direct/none.
		expect(flags.page_referrer).toBeUndefined();
		expect(flags.page_location).toBe("/");
	});

	test("no-op quando init não rodou (sem ID em dev)", () => {
		__setGaMeasurementIdForTests(undefined);

		trackPageview("/a", "/b");

		expect(gtagCalls).toHaveLength(0);
	});

	test("rejeita newPathname vazio (no-op)", () => {
		setupInitialized();

		trackPageview("/a", "");

		expect(gtagCalls).toHaveLength(0);
	});

	test("atualiza lastPathname interno", () => {
		setupInitialized();

		trackPageview("/", "/arena");
		expect(getLastPathname()).toBe("/arena");

		trackPageview("/arena", "/join");
		expect(getLastPathname()).toBe("/join");
	});
});

// ---------------------------------------------------------------------------
// isEnabled
// ---------------------------------------------------------------------------

describe("isEnabled", () => {
	test("false antes de init", () => {
		__setGaMeasurementIdForTests("G-XYZ789");
		expect(isEnabled()).toBe(false);
	});

	test("true depois de init com ID válida", () => {
		__setGaMeasurementIdForTests("G-XYZ789");
		init();
		expect(isEnabled()).toBe(true);
	});

	test("false depois de init com ID inválida", () => {
		__setGaMeasurementIdForTests("garbage");
		init();
		expect(isEnabled()).toBe(false);
	});
});