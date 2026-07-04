# Pointly — Plano de Protótipo (PRD-style brief)

> Status: **rascunho para revisão do usuário** · Última atualização: 2026-07-04
> Origem: entrevista de plan-brief, 7 decisões trancadas sequenciais.
> Grilling 2026-07-04: ver [CONTEXT.md](./CONTEXT.md) (glossário), [docs/adr/](./docs/adr/) (3 decisões não-óbvias) e o PRD formal em [.specs/features/planning-poker-v1/spec.md](./.specs/features/planning-poker-v1/spec.md) (33 requisitos com IDs e traceability).

## 1. Intenção

Protótipo web de **Planning Poker** para times ágeis (3–12 pessoas), **100% grátis, sem cadastro, sem limites**. Sala temporária via código curto de 4 chars, deck Fibonacci, votação síncrona com revelação coletiva, timer com estado crítico, estatísticas (média/mediana), e mesa visual com assentos. O protótipo simula multi-usuário client-side (11 bots votam após o usuário) — sem backend, sem WebSocket, sem persistência além de `localStorage`.

**Promessa central:** entre com um apelido, vote, revele — pronto. Nenhuma conta, nenhum email, nenhum plano pago.

## 2. Escopo

### Incluir (v1)

- US-1 Entrar na sala com apelido (2–20 chars, sem espaços duplos; sem avatar no v1 — inicial do nome no círculo)
- US-2 Votar em rodada (deck Fibonacci: 0, ½, 1, 2, 3, 5, 8, 13, ☕ — 9 cartas)
- US-3 Revelar votos (host) — destaque gold para mediana; pós-reveal mantém player info em full opacity
- US-4 Reconhecer meu assento ("VOCÊ" + borda coral)
- US-5 Criar sala (landing + CTA "Criar sala" + Trust Badge)
- Timer 60s com estado crítico (coral ≤30s, auto-reveal ao expirar)
- Toasts (jogador votou, todos votaram, sala cheia)
- Demo Mode overlay (substitui "Convide outros"; explica que 11 bots vão simular votos)
- Sala cheia (12/12 → entrada negada dedicada)
- Estatísticas pós-reveal (média, mediana)
- Host badge (★ mostarda, jewelry)
- Share URL copiável (pill ghost)

### Fora de escopo (v1)

- Mobile/tablet (desktop 1440px apenas)
- Story context na Arena
- ActionBar dedicada (só RevealButton → NewRoundButton)
- Skip/Discall buttons
- Spectator UI exposto
- Backlog, analytics, histórico, integração Jira/Linear
- Permissões granulares (só host + player — papel Player não exercitado no wireframe; server-side em produção)
- Pagamento, planos
- Responsive web
- Avatar configurável (inicial do nome no círculo é suficiente no v1)
- Real multiplayer (wireframe simula Host com 11 bots; estado "sala vazia" só faz sentido em produção)
- Toasts individuais por bot (consolidados em "mais N escolheram" para reduzir ruído no demo)
- Imagens colagem geradas (placeholder first-pass; promover a `gpt-image-2` depois se o plano fechar)

### Fidelidade

**Wireframe** — não produto final. Frames SVG/cinza rotulados, grey blocks, placeholders honestos (`—`) onde não houver valor real. Suficiente para validar roteamento, layout, anatomia da mesa, roteiro do mock.

## 3. Decisões trancadas (entrevista Q1–Q7)

| ID  | Decisão                                                | Valor estável        |
| :-: | :----------------------------------------------------- | :------------------- |
| Q1  | Penetração visual Atelier Zero                        | `bifurcated`         |
| Q2  | Estrutura de arquivos                                 | `5_plus_launcher`    |
| Q3  | Geometria da mesa                                      | `ring`               |
| Q4  | Profundidade do mock                                   | `reactive`           |
| Q5  | Roteamento + empty                                     | `routing_a` + `overlay` |
| Q6  | Voz editorial + mark                                   | `landing_only_voice` + `ring_slash` (Ø) |
| Q7  | Imagens + fidelidade                                   | `placeholder_then_generate` + wireframe |

## 4. Sistema visual — Atelier Zero (ativo)

Todos os tokens, famílias tipográficas e regras de postura estão em `design-systems/atelier-zero/DESIGN.md`. Resumo operacional:

### Cores (paleta Atelier Zero, NÃO Linear)

```
--bg:        #efe7d2  (paper, fundo)
--paper-warm:#ece4cf
--paper-dark:#ddd2b6
--surface:   #f7f1de  (bone, card elevado)
--fg:        #15140f  (ink, texto/CTA forte)
--fg-soft:   #2a2620
--fg-mute:   #3a352a
--fg-faint:  #4a4438
--accent:    #ed6f5c  (coral, ÚNICO acento quente)
--coral-soft:#f08e7c
--mustard:   #e9b94a  (jewelry: estrela nav, dot)
--olive:     #6e7448  (tags, glyphs)
```

Branco puro só dentro do painel escuro "Selected Work". Preto puro proibido — `--fg #15140f` é o mais escuro.

### Tipografia

- **Display/sans:** `Inter Tight` 700–900, letter-spacing `-0.025em` a `-0.04em`
- **Itálico emphasis/serif:** `Playfair Display` Italic 500 (substantivos emocionais inline, numerais romanos, brand mark Ø)
- **Body:** `Inter` 300–500
- **Mono:** `JetBrains Mono` 400–500 (coords, SHAs, plate numbers, timer arena)

### Postura (bifurcada)

- **Landing** (revista completa): metadata strip top, side rails 36px, sec-rules Roman (`I.`, `II.`…), hero collage full-bleed, plate annotations, mega footer `Pointly.` em Playfair Italic clamp(70px,13vw,200px).
- **Arena** (editorial-lite): mesmo papel e coral, mesma tipografia; **sem** side rails, sem colagens ocupando a mesa, sem sec-rules Roman. Substitui por cabeçalhos curtos `FIG. 02 · ROUND 03` em mono ink-faint. Único flourish editorial dentro da arena: numerais das cartas Fibonacci em **Playfair Italic** dentro de bone-fill cards 18px radius.

### Regras de cor críticas

- Um coral CTA por viewport. Se dois CTAs coral, numerais viram ink-faint.
- Mostarda nunca é CTA — é joia (≤1% superfície).
- Surface noise `::before` obrigatório (SVG turbulence 5–7% opacidade + 2 radial gradients em paper).

## 5. Estrutura de arquivos

```
index.html      # launcher — overview do produto, linka para as 4 telas
landing.html    # US-5 — hero + CTA "Criar sala" + Trust Badge
join.html       # US-1 — nickname prompt com ?code= querystring
arena.html      # US-2/3/4 — mesa ring, deck, reveal, timer, empty overlay
full.html       # edge case — sala cheia 12/12, entrada negada
```

Cada arquivo é standalone HTML com CSS/JS inline (skill `open-design-landing` ships `scripts/compose.ts` que gera `index.html` self-contained; demais telas são escritas à mão sobre o mesmo `styles.css`).

### Roteamento (sem backend)

```
landing.html
  └─ click "Criar sala"
     ├─ gera code = Math.random().toString(36).slice(2,6).toUpperCase()
     ├─ localStorage.host = code
     └─ window.location = `join.html?code=${code}&host=1`

join.html?code=XXXX
  └─ valida apelido (2–20 chars, sem espaços duplos)
     ├─ localStorage.playerNick = nick
     └─ window.location = `arena.html?code=${code}`

arena.html?code=XXXX
  ├─ if (localStorage.host === code) → mostra RevealButton coral
  ├─ else → mostra mesa apenas (player)
  ├─ if (players.length === 1) → overlay "Convide outros" + share URL
  └─ timer 60s inicia ao primeiro voto

join.html?code=XXXX (com 12 jogadores já)
  └─ window.location = `full.html`
```

Share URL copiável: `location.origin + location.pathname.replace(/[^/]+$/, 'join.html?code=XXXX')`.

## 6. Tela a tela

### 6.1 `index.html` (launcher)

Não é produto. Sumariza o Pointly em 4 cards (Criar sala / Entrar / Bots votam / Reveal coletivo) com link para cada HTML. Visual: mini-Atelier (paper bg, coral dot, marca Ø no topo), porém sem os 16 slots de colagem — só tipografia + paper texture + 4 cards bone-fill numerados `01–04` em Playfair Italic.

### 6.2 `landing.html` (US-5 — Criar sala)

> **[DEFERRED TO v2: side rails — ver ADR-003]** Implementação atual não inclui os 36px rails com metadata vertical. Mantidos no spec para rastreabilidade; v2 decide.

- Metadata strip: `Vol. 01 · Issue Nº 26 · Pointly · PT-BR` + pulse dot coral
- Sticky nav: brandmark `Ø Pointly` + nav 3 itens (`Como funciona`, `Para times`, `GitHub` com ★ mostarda) + CTA coral `Criar sala ↗`
- Hero (Roman I): headline mistura sans-bold + italic-serif com coral dot final — `'Vote com *ritmo*, *confiança*, e zero cadastro.'` · lead · CTA primário `Criar sala` + CTA ghost `Entrar com código` · 3 stat rings (0 cadastros / 12 assentos / 60s para decisão) · index card `01–04` na borda direita
- About (Roman II): `"Filed under: Planning Poker"` · parágrafo declarativo específico (numerais reais: 0 contas, 4 chars no código, 9 cartas no deck, 12 jogadores máx)
- Capabilities (Roman III): 4 bone-fill cards numerados `01–04` Playfair Italic — 4 features (Sala instantânea · Deck Fibonacci · Reveal coletivo · Timer crítico)
- Method (Roman IV): 4 steps com thumbnails placeholder + hairline horizontal ligando os step heads
- CTA (Roman V): ribbon paper-dark + email pill ghost `Avise quando lançar`
- Footer: 4 link columns + mega word `Pointly.` em Playfair Italic clamp(70px,13vw,200px)
- Placeholders de 16 slots via `scripts/placeholder.ts` — frames SVG rotulados slot/ratio/dimensions/prompt hint

### 6.3 `join.html` (US-1 — Nickname prompt)

- Telas editorial-lite (sem side rails/sec-rules Roman)
- Cabeçalho: `FIG. 02 · ENTRAR` em mono ink-faint 10px
- Card central bone-fill 18px radius: mark Ø + headline `Seu nome na sala.` (Inter Tight 700 + coral dot) + input text 16px ink + botão coral `Entrar ↗`
- Campo apelido: minlength 2, maxlength 20, regex `\S(.*\S)?` (sem espaços no início/fim, sem espaços duplos)
- Após entrar: toast `Bem-vindo, ${nick}.` → redireciona para `arena.html?code=XXXX`
- Se `?host=1` na querystring: append micro-descritivo `Você está criando esta sala.`
- Validação inline: erro ink-soft `Mínimo 2 caracteres.` / `Sem espaços duplos.` / `Máximo 20 caracteres.`

### 6.4 `arena.html` (US-2/3/4 — A mesa)

**Anatomia (ring/elipse):**

- Viewport 1440×900, paper bg, sem side rails
- Mesa elíptica centrada no viewport, raio horizontal 480px / vertical 280px
- 12 assentos distribuídos via trig `(cos θ, sin θ)` em JS — VOCÊ travado em 6h (embaixo-centro), demais 11 em arco (30° de espaçamento)
- Cada assento: bone-fill card 96×128, avatar inicial circular + apelido + estado pill (`IDLE` / `VOTED` / valor revelado)
- Destaque "VOCÊ": borda 2px coral + badge `VOCÊ` ink-soft dentro do card
- Host badge: ★ mostarda 14px no canto sup. do assento do criador

**Deck Fibonacci (dock inferior):**

- 9 cartas bone-fill **48×68** (implementação consolidada em `apps/web/src/components/deck.tsx` — divergia do spec 72×100; **atualizado em 2026-07-04, BUG-308**), radius 12px, numeral em **Playfair Italic 20px**
- v2 pode reintroduzir 72×100 desktop com variante mobile 48×68
- Ordem: `0  ½  1  2  3  5  8  13  ☕`
- Estado default: ink stroke 1px, surface bone, label ink-faint
- Hover: translateY(-3px), stroke coral
- Selecionado: ring coral 2px + bg coral-soft + ink color
- Após reveal: deck fica desabilitado (cartas ink-faint opacity 0.4)

**Botão host (centro da elipse):**

- Estado `aguardando jogadores`: ghost 1px ink-at-20%, label ink-faint `Aguardando N jogadores…` (N = 12 − players voted)
- Estado `pronto`: coral pill 999px, white label `Revelar votos.` (coral-dot final — único momento editorial na arena), shadow coral 0,14,26,-16
- Pós-reveal: vira ghost `Nova rodada` (limpa votos, reset timer)

**Timer (canto sup. direito):**

- Pill bone-fill, mono numerics `00:42 · ROUND 03`, ink-faint default
- Coral (coral-soft bg) quando ≤30s
- Aos 0s: auto-reveal + toast `Tempo esgotado — reveal automático.`

**Mock reativo (JS):**

```
const BOTS = ['Maya','Rui','Aria','Theo','Lia','Ivo','Nora'];
const CURATED_VOTES = [0,1,3,5,5,5,5,8,8,8,13]; // 4 cincos garantem mediana=5 para qualquer voto do usuário; outlier 13 + base 0–8
function scheduleBotVotes() {
  BOTS.forEach((name, i) => {
    setTimeout(() => markVoted(i), 400 + Math.random()*1800);
  });
}
function onAllVoted() {
  revealButton.enable(); // ghost → coral
}
function onReveal() {
  players.forEach((p, i) => p.reveal(CURATED_VOTES[i]));
  highlightMedian(); // jogadores com voto = mediana → border gold (mustard)
  showStats(); // média x.x · mediana y · intervalo a–b
}
```

Votos curados garantem o destaque gold sempre (alguém está na mediana por construção). Toasts:`Maya escolheu uma carta.` · `Todos votaram — hora do reveal.` · `Mediana: 5`

**Overlay empty (sala só com você):**

- Aparece ao carregar arena.html com `players.length === 1`
- Bone-fill card centrado, mark Ø, headline `Convide outros.` + coral dot, share URL input text readonly + pill ghost `Copiar link` (clipboard API)
- Botão ghost `Entrar na mesa mesmo assim` → dismiss overlay

**Estatísticas pós-reveal (painel sup. esquerdo):**

- Pill bone-fill, mono: `MÉDIA 5.4 · MEDIANA 5 · INTERVALO 3–13`
- Inline nos jogadores com voto = mediana: badge gold `MEDIANA` + borda mustard 2px

### 6.5 `full.html` (edge case — sala cheia)

- Tela dedicada, mesmo paper/typography
- Card central bone-fill: mark Ø + headline `Sala cheia.` + coral dot
- Sub: `Esta sala já tem 12 jogadores. Crie outra ou tente outro código.`
- Botões: coral `Criar nova sala` (→ landing.html) + ghost `Voltar` (history.back)

## 7. Componentes transversais

| Componente         | Uso                                   | Spec                                          |
| :----------------- | :------------------------------------ | :-------------------------------------------- |
| `bone-card`        | Todos cards elevados                  | bg `--surface`, radius 18px, pad 28×26, inset 1px ink-at-6%, shadow 30/60/-30/15 |
| `coral-pill`       | CTAs primários                        | bg `--accent`, label white, radius 999px, pad 14×22, arrow `↗` 14px |
| `ghost-pill`       | CTAs secundários, dismiss              | transparent, border 1px ink-at-20%, ink label  |
| `sec-rule`         | Roman walks na landing                | hairline 1px + flex `[Roman]·[meta]·[page/008]` |
| `mono-tag`         | Cabeçalhos arena, timer, coords       | mono 10–11px, letter-spacing 0.04em, ink-faint |
| `typewriter-dot`   | Pulse dot no metadata strip           | 6×6 coral, `pulse 2.4s ease-in-out infinite`  |
| `reveal`           | Scroll motion na landing              | `data-reveal` + IntersectionObserver, respeita `prefers-reduced-motion` |
| `seat`             | Assento da mesa                       | 96×128 bone-card, borda 2px coral se VOCÊ, ★ se host |
| `card-fibonacci`   | Carta do deck                         | 72×100 bone-card, radius 18px, numeral Playfair Italic 32px |
| `toast`            | Notificações efêmeras                 | bone-card top-center, auto-dismiss 3s          |

## 8. Modelo de dados (mock client-side)

```js
// localStorage schema
localStorage.host        = "9B9F"           // se criou a sala
localStorage.playerNick  = "Helder"
localStorage.code        = "9B9F"           // código ativo

// Em arena.html (estado em memória, NÃO persistido)
const state = {
  code: "9B9F",
  round: 3,
  timer: 60,
  phase: "idle" | "voting" | "revealed",
  players: [
    { you: true,  nick: "Helder", voted: false, value: null, seat: 6 },
    { you: false, nick: "Maya",   voted: false, value: null, seat: 0 },
    // … 11 bots total
  ],
  votes: [],  // preenchido no reveal
};
```

## 9. Aceitação (checklist de validação do wireframe)

> Veja a versão formal no PRD: [.specs/features/planning-poker-v1/spec.md](./.specs/features/planning-poker-v1/spec.md) (33 requisitos, 4 deviations marcadas).

- [ ] `index.html` abre sem console errors; 4 cards linkam para landing/join/arena/full
- [ ] `landing.html` tem metadata strip, side rails ≥1280px, sec-rules Roman I–V, mega footer `Pointly.`
- [ ] `landing.html` callback "Criar sala" gera código 4 chars e redireciona para join.html
- [ ] `join.html` valida apelido 2–20 chars, sem espaços duplos; erro inline; redireciona para arena.html?code=XXXX
- [ ] `arena.html` mostra 12 assentos em elipse; VOCÊ travado em 6h com borda coral + badge
- [ ] Deck inferior tem 9 cartas; numeral em Playfair Italic; hover lifts; seleção ring coral
- [ ] RevealButton começa ghost "Aguardando N jogadores"; após bots VOTED, vira coral "Revelar votos." (wireframe ignora papel — sempre visível)
- [ ] Pós-reveal: cards viram face-up com valor + jogador em full opacity (não esmaecido); jogadores com mediana ganham borda gold (mustard)
- [ ] Timer 60s; coral ≤30s; auto-reveal + toast ao expirar
- [ ] Demo Mode overlay aparece no primeiro load da arena; explica 11 bots prestes a votar; copia share URL; dismissável uma vez via sessionStorage
- [ ] `full.html` mostra "Sala cheia" se tentar entrar com 12/12
- [ ] Surface noise `::before` em todas as telas
- [ ] Paleta só usa tokens Atelier Zero (NÃO Linear) — sem #08090a, sem #5e6ad2, sem Inter sem Playfair
- [ ] Wireframe: grey blocks e placeholders `—` onde não houver valor real; sem inventar stats
- [ ] `prefers-reduced-motion: reduce` desabilita scroll-reveal e pulse dot
- [ ] Sem `scrollIntoView`; sem emoji em copy de produto; sem gradientes em texto

## 10. P0 (must-pass antes de handoff para Design mode)

1. **Paleta Atelier Zero only.** Nenhuma cor Linear. Scorecard verify vai falhar regras Linear-aligned — isso é intencional; supersede pelas regras Linear-aligned que precisam ser atualizadas para Atelier Zero.
2. **Coral ≤1 CTA por viewport.** Se dois CTAs coral na mesma tela, numerais viram ink-faint.
3. **Inter Tight + Playfair Display + Inter + JetBrains Mono** loaded via Google Fonts ou fallback stack declarada.
4. **Surface noise** `::before` presente em todas as 4 telas.
5. **Mesa ring renderiza sem horizontal scroll** a 1440px; 12 assentos dentro do viewport.
6. **Mock reativo dispara timeouts** e habilita RevealButton só após 12 VOTED.
7. **Wireframe fidelity** — sem inventar stats, grey blocks rotulados, placeholders honestos.

---

## TODO / Open questions (editable)

- [TODO] Confirmar tom dos 4 cards do `index.html` launcher — editorial curto ou puramente funcional?
- [TODO] Validar se 12 assentos cabem confortavelmente em elipse 480×280 a 1440px (testar render)
- [OPEN] Promover imagens de placeholder → generate (`gpt-image-2`) após aprovação do wireframe
- [OPEN] Revenue modelo (iatorsfoi dito "sem pagamento" — manter forever grátis? Confirmar)
- [OPEN] Avatar opcional em join.html — drop ou URL? Q1 mentionou "avatar opcional" mas nenhuma decisão desde.
- [OPEN] Confirmar regras verificadas herdadas (Linear) devem ser marcadas "superseded" no scorecard quando o artefato for gerado — proposta de regra Atelier Zero-aligned a seguir.

---

## Next step

1. **Revise este documento** — especialmente a seção 6 (tela a tela) e a 9 (aceitação).
2. **Edite os TODOs acima** ou levante novos open questions diretamente no Markdown.
3. Quando estiver satisfeito, responda "**plano aprovado, gere**" (ou similar) — eu passo para o Design mode e construo `index.html` primeiro (launcher), depois landing → join → arena → full, em screens separadas.
4. Se preferir um ajuste específico antes (ex.: trocar mark, mudar roteamento, reabrir uma Q trancada), diga qual.
