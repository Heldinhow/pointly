# AGENTS.md

## Mapa rápido

- `apps/web` — frontend (React + Vite + coss). Docs visuais: `DESIGN.md` + `apps/web/src/index.css` (SSOT de código).
- `apps/server` — backend (Bun + Hono + WS).
- `packages/shared` — contratos e cômputo (ex.: cooldown de projéteis; SSOT de regras executáveis).
- Linguagem do domínio: `CONTEXT.md`. Estratégia/produto: `PRODUCT.md`. Decisões: `docs/adr/`.

## Comandos (usar os filtros existentes)

- Piso de Done: `bun run verify` (= `typecheck` → `test` → `build:web`, fail fast). Guarde os exit codes como prova.
- Web: `bun --filter pointly-web dev | build | typecheck`, `bun test src/` dentro de `apps/web`.
- Server: `bun --filter server test`, `tsc --noEmit` dentro de `apps/server`.
- Shared: `bun --filter @planning-poker/shared test | typecheck`.
- E2E: Playwright em `e2e/` com `playwright.config.ts` (sobe `server` :3001 e Vite :5179, `reuseExistingServer: false`). `bun run test:e2e` (= `typecheck:e2e` → `playwright test`), `bun run test:e2e:list`, `bun run typecheck:e2e`.
- Raiz: `bun run test:serve-web` (= `node --test scripts/serve-web.test.mjs`).
- Não criar scripts novos quando o filtro já resolve.

## UI — preferir coss (`https://coss.com/ui`) sempre que possível

- Fonte canônica: `agent/skills/coss/` (demais paths são symlinks; editar só no canônico).
- Fluxo padrão: Impeccable escopado + COSS, subordinado a `DESIGN.md`. Sem trocar libs, sem AIDA/GSAP, sem overlap — ver Do's and Don'ts.
- Opt-in só por pedido explícito: `redesign-existing-projects`, `frontend-design`, `design-system` (slides fora de escopo), `taste-skill/*`, `gpt-taste`, `image-to-code`.
- Reutilizar primeiro o que já existe em `apps/web/src/components/ui/*` (Button, Card, Input, Alert, Field, Progress, Separator, Spinner, OTP Field, etc.).
- Se o primitivo não existir localmente, instalar via CLI (projeto usa Bun):
  `bunx --bun shadcn@latest add @coss/<componente>`
- Fonte de verdade, nesta ordem: skill `agent/skills/coss/SKILL.md` → `agent/skills/coss/references/component-registry.md` + guias em `references/primitives/<nome>.md` → docs em `https://coss.com/ui` e `https://coss.com/ui/llms.txt` → partículas em `https://coss.com/ui/particles`.
- Não reinventar comportamento que já existe como primitivo coss/Base UI (Dialog, Menu, Select, Popover, Tooltip, Toast via `toastManager`, Form/Field, Tabs, etc.). Composição e APIs seguem exatamente a doc — não misturar padrões entre primitivos nem inventar props.
- Exceção: componentes de domínio assinados do Pointly (`deck`, `poker-table`, feltro/mesa) continuam custom — mas botões, inputs, alerts, loaders, empty states e feedback ao redor deles usam coss.
- Estilizar coss com os tokens do Pointly (`DESIGN.md` + `apps/web/src/index.css`, Tailwind v4, dark-first via `html.dark`), nunca o default shadcn/coss sem customizar (cores/radii/sombras do sistema).

## Validação — Definition of Done (executável)

- Sempre: rode `bun run verify` (ou os filtros equivalentes) e guarde os exit codes como prova. Sem `verify` verde (ou falha pré-existente documentada), nada está "done".
- `packages/shared`: `shared test + typecheck` suficiente (`bun --filter @planning-poker/shared test && bun --filter @planning-poker/shared typecheck`).
- `apps/server`: `server test + typecheck`; opcional `/health` se o server estiver rodando.
- `apps/web` não-visual: `web test + typecheck + build:web` (coberto pelo `verify`).
- `apps/web` visual: `verify` MAIS `bun run test:e2e` (a suite Playwright existe nesta tree) OU checklist OpenChamber/browser contra `DESIGN.md` nos viewports 375/390/768/1024/1440, com screenshots salvos fora do git (path untracked, ex.: `/tmp/...`).
- Feature user-facing: rode `verify-pointly` (`.agents/skills/verify-pointly/SKILL.md`) no fim e atualize o arquivo correspondente em `.agents/skills/verify-pointly/features/` na mesma mudança; sem mudança de feature, não mexa no mapa.
- Mudanças Docker/compose: rode `docker compose build` quando Docker estiver disponível; senão, deixe para o CI (PR C) e registre como indisponível.

## Deploy

- CI (`.github/workflows/verify.yml`): PR e push em `main` rodam `verify` → `e2e`; `permissions: contents: read` (sem job de deploy).
- `docker-compose.yml` + `Dockerfile`: alvos `server` (:3001) e `web` (:8080) na rede externa `dokploy-network`; routers do `web` gerenciados pela UI do Dokploy (`roadmap.md`). Nenhum arquivo do repo declara deploy automático ao dar merge em `main`.

## Como trabalhar

- Direto por padrão; delegação/subagentes só por benefício concreto ou pedido explícito (sem skill orquestradora; agentes disponíveis em `.codex/agents/`).
- Verificação proporcional (`verify-and-stop`): menor prova suficiente, focada antes de gates largos. TDD só para comportamento novo, lógica complexa ou regressão.
- Não repetir valores mutáveis em docs — referenciar a constante/teste SSOT.
- `.specs/LESSONS.md` é auto-gerado; lições se editam via script/`.specs/lessons.json`, nunca à mão.
- Não rodar `/graphify` nem indexação salvo pedido explícito ou `graphify-out/graph.json` existente.
