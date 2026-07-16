import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/tmp/pointly-shots", { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
	viewport: { width: 1440, height: 900 },
	colorScheme: "dark",
});
const page = await ctx.newPage();

// Set dark theme via localStorage BEFORE navigating
await page.addInitScript(() => {
	localStorage.setItem("pointly.theme", "dark");
});

// Go to landing first, then click "Criar sala" to enter arena
await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/pointly-shots/01-landing-dark.png", fullPage: false });

// Click create room
await page.click('[data-testid="cta-nav-create-room"]');
await page.waitForTimeout(800);

// Fill nick
await page.fill('[data-testid="nick-input"]', "Helder");
await page.waitForTimeout(200);

// Click Entrar
await page.click('[data-testid="join-submit"]');
await page.waitForTimeout(2500);

// Should be in arena by now
await page.screenshot({ path: "/tmp/pointly-shots/02-arena-dark.png", fullPage: false });

// Top crop of header
await page.screenshot({
	path: "/tmp/pointly-shots/03-arena-topbar-dark.png",
	clip: { x: 0, y: 0, width: 1440, height: 100 },
});

// Click theme toggle to switch to light
await page.click('[data-testid="theme-toggle"]');
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/pointly-shots/04-arena-light.png", fullPage: false });
await page.screenshot({
	path: "/tmp/pointly-shots/05-arena-topbar-light.png",
	clip: { x: 0, y: 0, width: 1440, height: 100 },
});

// Toggle back to dark for the EmptyOverlay capture (which triggers when only player)
await page.click('[data-testid="theme-toggle"]');
await page.waitForTimeout(300);
await page.screenshot({ path: "/tmp/pointly-shots/06-arena-empty-overlay-dark.png", fullPage: false });

await browser.close();
console.log("DONE — screenshots in /tmp/pointly-shots/");
