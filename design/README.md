# design/ — Visual Reference (não runtime)

Esta pasta contém os **wireframes HTML originais** do Planning Poker v1. Eles são
**referência visual e de especificação de feature**, não runtime.

## Regra

- **Não** são servidos pelo Vite, **não** são parte do bundle.
- **Não** são abertos pelo app em produção. As rotas reais vivem em
  `apps/web/src/pages/` (Landing, Join, Arena, Full).
- Servem apenas para:
  1. Comparar fidelidade visual (Phase 6/9 — T27-T37, T48)
  2. Conferir anatomia de cada tela durante implementação
  3. Auditar features prometidas vs. entregues

## Arquivos

| Arquivo        | Rota runtime correspondente | Tarefa que implementa |
|----------------|-----------------------------|-----------------------|
| `arena.html`   | `/arena`                    | T30-T37               |
| `join.html`    | `/join`                     | T28                   |
| `landing.html` | `/`                         | T27                   |
| `full.html`    | `/full`                     | T29                   |
| `index.html`   | (launcher overview only)    | n/a — foi substituído pelo router (T24) |

## Tokens visuais

Cores, fontes e spacing vivem em `plan.md` (Atelier Zero) e em
`apps/web/tailwind.config.ts` (quando T25 rodar). Os HTMLs embutem os tokens via
CSS variables (`--bg`, `--fg`, `--accent`, etc.) — cross-check com o
`tailwind.config` durante visual fidelity (T48).

## Histórico

- 2026-07-04: HTMLs originalmente na raiz; movidos para `design/` em Phase 1
  (T0) ao iniciar implementação React/Vite. A URL antiga `landing.html` quebra
  de propósito — força uso do router `/`.
