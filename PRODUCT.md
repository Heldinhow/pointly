# Product

## Register

product

## Platform

web

## Users

Times ágeis (3–12 pessoas) em ritual de planning poker. Uso síncrono, sessão curta, sem conta.

## Product Purpose

Sala efêmera de votação (código de 4 caracteres): criar, votar no deck Fibonacci, revelar, nova rodada. Sem cadastro, sem email, sem plano pago. Sucesso = estimar juntos sem fricção.

## Positioning

Planning poker sem cadastro: direto à conversa.

## Brand Personality

Calmo, tátil, direto. Tom pt-BR objetivo.

## Anti-references

Landing cinematográfica, AIDA/GSAP, troca de biblioteca de ícones, sobreposição de conteúdo — ver `DESIGN.md` Do's and Don'ts.

## Design Principles

- Ritual rápido: legibilidade da arena acima de expressão.
- Uma ação principal por tela.
- Números de votação sempre mono tabulares.

## Accessibility & Inclusion

WCAG AA para texto; foco sempre visível (`var(--ring)`); `prefers-reduced-motion` respeitado; estados async com `aria-live`. Detalhes em `DESIGN.md`.

## Source Map

- Linguagem do domínio: `CONTEXT.md` (Sala, Host, Player, Rodada, Voto, Reveal…).
- Sistema visual: `DESIGN.md` + `apps/web/src/index.css` (SSOT de código).
- Este arquivo não duplica tokens, valores numéricos nem regras executáveis — referencia.
