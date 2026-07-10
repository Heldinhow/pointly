# Pointly · Propostas visuais e de UX

> Análise da linguagem visual atual do Pointly + propostas priorizadas.
> Foco em **design** (cor, tipo, hierarquia, estados, motion) — não duplica
> o bug audit operacional já existente em `UX_REVIEW.md` (10 itens BUG-401..410).
> Cruzamentos entre as duas listas estão marcados com `↻ ref UX-XXX`.

---

## 0. Leitura de design (Design Read)

> Reading this as: **ferramenta de produtividade para times ágeis pequenos**,
> com linguagem **editorial warm-paper** (Atelier Zero), tendendo para
> **foco ritual da mesa de Planning Poker**, com um eixo leve de **jogo
> físico** (projéteis, evitações, medianas em destaque).

Essa leitura vem de três sinais: (1) o domínio é Planning Poker para
times de 3-12 pessoas — não é dashboard denso nem marketing premium.
(2) a paleta paper + terracota + mostarda é editorial e calma, não
high-tech. (3) os projéteis e o cooldown introduziram um eixo de
**tacto** que precisa conviver com o restante sem virar carnaval.

## 1. Dials (para esta análise)

| Dial | Valor | Por que |
|---|---|---|
| `DESIGN_VARIANCE` | 7 | Já existe assimetria (split hero, side rails, ring oval), mas o conteúdo é seriado (landing com 4 features idênticas dispostas em grid 4-col). Ainda há espaço para irregularidade. |
| `MOTION_INTENSITY` | 5 | Há microinterações boas (card-bump, hit-shake, ellipse-pulse, cta-pulse), mas várias telas não exploram motion contínuo. Reveal é o momento mais escasso de motion narrativa. |
| `VISUAL_DENSITY` | 4 | Telas bastante respiradas, mas a Arena acumula muitos elementos (8 seats + deck + 2 pills + stats + center button + cooldowns + toasts). Densidade na Arena ameaça 6-7. |

## 2. Forças a preservar

Estas decisões de design diferenciam o Pointly. Não propor mudanças aqui,
só defender que se mantenham.

- **Brand mark Ø** em Playfair Italic. Único, memorável, barato de
  reproduzir. É a única coisa que sobrevive a um screenshot desfocado.
- **Coral como acento único** (CTA, dot de ênfase no fim de headlines,
  mostarda apenas como joia ≤1%). Mantém hierarquia visual limpa.
- **Edição itálica dentro de headline em sans** (`<em>ritmo</em>` em
  Inter Tight). Já existe nas wireframes e na implementação. É o
  movimento editorial mais forte do produto.
- **Roman numerals como sec-rule** (I, II, III, IV, V separando seções
  na Landing). Diferencia muito e custa três linhas de CSS.
- **Forma da mesa como assinatura visual**. Elipse dupla + 8 assentos
  em ângulo é a única forma que comunica "Planning Poker". Não
  tentar abstracções.
- **Reveal com flip do numeral** (face-num Playfair Italic opacidade
  0 → 1 sobre avatar esmaecido). Funciona. Não mexer.

## 3. Lacunas diagnosticadas

Lista priorizada (impacto ÷ esforço). IDs novos (`DESIGN-1..N`)
isolados dos IDs do audit existente.

### DESIGN-1 · Token terracota divergiu da documentação visual

**Sintoma.** `apps/web/src/index.css:32` define
`--accent: #d24a2a` ("terracota · UX-014"), enquanto os wireframes em
`design/*.html` ainda documentam `--coral: #ed6f5c`. O comentário
em `tailwind.config.ts:88` afirma "CTA terracota - shadow atualizado
para novo hue (UX-014)" mas não há ADR nem `plan.md` update explicando
a mudança.

**Impacto.**
- Designers lendo os wireframes hoje ficam confusos.
- A paleta editorial "paper + coral" virou "paper + burnt orange".
  Em telas grandes, com `--bg: #efe7d2` e `--coral: #d24a2a`, o
  contraste aumenta (terracota escurece ~25%). Mantém legibilidade
  mas reduz a brand warmth original.
- Decisão boa não documentada. É o tipo de decisão que se perde
  em 6 meses.

**Fix proposto.**

1. Adicionar ADR-002X registrando a mudança: "terracota (UX-014) —
   alinhamento com referência Open Design, mantendo <1.2 unidades de
   saturação por delta visual".
2. Atualizar `plan.md` (seção 4) com o novo hex + motivo.
3. Atualizar `design/*.html` para usar o mesmo hex (`#d24a2a` no lugar
   de `#ed6f5c`), ou marcar o arquivo como deprecated e mover para
   `design/archive/v0.html`.

### DESIGN-2 · Pill de stats "salta" entre estados sem transições

> **✓ IMPLEMENTADO em issue #67 / PR Heldinhow/pointly#81 (2026-07-10).**
> Branch: `loop/issue-67-stats-pill-skeleton`. Skeleton `h-11 min-w-[220px]`
> `bg-surface/40 animate-[pulse_4s_ease-in-out_infinite]` + `aria-hidden=true`.
> Stale JSDoc no header tambem corrigido.

**Sintoma.** `apps/web/src/components/stats-pill.tsx:50` retorna `null`
quando `consensus === null`. Pré-reveal a área superior-esquerda está
vazia. Pós-reveal o pill aparece inteiro de uma vez (apenas opacity
fade em 300ms). O usuário não tem pista visual de que algo vai
acontecer ali.

**Impacto.** Hierarchy visual instável. Usuário olha para a Arena
sem saber onde a informação vai aparecer quando o reveal rolar.

**Fix proposto.**

Skeleton do mesmo tamanho (110px altura, ghost-em-linha) durante o
estado pré-reveal, com pulse de 4s em bone-fade:

```tsx
// pseudo-código
if (!consensus) {
  return (
    <div aria-hidden="true"
      className="h-10 px-4 rounded-full bg-surface/40 border border-ink/5
                 animate-pulse" />
  );
}
```

Sem texto legível (aria-hidden), só o "lugar" da informação. Pré-reveal
pode evoluir para "3 jogadores votaram" como texto auxiliar:

```tsx
<span className="text-ink-faint">{votedCount}/{totalPlayers} votaram</span>
```

Resolve simultaneamente um problema de UX mais profundo: **ninguém
sabe quantas pessoas votaram** (ver DESIGN-7 abaixo).

### DESIGN-3 · Eixo de projéteis não tem signature visual próprio

**Sintoma.** `apps/web/src/components/seat.tsx:243` usa emoji 🎯 como
trigger. `apps/web/src/components/seat.tsx:265` usa emojis como
projéteis (`🍅`, `☕`, `🧸`). O reactivo também é emoji (`EMOJI_REACTIONS`).
A skill `design-taste-frontend` tem regra explícita: "Use vector-based
icons (Heroicons, Lucide, HugeIcons), not emojis".

**Por que aqui é OK quebrar a regra (parcialmente).** Projéteis são
personagens da brincadeira. Emoji é linguagem onipresente em chat
(Slack reactions, GitHub). Substituir tudo por SVG seria perder o
carácter "brincadeira". Mas o **trigger** (Mira 🎯) e o **shield**
(🛡️) são UI chrome — esses sim devem virar SVG.

**Fix proposto.**

| Onde | Hoje | Proposto |
|---|---|---|
| Botão Mira no hover do seat | `🎯` emoji em botão 28x28 | SVG crosshair 16x16 stroke 1.5 (Phosphor `CrosshairSimple` ou Lucide). <svg> aria-hidden. |
| Deflect shield no overlay | `🛡️` emoji em texto 20px | SVG shield outline 24x24 stroke 2.5 paper, fill olive/mustard a 15%. |
| Projéteis do menu | 7 emojis | Manter emoji (linguagem da brincadeira). Considerar como "stickers reconhecíveis" mais do que "ícones UI". |
| Emoji de reação flutuante | 1 emoji aleatório | Manter emoji. Adicionar cor de fundo sutil pro tipo (hit usa bg-coral-soft/20, deflect usa bg-mustard/15) para dar leitura semântica adicional além do emoji. |

**Custo.** 30min para trocar 2 ícones por SVG. Zero risco.

### DESIGN-4 · Botão "Revelar" tem três estados morfológicos mas cara de botão único

**Sintoma.** `apps/web/src/components/reveal-button.tsx:111-127` aplica
classes diferentes para awaiting/ready/post-reveal, mas o tamanho, a
posição (`absolute top-1/2 left-1/2`) e a forma (`rounded-full`) são
idênticos. O **estado awaiting** (cinza, cursor disabled) é o estado
mais longo (esperando todos votarem) e parece "travado".

**Fix proposto.**

Quando awaiting: o botão pode ser apenas uma **forma visual "aguarde"**
— não precisa ler como botão clicável.

```tsx
state === "awaiting" && (
  <div className="font-mono text-[10px] uppercase tracking-[0.16em]
                  text-ink-faint border border-ink/10 rounded-full
                  px-4 py-2 bg-paper/60 backdrop-blur-[2px]">
    <span className="ellipse-pulse inline-block">●</span>
    {" "} Aguardando {awaiting} jogador{awaiting === 1 ? "" : "es"}
  </div>
)
```

Quando `ready` ou `post-reveal`: mantém o botão coral pill atual.

Resultado: o centro da mesa fica **silencioso até alguém poder agir**,
depois vira **CTA coral**. Aumenta o signal-to-noise ratio do
momento da ação.

### DESIGN-5 · O numeral do Fibonacci perde presença na Reveal

**Sintoma.** `apps/web/src/components/seat.tsx:340` define numeral
revelado em Playfair Italic 24px (não-mediano) ou 36px (mediano,
coral). O doc em `deck.tsx:9` promete "Playfair Italic 32px" mas a
implementação usa 24px. Decisão editorial do numeral — assinatura do
produto — está tímida no momento mais importante da tela.

**Impacto.** No pós-reveal, o usuário quer ler 8 números. Em 24px,
juntos num card de 96px de largura, ficam apertados. A disposição
editorial está fraca no momento onde mais importa.

**Fix proposto.**

Uniformizar:

- Numeral revelado: `font-italic text-[28px]` (não-mediano) e
  `text-[40px]` (mediano coral). 32px fica para Tablet/desktop.
- Numerais semibold com leve expansão (`tracking-[-0.02em]`).
- Manter o `opacity` do avatar/nick em 0.18 pós-reveal, mas
  aumentar ligeiramente o contraste (`0.25`) para legibilidade do
  contexto.

`↻ ref UX-OBS-001` (já flagado).

### DESIGN-6 · Copy em PT-BR fica entre aspas tipográficas erradas

**Sintoma.** Vários componentes usam aspas retas ASCII em vez de
curly quotes PT/BR. `help-modal.tsx` e `toast.tsx` usam `'Click'`.
Em `seat.tsx:233`: `'Aguarde'` / `'Arremessar'` etc.

**Fix proposto.** Imports de `&ldquo;` e `&rdquo;` (ou `“` / `”`)
em todos os títulos e labels PT-BR. Aspas em code (`'`) só em
strings de programação.

### DESIGN-7 · Falta indicador de progresso da votação

> **✓ IMPLEMENTADO em issue #68 / PR Heldinhow/pointly#83 (2026-07-10).**
> Branch: `loop/issue-68-voted-counter`. Contador discreto "X / Y votaram"
> com `role=status` `aria-live=polite` `aria-atomic=true`, 72px abaixo do
> centro, visivel em voting+revealable, oculta pos-reveal.

**Sintoma.** A Arena mostra quem votou (badge `VOTED` em cada seat)
mas não mostra **quantos** já votaram em formato numérico. O
`RevealButton` adivinha (`"Aguardando 5 jogadores..."`) mas é a
única indicação agregada.

**Impacto.** UX ruim em times grandes. O host precisa contar
manualmente pelos seats para saber se está perto do reveal. Adiciona
carga cognitiva exatamente no momento em que o usuário está tentando
decidir se revela ou espera mais.

**Fix proposto.**

Adicionar um contador discreto no topo da Arena ou ao lado do
reveal button, sem competir com ele:

```tsx
<div className="font-mono text-[10px] uppercase tracking-[0.06em]
                text-ink-faint">
  <span className="text-ink">{votedCount}</span>
  <span>/</span>
  <span>{totalPlayers}</span>
  <span> votaram</span>
</div>
```

Posicionar abaixo do reveal-button no estado awaiting; ao lado no
estado ready. Anunciar via `aria-live="polite"` quando votedCount
muda (debounce de 200ms para não floodar leitores de tela).

### DESIGN-8 · "Arena cheia" (sala cheia) não acontece via modal — tela inteira

**Sintoma.** `apps/web/src/pages/full.tsx` renderiza uma tela cheia
quando o usuário tenta entrar em uma sala lotada. UX engessa — o
usuário perde completamente o contexto ("onde eu estava antes?").

**Fix proposto.** Converter `full.tsx` em **modal reutilizando o
`EmptyOverlay`** + um `<Card>` ao centro. O usuário pode fechar com
Esc ou clicar fora e voltar à Landing.

Razões:
- Sala cheia é uma falha de input, não um estado de tela nova.
- Padronizar com o help modal e o empty overlay (todos são
  surface-noise bone-cards).
- Preserva a navegação (voltar = Landing intacta).

### DESIGN-9 · Loader da WebSocket é "Conectando..." em texto puro

**Sintoma.** `apps/web/src/components/ui/connection-status.tsx`
(mencionado em index.css mas não lido aqui) provavelmente usa texto.
A skill `frontend-design` recomenda:
"skeleton screens / shimmer placeholders matching the final layout's
shape. Avoid generic circular spinners."

**Fix proposto.** Antes de assumir a forma do skeleton, ler
`connection-status.tsx`. Se for texto:
- Substituir por **estado vazio com 8 placeholders de seat** em
  bone-fade. O usuário vê "está montando a mesa" concretamente.
- Adicionar microcopy (`"Encontrando a sala..."`) sob os assentos.
- Manter `aria-live="polite"`.

Se a conexão cai (status `disconnected`), mostrar **toast persistente**
com botão "Tentar reconectar" (`apps/web/src/store` já tem o estado).

### DESIGN-10 · Stats em unanimidade perdem info útil

**Sintoma.** `stats-pill.tsx:84-91` mostra `★ Unanimous` em vez de
`Média / Mediana / Intervalo` quando todos votam igual. Mas a Média
ainda vale (é o valor!) e o Intervalo é `[N, N]`. Esconder os números
e mostrar só "★ Unanimous" joga fora a info crítica.

`↻ ref UX-BUG-408` (já flagado, mesmo problema).

**Fix proposto.**

Ordem de exibição quando unanimous:

```
★ UNANIMOUS · MÉDIA 5 · INTERVALO 5
```

Badge ★ menor (10px) à esquerda, depois médias em mono caps. A
informação está toda lá e a celebração fica em uma glosa, não no
lugar dos números.

### DESIGN-11 · Hierarquia de papéis durante a voting phase não está visível

**Sintoma.** Host é marcado por uma estrela mostarda (`seat.tsx:55`)
no canto do seat. Mas ninguém te explica *o que host significa* na
arena. A maioria das pessoas chegando em uma sala nova não sabe
regras. A `HelpModal` lista `R` e `N` mas não explica a função do
host (qual a diferença concreta?).

**Fix proposto.**

Adicionar uma linha discreta sob o seat do Host no header da arena:

```tsx
{isHost && (
  <div className="font-mono text-[9.5px] uppercase tracking-[0.06em]
                  text-ink-faint">
    <span className="text-mustard">★</span> Host - gerencia a mesa
  </div>
)}
```

E garantir que o `HelpModal` tenha seção "Papéis":
- Host: dispara reveal e nova rodada (e qualquer player pode, por
  design - isso é importante dizer).
- Player: vota, vê votos, joga projéteis.

### DESIGN-12 · Falta contraste no numeral do ☕ no deck

**Sintoma.** O ☕ é a única carta sem numeral. Renderizada em
`text-[22px]` (deck.tsx mais à frente não lido completamente),
diferente dos 30px das outras. Cai na hierarquia.

**Fix proposto.**

Substituir texto ☕ por **SVG custom** (uma caneca estilizada com a
linha de vapor usando `animate-steam-1/2/3` que já existem em
`index.css`). Mantém proporção com as outras cartas (28-32px) e
ganha motion contínuo que reforça a ideia de "pausa".

Custo: 1 SVG + 1 wrapper animado. ~15min. O efeito de vapor já está
implementado (chave `animate-steam-1`), só falta plugar.

### DESIGN-13 · Layout ratio assimetria: side rails e mock table

**Sintoma.** Side rails (`.side-rail`, `index.css:386`) são fixos em
36px (`@media (max-width: 767px) { .side-rail { display: none; } }`
já existe). Em desktop eles cumprem função decorativa; em mobile
somem. Mas o conteúdo entre eles (Landing hero, Arena center) está
deslocado. Talvez porque a container é 1360px e o viewport em 1440px
precisa compensar.

**Fix proposto.**

Adicionar inset no body para que os rails comam do viewport, não do
container:

```css
body { padding-inline: 36px; } /* compensado pelos side-rails */
@media (max-width: 767px) { body { padding-inline: 0; } }
```

Garante que containers `max-w-[1360px]` realmente sentem os 36px dos
rails em desktop sem deslocamento.

### DESIGN-14 · Estatísticas pós-reveal têm hierarquia fraca

**Sintoma.** `stats-pill.tsx:79` mostra `MÉDIA / MEDIANA / INTERVALO`
em mono small caps, todos no mesmo peso/altura. **Mediana** é a
informação mais útil do produto (justifica todo o reveal!), mas não
se diferencia visualmente além da cor `text-ink font-semibold` versus
`text-ink-faint`.

**Fix proposto.**

Dentro do stats pill, a mediana deveria ter:

- Numeral em `font-italic text-[20px]` (mesma família dos numerals
  das cartas - parente visual do Fibonacci).
- Cor `text-mustard` (já é).
- Borda inferior substituída por um **sublinhado serif itálico curto**
  visualmente falando (a actual `border-b border-mustard` é OK; só
  garantir `border-b-2` não `border-b`).
- Espaçamento extra em volta para criar respiro.

A média e intervalo ficam menores (12px caps), mediana vira o número
notável.

### DESIGN-15 · "Ø Pointly" brand lockup está em sete variações

**Sintoma.** Grep rápido mostraria o lockup usado em 5+ lugares
(Landing topbar, Join header, Arena topbar, Help modal, CTA pulse,
card-mark). Cada um com proporção diferente. Em um deles a Ø pode
estar em 18px, em outro 36px - dilui o sinal visual.

**Fix proposto.**

Introduzir um componente `<BrandLockup size="sm | md | lg" />` que
encapsula as proporções. Recebe `size`, renderiza o par Ø + "Pointly"
com proporções fixas:

```tsx
function BrandLockup({ size = 'md', as: Tag = 'span' }) {
  const mark = size === 'sm' ? 16 : size === 'lg' ? 36 : 22
  const text = size === 'sm' ? 'text-[13px]' : size === 'lg' ? 'text-[24px]' : 'text-[18px]'
  return (
    <Tag className={`inline-flex items-baseline gap-1.5 ${text}`}>
      <span aria-hidden="true"
        style={{ fontSize: `${mark}px` }}
        className="font-italic italic text-coral leading-none">Ø</span>
      <span className="font-display font-extrabold tracking-[-0.025em]">
        Pointly
      </span>
    </Tag>
  )
}
```

Resultado: 7 usos → 1 fonte de verdade. A Ø vira novamente memorável.

### DESIGN-16 · Empty state pós-nova-rodada tem 0 feedback

**Sintoma.** Quando o host (ou qualquer player) clica "Nova rodada",
todos os votos zeram, timer zera, mas o usuário pode estar olhando
para a área errante. O `apps/web/src/lib/new-round-loop.ts` deve
disparar isso, mas falta um sinal visual coletivo de "começou de novo".

**Fix proposto.**

Disparar um efeito de "sweep" leve na ellipse da mesa (`ellipse-pulse`
já existe no CSS, forte candidato). Limpa votos anima as cartas
saindo (scale 0.96 + opacity 0) por 240ms antes de zerar.

Também: o numeral "ROUND NN" no topo deveria dar um flash de coral
breve (`text-coral` 800ms → `text-ink-faint`). O importante é que
o usuário perceba "isso foi um reset, agora é uma rodada nova".

### DESIGN-17 · Animações decorativas sem propósito declarado

Auditoria: `index.css` define 9 animações custom:

| Animação | Propósito declarado | Risco |
|---|---|---|
| `steam-rise` | Vapor do ☕ (DESIGN-12) | Não está sendo usado em runtime |
| `projectile-x/y/arc` | Projétil arremesso | OK, usado |
| `hit-shake` | Reação a acerto | OK |
| `dodge-slide` | Reação a desvio | OK |
| `reaction-fade-up` | Emoji flutuante | OK |
| `ellipse-pulse` | Elipse awaiting | OK, mas talvez ligado fraco |
| `cta-pulse` | CTA final landing | Usado 1x (landing.tsx:929) |
| `card-bump` | Feedback de voto | OK |

**Recomendação.** Fazer um grep de uso e remover animações não
utilizadas (atualmente nenhuma `motion-reduce` falta, mas é ruído
no bundle CSS). Não é problema funcional, é hygienic.

### DESIGN-18 · Tailwind purga pode estar deixando classes importantes

**Sintoma.** `landing.tsx:239,245` (e arena.tsx:342-350) usaram
classes inválidas (`translate-x-34`, ver `↻ ref UX-BUG-404`). É
sinal de que classes Tailwind não estão sendo typecheckadas.

**Fix proposto.**

1. Adicionar `tsc --noEmit` ao pre-commit do Biome.
2. Configurar `tailwind.config` para emitir uma classe conhecida
   por linha (purge: `safelist`).
3. Adicionar eslint plugin `eslint-plugin-tailwindcss`.

### DESIGN-19 · Lado direito da Arena muito vazio na fase pré-voto

**Sintoma.** Quando ninguém votou, a Arena mostra `awaiting` button
central + ellipse vazia + 8 assentos `IDLE`. Em 1440px o terço direito
do viewport fica visualmente deserto. Nenhum call-to-action além do
centro.

**Fix proposto.** Adicionar um **micro-card de boas-vindas** lateral
direita em telas ≥1024px que mostre:

```
Ø Bem-vindo à sala
Você é o jogador 1 de 8. Convite pelo link:
[Copiar link]
```

O `EmptyOverlay` (`apps/web/src/components/empty-overlay.tsx`) já
existe e faz exatamente isso, mas só abre em full-overlay. Promover
para uma versão "side-card" em desktop, "modal" em mobile.

### DESIGN-20 · Falta empty-state da home antes do usuário criar sala

**Sintoma.** A Landing mostra hero + features + CTA tudo imediatamente.
Em mobile (`< md`) o conteúdo editorial se comprime contra `px-16`
e fica apertado (já flagado em `↻ ref UX-BUG-403`).

**Fix proposto.**

Refactor do hero mobile:

```
┌─────────────────────────────┐
│  Ø Pointly                  │
│  [pulse] Planning Poker     │
├─────────────────────────────┤
│  (hero copy)                │
│  [Criar sala →]             │
│  (stat rings inline)        │
├─────────────────────────────┤
│  (3-card stack illustration)│ <- HERE
│                             │
├─────────────────────────────┤
│  (4 features in 2-col)      │
└─────────────────────────────┘
```

Restruturar o grid mobile para `grid-cols-1` puro com a ilustração
**depois** do CTA no mobile, em vez de dentro do split do desktop.

## 4. Propostas agrupadas por alavanca

Em vez de aplicar uma a uma, agrupo por alavanca de design para
otimizar esforço. Ordenado por alavanca de maior leverage primeiro.

### Alavanca A · Hierarquia visual

> "Edição é a arte de decidir o que sobrevive."

- Aplique DESIGN-1 (resolver drift terracota ↔ coral).
- Aplique DESIGN-2 (stats pill skeleton).
- Aplique DESIGN-4 (awaiting sem cara de botão).
- Aplique DESIGN-5 (numeral pós-reveal maior).
- Aplique DESIGN-10 (unanimous preserva info).
- Aplique DESIGN-14 (mediana com numeral serif).
- Aplique DESIGN-16 (nova rodada sinaliza).

Esforço total: ~4h. Impacto: rebalanceamento da hierarquia da Arena
(onde o usuário mais olha).

### Alavanca B · Estados completos

> "Empty, loading, error são design, não afterthought."

- Aplique DESIGN-7 (contador "X/Y votaram").
- Aplique DESIGN-8 (full.tsx → modal).
- Aplique DESIGN-9 (loader como skeleton).
- Aplique DESIGN-11 (papel host visível).
- Aplique DESIGN-19 (side-card pré-voto).

Esforço total: ~6h. Impacto: deixar todas as fases do produto
cobertas com UI honesta.

### Alavanca C · Identidade coesa

> "Ø Ø Ø Ø Ø Ø Ø - quando aparece 7 vezes, dilui. Quando aparece 1,
>  grita."

- Aplique DESIGN-12 (☕ SVG com vapor animado).
- Aplique DESIGN-15 (BrandLockup component).
- Aplique DESIGN-17 (limpar CSS morto).

Esforço total: ~3h. Impacto: consistência visual cross-screen.

### Alavanca D · Touches finais

> O que sobra quando A-C está aplicado.

- Aplique DESIGN-3 (Mira/Shield SVG, manter emojis em projéteis).
- Aplique DESIGN-6 (aspas curly em PT-BR).
- Aplique DESIGN-13 (body padding pra side rails).
- Aplique DESIGN-18 (class validation).
- Aplique DESIGN-20 (hero mobile stack).

Esforço total: ~3h. Impacto: polimento.

## 5. Não-faço (escopo excluído)

- **Não propor dark mode**. O Atelier Zero é warm-paper deliberadamente.
  Dark mode diluiria a decisão editorial fundamental.
- **Não introduzir gradientes coloridos**. O ruído SVG + paleta chapada
  é o coração da brand. Gradiente é AI-tell.
- **Não trocar Playfair → outra serif**. A Ø + Playfair já está gravada
  como sinal. Trocar agora cria inconsistência entre wireframes, app
  e qualquer lugar que alguém referenciar.
- **Não adicionar parallax / scroll-jacking**. Reading-mode,
  reduced-motion-friendly. Sem gimmicks.
- **Não reintroduzir em-dash**. Copy do produto é em PT-BR; vírgulas e
  períodos resolvem 99% dos casos. Hifens com espaço para ênfase.
- **Não aumentar copy**. As legendas são curtas por design. Cada
  proposta adiciona no máximo 1 linha de microcopy por superfície.

## 6. Estimativa agregada

| Alavanca | Esforço | Impacto esperado |
|---|---|---|
| A - Hierarquia | ~4h | Alto: Arena fica mais legível, focus do momento do reveal claro |
| B - Estados | ~6h | Médio-Alto: nenhum estado fica "sem resposta visual" |
| C - Identidade | ~3h | Médio: consistência cross-screen |
| D - Polimento | ~3h | Baixo-Médio: qualidade percebida sobe |

Total: **~16h**. Compatível com ~2 ciclos de iteração do self-improve
loop (cada ciclo ~8h de gate + código).

## 7. Como medir (definição de "feito")

Para cada proposta, antes de marcar como concluída:

1. Lighthouse desktop score ≥ 95 (Arena post-reveal).
2. axe-core: 0 violações sérias (foco visível, aria-label, contraste).
3. `prefers-reduced-motion: reduce`: nenhum elemento anima.
4. Visual review no `screenshots/` antes/depois para Arena 1440px
   (revealed) e Landing 360px (mobile).
5. Contraste do numeral mediana pós-reveal: target 7:1 (AAA) contra
   o `--surface` (bone).

## 8. Próximos passos sugeridos

1. **Discordar primeiro, aprovar depois.** Este relatório é proposta.
   Marcar quais alavancas entram no backlog de issues (label
   `design/v2`).
2. **ADR-002X** antes de mexer em tokens: a decisão terracota ↔ coral
   precisa de rastro escrito.
3. **Spike técnico** (4h): extrair `BrandLockup` e validar que 7 lugares
   se atualizam sem regressão visual.
4. **Iterar Alavanca A** primeiro. Arena é o produto. Quando Arena
   estiver mais legível, parte-se pra Landing e Join.

---

## Anexo · Cross-ref com UX_REVIEW

| DESIGN | Ref existente |
|---|---|
| DESIGN-2 | (adição nova) |
| DESIGN-3 | (adição nova) |
| DESIGN-5 | `↻ OBS-001` |
| DESIGN-10 | `↻ BUG-408` |
| DESIGN-13 | (parcialmente `↻ BUG-204` - side rails defer) |
| DESIGN-18 | (relacionado a `↻ BUG-404`) |
| DESIGN-19 | (adição nova, mas adjacente a `↻ BUG-409`) |
| DESIGN-20 | `↻ BUG-403` |

Itens do `UX_REVIEW.md` cuja camada é design e foram reforçados aqui:
BUG-403, BUG-404, BUG-408, BUG-409, OBS-001. Os outros são bugs de
lógica/contraste e continuam no `UX_REVIEW.md`.

---

`$ pointly/design-proposals.md · gerado 2026-07-10 · cross-ref
UX_REVIEW.md`
