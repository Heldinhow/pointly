import { expect, type Browser, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
import { attachErrorGuard, attachWsCapture } from "./ws-capture";

export interface Player {
	page: Page;
	ws: ReturnType<typeof attachWsCapture>;
	guard: ReturnType<typeof attachErrorGuard>;
	nick: string;
	playerId: string | null;
}

const EXPECTED_VIEWPORTS: Record<string, { width: number; height: number; touch: boolean }> = {
	"chromium-desktop": { width: 1280, height: 800, touch: false },
	"chromium-mobile": { width: 390, height: 844, touch: true },
};

/** Isolated context per player. Context options pass the project `use` fields explicitly. */
export async function newPlayer(
	browser: Browser,
	testInfo: TestInfo,
	opts: { userAgent?: string } = {},
): Promise<{ page: Page; ctx: BrowserContext }> {
	const use = testInfo.project.use;
	const ctx = await browser.newContext({
		viewport: use.viewport,
		isMobile: use.isMobile,
		hasTouch: use.hasTouch,
		baseURL: use.baseURL,
		locale: use.locale ?? "pt-BR",
		timezoneId: use.timezoneId,
		...(opts.userAgent ? { userAgent: opts.userAgent } : {}),
	});
	const page = await ctx.newPage();
	const expected = EXPECTED_VIEWPORTS[testInfo.project.name];
	if (!expected) throw new Error(`projeto desconhecido: ${testInfo.project.name}`);
	expect(page.viewportSize()).toEqual({ width: expected.width, height: expected.height });
	const layout = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
	if (expected.touch) {
		expect(layout.w, "isMobile emulation active on blank page (980 default layout width)").toBe(980);
	} else {
		expect(layout).toEqual({ w: expected.width, h: expected.height });
	}
	const touchPoints = await page.evaluate(() => navigator.maxTouchPoints);
	if (expected.touch) {
		expect(touchPoints).toBeGreaterThan(0);
	} else {
		expect(touchPoints).toBe(0);
	}
	return { page, ctx };
}

/** Attach typed WS capture plus strict error guard. */
export function wirePlayer(page: Page, nick: string): Player {
	const ws = attachWsCapture(page);
	const guard = attachErrorGuard(page);
	return { page, ws, guard, nick, playerId: null };
}

/** Create a room as `nick` from /join. Returns the code. */
export async function createRoom(player: Player, nick: string): Promise<string> {
	const { page } = player;
	await page.goto("/join");
	await page.locator("#nick").fill(nick);
	await page.locator('button[type="submit"]').click();
	await expect(page.locator('[data-testid="sala-code"]')).toBeVisible();
	const raw = ((await page.locator('[data-testid="sala-code"]').textContent()) ?? "").trim();
	const code = extractCode(raw);
	player.nick = nick;
	return code;
}

/** Join by typing the code into the OTP field. */
export async function joinWithManualCode(
	player: Player,
	code: string,
	nick: string,
	opts: { spectate?: boolean } = {},
): Promise<void> {
	const { page } = player;
	await page.goto("/join?mode=join");
	await page.locator("#nick").fill(nick);
	const inputs = page.locator('[data-slot="otp-field-input"]');
	await expect(inputs.first()).toBeVisible();
	await inputs.first().click();
	await inputs.first().pressSequentially(code.toUpperCase(), { delay: 30 });
	if (opts.spectate) {
		await page.locator("#spectate").check();
	}
	await page.locator('button[type="submit"]').click();
	await expect(page.locator('[data-testid="sala-code"]')).toBeVisible();
	await expect(page.locator('[data-testid="sala-code"]')).toContainText(code);
	player.nick = nick;
}

/** Join through the invite link exactly as read from the arena. The URL is validated, never rebuilt. */
export async function joinWithInviteLink(
	player: Player,
	inviteUrl: string,
	nick: string,
	opts: { spectate?: boolean } = {},
): Promise<void> {
	const { page } = player;
	const url = new URL(inviteUrl);
	expect(url.pathname).toBe("/join");
	const code = url.searchParams.get("code") ?? "";
	expect(code).toMatch(/^[A-Za-z0-9]{4}$/);
	await page.goto(url.toString());
	await page.locator("#nick").fill(nick);
	if (opts.spectate) {
		await page.locator("#spectate").check();
	}
	await page.locator('button[type="submit"]').click();
	await expect(page.locator('[data-testid="sala-code"]')).toBeVisible();
	await expect(page.locator('[data-testid="sala-code"]')).toContainText(code.toUpperCase());
	player.nick = nick;
}

export function extractCode(inviteUrlOrCode: string): string {
	const param = /[?&]code=([A-Za-z0-9]{4})/.exec(inviteUrlOrCode);
	if (param?.[1]) return param[1].toUpperCase();
	const matches = inviteUrlOrCode.toUpperCase().match(/[A-Z0-9]{4}/g);
	const last = matches?.[matches.length - 1];
	if (!last) throw new Error(`código não extraído de: ${inviteUrlOrCode}`);
	return last;
}

/** Read the invite link from the arena input and validate origin, path and code. No fallback. */
export async function readInviteUrl(player: Player, expectedCode: string): Promise<string> {
	const { page } = player;
	const input = page.getByLabel(/Link de convite|Invite link/i);
	await expect(input).toBeVisible();
	// O campo mostra o meio truncado até receber foco; o valor inteiro
	// aparece ao focar (e o botão de copiar usa sempre a URL completa).
	await input.focus();
	const value = await input.inputValue();
	const url = new URL(value);
	expect(url.origin).toBe(new URL(page.url()).origin);
	expect(url.pathname).toBe("/join");
	expect(url.searchParams.get("code")).toBe(expectedCode);
	return url.toString();
}

/** Add an agenda story and wait for activation. Returns the story id. */
export async function addStory(player: Player, title: string): Promise<string> {
	const { page } = player;
	await page.locator("#pauta-novo-titulo").fill(title);
	await page.locator('[data-testid="pauta-add-button"]').click();
	const item = page.locator('[data-testid^="pauta-item-"]', { hasText: title });
	await expect(item).toBeVisible();
	const testid = (await item.getAttribute("data-testid")) ?? "";
	return testid.replace("pauta-item-", "");
}

/** Vote a deck card and wait for the own selection (aria-pressed). */
export async function vote(player: Player, value: string): Promise<void> {
	const { page } = player;
	await page.locator(`button[data-testid="deck-card-${value}"]`).click();
	await expect(page.locator(`button[data-testid="deck-card-${value}"]`)).toHaveAttribute(
		"aria-pressed",
		"true",
	);
}

/** Own playerId read from the last room_state (matched by nick). */
export function ownPlayerId(player: Player): string {
	const sala = player.ws.lastRoomState?.payload.sala;
	const self = sala?.players.find((p) => p.nick === player.nick);
	if (!self) throw new Error(`self ${player.nick} ausente no room_state`);
	player.playerId = self.id;
	return self.id;
}
