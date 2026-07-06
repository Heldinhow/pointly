# ISSUES_MAP — Pointly home improvement loop (T1–T8)

Mapeamento `T{N} → issue #{M}` para o loop de melhorias de UX da home.
Branch de trabalho: `ux/home-loop-t1-t8`. Repo: `Heldinhow/pointly`.

| Item  | Título curto                                       | Issue | Labels                       | Status            |
| ----- | -------------------------------------------------- | ----- | ---------------------------- | ----------------- |
| T1    | Hero mostra o produto, não só ilustração decorativa | #23   | `home`, `ux`                 | closed (PR #31)   |
| T2    | Métrica "0 Cadastros" ambígua                      | #24   | `home`, `ux`                 | closed (PR #32)   |
| T3    | Open-source escondido no footer                    | #25   | `home`, `ux`                 | closed (PR #33)   |
| T4    | Footer "Produto" incompleto                        | #26   | `home`, `ux`                 | closed (PR #34)   |
| T5    | Navegação persistente ausente                      | #27   | `home`, `ux`                 | open              |
| T6    | Contraste de texto secundário (WCAG AA)            | #28   | `home`, `ux`, `a11y`         | open              |
| T7    | Estado vazio da sala (esperando jogador)           | #29   | `home`, `ux`                 | open              |
| T8    | Responsividade mobile (375px)                      | #30   | `home`, `ux`                 | open              |

## Convenções do loop

- Cada item usa o loop `ENSURE ISSUE → PLAN → IMPLEMENT → VERIFY → SELF-CRITIQUE → DECIDE`, com no máximo N=4 iterações.
- `DONE`: fechar via `Closes #{M}` no commit/PR; changelog em `CHANGELOG_HOME.md`.
- `BLOCKED`: aplicar label `blocked`, manter issue aberta, registrar motivo no changelog, seguir para o próximo item.
- Nenhuma issue é fechada sem VERIFY + SELF-CRITIQUE verde.
