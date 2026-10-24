# Consentimento de analytics (LGPD)

## Sub-features

- Banner `analytics-consent-banner` (role dialog, não modal) aparece em qualquer rota quando `VITE_GA_MEASUREMENT_ID` está configurado e ainda não há escolha salva.
- Copy pt-BR/en: "Cookies e análise de uso" / "Cookies and usage analytics"; botões `Aceitar`/`Accept` e `Recusar`/`Decline`.
- **Aceitar** (`analytics-consent-accept`) grava `granted` em `pointly.analytics-consent`, injeta `gtag.js` e envia o `page_view` da rota atual (e das próximas trocas SPA).
- **Recusar** (`analytics-consent-reject`) grava `denied` e mantém zero requests a `googletagmanager.com`/`google-analytics.com`; após reload o banner não reaparece.
- Link **Privacidade** (`analytics-consent-open`) no rodapé reabre o banner; com escolha salva aparece também **Fechar** (`analytics-consent-close`). Trocar para Recusar interrompe novos eventos.
- Sem Measurement ID não há banner nem link (nada a consentir).

## How to get to it (user POV)

First visit to any page with analytics configured → banner at the bottom. Choose Accept or Decline. Later, scroll to the footer and click "Privacidade" / "Privacy" to review the choice.

## Driving it

```
browser.open { url: "http://localhost:5173/", viewport: "desktop" }
browser.snapshot   // banner visible, no gtag script yet
browser.click { selector: "[data-testid=\"analytics-consent-reject\"]" }
browser.snapshot   // banner gone; localStorage pointly.analytics-consent = denied
browser.click { selector: "[data-testid=\"analytics-consent-open\"]" }
browser.click { selector: "[data-testid=\"analytics-consent-accept\"]" }
browser.snapshot   // gtag script present; dataLayer has page_view for the current path
```

Network proof (Playwright suite, analytics hosts stubbed so the assertion is offline-safe):

```
bun run typecheck:e2e
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser bun run test:e2e -- e2e/analytics-privacy.spec.ts
```

## Evidence

- `[data-testid="analytics-consent-banner"]` visible before any choice; absent after Accept/Decline.
- `page.on("request")` filtered to `googletagmanager.com`, `google-analytics.com`, `doubleclick.net`: empty before choice and after Decline (including reload).
- `document.querySelector('script[src*="googletagmanager.com/gtag/js"]')`: 0 before Accept/after Decline, 1 after Accept.
- `window.dataLayer` page_view entries: `/` right after Accept, `/join` after SPA navigation; none added after switching to Decline.
- `localStorage["pointly.analytics-consent"]` is exactly `granted` or `denied`.

## Gotchas

- The banner is rendered only after mount, so prerendered HTML stays clean (no hydration mismatch). It appears on `/`, `/join`, `/s/:code` and guides.
- No Measurement ID (`VITE_GA_MEASUREMENT_ID` empty) means no banner; E2E forces a synthetic non-empty ID.
- A choice is device-local (localStorage). Clearing site data brings the banner back.
- Revoking stops new gtag calls immediately; it does not un-download an already loaded script until the next reload.
- Do not test against the real Google endpoint: stub analytics hosts in Playwright and assert the request attempt, not a successful collect.
