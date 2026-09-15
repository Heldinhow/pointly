# AGENTS.md

## UI — preferir coss (`https://coss.com/ui`) sempre que possível

- Toda UI nova ou refatorada em `apps/web` deve reutilizar componentes coss antes de criar markup custom.
- Reutilizar primeiro o que já existe em `apps/web/src/components/ui/*` (Button, Card, Input, Alert, Field, Progress, Separator, Spinner, OTP Field, etc.).
- Se o primitivo não existir localmente, instalar via CLI (projeto usa Bun):
  `bunx --bun shadcn@latest add @coss/<componente>`
- Fonte de verdade, nesta ordem: skill `agent/skills/coss/SKILL.md` → `agent/skills/coss/references/component-registry.md` + guias em `references/primitives/<nome>.md` → docs em `https://coss.com/ui` e `https://coss.com/ui/llms.txt` → partículas em `https://coss.com/ui/particles`.
- Não reinventar comportamento que já existe como primitivo coss/Base UI (Dialog, Menu, Select, Popover, Tooltip, Toast via `toastManager`, Form/Field, Tabs, etc.). Composição e APIs seguem exatamente a doc — não misturar padrões entre primitivos nem inventar props.
- Exceção: componentes de domínio assinados do Pointly (`deck`, `poker-table`, feltro/mesa) continuam custom — mas botões, inputs, alerts, loaders, empty states e feedback ao redor deles usam coss.
- Estilizar coss com os tokens do Pointly (`DESIGN.md` + `apps/web/src/index.css`, Tailwind v4, dark-first via `html.dark`), nunca o default shadcn/coss sem customizar (cores/radii/sombras do sistema).
