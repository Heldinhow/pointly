# Visitas first-party (display ESP32)

## Sub-features

- Beacon `POST /api/stats/pageview` (vazio, `sendBeacon`) em toda troca de rota, sem consentimento GA — nenhum dado pessoal sai do device.
- Dedupe por visitante por dia (America/Sao_Paulo): `hash(salt diário + IP + UA)`; salt só em memória, descartado na virada; IP/UA crus nunca persistem.
- Resumo público `GET /api/stats/visits` → `{"today","last7d","live5m","updatedAt"}` (CORS `*`, cache 30s) — o ESP32 faz polling aqui.
- Bots (UA bot/crawler/spider/headless) respondem 204 sem contar; rate limit por IP nos dois endpoints; corpo >1KB vira 413.

## How to get to it (user POV)

Não há UI: qualquer page load/navegação no site dispara o beacon. Para ver o efeito, abra `/` e consulte `GET /api/stats/visits` (`today` incrementa 1x por visitante/dia; recarregar não soma).

## Driving it

```
browser.open { url: "http://localhost:5173/", viewport: "desktop" }
// today incrementa +1; navegar pra /join não soma de novo (dedupe)
browser.snapshot / curl http://localhost:3001/api/stats/visits
```

E2E: `e2e/visits.spec.ts` (UA único por teste — o dedupe é por IP+UA).

## Gotchas

- Dedupe é por IP+UA: segundo projeto/navegador com mesmo IP+UA no mesmo dia NÃO incrementa — o spec usa UA único (`PointlyVisitsE2E/<ts>`).
- `live5m` são hashes distintos dos últimos 5min (memória; zera no restart). Totais por dia sobrevivem (volume `pointly-visits`, `VISITS_DATA_FILE`).
- Restart no mesmo dia zera o dedupe (salt novo): uma revisita conta 1x a mais. Margem aceita — persistir o salt quebraria a unlinkability diária.
- CSP do `serve-web` já permite o beacon: `connect-src` inclui `'self'`.
