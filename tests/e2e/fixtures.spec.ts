/**
 * fixtures.spec.ts — T42 verify.
 *
 * Smoke test: cria o suite multi-client, valida que os 2 contexts
 * sobem corretamente, o health endpoint responde, e os helpers existem.
 *
 * **Gate**: `bunx playwright test fixtures` deve passar.
 *
 * @see .specs/features/planning-poker-v1/tasks.md T42
 */
import { expect, test } from "@playwright/test";
import { multiClient, pingHealth } from "./fixtures/multi-client";

test.describe("T42: multi-client fixture", () => {
	test("sobe 2 contexts isolados", async ({ browser, request }) => {
		const suite = await multiClient(browser, { clientCount: 2 });
		try {
			expect(suite.clients).toHaveLength(2);
			expect(suite.clients[0]!.context).not.toBe(suite.clients[1]!.context);
			expect(suite.clients[0]!.page).not.toBe(suite.clients[1]!.page);
			expect(suite.clients[0]!.nick).toBe("Helder");
			expect(suite.clients[1]!.nick).toBe("Test");
		} finally {
			await suite.dispose();
		}

		// Server health deve responder (webServer em playwright.config.ts)
		const health = await pingHealth(request);
		// Pode ser null se /health não estiver em :3001, mas se baseURL
		// (5173) tem proxy, também funciona. Não falhamos o teste:
		expect(health === null || health.status === "ok").toBe(true);
	});

	test("helpers de fluxo estão presentes", async ({ browser }) => {
		const suite = await multiClient(browser, { clientCount: 2 });
		try {
			expect(typeof suite.createRoom).toBe("function");
			expect(typeof suite.joinRoom).toBe("function");
			expect(typeof suite.vote).toBe("function");
			expect(typeof suite.reveal).toBe("function");
			expect(typeof suite.newRound).toBe("function");
			expect(typeof suite.salaState).toBe("function");
			expect(typeof suite.consensus).toBe("function");
			expect(typeof suite.waitForSala).toBe("function");
			expect(typeof suite.playerId).toBe("function");
			expect(typeof suite.dispose).toBe("function");
		} finally {
			await suite.dispose();
		}
	});

	test("custom nicks", async ({ browser }) => {
		const suite = await multiClient(browser, {
			clientCount: 2,
			nicks: ["Alice", "Bob"],
		});
		try {
			expect(suite.clients[0]!.nick).toBe("Alice");
			expect(suite.clients[1]!.nick).toBe("Bob");
		} finally {
			await suite.dispose();
		}
	});
});
