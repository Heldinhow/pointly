---
target: /join PT+EN lote6
total_score: 30
p0_count: 0
p1_count: 1
timestamp: 2026-09-20T02-33-52Z
slug: apps-web-src-pages-join-tsx
---
# Polish lote 6 — join busy-note + segmented + P1-2
- **P1 busy corrigido**: `role=status` saiu de `sr-only` para `.join-busy-note` visível (14px muted, centralizado, some vazio); footer em coluna. Vidente agora vê "Criando sala…" no pico de ansiedade.
- **P1 segmented parcial**: ativo ganhou `font-weight: 600` (delta além de borda/sombra). Semântica `group+aria-pressed` mantida (sem primitivo Tabs no projeto; trocar seria instalar dependência — registrado como residual).
- **Correção de rota**: P1-2 submit era falso positivo parcial — `Button` define `isDisabled = loading || disabledProp` (button.tsx), logo o submit se desabilita no busy mesmo fora do `fieldset`. Resta só ordem DOM/AT como minor.
- Evidência: typecheck 0; join+App 26 pass. Fluxo real ponta a ponta funcionou (sala RB7S criada no browser).
- Rescore heurística 1 (Visibility): 2 → 3 → total **30/40 Good**.
