# Redesign Pointly — "Prensa" — Plano de execução

- **Branch**: `feat/redesign-from-zero` (main intocada; merge final só com OK explícito).
- **Direção**: ver `DESIGN.md` (reescrito — visual antigo descartado, nada dele é referência).
- **Preservado**: lógica e tempo real das salas, rotas/URLs, i18n PT/EN, SEO (meta/canonical/OG/hreflang/JSON-LD), "sem cadastro".
- **Mudanças de contrato aprovadas**: deck v2 (ADR-0014), votos mascarados pré-reveal (ADR-0015).
- **Suposições S1–S9** do Round 1 seguem valendo.
- **Execução**: via OpenChamber/OpenCode (Hermes orquestra e valida, nunca edita código). Cada issue → commits atômicos → PR pequeno para a branch de integração (commit direto só para trivialidades) → `bun run verify` + checklist de navegador (screenshots fora do git) → validação independente.
- **Checkpoints visuais com o Helder**: fim da F2 e fim da F3 (screenshots + resumo).
- **Gates finais**: Lighthouse ≥ 95 (Performance, Acessibilidade, SEO) no build de produção; LCP < 2,0s no mobile; sem CLS; criar sala + votar < 15s; "impossível confundir com o visual anterior".

## F0 — Fundações

| # | Issue | Notas |
|---|---|---|
| F0.1 | Fontes self-hosted | Archivo + Instrument Sans; subset pt/en; preload; métricas anti-CLS (size-adjust) |
| F0.2 | Tokens & temas | CSS vars claro/escuro; `prefers-color-scheme` + toggle; base styles |
| F0.3 | Ícones + marca | set de ícones de tinta; wordmark/marca nova |
| F0.4 | Primitivos | button, input/field, surface/card, dialog/sheet, stamp, separator, spinner (coss restilizado) |
| F0.5 | Shell | header/footer/nav; skip link; toggles de idioma/tema |
| F0.6 | Motion kit | tokens + helpers (assentar/tiragem/carimbo/réguas); reduced-motion |

## F1 — Contratos (shared/server)

| # | Issue | Notas |
|---|---|---|
| F1.1 | shared: deck v2 | 11 cartas padrão; `?`/pausa; deck da sala; validação (2–12 cartas, ≥2 numéricas); testes — [ADR-0014] |
| F1.2 | server: deck da sala | troca pelo host até o 1º voto; validação de voto por sala; testes — [ADR-0014] |
| F1.3 | server: votos mascarados | `room_state` pré-reveal só com contagem; testes — [ADR-0015] |

## F2 — Páginas públicas

| # | Issue | Notas |
|---|---|---|
| F2.1 | Home | CTA primário "Criar sala"; secundário discreto "Entrar com código"; seções; confiança |
| F2.2 | Demo "prova de prensa" | votos simulados explícitos; teclado; reduced-motion |
| F2.3 | Landings SEO | `/planning-poker`, `/scrum-poker` + EN; estrutura SEO intacta |
| F2.4 | Guias | hub + 3 guias + EN |
| F2.5 | Join | código + apelido + avatar |
| F2.6 | 404 | |
| F2.7 | Assets SEO | OG image nova ("folha de prova"); favicons; manifest (cores); revisão meta/JSON-LD |

## F3 — Sala (o coração)

| # | Issue | Notas |
|---|---|---|
| F3.1 | Mesa & assentos | mobile-first; estados (espera/votou/desconectado/espectador); host |
| F3.2 | Deck UI | 11 cartas; grade "uma mão"; teclado (roving tabindex); pausa com ícone |
| F3.3 | Votação & reveal | tiragem; indicador "todos votaram"; cliente do masked-votes |
| F3.4 | Stats & divergência | média/mediana/consenso; réguas menor↔maior; carimbo de unânime; dado da mesa |
| F3.5 | Pauta/comanda | lista, história ativa, pontos carimbados |
| F3.6 | Deck customizado | painel do host: presets + editor (até o 1º voto) |
| F3.7 | Copiar resultados | restyle da feature existente |

## F4 — Camada lúdica

| # | Issue | Notas |
|---|---|---|
| F4.1 | Avatares | picker + exibição |
| F4.2 | Projéteis & cutucadas | restyle; física/comportamento mantidos |
| F4.3 | Celebração de unânime | carimbo |

## F5 — Acabamento & gates

| # | Issue | Notas |
|---|---|---|
| F5.1 | A11y sweep | contraste, teclado, aria-live, reduced-motion, axe |
| F5.2 | Perf sweep | LCP < 2s mobile; CLS ≈ 0; peso de CSS/fontes; Lighthouse ≥ 95 Perf |
| F5.3 | Confiança | aviso de privacidade curto (o que é guardado e por quanto tempo) |
| F5.4 | QA final & aceite | "impossível confundir"; 15s; Lighthouse ≥ 95 (P/A/SEO); resumo de decisões e descartes |
| F5.5 | Merge + deploy | quando você mandar: merge na main, deploy Dokploy, Lighthouse em produção |

## Riscos & mitigação

- **Fontes vs LCP**: subset + preload + métricas de fallback.
- **Deck custom vs simplicidade**: presets cobrem o caso comum; editor é opcional.
- **Mistura visual durante a branch**: esperada (branch de integração); a main só recebe o conjunto final.
- **Sem CI no repo**: gate local `bun run verify` + navegador; sem Playwright (não existe na tree).

## Fluxo por issue

1. Abro a issue (GitHub) + sessão OpenChamber com o escopo fechado.
2. OpenChamber implementa (commits atômicos; visual antigo nunca é referência — só substituição).
3. `bun run verify` + checklist de navegador/screenshots (web visual).
4. Validação independente (eu) e sigo para a próxima.
