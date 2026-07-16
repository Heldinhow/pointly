# Loop Prompt — Pointly UX Polish v1

## Contexto e restrições do projeto

- **Project name:** Pointly
- **Stack:** Bun monorepo (apps/web = React 18 + Vite + Tailwind, apps/server = Hono + Bun.serve + WS, packages/shared = Zod), Playwright E2E.
- **Repo:** https://github.com/Heldinhow/pointly
- **Prod URL:** https://pointly.space (Dokploy + Traefik)
- **Viewport alvo:** 1440px desktop only (não há breakpoints mobile/tablet no v1 — manter isso).
- **Design tokens existentes:** `design/tokens.css` (paleta cream/coral, tipografia serif + mono). Mudanças devem preservar tokens — usar Tailwind classes mapeadas para os tokens.
- **Domínio (de `CONTEXT.md`):** sala, host, player, apelido, código, assento, rodada, voto, reveal, mediana, deck, timer.
- **Restrições a preservar:**
  - Identidade visual: paleta cream/coral, tipografia serif com itálico de destaque, mono para labels.
  - Zero cadastro, zero email, zero plano pago (mensagem central do produto).
  - In-memory state — sem backend persistente, sem migrations.
  - Sem responsividade mobile/tablet nesta iteração (escopo v1 desktop-only).
- **Onde mexer:** somente `apps/web/src/**` (componentes, estilos, a11y attrs). NÃO tocar `apps/server/**`, `packages/shared/**`, `tests/e2e/**` (estes rodam como gate, não como alvo).
- **Labels GitHub obrigatórias:** `ux-review` + `category:ui` (ou `category:a11y`) + `severity:baixa`/`media`/`alta`. Área: `home`, `arena`, `lobby`. Tudo via `gh issue create`.

## Rastreamento via GitHub Issues

**Pré-requisito:** `gh` CLI autenticado em `Heldinhow/pointly` com permissão `Issues: Write`. Verificar: `gh auth status` e `gh issue list --repo Heldinhow/pointly --limit 1`.

**Regra de ouro:** nenhum código é tocado sem Issue aberta. Implementação → Issue referenciada.

**State machine (atualizado em cada Issue body):**

```
open → in-progress → playwright-validated → done
                                              ↓
                                          blocked (após 5 iters falhadas)
```

**Para cada finding:**

1. `gh issue create --title "[T<n>] <título curto>" --body "<template abaixo>" --label ux-review --label category:ui --label severity:<n>`
2. Body do Issue (template mínimo):
   ```
   **T<n> — <título>**
   - Tela(s) afetada(s): <path da rota>
   - Problema: <observação objetiva da imagem, sem opinião>
   - Critério de aceite: <linha objetiva testável>
   - Files alvo: <lista de paths em apps/web/src/>
   - Status: open
   - Evidência (preencher ao validar):
     - before: ./screenshots/T<n>-before.png
     - after:  ./screenshots/T<n>-after.png
   ```

3. Atualizar `Status` para `in-progress` ao começar, `playwright-validated` após Playwright passar, `done` ao fechar.

**Convenção de labels (já obrigatória no repo):** `ux-review` (tipo) + `category:ui|a11y|fluxo` + `severity:baixa|media|alta`. Adicionar label de área se aplicável: `home`, `arena`, `lobby`.

**Limites:** 5 iterações por T-item. Após a 5ª falha, label `blocked` + comentário com log + seguir para o próximo. Item bloqueado nunca bloqueia o loop.

## Backlog de itens com critério de aceite

### T1 — CTA "Criar sala" precisa hierarquia visual clara no estado primário

- **Description:** O botão "Criar sala" (pílula coral com seta) tem peso visual correto, mas compete visualmente com o botão ghost "Entrar" e o campo "CÓDIGO" pelo mesmo row. Falta um estado `hover`/`focus-visible` perceptível e um `disabled` quando a sala está sendo criada.
- **Suggested action:** Adicionar estados `hover` (escurece 1 step), `focus-visible` (ring coral 2px + offset 2px), `disabled` (opacidade 0.6 + cursor not-allowed). Garantir ordem de tab: `Criar sala` → `Código input` → `Entrar`.
- **Critério de aceite:** Botão "Criar sala" tem `focus-visible` ring visível quando navegado por teclado (Tab), passa axe-core (`rules.color-contrast`, `rules.focus-order-semantics`), e estado `disabled` aparece quando o clique dispara criação (latência < 100ms com mock de rede).
- **Avaliação subjetiva (revisão humana):** tom coral + sombra suave do botão.

### T2 — Botão ghost "Entrar" sem affordance visual clara

- **Description:** O botão "Entrar" (pílula outline coral, sem preenchimento) tem peso visual quase idêntico ao input "CÓDIGO" no mesmo row. Usuário pode hesitar sobre qual é clicável.
- **Suggested action:** Aumentar contraste do outline (de coral ~30% opacity para coral sólido 1px) ou trocar para texto+link "Entrar →" sem box. Adicionar `aria-label` descritivo ("Entrar na sala com código").
- **Critério de aceite:** Botão "Entrar" tem `outline` ≥ 1.5px coral sólido e `aria-label` presente, verificável via DOM query `button[aria-label*="Entrar na sala"]`. Tab order e focus-visible funcionam.
- **Avaliação subjetiva (revisão humana):** affordance do botão secundário.

### T3 — Página "Seu nome na sala" — input sem label associado e placeholder ambíguo

- **Description:** O campo "Apelido" mostra placeholder "ex. Helder" mas o label "APELIDO" está visualmente desconectado (não usa `<label for>`) e não há `<label>` acessível para screen readers.
- **Suggested action:** Associar `<label htmlFor="apelido">APELIDO</label>` ao input, mover o label para dentro do `<label>` ou usar `aria-labelledby`. Adicionar `aria-describedby` apontando para o texto de ajuda ("Apelido visível para os outros jogadores…").
- **Critério de aceite:** Input `Apelido` tem `<label>` programaticamente associado (axe-core `label` rule passa). Navegação por screen reader anuncia "APELIDO, edit text, Apelido visível para os outros jogadores…". `name` attribute presente no axe scan.
- **Avaliação subjetiva (revisão humana):** tom do texto de ajuda.

### T4 — Header do lobby com hierarquia de marca inconsistente

- **Description:** O logo "Ø Pointly" + botão "SUMÁRIO" dropdown no topo competem com o texto vertical lateral ("POINTLY · AGILITY WITH RHYTHM" / "VOL. 01 / ISSUE Nº 26 · OPEN BETA") — três níveis de identidade sem hierarquia clara.
- **Suggested action:** Padronizar tipografia (mesma família mono para todas as meta-informações), usar `text-[10px]` para o texto vertical lateral e `text-xs` para header. Adicionar `aria-hidden="true"` no texto vertical decorativo.
- **Critério de aceite:** Texto vertical lateral tem `aria-hidden="true"` no DOM, e a tipografia dos meta-labels usa a mesma `font-family` mono token (`font-mono` Tailwind). axe-core não reporta `landmark-unique` ou `heading-order` issues para essa região.
- **Avaliação subjetiva (revisão humana):** densidade tipográfica.

### T5 — Cards de feature (01-04) sem ícone visual

- **Description:** Os 4 cards de capacidade ("Sala instantânea", "Deck Fibonacci", "Reveal coletivo", "Timer crítico") usam só número grande + label "FEATURE" + título + descrição. Falta ícone ou símbolo visual que reforce o conceito em < 1s.
- **Suggested action:** Adicionar ícone Lucide (zap instantâneo / layers / eye / clock) consistente em tamanho 20px coral, alinhado à direita do card. Manter descrição como está. Garantir `aria-hidden="true"` no SVG.
- **Critério de aceite:** Cada card `.feature-card` contém `<svg aria-hidden="true">` como último filho da área do título, com `class="text-coral-500 w-5 h-5"`. axe-core não reporta svg-alt issues. Screenshots before/after mostram ícone visível.
- **Avaliação subjetiva (revisão humana):** escolha dos ícones (semântica visual).

### T6 — Seção "Pronto pra começar?" — call-to-action sem urgência visual

- **Description:** O bloco cream do "Pronto pra começar?" com CTA "Criar sala" é estático. Sem sensação de movimento ou urgência que reforce o "em menos de 5 segundos" do copy.
- **Suggested action:** Adicionar micro-animação sutil (pulse no botão CTA a cada 3s) usando `animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite` com `prefers-reduced-motion: reduce` desabilitando. Adicionar indicador "12 times já usaram hoje" ou similar social-proof acima do CTA.
- **Critério de aceite:** Botão "Criar sala" tem animação `pulse` CSS quando `prefers-reduced-motion: no-preference`, e é estático quando `prefers-reduced-motion: reduce`. axe-core não reporta `prefers-reduced-motion` issues. Visual confirmável em DevTools.
- **Avaliação subjetiva (revisão humana):** intensidade da animação, tom do social proof.

### T7 — Mesa revelada sem destaque visual para a mediana

- **Description:** Na vista da mesa revelada, a mediana é marcada com borda coral mais grossa + label "MEDIANA" no canto, mas o número da mediana não tem tamanho/tipografia que o faça saltar. Usuário pode não entender qual card é o resultado.
- **Suggested action:** Aumentar fonte do número da mediana (de mesmo tamanho para ~1.5x), adicionar label "MEDIANA" em coral bold acima do número, e badge "MEDIANA 5" no header da região da mesa. Manter o card dos outros jogadores inalterado.
- **Critério de aceite:** Card da mediana tem `font-size` ≥ 1.5x relativo aos outros cards da mesa (DOM query `font-size` retorna valor em px). Texto "MEDIANA" visível no card. axe-core não reporta contrast issues no coral sobre cream.
- **Avaliação subjetiva (revisão humana):** proporção tipográfica.

### T8 — Footer "SALA: SERÁ GERADA AO ENTRAR" sem hierarquia de seção

- **Description:** A linha "SALA: SERÁ GERADA AO ENTRAR" abaixo do logo aparece sem distinção visual de section/region. Falta estrutura semântica.
- **Suggested action:** Envolver o footer em `<footer role="contentinfo">` com `<nav aria-label="Rodapé">` agrupando os 3 grupos (POINTLY / PRODUTO / CÓDIGO ABERTO). Links "Página inicial", "Como funciona", "Para times", "Roadmap", "Changelog", "Preços", "Contato" devem ter `href` real (mesmo que `href="#"`) e ser focáveis.
- **Critério de aceite:** `<footer>` existe no DOM com `<nav aria-label="Rodapé">`, todos os 7 itens de link são `<a>` focáveis e alcançáveis por Tab. axe-core `region` rule passa.
- **Avaliação subjetiva (revisão humana):** agrupamento visual dos 3 grupos.

### T9 — Arena vazia com placeholder "Aguardando primeiro jogador" sem skeleton

- **Description:** Quando a sala está vazia (só host), a elipse pontilhada mostra só o card do host + CTA "Revelar votos" desabilitado com subtexto "AGUARDANDO 1 JOGADOR…". Falta um skeleton/placeholder que indique "entrarão mais jogadores aqui".
- **Suggested action:** Adicionar 2-3 cards placeholder semi-transparentes (50% opacity, `pointer-events: none`, label "Aguardando…") distribuídos pela elipse, com `aria-label="Slot aguardando jogador"`. Esconder quando ≥ 2 jogadores.
- **Critério de aceite:** Quando sala tem 1 jogador, DOM tem ≥ 2 elementos com `aria-label="Slot aguardando jogador"`. Quando tem ≥ 2, esses elementos somem (`display: none` ou removidos). axe-core não reporta elementos redundantes.
- **Avaliação subjetiva (revisão humana):** opacidade dos placeholders.

### T10 — Estado "selecionou voto" sem confirmação visual

- **Description:** Quando o jogador clica numa carta (ex.: "3"), a carta fica com borda coral, mas não há confirmação adicional (toast, haptic, animação). Usuário pode não ter certeza de que o voto foi registrado antes do reveal.
- **Suggested action:** Adicionar animação `scale(1.05)` por 200ms no clique + toast discreto "Voto registrado" no canto inferior (5px text-xs, fade in/out 2s). Respeitar `prefers-reduced-motion`.
- **Critério de aceite:** Ao clicar carta, DOM tem elemento com `role="status"` (toast) contendo texto "Voto registrado", que aparece com `opacity` 0→1 em ≤ 200ms e some após 2s. axe-core `aria-live` rule passa.
- **Avaliação subjetiva (revisão humana):** intensidade da confirmação.

### T11 — Topbar de sala (SALA B891 · RODADA 01 · VOCÊ · HELDER) sem separação visual entre grupos

- **Description:** Os 4 fragmentos do topbar (SALA + código, RODADA + número, VOCÊ, HELDER) estão colados como uma string só, sem separadores. Falta hierarquia.
- **Suggested action:** Adicionar separador `·` ou `|` entre grupos (já existe em algumas telas mas não em todas), tipografia `text-xs text-stone-500 uppercase tracking-wider` consistente, e agrupar "SALA B891" e "RODADA 01" em `<dl>` semântico.
- **Critério de aceite:** Topbar usa `<dl>` com `<dt>`/`<dd>` para cada par label/valor, separador `·` presente entre grupos não-agrupados. axe-core não reporta issues de semântica na região.
- **Avaliação subjetiva (revisão humana):** densidade do topbar.

### T12 — Botão "Copiar link" sem feedback visual pós-clique

- **Description:** O botão "COPIAR LINK" outline coral na tela de compartilhar código (#B891) não dá feedback após o clique. Usuário não sabe se o link foi copiado.
- **Suggested action:** Trocar texto do botão para "Copiado ✓" por 2s após clique bem-sucedido (`navigator.clipboard.writeText`), com cor mudando para verde. Adicionar `aria-live="polite"` em região próxima.
- **Critério de aceite:** Após `click()` no botão, texto do botão muda para "Copiado ✓" e reverte após 2s. Região com `aria-live="polite"` anuncia mudança. axe-core não reporta mudanças abruptas em landmarks.
- **Avaliação subjetiva (revisão humana):** tom do feedback positivo.

## Mecânica do loop

**Ciclo por T-item:** PLAN → IMPLEMENT → VERIFY (Playwright) → SELF-CRITIQUE → DECIDE.

**Limites:**
- 5 iterações por item. Após a 5ª, marcar Issue `blocked` com log e seguir.
- Item bloqueado nunca bloqueia o restante do loop.
- Timeout total do loop: 90 min (1.5h). Se estourar, encerrar com `DONE count` + `BLOCKED count` no relatório.

**Self-critique (antes de DECIDE):** o agente revisa seu próprio diff contra o critério de aceite. Lista gaps. Se houver gap, itera; se não, decide.

**Decisão:**
- `commit & close Issue` — Playwright passou + zero gaps no self-critique.
- `iterate` — qualquer gap.

**Ordem de execução sugerida:** T1, T2, T5, T7, T8, T11 (baixa/media severidade, baixo risco de regressão), depois T3, T4, T10, T12 (a11y + feedback), depois T6, T9 (polish + skeletons). Esta ordem é sugestão — o agente pode reordenar se detectar dependências.

**Não fazer:**
- Não criar branches por T-item. Trabalhar direto na branch do loop.
- Não mergear para `main` antes do fim do loop — PR único no fim.
- Não rodar `bun run build` entre T-items — só ao final.

## Testes estruturados com Playwright

**Setup:** Playwright já configurado em `tests/e2e/` (workers: 1, sequential). Adicionar specs em `tests/ux/` (Playwright UX audit, já existe com viewports desktop/tablet/mobile — usar desktop apenas).

**Por T-item, gerar 2 specs:**

1. **`{T<n>}-before.spec.ts`** — prova que o problema existia. Rodar contra branch ANTES da mudança:
   - Salvar screenshot `./screenshots/T<n>-before.png` (viewport 1440×900).
   - Asserts DOM/query que provam o problema (ex.: "focus-visible não tem ring", "label não associado").

2. **`{T<n>}-after.spec.ts`** — prova que o fix funcionou. Rodar contra branch DEPOIS:
   - Salvar `./screenshots/T<n>-after.png`.
   - Asserts DOM/query que provam o critério de aceite (ex.: ring visível, label associado).

**Convenções:**
- Screenshots em `./screenshots/T<n>-{before|after}.png` (criar diretório se não existir).
- Para critérios subjetivos (ex.: "ícone visualmente consistente"), ainda escrever spec estrutural + flag para revisão humana no Issue body.
- axe-core: rodar `@axe-core/playwright` em cada `*-after.spec.ts` e falhar o test se houver violations `serious` ou `critical`.
- Viewport único: 1440×900 (desktop only).
- Não rodar testes E2E existentes (`tests/e2e/`) entre T-items — só ao final do loop.

**Comando por spec:**

```bash
bunx playwright test tests/ux/T1-after.spec.ts --reporter=line
```

## Changelog obrigatório

Para cada T-item, atualizar o Issue body (não criar arquivo separado) com o template:

```
**Changelog (T<n>)**
- Status: in-progress → playwright-validated → done
- Files touched: <lista de paths em apps/web/src/>
- Evidence:
  - before: ./screenshots/T<n>-before.png
  - after:  ./screenshots/T<n>-after.png
  - Playwright report: ./playwright-report/index.html
- Notes: (curto, opcional)
```

Esse changelog é a fonte de verdade do que mudou em cada Issue. Não duplicar em `CHANGELOG_HOME.md` (esse é do produto, não dos fixes de UX).

## Saída final esperada do loop

Quando o loop termina (todos `done` ou `blocked`), produzir relatório final com summary table, counts (DONE/BLOCKED/TOTAL), path para `./playwright-report/index.html`, e plano de PR. Formato concreto no template do Issue body do último T-item.

**Critério de fim:** todos os 12 T-items estão `done` ou `blocked`. Relatório final commitado em `loop-prompt-report.md` na raiz do repo. PR aberto ao final com 1 commit por T-item DONE + CHANGELOG_HOME.md atualizado.