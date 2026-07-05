import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const AFTER_DIR = join(
  process.cwd(),
  "..",
  "..",
  "docs",
  "ux-review",
  "screenshots",
  "after",
);
mkdirSync(AFTER_DIR, { recursive: true });

function shot(page: Page, name: string, full = true) {
  return page.screenshot({
    path: join(AFTER_DIR, `${name}.png`),
    fullPage: full,
  });
}

// =========================================================================
// UX-011: EmptyOverlay NÃO bloqueia clicks do deck
// =========================================================================
test("UX-011 — EmptyOverlay é banner não-bloqueante em sala solo", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/join?host=1", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const nickInput = page
    .locator('input[name="nick"], input[data-testid*="nick" i]')
    .first();
  await nickInput.waitFor({ state: "visible", timeout: 5000 });
  await nickInput.fill("TestUser");
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /entrar|criar|continuar/i }).first().click();
  await page.waitForURL(/\/arena/, { timeout: 8000 });
  await page.waitForFunction(
    () => document.querySelector("[data-testid='arena-code']")?.textContent !== "—",
    { timeout: 8000 },
  ).catch(() => {});
  await page.waitForTimeout(1_500);

  const probe = await page.evaluate(() => {
    const overlay = document.querySelector("[data-testid='empty-overlay']");
    const overlayClass = overlay?.className ?? "";
    return {
      overlayPresent: !!overlay,
      notBlocking: !overlayClass.includes("absolute inset-0"),
      notModal: overlay?.getAttribute("role") === "status" || overlay?.getAttribute("role") === "region",
      codeVisible: /[A-Z0-9]{4}/.test(overlay?.textContent ?? ""),
      ariaModal: overlay?.getAttribute("aria-modal"),
    };
  });

  await shot(page, "UX-011-after-empty-overlay-banner");
  test.info().annotations.push({ type: "ux-011-evidence", description: JSON.stringify(probe) });

  expect(probe.overlayPresent, "EmptyOverlay presente").toBe(true);
  expect(probe.notBlocking, "EmptyOverlay NÃO tem 'absolute inset-0'").toBe(true);
  expect(probe.notModal, "EmptyOverlay é role=status (não dialog/modal)").toBe(true);
  expect(probe.ariaModal, "EmptyOverlay NÃO tem aria-modal=true").not.toBe("true");
});

// =========================================================================
// UX-011 regression: vote funciona em sala solo sem precisar dismiss nada
// =========================================================================
test("UX-011 reg — clicar deck card funciona com EmptyOverlay visível", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/join?host=1", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const nickInput = page
    .locator('input[name="nick"], input[data-testid*="nick" i]')
    .first();
  await nickInput.waitFor({ state: "visible", timeout: 5000 });
  await nickInput.fill("TestUser");
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /entrar|criar|continuar/i }).first().click();
  await page.waitForURL(/\/arena/, { timeout: 8000 });
  await page.waitForFunction(
    () => document.querySelector("[data-testid='arena-code']")?.textContent !== "—",
    { timeout: 8000 },
  ).catch(() => {});
  await page.waitForTimeout(1_500);

  // Tenta votar — não deve ser interceptado pelo EmptyOverlay
  const card = page.locator('[data-testid="deck-card-5"]').first();
  await card.waitFor({ state: "visible", timeout: 5000 });
  await card.click({ timeout: 8000 }); // ANTES: 45× retry + 30s timeout. AGORA: OK
  await page.waitForTimeout(1500);

  const revealState = await page.evaluate(() => {
    const reveal = document.querySelector("[data-testid='reveal-button']");
    return reveal?.getAttribute("data-reveal-state") ?? null;
  });

  await shot(page, "UX-011-after-vote-with-banner-visible");
  test.info().annotations.push({ type: "ux-011-vote-evidence", description: JSON.stringify({ revealState }) });
  expect(revealState, "Reveal button deve estar 'ready' após voto solo").toBe("ready");
});
