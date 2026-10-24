# Visitas first-party (display ESP32)

## Sub-features

- Beacon `POST /api/stats/pageview` (vazio, `sendBeacon`) em toda troca de rota, sem consentimento GA — nenhum dado pessoal sai do device. Continua **público**.
- Dedupe por visitante por dia (America/Sao_Paulo): `hash(salt diário + IP + UA)`; salt só em memória, descartado na virada; IP/UA crus nunca persistem.
- **Protegido por token**: `GET /api/stats/visits` → `{"today","last7d","live5m","updatedAt"}`, só com `Authorization: Bearer <token>` ou `X-Stats-Key: <token>`. Sem CORS. Cache `private, max-age=30`.
- `STATS_API_TOKEN` vazio/ausente → **503** (fail closed); token errado/ausente → **401**; comparação em tempo constante (digests SHA-256).
- Bots (UA bot/crawler/spider/headless) respondem 204 sem contar; rate limit por chave derivada do IP (hash com salt, nunca IP cru) nos dois endpoints; corpo >1KB vira 413.

## How to get to it (user POV)

Não há UI: qualquer page load/navegação no site dispara o beacon. Para ver o efeito, abra `/` e consulte o endpoint com o token (`today` incrementa 1x por visitante/dia; recarregar não soma).

## Driving it

```
# no server: STATS_API_TOKEN=<segredo> (ver apps/server/.env.example)
browser.open { url: "http://localhost:5173/", viewport: "desktop" }
// today incrementa +1; navegar pra /join não soma de novo (dedupe)
curl -s -H "Authorization: Bearer $STATS_API_TOKEN" http://localhost:3001/api/stats/visits
curl -s -H "X-Stats-Key: $STATS_API_TOKEN"            http://localhost:3001/api/stats/visits
curl -si http://localhost:3001/api/stats/visits        # 401 sem token
```

E2E: `e2e/visits.spec.ts` (UA único por teste — o dedupe é por IP+UA; token `e2e-stats-token` no `playwright.config.ts`).

## Gotchas

- **Sem token não há contagem**: `STATS_API_TOKEN` vazio devolve 503, não 200 com zeros — fail closed de propósito. O ESP32 precisa do header em todo poll.
- Não há CORS no GET: o consumidor é o ESP32 (não-browser). Um browser de outra origem não lê a resposta, por design.
- Dedupe é por IP+UA: segundo projeto/navegador com mesmo IP+UA no mesmo dia NÃO incrementa — o spec usa UA único (`PointlyVisitsE2E/<ts>`).
- `live5m` são hashes distintos dos últimos 5min (memória; zera no restart). Totais por dia sobrevivem (volume `pointly-visits`, `VISITS_DATA_FILE`).
- Restart no mesmo dia zera o dedupe (salt novo): uma revisita conta 1x a mais. Margem aceita — persistir o salt quebraria a unlinkability diária.
- CSP do `serve-web` já permite o beacon: `connect-src` inclui `'self'` (POST segue público).
