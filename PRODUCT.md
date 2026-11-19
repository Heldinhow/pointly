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

Landing cinematográfica vazia e sobreposição de conteúdo continuam fora. AIDA/GSAP e troca de biblioteca de ícones saem da lista: o Taste v2 permite ambos, desde que declarados em `DESIGN.md` com lib, uso e fallback de `prefers-reduced-motion`. Onde o v2 contradiz uma anti-referência antiga, o `DESIGN.md` diz qual regra substitui qual.

## Design Principles

- Ritual rápido: legibilidade funcional em toda superfície, inclusive arena.
- Uma ação principal por tela.
- Números de votação sempre mono tabulares.

## Accessibility & Inclusion

WCAG AA para texto; foco sempre visível (`var(--ring)`); `prefers-reduced-motion` respeitado; estados async com `aria-live`. Detalhes em `DESIGN.md`.

## Source Map

- Linguagem do domínio: `CONTEXT.md` (Sala, Host, Player, Rodada, Voto, Reveal…).
- Sistema visual: `DESIGN.md` + `apps/web/src/index.css` (SSOT de código).
- Este arquivo não duplica tokens, valores numéricos nem regras executáveis — referencia.
