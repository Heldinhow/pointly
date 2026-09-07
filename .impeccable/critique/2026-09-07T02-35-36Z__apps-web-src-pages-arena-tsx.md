---
target: apps/web full surface final
total_score: 34
p0_count: 0
p1_count: 0
timestamp: 2026-09-07T02-35-36Z
slug: apps-web-src-pages-arena-tsx
---
Method: dual-agent (A: design-review · B: detector-evidence) + live variant iteration

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Deck desabilita pós-reveal; timer role ok |
| 2 | Match System / Real World | 4 | Copy de mesa, Fibonacci + pausa |
| 3 | User Control and Freedom | 3 | confirm nativo no blocker persiste (P2) |
| 4 | Consistency and Standards | 4 | Tokens/radius/foco unificados |
| 5 | Error Prevention | 3 | Pre-check 404, paste silencioso (P2) |
| 6 | Recognition Rather Than Recall | 3 | Help agora tem botão ? visível |
| 7 | Flexibility and Efficiency | 3 | R/N/? + menu com setas |
| 8 | Aesthetic and Minimalist Design | 4 | Sem slop; hint fora da pill (live V1) |
| 9 | Error Recovery | 4 | Erros inline + foco; danger unificado |
| 10 | Help and Documentation | 3 | Botão ? na arena; sem tour |
| **Total** | | **34/40** | **Good** |

## Anti-Patterns Verdict

**LLM assessment**: sem AI slop. Mesa elíptica + felt + azul tinta preservados; live V1 mantém pill limpa.
**Deterministic scan**: detect.mjs 6 findings (4 overused-font Space Grotesk = falso positivo, identidade cometida; 2 advisories = exceções documentadas: mini-carta 5px, felt mobile 22px). Zero side-stripes, gradient-text, glass, mint, rounded-lg.

## Priority Issues (resolvidos nesta iteração)

- **[P0] Full "Criar sala nova" ia para /** → agora /join?host=1
- **[P0] Deck habilitado pós-reveal** → disabled={faceUp} nos 2 branches
- **[P1] Erro ?code= sem foco** → inviteErrorRef com tabIndex -1
- **[P1] EmptyOverlay sem restore-focus** → padrão HelpModal
- **[P1] Menu sem setas/foco** → foco no 1º item, Arrow/Home/End/Tab
- **[P1] Trigger some do tab-order sem anúncio** → role=status com contagem
- **[P1] Demo lida como dado** → role=img + aria-hidden
- **[P2] Hint 10px na pill** → live V1: hint 12px fora da pill + aria-describedby
- **[P2] UNÂNIME ausente no mobile** → badge espelhado do desktop
- **[P2] Help sem entry-point** → botão ? 44px no header da arena
