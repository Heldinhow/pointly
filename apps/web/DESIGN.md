---
name: Pointly
description: Planning Poker web para times ágeis — salas efêmeras, votação síncrona, zero cadastro. Estética Spell UI, dark-first.
colors:
  void: "#09090b"
  panel: "#101013"
  raised: "#17171b"
  edge: "#26262c"
  fg: "#f4f4f5"
  fg-mute: "#a1a1aa"
  fg-faint: "#63636b"
  accent: "#e4e4e7"
  accent-ink: "#09090b"
  danger: "#f87171"
  danger-deep: "#450a0a"
  success: "#34d399"
  success-deep: "#022c22"
  warning: "#fbbf24"
  warning-deep: "#451a03"
typography:
  display:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 5vw, 4.25rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.2vw, 2.75rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Geist Mono', ui-monospace, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  card: "16px"
  pill: "999px"
---

# Design System: Pointly (Spell)

## 1. Overview

**Creative North Star: "The Night Table"**

Pointly é dark-first: a mesa de estimativa acesa no escuro. Fundos
near-black, superfícies em zinc profundo separadas por bordas de 1px,
tipo Geist em voz única e micro-labels mono em caixa alta. A estética
segue **Spell UI** — peças React + Tailwind + motion copiáveis,
inspiradas em shadcn/ui — com o brilho reservado a momentos: reveal
coletivo, sucesso de voto, entrada na sala.

Densidade contida — uma ideia por viewport, respiro generoso. Motion é
feedback, nunca coreografia: só transform e opacity, e tudo colapsa
para near-zero sob reduced motion.

**Key Characteristics:**

- Dark-first: `#09090b` é o fundo padrão; light é exceção opt-in.
- Bordas de 1px (`#26262c`), não sombras — profundidade é borda, não blur.
- Uma voz tipográfica (Geist); Geist Mono anota.
- Brilho com parcimônia: no máximo um momento luminoso por viewport.

## 2. Tokens

### Cores (dark-first)

| Token     | Valor     | Uso                              |
| --------- | --------- | -------------------------------- |
| `void`    | `#09090b` | fundo da página (dark)           |
| `panel`   | `#101013` | shells, seções                   |
| `raised`  | `#17171b` | cards, superfícies elevadas      |
| `edge`    | `#26262c` | bordas hairline 1px              |
| `fg`      | `#f4f4f5` | texto primário                   |
| `fg-mute` | `#a1a1aa` | texto secundário                 |
| `fg-faint`| `#63636b` | metadata, placeholders           |
| `accent`  | `#e4e4e7` | CTA primário (claro sobre escuro)|
| `danger` / `success` / `warning` | `#f87171` / `#34d399` / `#fbbf24` | vereditos, sempre com fill deep pareado |

Light mode inverte a escala (fundo `#f5f5f5`, tinta `#171717`) via a
classe `.light` no `documentElement` — ver `src/theme/theme.tsx`.
Contraste AA obrigatório em ambos os temas.

### Tipografia

Geist em tudo; Geist Mono em labels, códigos de sala, timers e
metadados. Display nunca abaixo de `-0.03em` de tracking. Deck usa
numeral 600, 20px, sempre upright.

### Raios e elevação

- Botões/inputs: `8px`. Cards/modais: `16px`. Pills/seats: `999px`.
- Flat por padrão; um único shadow ambiente em modais
  (`0 16px 48px rgb(0 0 0 / 45%)`).

## 3. Motion

- Só `transform` + `opacity`. Durações 150–420ms, easing exponencial-out.
- `MotionConfig reducedMotion="user"` na raiz (`motion/react`) +
  guarda CSS `@media (prefers-reduced-motion: reduce)` que zera
  animações — as duas camadas convivem.
- Sem `transition-property: all` global; sem coreografia de entrada
  em cascata nas telas de fluxo (join/arena).

## 4. Componentes → peças Spell

| Necessidade Pointly   | Peça Spell correspondente              |
| --------------------- | -------------------------------------- |
| Headline da landing   | Blur Reveal / Gradient Wave Text       |
| Ações primárias       | Button (variantes spell)               |
| Fundo da landing      | Light Rays / Animated Gradient (sutil) |
| Sala / explicador 3D  | Perspective Book                       |
| Micro-labels de status| Shimmer Text (parcimonioso)            |
| Formulários (apelido, código) | Input + Field spell, dark      |
| Toasts                | Toast spell, dark (ver contrato em `src/components/feedback/toast.tsx`) |
| Mesa da arena         | Custom (feltro noturno) — spell não cobre; segue tokens acima |

Peças novas entram copiadas para `src/components/spell/` (vendored,
estilo Spell/shadcn) — nunca como dependência npm. `cn()` vive em
`src/lib/cn.ts`; variantes com `class-variance-authority`;
composição com `@radix-ui/react-slot`.

## 5. Do's and Don'ts

### Do

- **Do** manter dark como default real (primeiro paint já escuro).
- **Do** separar superfícies com borda `edge` 1px sobre fills flat.
- **Do** dar a todo controle foco visível (`:focus-visible`, anel 3px) e alvo ≥ 44px.
- **Do** reservar cor saturada/brilho para o momento de veredito (reveal, erro, sucesso).
- **Do** colapsar motion sob reduced motion (MotionConfig + CSS).

### Don't

- **Don't** usar `use client`, `<style jsx>` ou CSS global fora de `src/index.css`.
- **Don't** inventar testids para e2e (só o básico local, ex. `page-not-found`).
- **Don't** puxar peças spell como pacote — copiar para `src/components/spell/`.
- **Don't** texto corrido ou placeholder abaixo de 4.5:1 contra o fill.
