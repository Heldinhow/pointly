---
target: /join PT+EN lote3
total_score: 28
p0_count: 0
p1_count: 3
timestamp: 2026-09-20T02-02-57Z
slug: apps-web-src-pages-join-tsx
---
# Polish lote 3 — join.tsx (espectador só no join)
- **P2-2 corrigido e verificado no browser**: checkbox espectador renderiza só em `mode === "join"` (join.tsx). Create sem "assento fantasma"; teste atualizado (`modo create não oferece...` assert null). Snapshots: create sem spectate, join com spectate + OTP 50px.
- **Correção de rota**: P2-3 OTP virou falso positivo — Base UI ignora `aria-label` no 1º slot por desenho (`OTPFieldInput.mjs:68,78`); o slot herda o label do grupo (`FieldLabel`→`Código da sala`). Revertido meu fix (evita warning em dev). Comportamento SR: slot 1 = label do grupo, slots 2-4 = "Caractere N de 4" — consistente.
- Evidência: join.test 13 pass; typecheck 0.
- Score mantido **28/40 Good** (troca de justificativa, sem P0).
