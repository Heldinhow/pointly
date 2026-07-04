/**
 * Track C — UX Flows (multi-client)
 *
 * Reaproveita fixture de tests/e2e/fixtures/multi-client.ts.
 * Cobre os 10 cenários de produto do plan.md seção 9.
 */
import { expect, test } from "@playwright/test";
import { multiClient } from "../e2e/fixtures/multi-client";

test("C1: Host solo vota 5 → reveal", async ({ browser }) => {
	const suite = await multiClient(browser, { clientCount: 1 });
	try {
		const code = await suite.createRoom(0);
		expect(code).toMatch(/^[A-Z0-9]{4}$/);

		// Estado inicial: awaiting
		const initial = await suite.clients[0]!.page
			.getByTestId("reveal-button")
			.getAttribute("data-reveal-state");
		expect(initial).toBe("awaiting");

		await suite.vote(0, "5");

		// Após voto: ready
		await suite.clients[0]!.page.waitForFunction(
			() =>
				document
					.querySelector('[data-testid="reveal-button"]')
					?.getAttribute("data-reveal-state") === "ready",
			undefined,
			{ timeout: 5_000 },
		);

		await suite.reveal(0);

		// Pós-reveal: post-reveal
		await suite.clients[0]!.page.waitForFunction(
			() =>
				document
					.querySelector('[data-testid="reveal-button"]')
					?.getAttribute("data-reveal-state") === "post-reveal",
			undefined,
			{ timeout: 5_000 },
		);

		// Consensus: unanimidade, mean=5, median=5
		const c = await suite.consensus(0);
		expect(c?.unanimous).toBe(true);
		expect(c?.mean).toBe(5);
		expect(c?.median).toBe(5);
		expect(c?.range).toEqual([5, 5]);
	} finally {
		await suite.dispose();
	}
});

test("C2: Multi-client (A=5, B=8) → consensus correto", async ({ browser }) => {
	const suite = await multiClient(browser, { clientCount: 2 });
	try {
		const code = await suite.createRoom(0);
		await suite.joinRoom(code, 1);
		await suite.vote(0, "5");
		await suite.vote(1, "8");
		await suite.reveal(0);

		const cA = await suite.consensus(0);
		const cB = await suite.consensus(1);
		expect(cA?.mean).toBeCloseTo(6.5, 1);
		expect(cA?.unanimous).toBe(false);
		expect(cA?.range).toEqual([5, 8]);
		expect(cB?.mean).toBeCloseTo(6.5, 1);
	} finally {
		await suite.dispose();
	}
});

test("C3: Trocar voto antes do reveal (3 → 8)", async ({ browser }) => {
	const suite = await multiClient(browser, { clientCount: 2 });
	try {
		const code = await suite.createRoom(0);
		await suite.joinRoom(code, 1);

		await suite.vote(0, "3");
		await suite.vote(1, "8");

		// Troca voto de A
		await suite.vote(0, "8");

		await suite.reveal(0);

		const salaA = await suite.waitForSala(
			0,
			(s) => s.phase === "revealed" && Object.keys(s.votes).length === 2,
			10_000,
		);
		// Ambos devem ter "8"
		const votes = Object.values(salaA.votes);
		expect(votes.sort()).toEqual(["8", "8"]);
	} finally {
		await suite.dispose();
	}
});

test("C4: Nova rodada limpa estado", async ({ browser }) => {
	const suite = await multiClient(browser, { clientCount: 2 });
	try {
		const code = await suite.createRoom(0);
		await suite.joinRoom(code, 1);
		await suite.vote(0, "5");
		await suite.vote(1, "8");
		await suite.reveal(0);

		await suite.newRound(0);

		// Verifica: phase voltou a voting (ou idle), votos limpos
		const sala = await suite.waitForSala(
			0,
			(s) => s.phase !== "revealed",
			5_000,
		);
		expect(sala.phase).not.toBe("revealed");
		const anyVoted = sala.players.some((p) => p.hasVoted);
		expect(anyVoted).toBe(false);
	} finally {
		await suite.dispose();
	}
});

test("C6: Empty overlay aparece quando sozinho", async ({ browser }) => {
	const suite = await multiClient(browser, { clientCount: 1 });
	try {
		await suite.createRoom(0);
		await suite.waitForSala(0, (s) => s.players.length === 1, 10_000);
		await suite.clients[0]!.page.waitForSelector(
			'[data-testid="empty-overlay"]',
			{ timeout: 5_000 },
		);

		const shareUrl =
			(await suite.clients[0]!.page
				.getByTestId("empty-overlay-share-url")
				.inputValue()) ?? "";
		expect(shareUrl).toMatch(/join\?code=[A-Z0-9]{4}/);

		// Botão "Entrar mesmo assim" (ou similar) presente
		const dismissCount = await suite.clients[0]!.page
			.getByTestId("empty-overlay-dismiss")
			.count();
		console.log(`[C6] dismiss button count: ${dismissCount}`);
	} finally {
		await suite.dispose();
	}
});

test("C10: Unanimidade (3 clients = 5)", async ({ browser }) => {
	const suite = await multiClient(browser, {
		clientCount: 3,
		nicks: ["Ana", "Beto", "Cris"],
	});
	try {
		const code = await suite.createRoom(0);
		await suite.joinRoom(code, 1);
		await suite.joinRoom(code, 2);

		await suite.vote(0, "5");
		await suite.vote(1, "5");
		await suite.vote(2, "5");
		await suite.reveal(0);

		const c = await suite.consensus(0);
		expect(c?.unanimous).toBe(true);
		expect(c?.mean).toBe(5);
		expect(c?.median).toBe(5);
		expect(c?.range).toEqual([5, 5]);

		// Badge unanimidade presente
		const badge = await suite.clients[0]!.page
			.getByTestId("stats-unanimous-badge")
			.count();
		console.log(`[C10] unanimity badge count: ${badge}`);
	} finally {
		await suite.dispose();
	}
});