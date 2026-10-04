# Pointly — Design "Prensa"

Direção visual do Pointly. Substitui integralmente o DESIGN.md anterior: o visual antigo foi descartado como referência (redesign do zero, branch `feat/redesign-from-zero`). Este arquivo é a fonte de verdade do design; tokens vivem no código e decisões estruturais viram ADR em `docs/adr/`.

## Direção

- **Público**: times ágeis (3–12) no ritual de planning — devs, PMs, designers; sessão curta, sem conta; PT/EN.
- **Tom**: calmo e direto, com energia contida — uma mesa de trabalho, não um dashboard.
- **Identidade**: tátil · franco · preciso.
- **Ideia central**: o Pointly é uma oficina gráfica. Papel, tinta e UMA cor de sinal. Cada voto é um tipo composto; a revelação é a tiragem saindo da prensa; unanimidade ganha carimbo; divergência abre réguas (menor ↔ maior); a pauta é uma comanda de papel. A metáfora vive nos materiais e nos momentos — nunca como fantasia.
- **Na prática**: landing = folha de prova tipográfica (a demo é uma "prova de prensa", marcada como simulação); sala = mesa de composição; reveal = tiragem; estatísticas = leitura de medidas.
- **Fontes**: **Archivo** (voz de prensa — títulos, números das cartas, carimbos; eixo de largura para momentos "cartaz") + **Instrument Sans** (interface e dados — texto, rótulos, estatísticas em numerais tabulares). Ambas variáveis, self-hosted, subset pt/en.
- **Espaçamento**: base 4 — `4/8/12/16/24/32/48/64/96`; layout em grid de 8.
- **Tema**: padrão = sistema (`prefers-color-scheme`); toggle manual persiste.
- **Descartados de propósito**: risografia fluorescente (barulhenta para ritual diário), "instrumento industrial" (fria), quadro-negro (AA difícil), literalidade de pôquer (ruptura), gradientes/vidro/blur/glow, emoji decorativo, sombras suaves grandes.

## Princípios

1. **Papel e tinta primeiro.** Superfícies são papel; conteúdo é tinta. Sem gradiente, vidro, blur ou glow — profundidade é recorte.
2. **Uma cor de sinal.** O vermelhão marca MOMENTOS: CTA, reveal, carimbo, réguas, foco, seleção. Fora disso, tinta sobre papel.
3. **Régua, não caixa.** Separação vem de hairline de 1px e espaço. Sombra é recorte duro de 2px, nunca blur.
4. **Movimento mecânico.** Curto e físico; explica estado (votou, revelou, divergiu). Sem floaty, sem parallax, sem loop decorativo.
5. **Franco.** Hierarquia explícita, rótulos claros, números tabulares. Legibilidade acima de expressão.
6. **Metáfora é material, não fantasia.** Sem skeuomorphism decorativo, sem textura pesada.

## Tokens

### Cor (claro "papel" / escuro "breu")

| token | claro | escuro | uso |
|---|---|---|---|
| `--bg` | `#F6F2E9` | `#141210` | fundo |
| `--surface` | `#FDFAF3` | `#1C1916` | folhas, cartões, cartas |
| `--ink` | `#171512` | `#F3EEE3` | texto |
| `--ink-muted` | `#6B6357` | `#A79D8C` | texto secundário; borda de controles |
| `--line` | `#DAD2C2` | `#34302A` | réguas decorativas |
| `--accent` | `#C43A00` | `#FF5A1F` | vermelhão — momentos |
| `--on-accent` | `#FFFFFF` | `#201008` | texto sobre accent |
| `--accent-soft` | `#F3E2D8` | `#3A2114` | tintas de seleção / fundo suave |
| `--focus` | = accent | = accent | anel de foco |

Contrastes verificados: todos os pares de texto ≥ 4,5:1 (AA) nos dois temas; foco ≥ 3:1. Cor nova só via ADR.

### Tipografia

- **Archivo** (display; pesos 500–800): H1–H3, números das cartas, carimbos, wordmark.
- **Instrument Sans** (UI; pesos 400–700): corpo, rótulos, botões, estatísticas.
- Escala: `12 / 13 / 16 / 20 / 24 / 32 / 44 / 64` (etiqueta → display). Corpo 16/1.5; display com entrelinha 1,05–1,15 e tracking −0,01em; etiquetas em caixa alta, 12px, tracking +0,08em.
- Estatísticas e números de mesa: `font-variant-numeric: tabular-nums`.

### Espaçamento, forma e elevação

- `--space-1…9`: `4/8/12/16/24/32/48/64/96`; grid de 8.
- Raios: `--radius-sm: 2px`, `--radius-md: 4px` (papel cortado). Sem pílulas.
- Elevação: `--shadow-cut: 0 2px 0` (tinta a ~14% no claro; preto a 50% no escuro) — só em recortes (cartas, sheets, botão-carimbo).

### Movimento

- Durações `120/160/200/280ms`; easings: `--ease-out: cubic-bezier(.2,.8,.2,1)`; `--ease-snap: cubic-bezier(.3,1.4,.4,1)` (assentamento de carta).
- Momentos: voto assentado (~160ms) · reveal = tiragem (200ms, stagger 24ms) · carimbo = impacto (200ms) · réguas abrem (280ms) · balão de cutucada · projétil (física atual, reestilizada).
- `prefers-reduced-motion`: corte/fade curto; nunca remove informação.

### Acessibilidade

- Alvos ≥ 44px; foco visível sempre (anel 2px `--focus`, offset 2px; sobre accent, anel em `--ink`).
- Texto ≥ 4,5:1; ícones e limites ≥ 3:1; estados async com `aria-live`; teclado completo (deck com roving tabindex; atalhos R/N).

### Ícones e imagens

- Ícones: traço 1,5–2px, grid 24, cantos retos; preenchimento só em carimbos.
- Sem foto ou ilustração pesada; imagem = composição tipográfica ou diagrama de tinta. OG image = "folha de prova" (wordmark + cartas).

## Aplicação por superfície

- **Landing** (`/`): folha de prova; CTA primário "Criar sala" (botão-carimbo); secundário discreto "Entrar com código"; demo = prova de prensa com simulação explícita.
- **Sala** (`/s/:code`): mesa de composição; cartas = tipos; reveal = tiragem; stats = leitura de medidas com réguas; pauta = comanda.
- **Guias e landings SEO**: coluna tipográfica; estrutura SEO (meta/canonical/hreflang/JSON-LD) intacta.
- **Join e 404**: folhas pequenas, mesmo sistema.

## Governança

- Fonte de verdade do design; desvios pedem ADR ou edição aqui.
- Componentes: primitivos genéricos (coss) restilizados sob os tokens + componentes de domínio próprios (carta, assento, comanda, carimbo, réguas).
- O visual antigo não é referência em momento algum; assets antigos (CSS, componentes, OG, favicons) são substituídos conforme cada issue.
