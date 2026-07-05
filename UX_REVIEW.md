# Pointly — UX Review (rodada contínua)

> Auditoria UX/UI/Features do **Pointly** (Planning Poker web).
> Arquivo-mestre **não-destrutivo**: cada rodada registra achados novos,
> referenciando o relatório histórico detalhado em
> `audit/UX-AUDIT-FINDINGS.md` (que contém a auditoria completa anterior,
> screenshots e justificativas estendidas).
>
> **Workflow**: a cada rodada
>  1. Auditar todas as telas, fluxos e estados em **1440px** e **390px**
>  2. Cruzar achados com auditorias anteriores (sem duplicar IDs já
>     registrados como RESOLVIDO)
>  3. Registrar aqui só **achados NOVOS** ou **REGRESSÕES** (de bugs
>     marcados `✓ FIXED` na auditoria anterior)
>  4. Classificar por severidade: **P0** (quebra funcionalidade /
>     feature prometida) · **P1** (UX ruim que prejudica percepção) ·
>     **P2** (polish, fidelidade, observações)
>  5. Recomendar ordem de aplicação por impacto/esforço
>
> **Regra de não-duplicação**: se o achado coincide com BUG-XXX já
> registrado como `✓ FIXED`, abrir entrada `↻ REGRESSÃO DE BUG-XXX`.

---

## Rodada 1 — 2026-07-04 (viewport 1440 + 390)

**Método**: navegação real via Playwright MCP contra `apps/web` em
`localhost:5173` e `apps/server` em `localhost:3001`. Console monitorado
para warnings/errors de React/Router/Tailwind. Screenshots em
`audit/screenshots/r1-*.png`.

**Achados NOVOS (não constam em auditorias anteriores)**:

| ID | Sev | Área | Resumo |
|----|-----|------|--------|
| BUG-401 | **P0** | Arena / Timer | Timer visual **congela** durante phase `revealable` (após votar em sala solo) |
| BUG-402 | **P0** | UI Primitives / Console | `Button` recebe `ref` mas não usa `forwardRef` → 2× erros React 18 no console |
| BUG-403 | **P1** | Landing mobile | Illustration 3-card / 5-mediana do hero fica com **largura 2px** em 390px (some) |
| BUG-404 | **P2** | Landing hover | Classes Tailwind `hover:translate-x-34` são inválidas (spacing scale vai só até 36) |
| BUG-405 | **P2** | Landing footer | Footer usa `grid-cols-4` mas tem só 2 colunas preenchidas (metade direita vazia) |
| BUG-406 | **P2** | Join / a11y | Input `aria-label="Seu nome na sala"` diverge do `<label>` visível `Apelido` |
| BUG-407 | **P2** | Join / a11y | Input nick sem `autocomplete` attribute (form `autoComplete="off"` não propaga) |
| BUG-408 | **P2** | Arena / Stats | Stats pill mostra `Média — / Intervalo —` mesmo com voto registrado (sala solo) |
| BUG-409 | **P1** | Arena mobile | Stats pill e Timer pill **sobrepõem** em 390px (colisão lateral ~85px) |
| BUG-410 | **P2** | Toast / a11y | Toast `success` usa `bg-coral-soft` + `text-coral` (mesma hue, contraste ~1.1:1 → WCAG fail) |

**Achados REGRESSIVOS** (de itens marcados `✓ FIXED` na auditoria anterior):

| ID original | Sev | Status | Resumo da regressão |
|-------------|-----|--------|---------------------|
| BUG-101 | **P0** | **↻ REGRESSÃO** | Timer **não decrementa** após primeiro voto em sala solo. Confirmado por amostra em 14s: `timer-text` permanece `"60ROUND 01"`. Diferença: o fix anterior cobriu `phase === "voting"`, mas em sala solo o phase vira `revealable` no 1º voto (todos conectados já votaram) — cliente ticker tem guard `if (phase !== "voting") return;` em `use-arena-loop.ts:230`, então para de decrementar. Servidor decrementa mas não broadcasta em `revealable` (`sala.tick()` retorna `'idle'` em vez de `'ticking'`). Resultado: visual parado até o auto-reveal aos 60s do servidor, sem countdown. |

**Achados já em aberto** (backlog da auditoria anterior sem mudança de status):

| ID original | Sev | Status | Resumo |
|-------------|-----|--------|--------|
| BUG-003 | P2 | ↻ STILL | `motion-reduce:` não verificado em código para pulse-dots e steam animado |
| BUG-204 | P1 | ⏸ DEFERRED v2 | Side rails 36px ausentes (decisão ADR-003) |
| OBS-001 | P2 | ↻ STILL | Numerals das cartas em `text-[20px] italic` — spec Playfair 32px |
| OBS-003 | P2 | ↻ STILL | `stats-pill.tsx:42-45` retorna `6.5.toFixed(1)` para mediana não-inteira (BUG-401 da rodada anterior, agora também BUG-408) |

### Detalhes por achado

#### BUG-401 — Timer congela em `revealable` (P0)

**Sintoma**: Sala solo (host cria, vota). Phase vai `voting` → `revealable` após primeiro voto. `data-testid="timer-value"` permanece `"60"` por 60s inteiros, depois revela "do nada" no auto-reveal. Drift visual até o auto-reveal.

**Causa**: dois pontos cooperam:

1. **Cliente** (`apps/web/src/lib/use-arena-loop.ts:228-239`):
   ```ts
   if (phase !== "voting") return;   // ← para de tickar
   ```
   Guarda só permite tick durante `phase === 'voting'`. Mas spec do
   servidor diz: em `revealable` o timer **deve continuar** (auto-reveal
   aos 0s).

2. **Servidor** (`apps/server/src/sala.ts:451`):
   ```ts
   return this.phase === "voting" ? "ticking" : "idle";
   ```
   `tick()` decrementa mesmo em `revealable`, mas retorna `'idle'` →
   `ws.ts` (linhas 210-216) só faz `broadcastRoomState` em `'ticking'`,
   então servidor **não atualiza cliente** durante `revealable`. Drift
   máximo = até o próximo reconcile de 10s (que também não vem, então
   o cliente fica com timer stale até o `phase: 'revealed'` final).

3. **Test confirma o no-op intencional** (`apps/web/src/store/sala.test.ts:445`):
   > `tickTimer é no-op quando phase === 'revealable'`

   Esse teste documenta o comportamento, mas o comportamento quebra
   a spec do PRD F-013/F-014 (auto-reveal visível).

**Impacto**:
- Auto-reveal prometido ("60s com transição pra coral aos 30s") não
  é visível quando o usuário vota em sala solo.
- Usuário não vê feedback temporal entre votar e revelar.
- Stats de "critical state coral ≤30s" também não aparece.

**Severidade**: P0 — feature central e declarada em PRD não funciona
em fluxo `solo → vote → revealable`.

**Fix proposto**:

Opção A — Cliente (mínimo, 2 linhas):
```ts
// use-arena-loop.ts:229
const phase = useSalaStore((s) => s.sala?.phase ?? "idle");
useEffect(() => {
    if (phase !== "voting" && phase !== "revealable") return;
    const id = setInterval(() => {
        const current = useSalaStore.getState().sala;
        if (!current || (current.phase !== "voting" && current.phase !== "revealable")) return;
        if (current.timer <= 0) return;
        useSalaStore.getState().tickTimer();
    }, 1000);
    return () => clearInterval(id);
}, [phase]);
```
E ajustar `tickTimer` em `apps/web/src/store/sala.ts:248-259` para
também decrementar em `'revealable'`. Atualizar o teste
`sala.test.ts:445` para refletir novo comportamento ou quebrar em dois
testes (voting + revealable).

Opção B — Servidor (autoritativo, 1 linha):
```ts
// apps/server/src/sala.ts:451
return (this.phase === "voting" || this.phase === "revealable") ? "ticking" : "idle";
```
Cliente ficaria sincronizado via reconcile de 10s, sem precisar do
ticker cliente. Mas perde suavidade do 1s.

Recomendação: **A + B juntas** (1s smooth + reconcile autoritativo).

---

#### BUG-402 — Console errors: `ref` no Button sem `forwardRef` (P0)

**Sintoma**: Navegando `/`, console emite 2× warnings:
```
Warning: %s: `ref` is not a prop. ...
   at Button (apps/web/src/components/ui/button.tsx:43:3)
Warning: Function components cannot be given refs.
   at Landing → at Button
```

**Causa** (`apps/web/src/components/ui/button.tsx:52-75`):
```ts
export interface ButtonProps extends ... {
    ref?: React.Ref<HTMLButtonElement>;
}
export function Button({ className, variant, size, ref, ...props }: ButtonProps) {
    return <button ref={ref} ... />;
}
```

Padrão `ref`-as-prop é **React 19**. App está em React 18.3.1
(deps em `apps/web/package.json:14`). Em React 18, `ref` precisa de
`forwardRef` ou não é reconhecido.

**Call-site afetado**: `apps/web/src/pages/landing.tsx:174` —
```tsx
<Button ... ref={heroCtaRef} id="hero-create-room-cta" />
```
o `ref` é usado pelo `IntersectionObserver` para esconder o CTA do
sticky-nav quando o hero está visível (`BUG-103`).

**Impacto**:
- Logs sujam o console (ferramenta de dev e E2E tests).
- Em CI com `--strict-mode`, faz falhar o `vite build` por
  `tsc --noEmit && vite build` (já emite warning de TS em strict).
- Em produção React 18.3.1 manda o `ref` como prop e o
  `IntersectionObserver` recebe `undefined` — `BUG-103` pode estar
  silenciosamente quebrado em produção!

**Verificação de produção**: precisa confirmar se hero CTA sticky-nav
realmente está sendo escondido. Se `ref` é `undefined`,
`heroCtaRef.current` é `null`, o `useEffect` retorna early
(`if (!el) return`), e o CTA sticky nunca some. Reabre BUG-103.

**Severidade**: P0 — bug funcional + reabertura potencial de BUG-103.

**Fix proposto**: 2 opções (escolher **uma**):

1. **Forward ref** (recomendado, compatível cross-version):
   ```ts
   import { forwardRef } from "react";
   export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
       ({ className, variant, size, ...props }, ref) => (
           <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
       )
   );
   Button.displayName = "Button";
   ```

2. **Migrar para React 19** (escopo maior, ADR-019).

**Esforço**: 5 min.

---

#### BUG-403 — Cards illustration do hero Landing some em 390px (P1)

**Sintoma**: Landing mobile (390×844):
- `<div className="relative min-h-[520px] bg-paper-warm …">` que
  deveria mostrar 3 cartas estilizadas ("3", "5 mediana", "☕")
  renderiza com `width: 2px` (visualmente invisível).
- Confirmado via DOM probe: `boundingClientRect.width === 2`.

**Causa** (`apps/web/src/pages/landing.tsx:140`):
```tsx
<div className="grid grid-cols-[0.78fr_1.22fr] gap-16 items-start pt-12">
```

Grid usa colunas fracionárias **sem prefixo responsivo**. No mobile:
- `px-16` da section = 64px cada lado = 128px subtraído
- `gap-16` entre colunas = 64px
- Sobra 390−128−64 = 198px para 2 colunas
- Coluna 1 (esquerda) ~ 86px → ainda cabível
- Coluna 2 (direita) ~ 112px → ilustração comprime

Mas na prática a inspeção mostra 2px → provavelmente o conteúdo
`w-80 h-80` da ilustração interna excede e causa overflow que o
flex `justify-center` colapsa em mobile. Não investigado a fundo
(HIPÓTESE: interaction com `min-h-[520px]` absoluto forçando altura
mas largura filha comprime).

**Impacto**:
- Mobile perde completamente o "hero visual" — único indício do
  produto é o texto.
- Diferenciação editorial fica só no desktop.
- Plan §6.2 previa "index card 01-04 lateral" — implementado só no desktop.

**Severidade**: P1 (UX ruim em mobile, quebra promessa de design).

**Fix proposto**:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[0.78fr_1.22fr] gap-16 items-start pt-12">
```
Stack vertical no mobile, 2-cols só no `lg+`. Adicionar `hidden lg:flex`
ou similar no illustration wrapper para garantir que ocupa 100% da
coluna no desktop e fica visível (ou `hidden lg:block`) no mobile para
esconder limpo.

**Esforço**: 10 min.

---

#### BUG-404 — Classes Tailwind `translate-x-34` inválidas (P2)

**Sintoma**: No hero da Landing, hover sobre card 1 (rotacionado
-16deg) deveria animar para `-6deg + translateY(-6px) + translateX(-34 * 4 = -136px)`,
mas a translate-X **não aplica**. Tailwind 3.4.17 não tem valor 34 em
nenhum dos spacing scales.

**Causa** (`apps/web/src/pages/landing.tsx:239, 245`):
```tsx
"…hover:-translate-x-34 hover:scale-105…"
"…hover:translate-x-34 hover:scale-105…"
```

Tailwind spacing scale: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9,
10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64,
72, 80, 96. **Não há 34**. JIT não emite a classe → hover não move X.

**Impacto**: Card hover fica estático em X (só rotaciona e sobe Y).
Menor impacto visual — usuário pode não perceber o missing translate.

**Severidade**: P2 (polish).

**Fix proposto**: substituir por valor válido:
- `hover:-translate-x-32` (limita um pouco, mas existe)
- `hover:-translate-x-36` (extrapola 4px além do original)
- ou arbitrary value: `hover:-translate-x-[8.5rem]` (34 × 0.25rem = 8.5rem)

Recomendado: `-translate-x-[8.5rem]` para manter paridade exata.

**Esforço**: 2 min.

---

#### BUG-405 — Footer `grid-cols-4` com só 2 colunas (P2)

**Sintoma**: Footer da Landing exibe apenas 2 colunas (Pointly, Produto).
Largura `grid-cols-4` mantém 4 trilhos de 25% cada. Colunas 3 e 4 ficam
vazias → metade direita do footer tem só whitespace.

**Causa** (`apps/web/src/pages/landing.tsx:371-407`): refactor da
auditoria anterior (BUG-205) removeu 2 das 4 colunas do footer original,
mas esqueceu de trocar `grid-cols-4` por `grid-cols-2`.

**Impacto**: visual não-balanceado, sensação de "página quebrada"
(footers editoriais costumam preencher o full-width).

**Severidade**: P2 (polish).

**Fix proposto**: `grid-cols-2` (footer full-width em 2 colunas, cada
50% do espaço) ou `grid-cols-4` mantendo o ponto de partida editorial
(mas precisa preencher as 4).

Decisão: **esconder** as 2 colunas vazias (`grid-cols-2`) — minimal e correto.

**Esforço**: 1 min.

---

#### BUG-406 — Label/aria-label divergentes no input nick (P2)

**Sintoma**: `/join` mostra `<label>Apelido</label>` visível.
Input tem `aria-label="Seu nome na sala"`. Screen reader lê **o último** —
então NVDA/VoiceOver falam "Seu nome na sala" em vez de "Apelido".

**Causa** (`apps/web/src/pages/join.tsx:243-264`): duas fontes de
acessibilidade se contradizem.

**Impacto**: a11y — inconsistência para screen reader users. Pequeno,
mas viola WCAG 1.3.1 (info and relationships).

**Severidade**: P2.

**Fix proposto**:
- Opção A: remover `aria-label` do input (deixa o `<label for>` vencer).
- Opção B: alinhar `aria-label="Apelido"` com o label visível.
- Opção C: usar `aria-labelledby` apontando pro label id.

Recomendado: **A** — label já está associado via `htmlFor`, aria-label
é redundante e introduz inconsistência.

**Esforço**: 1 min.

---

#### BUG-407 — Input nick sem `autocomplete` attribute (P2)

**Sintoma**: `/join` field não declara `autocomplete` próprio. Form tem
`autoComplete="off"` (`join.tsx:240`) — mas este atributo em `<form>`
**NÃO propaga** para children inputs (é comportamento documentado:
HTML spec apenas permite `autocomplete` em form controls).

**Causa**: tentativa de desligar autofill via form-level attribute.

**Impacto**:
- Browsers IGNORAM `autoComplete="off"` em `<form>` (Chrome, Safari, FF).
- O input continua susceptível a browser autofill de "seu nome" (de outro
  site), oferecendo apelidos antigos. Em mobile, teclado pode
  predizer/sugerir nomes não relacionados.
- Em privacidade, pode expor o histórico do navegador pra users que
  **não querem** apelido pré-preenchido (já temos pré-preenchimento
  legítimo via sessionStorage T08).

**Severidade**: P2.

**Fix proposto**: explicitar `autoComplete="off"` no `<input>` direto
(`apps/web/src/pages/join.tsx:249`). Remover do `<form>`.

**Esforço**: 1 min.

---

#### BUG-408 — Stats `Média — / Intervalo —` mesmo com voto (P2)

**Sintoma**: Arena pós-reveal em sala solo (1 voto "5"). Pill mostra
`Média — · ★ Unanimous · Intervalo —`. O "★ Unanimous" implica que
todos votaram igual, mas os números ficam `—` (placeholder de null).

**Causa**: `computeConsensus([5])` retorna `{median: 5, mean: 5, range: [5,5]}`?
Vejo no store (`__POINTLY_SALA__` snapshot): `{median: null, mean: null,
range: null, unanimous: true}`. Ou seja, **consensus só popula median/mean/range
quando há ≥2 votos numéricos**.

Para 1 voto só o unanimous flag se ativa, mas os stats numéricos ficam
null. Visual: o usuário vê "Unanimous" mas não vê **o que** todos votaram
(precisa adivinhar a partir dos seats).

**Impacto**:
- Pós-reveal em sala solo: usuário não vê o valor consensual —
  a info crítica some atrás de `—`.
- Sala pequena (2-3 jogadores) onde unanimity é rara mas valores
  numéricos são importantes: o pill perde utilidade.

**Severidade**: P2.

**Fix proposto**: ajustar `computeConsensus` em
`packages/shared/src/compute/consensus.ts` (verificar implementação)
para retornar `median/mean/range` mesmo com 1 voto. Em 1 voto, todos
são iguais ao próprio voto.

Alternativa: UI mostra o valor do assento local no stats quando há
`unanimous` + N===1.

**Esforço**: 15 min.

---

#### BUG-409 — Stats pill + Timer pill sobrepõem em mobile (P1)

**Sintoma**: Arena mobile (390px), pós-reveal:
- `<div data-testid="stats-pill">` ocupa `x: 48 → 313` (largura 265px).
- `<div role="timer">` ocupa `x: 228 → 342` (largura 113px).
- Sobreposição: `313 − 228 = 85px` colidem.

Visual: os 2 elementos ficam meio-colados, timer pill encosta em cima
do stats pill. Tela parece bugada.

**Causa** (`apps/web/src/pages/arena.tsx:342-350`):
```tsx
<div className="absolute top-3.5 left-12 z-10">  {/* stats */}
<div className="absolute top-3.5 right-12 z-10"> {/* timer */}
```

Ambos `absolute top-3.5` em lados opostos do `<main>`. Em mobile
(390px) com `px-12` (48px cada lado), só sobra 294px de espaço.
Stats (265px) + Timer (113px) = 378px > 294px ⇒ sobrepõem.

**Impacto**: UI parece quebrada em mobile. Stats pill pode esconder
parte do timer (legibilidade crítica do tempo restante).

**Severidade**: P1 (visibilidade comprometida).

**Fix proposto**:

Opção A — **esconder o timer no mobile** quando o stats pill está visível:
```tsx
<div className="hidden md:flex absolute top-3.5 right-12 z-10">
  <TimerPill />
</div>
```
Stats fica visível sempre (info mais importante). Timer só no desktop.

Opção B — **stack vertical no mobile**:
```tsx
<div className="absolute top-3.5 left-12 right-12 z-10 flex flex-col gap-2
                md:block md:left-auto md:right-12 md:flex-row">
  <StatsPill />
  <div className="self-end md:self-auto"><TimerPill /></div>
</div>
```

Opção C — **timer abaixo do stats**:
```tsx
<div className="absolute top-3.5 left-12 z-10">
  <StatsPill />
  <div className="mt-2 md:mt-0 md:hidden"><TimerPill /></div>
</div>
```

Recomendado: **A** (cleanup mínimo e timer já aparece grande no centro
da arena pela iluminação da mesa).

**Esforço**: 5 min.

---

---

#### BUG-410 — Toast `success` com mesmo hue de fundo e label (P2)

**Sintoma**: Em `/join` após digitar nick e clicar Entrar, exibe-se
toast "Bem-vindo, Auditor." (kind: `success`). O texto aparece
**quase invisível** porque usa a mesma hue coral do fundo (`text-coral`
em `bg-coral-soft`). Usuário precisa forçar a vista pra ler.

**Causa** (`apps/web/src/components/ui/toast.tsx:41-45`):
```ts
const KIND_STYLES: Record<ToastKind, string> = {
    info: "bg-surface text-ink border-ink/10",
    success: "bg-coral-soft text-coral border-coral/30",
    error: "bg-coral text-white border-coral",
};
```

Paleta (`apps/web/src/index.css:32-33`):
- `--accent: #ed6f5c` (coral — HSL ~7°, 78%, **65%**)
- `--coral-soft: #f08e7c` (coral-soft — HSL ~7°, 84%, **71%**)

Mesmo matiz (7°), só lightness varia 6pp. **Contraste ~1.1:1**
(calculado pela fórmula WCAG). Precisa ≥ **4.5:1** pra AA, ≥ **3:1** pra
AA-large. Falha em todos os tiers.

**Impacto**:
- Toast `success` (notavelmente o "Bem-vindo, X" do /join) é o
  feedback **primário** do fluxo de entrada. Se o usuário não lê,
  perde a confirmação de que entrou na sala.
- Screen readers leem via `<span class="sr-only">Sucesso: </span>`,
  então a11y de leitor de tela está OK; o problema é visual.
- Triggers users a reload (acham que click não funcionou).

**Severidade**: P2 — funcionalidade OK, mas visibilidade do feedback
primário comprometida + viola WCAG 1.4.3 (contrast minimum).

**Fix proposto**:

Opção A — **trocar cor do texto** (mínimo):
```ts
success: "bg-coral-soft text-ink border-coral/40",
```
Mantém fundo claro, usa texto `ink` (~#15140F) → contraste ~12:1.

Opção B — **inverter padrão** (consistente com `error`):
```ts
success: "bg-ink text-coral-soft border-ink",
```
Fundo escuro com texto coral-soft. Alta legibilidade e mantém
"vibe editorial" do design system.

Opção C — **usar surface com borda coral** (mais discreto):
```ts
success: "bg-surface text-coral border-coral/40",
```

Recomendado: **A** (quick win, mínimo disruption visual). Avaliar B se
quero reforçar contraste alto contra o coral.

**Esforço**: 1 min + 1 regression test (snapshot do toast rendered).

---

### Resumo da Rodada 1

| Sev | Qtd | IDs |
|-----|-----|-----|
| **P0** | **3** | BUG-401, 402, ↁ REGRESSÃO BUG-101 |
| **P1** | **2** | BUG-403, 409 |
| **P2** | **7** | BUG-404, 405, 406, 407, 408, 410 + backlog |
| **Total NOVOS** | **10** | BUG-401–410 |
| **↻ REGRESSÕES** | **1** | BUG-101 |

### Recomendação de ordem de aplicação (impacto ÷ esforço)

1. **BUG-402 P0** (5 min) — Button sem forwardRef. Resolve regressão
   silenciosa de BUG-103 e limpa console.
2. **BUG-401 P0 ↻ BUG-101** (15 min) — timer em `revealable`. Feature
   central volta a funcionar com fluxo solo.
3. **BUG-409 P1** (5 min) — stats/timer overlap mobile. UI legível.
4. **BUG-403 P1** (10 min) — hero illustration mobile. Visual editorial.
5. **BUG-405 P2** (1 min) — footer grid-cols-4 → grid-cols-2. Quick win.
6. **BUG-410 P2** (5 min) — toast `success` contraste. a11y WCAG.
7. **BUG-404 P2** (2 min) — translate-x-34. Polish hover.
8. **BUG-407 P2** (1 min) — autocomplete no input. a11y cleanup.
9. **BUG-406 P2** (1 min) — aria-label duplicado. a11y cleanup.
10. **BUG-408 P2** (15 min) — stats unanimity solo. Cobertura consistente.

**Estimativa total**: ~60 min para todos.

---

## Anexos

- Screenshots: `audit/screenshots/r1-*.png`
- Console errors capturados: 2× warnings/erros React 18 + 6× futuros
  React Router v7 (`v7_startTransition`, etc.) — backlog pós-v6.
- Estado do store no momento do bug: ver `window.__POINTLY_SALA__`
  injetado por `apps/web/src/lib/use-arena-loop.ts:184-201` (E2E fixture).
