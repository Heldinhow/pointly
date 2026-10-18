import { expect, test } from "@playwright/test";
import { addStory, createRoom, newPlayer, wirePlayer } from "./helpers/room";
import { rawFramesContainUuid } from "./helpers/ws-capture";

test("pauta destrava deck e nova rodada exige confirmação dupla", async ({
	browser,
}, testInfo) => {
	const soloCtx = await newPlayer(browser, testInfo);
	const solo = wirePlayer(soloCtx.page, "Solo");

	try {
		await createRoom(solo, "SoloPlayer");

		await expect(solo.page.locator('button[data-testid^="deck-card-"]').first()).toBeVisible();
		for (const value of ["0", "1", "5"]) {
			await expect(solo.page.locator(`button[data-testid="deck-card-${value}"]`)).toBeDisabled();
		}

		// Sem história ativa o centro vira o estado vazio: sem Revelar
		// (não há o que revelar) e com o caminho único para criar.
		await expect(solo.page.locator('[data-testid="reveal-button"]')).toHaveCount(0);

		const firstStoryAction = solo.page.getByTestId("first-story-action");
		await expect(firstStoryAction).toBeVisible();
		await expect(firstStoryAction).toBeInViewport({ ratio: 1 });
		await expect(solo.page.locator(".poker-center")).toContainText(
			"Adicione uma história para liberar as cartas",
		);
		await expect(solo.page.locator('[data-testid="reveal-hint"]')).toContainText(
			"As cartas abrem quando existir uma história ativa",
		);
		await expect(
			solo.page.locator('[data-testid="deck-locked-legend"]'),
		).toBeVisible();
		await firstStoryAction.click();
		await expect(solo.page.locator("#pauta-novo-titulo")).toBeFocused();
		await expect(solo.page.locator("#pauta-novo-titulo")).toBeInViewport();

		await addStory(solo, "Onboarding");
		await expect(firstStoryAction).toHaveCount(0);
		for (const value of ["0", "1", "5"]) {
			await expect(solo.page.locator(`button[data-testid="deck-card-${value}"]`)).toBeEnabled();
		}

		// Com história e sem votos, Revelar existe e fica desabilitado.
		await expect(solo.page.locator('[data-testid="reveal-button"]')).toBeDisabled();

		await solo.page.locator('button[data-testid="deck-card-5"]').click();
		await expect(solo.page.locator('button[data-testid="deck-card-5"]')).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		await expect(solo.page.locator('[data-testid="reveal-button"]')).toBeEnabled();
		await solo.page.locator('[data-testid="reveal-button"]').click();
		await expect
			.poll(() => solo.ws.lastRoomState?.payload.sala.phase)
			.toBe("revealed");

		await solo.page.locator('[data-testid="new-round-button"]').click();
		await expect(solo.page.locator('[data-testid="new-round-hint"]')).toBeVisible();
		expect(solo.ws.lastRoomState?.payload.sala.phase).toBe("revealed");
		expect(
			Object.keys(solo.ws.lastRoomState?.payload.sala.votes ?? {}).length,
		).toBeGreaterThan(0);

		const roundBefore = solo.ws.lastRoomState?.payload.sala.round ?? 1;
		await solo.page.locator('[data-testid="new-round-button"]').click();
		await expect
			.poll(() => solo.ws.lastRoomState?.payload.sala.phase)
			.toBe("voting");
		await expect
			.poll(() => solo.ws.lastRoomState?.payload.sala.round)
			.toBe(roundBefore + 1);
		await expect
			.poll(() => Object.keys(solo.ws.lastRoomState?.payload.sala.votes ?? {}).length)
			.toBe(0);
		await expect(solo.page.locator('button[data-testid="deck-card-5"]')).toHaveAttribute(
			"aria-pressed",
			"false",
		);

		expect(rawFramesContainUuid(solo.ws.frames), "uuid no wire").toBeNull();
		expect(solo.ws.parseErrors).toEqual([]);
		solo.guard.assertClean();
	} finally {
		solo.guard.detach();
		await soloCtx.ctx.close();
	}
});

test("convite fica no topo, copia sem rolar e o link não corta o código", async ({
	browser,
}, testInfo) => {
	const soloCtx = await newPlayer(browser, testInfo);
	const solo = wirePlayer(soloCtx.page, "Solo");

	try {
		await soloCtx.ctx.grantPermissions(["clipboard-read", "clipboard-write"]);
		const code = await createRoom(solo, "SoloPlayer");

		const copy = solo.page.getByTestId("toolbar-copy-invite");
		await expect(copy).toBeVisible();
		await expect(copy).toBeInViewport({ ratio: 1 });
		await expect(copy).toHaveText(/Copiar convite/);
		await expect(solo.page.getByTestId("sala-code")).toContainText(code);

		const link = solo.page.getByLabel(/Link de convite|Invite link/i);
		const shown = await link.inputValue();
		expect(shown).toContain("…");
		expect(shown.startsWith("http")).toBe(true);
		expect(shown.endsWith(`?code=${code}`), "fim do link preserva o código").toBe(
			true,
		);

		// O valor truncado precisa caber na largura real do campo (o fim com
		// o código não pode ser cortado), inclusive no celular com fonte 16px.
		const fits = await link.evaluate((el) => {
			const input = el as HTMLInputElement;
			const style = getComputedStyle(input);
			const ctx = document.createElement("canvas").getContext("2d");
			if (!ctx) return true;
			ctx.font = `${style.fontSize} ${style.fontFamily}`;
			return ctx.measureText(input.value).width <= input.clientWidth - 1;
		});
		expect(fits, "valor truncado cabe no campo sem cortar o fim").toBe(true);

		await link.focus();
		const full = await link.inputValue();
		expect(full).not.toContain("…");
		expect(full).toBe(new URL(`/join?code=${code}`, solo.page.url()).toString());

		await copy.click();
		await expect(copy).toHaveText(/Copiado/);
		expect(await solo.page.evaluate(() => navigator.clipboard.readText())).toBe(
			full,
		);

		// Rolar até o fim não tira o convite do topo (desktop e celular).
		await solo.page.evaluate(() =>
			window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" }),
		);
		await expect(copy).toBeInViewport({ ratio: 1 });
		await expect(solo.page.getByTestId("sala-code")).toBeInViewport({ ratio: 1 });

		expect(solo.ws.parseErrors).toEqual([]);
		solo.guard.assertClean();
	} finally {
		solo.guard.detach();
		await soloCtx.ctx.close();
	}
});
