---
version: v3-monochrome-convergence
name: Pointly - Monochrome Convergence
colors:
  bg: "#f5f5f5"
  surface: "#ffffff"
  sunken: "#ebebeb"
  fg: "#171717"
  fg-soft: "#383838"
  fg-mute: "#525252"
  fg-faint: "#626262"
  primary: "#171717"
  on-primary: "#fafafa"
  primary-hover: "#383838"
  line: "#c9c9c9"
  focus: "#171717"
typography:
  sans: Geist
  mono: Geist Mono
rounded:
  control: 3px
  card: 10px
spacing:
  header: 72px
  column: 1440px
---

# Pointly: Monochrome Convergence

## Compromisso

Direção aprovada: linguagem visual do factory.ai em **todas** as telas, sem copiar sua marca. Geist, Geist Mono, composição ampla, controles precisos, superfícies planas e hairlines. A identidade anterior azul e a etapa intermediária com laranja foram substituídas. O nome Pointly permanece; quatro perspectivas convergem para um centro aberto no símbolo original.

A landing apresenta o produto; entrada, arena e recuperação priorizam a tarefa. Times usam a mesa em ambientes claros e escuros, por isso ambos os temas têm o mesmo nível de acabamento. Tema explícito vence a preferência do sistema; o terceiro estado do seletor volta ao sistema.

## Contrato

- Landing: headline central em duas linhas no desktop e mobile, descrição real, criar/entrar e demonstração identificada como exemplo. Passos sequenciais, não uma grade de benefícios inventados.
- Entrada: título e explicação à esquerda, formulário à direita; uma coluna no mobile. Preservar criação, convite, entrada manual, validação e recuperação de código inexistente.
- Arena: pessoas, andamento, deck, revelação e nova rodada. Votos continuam privados até a revelação. Backend e store seguem como autoridade.
- Recuperação: sala cheia, 404 e carregamento usam a mesma navegação, tipografia, superfícies e ações.
- Navbar: fixa, ampla no topo; compacta ao rolar por transform/opacity, sem animar largura, altura ou posição de layout.
- Não inventar métricas, links, depoimentos ou funcionalidades. Não adicionar dependências para efeitos visuais.

## Cores

| Papel | Claro | Escuro |
| --- | --- | --- |
| Página | `#f5f5f5` | `#111111` |
| Superfície | `#ffffff` | `#191919` |
| Rebaixo | `#ebebeb` | `#080808` |
| Mesa / seleção suave | `#ebebeb` | `#242424` |
| Texto principal | `#171717` | `#eeeeee` |
| Texto suave | `#383838` | `#d4d4d4` |
| Texto secundário | `#525252` | `#b6b6b6` |
| Texto discreto | `#626262` | `#a3a3a3` |
| Primário | `#171717` | `#eeeeee` |
| Sobre primário | `#fafafa` | `#171717` |
| Hover primário | `#383838` | `#d4d4d4` |
| Hairline | `#c9c9c9` | `#414141` |

`accent`, `signature`, `accent-ink` e `focus` são aliases neutros. Não existe exceção laranja no produto: criar, entrar, copiar, revelar e carta selecionada seguem o mesmo par primário. Avatares também são neutros; o próprio participante recebe o par primário invertido.

Cores semânticas não são marca: erro `#a32e3b/#ffe8eb`, sucesso `#256a52/#dff2e9`, atenção `#835007/#fff0ce`; no escuro, pares `#ff8c96/#3b2025`, `#8fce9f/#1f3830`, `#e4bc75/#373022`. Estados sempre incluem texto ou outro sinal, nunca só cor.

## Tipografia

- Geist local: interface, títulos, nomes e textos. Geist Mono local: CTAs, códigos, timer e votos. Sem terceira família.
- Hero: peso 500, uppercase, `clamp(3rem, 5.2vw, 4.6rem)`, line-height 1, tracking -0.04em. Até 600px: `clamp(2rem, 8.8vw, 3.4rem)` para manter a frase legível sem seis linhas.
- H2: peso 500, `clamp(2rem, 3.5vw, 3.2rem)`, line-height 1.04. Entrada: 3rem, 2rem mobile. Recuperação: 2.3rem a 4rem.
- Corpo: 16px/1.5; lede: 17px/1.65; legenda: 14px/1.55. Textos secundários não usam hairline como cor.
- CTAs: mono 13px, peso 600, uppercase e tracking 0.06em; tamanho do botão altera área de toque, não a hierarquia tipográfica.
- Dados numéricos: tabulares. Nomes longos podem truncar no assento, mantendo `title` e nome acessível.

## Navegação

`SiteHeader` é compartilhado pela landing, join, arena, full, 404 e fallback de carregamento. Altura reservada de 72px, largura máxima de 1440px, padding 36/28/16px.

Após 48px de scroll, os grupos transladam para dentro até 160px e descem 8px. Uma superfície compacta entra por opacity/transform; o fundo amplo sai por opacity. Controles não são escalados e mantêm 44px. O listener é passivo, usa no máximo um requestAnimationFrame pendente e cancela o frame ao desmontar.

No mobile a compactação é vertical, sem deslocamento horizontal. Até 380px, apenas o símbolo aparece no link da marca para preservar todas as ações; o nome acessível continua completo. Movimento reduzido mantém os mesmos estados sem transição perceptível.

## Componentes

- Marca: wordmark minúsculo Geist 600; símbolo SVG de quatro cantos independentes, centro vazio, preenchimento `currentColor`. Não usar a estrela do Factory nem o antigo bloco 2x2 inclinado.
- Botões: primário sólido, secundário transparente com borda, ghost para ações terciárias. Radius 3px e mínimo de 44px. Sem textura diagonal ou grain.
- Superfícies: fundo + hairline, radius 10px, sem sombra decorativa. Sombra suave apenas no modal; o modal usa sombra sem borda duplicada.
- Formulário: inputs com 16px mínimo, padding responsivo, foco visível, erros inline e botões com texto de carregamento. Não substituir validação por cor.
- Deck: seleção sólida com texto invertido, `aria-pressed`, foco e navegação por teclado preservados. Scroll horizontal com indicação de continuidade quando necessário.
- Assentos desktop: grade interna compacta, avatar 32px, nome e estado/voto; mínimo de 96px de altura. Borda e badge identificam o próprio participante. Dimensões não podem colidir com posições vizinhas.
- Resultados: painel de dados com média, mediana e intervalo; unânime explícito, sem enfeites de estrelas. `output` fornece semântica de status, com anúncio polite.
- Ajuda: overlay com foco preso, Escape e retorno ao acionador; conteúdo interno em fluxo com gap de 16px e scroll em telas baixas.
- Toasts: semântica e fechamento preservados. No mobile ficam acima do deck, sem cobrir o resumo superior de votos.

## Responsividade

- Acima de 1050px: mesa elíptica, geometria existente e até 12 assentos ao redor.
- De 640px a 1050px: o mesmo componente de assento passa para grade de três colunas; resumo/ação no topo. Não comprimir a mesa até sobrepor pessoas.
- Abaixo de 640px: lista de participantes e dock de voto, com safe-area, rolagem de cartas e alvos de toque preservados.
- Entrada abaixo de 720px: uma coluna. Todos os shells respeitam viewport dinâmico e o tratamento de teclado existente.
- Focus: outline 3px com offset 3px. Seleção de texto, caret, scrollbar e controles nativos usam os tokens do tema.
- Transições de interface limitadas a transform/opacity. `prefers-reduced-motion` reduz animações e transições; projéteis existentes permanecem funcionais com seu fallback.

## Assets e Fonte de Verdade

- `apps/web/src/index.css`, `tailwind.config.ts` e `styles/*.css` definem o sistema implementado.
- `public/favicon.svg` compartilha a geometria de `Brand`; inverte no tema escuro do sistema.
- `public/logo.png` (512x512) e `public/og-cover.png` (1200x630) mantêm suas URLs anteriores. Fonte reproduzível: `apps/web/brand-assets.html`, renderizada no Vite com os mesmos fonts locais; exportar os elementos `#logo` e `#og` em escala CSS.
- Nomes legados `coral`, `mustard`, `paper-*`, `surface-noise` e variantes existentes continuam disponíveis aos consumidores e testes, mas não reintroduzem a paleta antiga ou textura.
- Não alterar backend, protocolo, persistência, rotas ou fluxo para resolver problemas visuais.

## Verificação

Capturas locais desta implementação estão em `.uizze/review/`. Fluxo real com dois participantes cobriu criação, convite, votos distintos, revelação, mediana, ajuda e nova rodada. A disposição de 12 pessoas foi exercitada com fixture visual local em 1440, 1051, 768, 640 e 390px, sem sobreposição de assentos. Fixture não é alegação de teste de carga nem de doze conexões reais.

Revisão 2026-09-07 (sessão atual): estados críticos (Pill `critical`, TimerPill ≤30s, Pill `gold`) migrados de aliases neutros para o par `warning`/`warning-soft`, com testes unitários e spec UX FMR-21 atualizados; CTAs e seleção permanecem no par primário neutro (preto no claro, claro no escuro). Validado nesta sessão: `test:web` 351 pass / 0 fail, `typecheck` OK nos 5 pacotes, `build` web OK; inspeção visual no dev server em landing (claro, escuro e 390px), join?host=1, /full, 404 e /arena desktop, com navbar compactando ao rolar (`data-scrolled=true`, 72px preservados). `bun run lint` segue com 401 erros pré-existentes no repo (formatação e exhaustive-deps legados); nenhum erro novo nas linhas alteradas. Specs UX legadas `02-visual`/`07-phase2` ainda citam a paleta laranja antiga e não foram migradas. Sem revisão independente por subagente (ferramenta indisponível nesta sessão).
