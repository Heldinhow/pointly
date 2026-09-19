# AGENTS.md

## Mapa rápido

- `apps/web` — frontend (React + Vite + coss). Docs visuais: `DESIGN.md` + `apps/web/src/index.css` (SSOT de código).
- `apps/server` — backend (Bun + Hono + WS).
- `packages/shared` — contratos e cômputo (ex.: cooldown de projéteis; SSOT de regras executáveis).
- Linguagem do domínio: `CONTEXT.md`. Estratégia/produto: `PRODUCT.md`. Decisões: `docs/adr/`.

## Comandos (usar os filtros existentes)

- Web: `bun --filter pointly-web dev | build | typecheck`, `bun test src/` dentro de `apps/web`.
- Server: `bun --filter server test`, `tsc --noEmit` dentro de `apps/server`.
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

## Validação (obrigatório em mudança de código)

- Toda mudança de código exige validação via Playwright antes de considerar pronto.
- Se a mudança for visual (UI/frontend): validar visualmente no navegador via Playwright (abrir página, screenshot/inspeção) e confirmar contra `DESIGN.md` + `apps/web/src/index.css`.
- Sem pular Playwright por "mudança pequena" — prova real com output da ferramenta, não narração.

## Como trabalhar

- Direto por padrão; delegação/subagentes só por benefício concreto ou pedido explícito (sem skill orquestradora; agentes disponíveis em `.codex/agents/`).
- Verificação proporcional (`verify-and-stop`): menor prova suficiente, focada antes de gates largos. TDD só para comportamento novo, lógica complexa ou regressão.
- Não repetir valores mutáveis em docs — referenciar a constante/teste SSOT.
- Não rodar `/graphify` nem indexação salvo pedido explícito ou `graphify-out/graph.json` existente.
