import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/tmp/pointly-shots2", { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
	viewport: { width: 1440, height: 900 },
	colorScheme: "dark",
});
const page = await ctx.newPage();

await page.addInitScript(() => {
	localStorage.setItem("pointly.theme", "dark");
	sessionStorage.setItem("pointly.dismissedEmpty", "1");
});

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);

await page.click('[data-testid="cta-nav-create-room"]');
await page.waitForTimeout(400);

// Fill nick to enable submit
await page.fill('[data-testid="nick-input"]', "Helder");
await page.waitForTimeout(200);
await page.click('[data-testid="join-submit"]');
await page.waitForTimeout(2000);

await page.screenshot({ path: "/tmp/pointly-shots2/01-arena-dark.png" });

const card5 = await page.$('[data-deck-value="5"]');
if (card5) await card5.click();
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/pointly-shots2/02-arena-voted-dark.png" });

await page.click('[data-testid="theme-toggle"]');
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/pointly-shots2/03-arena-voted-light.png" });

await page.screenshot({
	path: "/tmp/pointly-shots2/04-topbar-light.png",
	clip: { x: 1100, y: 0, width: 340, height: 60 },
});

await page.click('[data-testid="theme-toggle"]');
await page.waitForTimeout(400);
await page.screenshot({
	path: "/tmp/pointly-shots2/05-topbar-dark.png",
	clip: { x: 1100, y: 0, width: 340, height: 60 },
});

const pill = await page.$('[data-testid="share-pill"]');
if (pill) await pill.hover();
await page.waitForTimeout(300);
await page.screenshot({
	path: "/tmp/pointly-shots2/06-topbar-pill-hover.png",
	clip: { x: 1100, y: 0, width: 340, height: 60 },
});

if (pill) await pill.click();
await page.waitForTimeout(200);
await page.screenshot({
	path: "/tmp/pointly-shots2/07-topbar-pill-copied.png",
	clip: { x: 1100, y: 0, width: 340, height: 60 },
});

await page.waitForTimeout(2000);
await page.screenshot({ path: "/tmp/pointly-shots2/08-arena-with-toasts.png" });

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/pointly-shots2/09-landing-dark.png" });

await page.goto("http://localhost:5173/join", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/pointly-shots2/10-join-dark.png" });

await page.goto("http://localhost:5173/full", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/pointly-shots2/11-full-dark.png" });

await browser.close();
console.log("DONE — /tmp/pointly-shots2/");
