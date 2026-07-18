# Google Analytics 4 with privacy-first defaults

Adotamos **Google Analytics 4 (gtag.js)** no Pointly para medir tráfego de rotas SPA (landing, join, arena, full, 404). Tracking limitado a **pageviews** com **privacy-first defaults**: zero cookie, IP anonymized, query string stripped (código de sala nunca chega ao Google), sem advertising features, sem consent banner. Pageview de pathname público não é "dado pessoal" sob LGPD, então a lane de privacidade da ADR-006 ("zero cadastro, zero rastreamento") evolui para "zero PII rastreável" — honrando o espírito (privacy-by-default) sem precisar de banner que quebraria o "Zero Administrative Friction" do PRODUCT.md.

**Data**: 2026-07-18

## Decisão

Implementar GA4 via `apps/web/src/lib/analytics.ts` (runtime loader) com API mínima: `init()`, `trackPageview(prevPathname, newPathname)`, `isEnabled()`. Snippet `gtag.js` injetado lazy em runtime via `document.createElement('script')` apenas quando `VITE_GA_MEASUREMENT_ID` está setada. Pageviews rastreados por `<PageviewTracker />` montado dentro de `<AppRouter>` em `routes.tsx` (single source of truth para todas as rotas). Env var chega ao bundle via build-arg em `docker-compose.yml` + `ARG/ENV` no `Dockerfile` web-build stage, setada em Dokploy project env.

## Privacy flags (gtag config)

```ts
gtag('config', ID, {
  send_page_view: false,        // SPA: we fire page_view manually
  anonymize_ip: true,           // IP anonymized (último octeto zerado)
  ads_data_redaction: true,     // sem advertising features
  cookie_domain: 'none',        // zero cookie no domínio Pointly
  client_storage: 'none',       // zero localStorage/sessionStorage do GA
});
gtag('event', 'page_view', { page_referrer: prev, page_location: next });
```

Em **trackPageview** (route change):

```ts
gtag('config', ID, {
  send_page_view: false,
  page_referrer: prev,          // pathname anterior
  page_location: next,          // pathname novo (query string stripped)
  update: true,                 // merge sem reinit
});
gtag('event', 'page_view', { page_referrer: prev, page_location: next });
```

## Dev / Prod behavior

| Cenário | `VITE_GA_MEASUREMENT_ID` | Comportamento |
| --- | --- | --- |
| Dev sem `.env.local` | `undefined` | `init()` é no-op puro. **Zero request** a `googletagmanager.com`. |
| Dev com `.env.local` | `G-DEV123` | `init()` injeta snippet, tracking funciona contra GA property de dev. |
| Build prod sem env | `undefined` | `init()` é no-op. Bundle sem referência a `googletagmanager.com` (verificável via grep no `dist/`). |
| Build prod com env (Dokploy) | `G-PROD456` | `init()` injeta snippet com ID literal inlined no bundle. |

## Admin GA4 — checklist do operator

Antes de subir o ID real em Dokploy, **obrigatório** no admin do Google Analytics:

- [ ] **Enhanced Measurement → "Page changes based on browser history events" = OFF** (default é ON — gera duplicate pageview por rota, sem a flag ter efeito).
- [ ] **Data retention → 2 months** (default é 14 months — fora do mínimo necessário).
- [ ] **IP anonymization** ativado (reforço do `anonymize_ip: true` do código; redundância desejada).
- [ ] **Personalized ads = OFF**.

Sem esses 4 toggles, o código funciona mas a postura de privacidade fica fragilizada (ou o tracking fica quebrado no caso do duplicate).

## Considered Options

### Alternative 1: Sem tracking (status quo)

- **Pro**: zero código, zero risco LGPD.
- **Con**: zero visibilidade de produto — decisões cegas (qual CTA funciona, qual página tem bounce, qual rota é dead link).
- **Por que rejeitado**: pageview anônimo é informação não-pessoal. ADR-006 evolui pra "zero PII" (mais preciso que "zero rastreamento"). Tracking com privacy-first é compatível com a lane.

### Alternative 2: Consent banner + Consent Mode v2

- **Pro**: LGPD-grade, juridicamente mais defensável.
- **Con**: quebra ADR-006 ("zero fricção") e PRODUCT.md ("Zero Administrative Friction"). Banner adiciona regressão visual + caminho de teste E2E novo.
- **Por que rejeitado**: desproporcional ao dado coletado (pageview de pathname público). Privacy-first defaults cobrem 95% do caso LGPD sem fricção.

### Alternative 3: Plausible / Fathom (privacy-focused alternatives)

- **Pro**: cookieless por default, sem flags de privacy.
- **Con**: vendor lock-in em serviço pago (Plausible ~$9/mês por 10k pageviews; Fathom similar). Dependência externa de SaaS.
- **Por que rejeitado**: GA4 é free, vendor é o próprio Google (já hospeda nosso email + docs), privacy-first defaults mitigam as preocupações. Revisar se analytics usage crescer além de 100k pageviews/mês (limite free do GA4).

### Alternative 4: Server-side events via Measurement Protocol

- **Pro**: tracking server-side, controle total.
- **Con**: requer infra no backend (Bun+Hono não tem hook natural para "pageview"), adiciona complexidade sem ganho claro pro escopo pageview.
- **Por que rejeitado**: pageviews são naturalmente client-side. Server-side só vale pra eventos custom críticos (ex: billing) — fora do escopo v1.

## Consequences

### Positive

- **Visibilidade de produto**: traffic source, popular pages, exit pages, device breakdown — tudo no GA4 dashboard.
- **LGPD-friendly por default**: zero cookie + IP anonymized + cookieless pings + query stripped = "zero PII" tecnicamente verificável.
- **Zero atrito em dev**: `bun run dev` continua offline a Google (sem env var = no-op puro).
- **Bundle prod mínimo**: ~45KB de `gtag.js` adicionado, lazy-loaded só após init em prod.
- **API extensível**: `trackEvent(name, params)` é 1 chamada de função quando v2 precisar de eventos custom (`room_created`, `vote_cast`).

### Negative

- **Vendor lock-in Google**: tracking depende de `googletagmanager.com` uptime. Mitigação: fallback gracioso (gtag.js enfileira calls se rede cair).
- **Operação manual no admin GA4**: 4 toggles críticos (Enhanced Measurement OFF, retention, IP anonymization, ads OFF). Sem eles, privacidade fica fragilizada. Mitigação: checklist no topo desta ADR + comentário no `analytics.ts`.
- **Mudança na stance da ADR-006**: "zero rastreamento" → "zero PII rastreável". Update inline na ADR-006 (privacy-by-default preserva o espírito).

### Risks

- **Enhanced Measurement ON no admin**: gera duplicate pageview por rota, polui o dashboard. Mitigação: checklist + primeiro deploy valida via DebugView.
- **Query string não stripped em algum caller**: se alguém chamar `trackPageview(window.location.href)` em vez de `window.location.pathname`, código de sala vaza. Mitigação: API só aceita `string` e `<PageviewTracker />` é o único caller; unit test cobre strip.
- **Env var vazia em prod**: `VITE_GA_MEASUREMENT_ID=` (string vazia) passa regex mas é inválida. Mitigação: regex `^G-[A-Z0-9]{1,10}$` valida formato; falha → `console.warn` único + no-op.

## Implementation Notes

1. **Arquivos novos**:
   - `apps/web/src/lib/analytics.ts` (≈80 linhas) — `init()`, `trackPageview()`, `isEnabled()`.
   - `apps/web/src/components/pageview-tracker.tsx` (≈30 linhas) — `useLocation` + `useEffect`.
   - `apps/web/src/lib/analytics.test.ts` — 6 testes unit.
   - `apps/web/src/components/pageview-tracker.test.tsx` — 3 testes unit.
   - `apps/web/.env.example` — placeholder `VITE_GA_MEASUREMENT_ID=`.
   - `.specs/features/google-analytics/{spec.md, context.md}`.

2. **Arquivos editados**:
   - `apps/web/src/routes.tsx` — `<PageviewTracker />` montado dentro de `<AppRouter>` antes do `<RouterProvider>`.
   - `Dockerfile` — `ARG VITE_GA_MEASUREMENT_ID` + `ENV` no stage `web-build`.
   - `docker-compose.yml` — `web.build.args.VITE_GA_MEASUREMENT_ID: ${VITE_GA_MEASUREMENT_ID:-}`.

3. **Verificação pós-deploy**:
   - DevTools → Network → filtrar `googletagmanager` em prod: 1 request `gtag/js?id=...` + N hits `collect`.
   - DevTools → Application → Cookies: **zero cookie** em `pointly.space` (validação cookieless).
   - GA4 → DebugView: 1 pageview por rota, sem duplicate.

## References

- `.specs/features/google-analytics/spec.md` — AC testáveis.
- `.specs/features/google-analytics/context.md` — decisões D1-D7 do grilling.
- Memory `ga4-spa-pageview-pattern` — gotcha do duplicate via Enhanced Measurement (referência canônica).
- `.compozy/tasks/pointly-ux-hardening/adrs/adr-006.md` — privacy-by-default original (atualizada inline).
- Doc oficial: https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications
- Doc oficial: https://support.google.com/analytics/answer/9216061 (Enhanced Measurement)