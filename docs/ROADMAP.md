# Roadmap de produto — Pointly

> Brief de priorização de melhorias (setembro/2026), alinhado a `PRODUCT.md`, à análise de produto/UX pós-polish (#194–#196) e às issues abertas.  
> Não substitui o espelho SEO em [`/roadmap.md`](../roadmap.md) (mapa 15, **concluído**). Linguagem de domínio: [`CONTEXT.md`](../CONTEXT.md).

---

## Contexto

Pointly é planning poker web para times ágeis de 3 a 12 pessoas: salas efêmeras com código de 4 caracteres, votação síncrona no deck Fibonacci (`0, ½, 1, 2, 3, 5, 8, 13, ☕`), reveal e nova rodada democratizados, sem cadastro, sem e-mail e sem plano pago.

O ritual na Arena já está maduro (mesa, assentos, mediana, unânime/divergente, dado, projéteis, cutucadas, avatar local, espectadores, i18n pt/EN, SEO on-site em pointly.space). O polish recente (#194 critique, #195 header 48px, #196 DESIGN.md + hooks Impeccable) elevou a qualidade das superfícies.

**O maior gap de produto hoje não é “mais diversão na mesa”.** É ancorar a conversa na história que o time está estimando — hoje a rodada é só `Rodada N · fase` — e fechar o loop até o backlog (copiar resultado), sem trair os pilares de sala efêmera e zero conta.

Monorepo Bun: `apps/web` (React+Vite+coss), `apps/server` (Hono+WS), `packages/shared` (Zod). Estado da sala em memória: quando o último sai, a sessão some.

---

## Princípios de priorização

1. **Preservar os pilares.** Sem cadastro, sala efêmera, sem plano pago. Conta, storage cross-sala ou monetização ficam em Depois (ou fora).
2. **Uma ação principal por tela.** Fechar o loop do ritual (criar → votar → revelar → registrar → próxima) antes de micro-efeitos.
3. **Evidência no código / issues.** Preferir o que já tem spec (`#160`–`#166`), contrato parcial ou dívida que bloqueia valor (`#147`, `#117`).
4. **Ritmo da cerimônia.** Reduzir troca de contexto e fricção de copiar resultado vale mais que polish cosmético.
5. **Acessibilidade e resiliência como produto.** WCAG AA, `prefers-reduced-motion`, reconnect estável.
6. **Esforço relativo.** P = fatia curta · M = alguns tickets · G = contrato + WS + UI + testes multi-client.

---

## Agora

### 1. Pauta de Histórias na Sala — `#160`–`#166`
- **Problema:** O time estima rodada a rodada sem ver o que está sendo pontuado. Entre rodadas alguém cola título no chat/Jira e o ritmo cai.
- **Para quem:** Players e Host (3–12); espectadores só leem.
- **Proposta:** Pauta efêmera em memória (lista ≤50): título (1–120), critério opcional (≤1000), história ativa por rodada, pontuação = mediana pós-reveal, nova rodada auto-avança para a próxima não pontuada. Card na sidebar da Arena. Glossário: História / Pauta / Pontuação.
- **Por que agora:** Único mapa de produto aberto e pronto; maior diferencial vs. concorrentes que exigem conta; fecha o gap mais visível da Arena.
- **Sucesso:** Criar história aparece em outro client em <2s; reveal carimba pontuação; trocar ativa em `voting`/`revealable` falha com `invalid_phase` sem invalidar votos; F5 reidrata pauta; sala vazia apaga tudo; deck desabilitado sem história ativa + empty state claro.
- **Esforço / impacto:** G / alto
- **Ordem sugerida:** `#161` contrato → domínio → handlers WS → wire client → card UI → wiring nova rodada (`#162`–`#166`).

### 2. Unificar o contrato web com `@planning-poker/shared` — `#147`
- **Problema:** O web espelha wire format em `apps/web/src/lib/protocol.ts` (`TODO(#147)`). Cada feature nova (Pauta, cutucada, avatar) duplica schema e risco de drift.
- **Proposta:** Apagar o espelho; web importa `workspace:*` do shared; reexportar cômputo já SSOT (`consensus`, `justify`, `projectile`).
- **Por que agora:** Habilitador da Pauta (5 eventos novos). Dívida técnica que libera velocidade.
- **Sucesso:** Zero duplicata de `DECK_VALUES`/tipos de evento no web; typecheck e testes verdes.
- **Esforço / impacto:** M / alto (habilitador)  
- **Nota:** Fazer **antes ou no início** do mapa da Pauta.

### 3. Copiar resultado como texto — `#175`
- **Problema:** Pós-reveal, o número precisa ir ao backlog; hoje só existe copy do link de convite.
- **Proposta:** Botão no bloco de Resultados (só pós-reveal) no espírito de `Mediana: 5 — votos: 3, 5, 5, 8`, reusando `clipboard.ts` + feedback `aria-live`.
- **Por que agora:** Esforço P; multiplica o valor da Pauta e do posicionamento “grátis / online”.
- **Sucesso:** Um clique copia; pré-reveal oculto/desabilitado; “Copiado!” para leitores de tela; desktop + mobile Safari.
- **Esforço / impacto:** P / alto  
- **Nota:** Pode correr em paralelo à Pauta como quick win.

### 4. Reconnect estável com aba em segundo plano — `#117`
- **Problema:** Heartbeat/reconnect em background tab pode gerar storm/flicker; no planning real o time troca de aba o tempo todo.
- **Proposta:** Tratar `visibilitychange` / Page Lifecycle: pausar pressão agressiva em background, sync limpo ao focar, sem perder assento/voto (UUID + grace no server).
- **Por que agora:** Confiabilidade é pré-requisito da Pauta e de sessões longas.
- **Sucesso:** Alternar aba 1–2 min sem storm; ao focar, `room_state` consistente; sem regressão nos testes de reconnect.
- **Esforço / impacto:** M / alto  
- **Nota:** Revisar se o PR aberto `#114` (heartbeat 5s→15s) ainda se aplica à árvore atual ou está obsoleto.

---

## Próximo

### 5. Feedback de disponibilidade no Join (leftover #194)
- **Problema:** `checkSala` roda no submit; `playerCount`/`phase` da API são descartados; sala cheia só aparece via erro WS depois do nick/avatar.
- **Proposta:** Ao completar o código (ou debounce), mostrar existe/ausente + contagem/fase; antecipar `sala_cheia` se a API expuser capacidade.
- **Esforço / impacto:** P–M / médio–alto (confiança na entrada)

### 6. Banner de consentimento GA / LGPD (leftover #194)
- **Problema:** GA4 está no código, mas `analytics.ts` exige consent gate antes de ligar `VITE_GA_MEASUREMENT_ID` em produção.
- **Proposta:** Banner mínimo aceitar/recusar (pt/EN); default recusar; só então `initAnalytics`.
- **Esforço / impacto:** P / alto (desbloqueia métricas sem risco jurídico)

### 7. Trocar papel espectador ↔ jogador sem sair
- **Problema:** Copy manda sair e entrar de novo para votar.
- **Proposta:** Ação na sidebar com evento de protocolo; respeitar teto de 12 assentos e quórum de revealable.
- **Esforço / impacto:** M / médio

### 8. Deck navegável por teclado — `#120`
- **Problema:** Cartas não seguem radiogroup horizontal (setas).
- **Proposta:** Roving tabindex; Space/Enter seleciona; atalhos R/N intactos.
- **Esforço / impacto:** P / médio

### 9. Toast de voto com o valor — `#118`
- **Problema:** “Voto registrado” sem dizer qual carta.
- **Proposta:** Incluir o valor no anúncio `aria-live` / toast.
- **Esforço / impacto:** P / baixo–médio

### 10. Diferenciar H1s home vs landings (leftover #194)
- **Problema:** Home e `/planning-poker` competem com H1s quase iguais (“Planning poker online grátis…”).
- **Proposta:** Home = benefício/marca; landings = intenção transacional da keyword; alinhar titles em `seo/routes.ts`. Preferir `$impeccable typeset` / `clarify` no register brand.
- **Esforço / impacto:** P / médio (SEO)

### 11. Clima da sessão — `#174`
- Contadores em memória: unanimidades, maior divergência, rodadas. UI compacta na sidebar.
- **Esforço / impacto:** M / médio

### 12. Sons táteis opt-in — `#171`
- Web Audio sintetizado; default off; persiste em `localStorage`; respeita `prefers-reduced-motion`.
- **Esforço / impacto:** M / médio

### 13. Segunda fatia SEO (cauda)
- 2–4 artigos/landings (`fibonacci`, remoto, comparativos) no pipeline `seo/routes.ts` + prerender; olhar GSC antes de escrever mais.
- **Esforço / impacto:** M / médio

### 14. Presets de avatar (sem upload)
- 8–12 presets locais (SVG/JPEG); mesma persistência do upload; teto 40KB (ADR-0013).
- **Esforço / impacto:** P / baixo–médio

---

## Depois

### 15. Export leve da Pauta (ata de texto)
- “Copiar pauta” → markdown/texto da sessão. Depende da Pauta estável.

### 16. Loop de métricas e cadência editorial
- Ritual mensal humano: GSC/Bing → 1 peça de cauda ou FAQ. Sem backlinks pagos.

### 17. Integrações Jira / Linear (import only)
- Popular a Pauta sem write-back. Arriscado para o pilar “sem cadastro” — só com demanda clara.

### 18. Escalas alternativas de deck
- Fibonacci | powers-of-2 | T-shirt na criação da sala; imutável após o 1º voto.

### 19. Timer opcional de rodada
- Opt-in por sala, default off, **sem** auto-reveal. Hoje o produto escolheu reveal manual; limpar tokens órfãos de timer no `DESIGN.md` pode ser chore separado.

### 20. Arena Impeccable (quieter / distill / harden / live)
- Densidade da sidebar, ruído visual, harden mobile <1050px — depois que a Pauta ocupar a sidebar, não antes.

---

## Explicitamente fora (por enquanto)

- Contas, login, histórico cross-sala, velocity entre sessões, ranking global.
- Plano pago / loja de avatares.
- Chat livre (cutucadas cobrem o social leve).
- Cena Three.js / cassino 3D (issues `#128`–`#135` legadas; identidade atual é feltro 2D + coss).
- Migração Next.js/SSR; SEO de rotas internas (`/join`, `/s/:code` noindex por design).
- Backlinks e divulgação paga contínua.

---

## Higiene do board (fazer junto com Agora)

| Ruído | Ação |
| --- | --- |
| Issues Three.js / Spell / greenfield (`#128`–`#138`, `#146`, várias 01–12 já entregues na reescrita) | Fechar, arquivar ou marcar **legado** para o “Agora” ficar legível só com Pauta + utilidades |
| ~10 PRs abertos de jul/2025 (`#101`–`#114`, `#122`…) contra árvore pré-coss | Rebase se ainda valer; senão **close** com motivo |
| Skills UX locais não versionadas (`.agents/skills/accessibility` etc.) | PR de harness separado, se o time quiser o catálogo alinhado |
| Dualidade `roadmap.md` (SEO) vs este doc | SEO continua no root; **este arquivo é o brief de produto** |

---

## Riscos / dependências

| Risco | Mitigação |
| --- | --- |
| Pauta aumenta complexidade do `room_state` e da sidebar mobile | Limite 50; card colapsável; sem drag-and-drop; validar 375–1440px |
| Drift shared ↔ `protocol.ts` durante a Pauta | Item 2 **antes ou no início** do mapa `#161`+ |
| Integrações Jira corroem “sem cadastro” | Manter em Depois; preferir export texto |
| Sons no call de voz | Default off; síntese curta; sem autoplay |
| Board legado confunde prioridade | Higiene explícita acima |
| ADR-0014 / termos História–Pauta–Pontuação ainda fora do CONTEXT | Atualizar CONTEXT + ADR ao fechar o contrato (`#161`) |
| Ligar GA sem banner | Manter Measurement ID vazio até o item 6 |

---

## Próximos passos sugeridos

1. **Abrir o mapa wayfinder da Pauta** a partir de `#160`, na ordem `#161` → domínio → handlers → wire client → card UI → wiring com nova rodada (`#162`–`#166`), com `#147` no início do contrato.
2. **Encaixar Copiar resultado** (`#175`) como fatia P paralela.
3. **Reproduzir `#117`** (aba em background) e fechar reconnect storm.
4. **Consent GA** se for medir SEO de verdade; senão manter ID vazio.
5. **Limpar o board** (legado Three.js + PRs de julho) para o Agora ficar legível.

---

## Evidência principal

- `PRODUCT.md`, `CONTEXT.md`, `DESIGN.md`, `AGENTS.md`
- `roadmap.md` (SEO mapa 15) e issues `#160`–`#166`, `#147`, `#117`, `#120`, `#118`, `#171`, `#174`, `#175`
- Leftovers explícitos do PR #194 (join availability UX, H1s, consent GA)
- `apps/web/src/pages/arena.tsx`, `arena-content.pt.ts`, `join.tsx`, `lib/protocol.ts`, `lib/clipboard.ts`, `lib/analytics.ts`, `seo/routes.ts`
- `packages/shared`, `apps/server/src/sala.ts` (reveal manual, sem timer)

*Documento de produto — versionar no GitHub junto do código quando houver PR dedicado.*
