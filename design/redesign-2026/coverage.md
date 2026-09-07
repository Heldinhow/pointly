# Pointly — redesign integral

## Estado da entrega

Etapa atual: comparação de três propostas navegáveis. Mesa compartilhada escolhida pelo usuário; paleta em revisão. Nenhuma direção aplicada ao frontend de produção. Este diretório contém estudos isolados com dados demonstrativos e fontes locais. O plano do usuário exige a decisão visual antes da consolidação e implementação; a resposta do usuário na conversa será o registro da escolha.

## Decisões já confirmadas

- Manter somente o nome Pointly; refazer símbolo, identidade, layouts e componentes.
- Personalidade colaborativa e marcante; prioridade: identidade memorável.
- Redesenhar visual e experiência preservando funcionalidades, URLs, backend e protocolos.
- Cobertura total em claro/escuro, desktop/mobile; sala com 1, 2, 6 e 12 participantes.
- Estudos no navegador precedem a implementação da identidade escolhida.

## Contrato das propostas

| Proposta | Hierarquia | Sistema visual | Risco a avaliar |
|---|---|---|---|
| A · Mesa compartilhada | Participantes ao redor, andamento/resultado no centro, deck pessoal abaixo | Verde botânico, branco fresco, Manrope + Space Grotesk, símbolo de quatro peças reunidas | Legibilidade e espaço na mesa com 12 pessoas |
| B · Mural de participantes | Participantes em módulos, andamento coletivo, controles de rodada | Cobalto, azul claro e pêssego, módulos de pessoas | Evitar que a reunião pareça uma lista administrativa |
| C · Cartas em primeiro plano | Carta/estimativa, revelação e resultados, participantes como contexto | Ameixa, rosa e pêssego dourado, números expressivos | Não esconder quem votou atrás da expressão gráfica |

Cada estudo tem landing, sala, seleção de voto, revelação, nova rodada, tamanhos de equipe, tema e apresentação mobile. Timer, nomes, presença e votos dos outros participantes são demonstrativos. O botão de convite explica a simulação; nenhum link de sala real é criado. Este contrato é de comparação, não a especificação final dos componentes.

## Diagnóstico renderizado inicial — ui-slop-score

Evidência: interface local http://localhost:5173, inspecionada em 6 de setembro de 2026. A avaliação não atribui pontuação numérica porque não foi solicitada explicitamente. Até três achados prioritários:

1. **Criação com linguagem de entrada.** O CTA “Criar sala” leva a `/join?host=1`, com título “Entrar na sala” e botão “Entrar”. Impacto: a ação seguinte contradiz a intenção inicial. Correção: diferenciar criação, entrada manual e convite por título, contexto e verbo do CTA.
2. **Participante e ação central pequenos no desktop.** Sala com uma pessoa a 1280×720: assento/nome e texto de revelação ocupam uma região muito pequena, enquanto sobra grande área vazia. Impacto: dificulta reconhecer presença e próximo passo. Correção: manter tamanho legível dos controles e compor o grupo sem escalar textos com a mesa.
3. **Convite interrompe a chegada.** Com uma pessoa, um overlay cobre e desfoca toda a sala até ser dispensado. Impacto: o participante precisa fechar uma camada para conhecer a mesa. Correção proposta: incorporar o convite ao estado de espera, preservando acesso direto ao deck e ao compartilhamento.

Landing e criação foram observadas também na etapa de planejamento. Diagnóstico visual de produção com 2/6/12 participantes, tema escuro, mobile, resultados, modais de ajuda, offline/reconexão e recuperação: **não verificado nesta etapa**. Inventário por código existe abaixo; não confundir inventário com validação renderizada.

## Matriz obrigatória de implementação após a escolha

| Superfície | Estados e comportamento | Critério de aceitação |
|---|---|---|
| Landing `/` | Cabeçalho, hero com produto reconhecível, criar/entrar, explicação, FAQ, rodapé | Conteúdo em português consistente com deck/código reais; ações com destino correto |
| Criar `/join?host=1` | Apelido, vazio/inválido/válido, envio, erro | Título e CTA de criação; não adicionar configuração desnecessária |
| Entrada `/join` | Código editável de 4 caracteres e apelido; validação/verificação | Corrigir erros sem recomeçar o fluxo |
| Convite `/join?code=…` | Código recebido, apelido, sala inexistente, falha de rede | Recuperação clara preservando o contexto de convite |
| Arena `/arena` | Conectando, espera, voting, revealable, revealed, próxima rodada | UI segue estado servidor; qualquer jogador mantém ações permitidas |
| Participantes | 1/2/6/12, anfitrião, você, voto oculto, revelado, mediana, desconectado, nome longo | Estados diferenciados por texto/forma além de cor; alvos de toque legíveis |
| Resultados | Mediana, média, intervalo, unanimidade, voto de pausa | Refletir dados existentes sem inventar decisão final ou alterar regras |
| Controles | Deck real, timer, compartilhar, reações, cooldown, ajuda de teclado | Preservar interações, autoridade do servidor e atalhos |
| Espera/ajuda/saída | Convite, ajuda, confirmação de saída | Foco inicial e retorno, Escape onde aplicável, labels claros |
| Recuperação | `/full`, 404, sala encerrada, offline, reconexão, erros | Próxima ação explícita; não sugerir conexão inexistente |
| Transversal | Fallback, toast, foco, hover, disabled, loading, temas e motion reduzido | Cobertura claro/escuro, teclado, 360/390/768/1280/1440px e orientação |

## Fronteiras e execução

Aplicar a identidade em páginas, componentes apresentacionais, CSS/tokens e Tailwind. Preservar schemas, eventos, transporte, store e loops de sincronização. Manter rotas, links, IDs de teste comportamentais e regras de domínio; atualizar testes de aparência que codificam o sistema descartado. Alterações preexistentes no checkout não pertencem ao redesign.

Depois da escolha: registrar identidade em documento final, detalhar todas as linhas da matriz, implementar fundamentos+sala; criação/entrada; landing; recuperação/transversal. Validar cada fatia e concluir com revisão integral.

## Validação de produto futura

- Fluxo multi-client real: criar → entrar → votar → revelar → próxima rodada; reconnect e sala cheia.
- `bun run typecheck`, `bun run build`, `bun run test:all`, UX/axe/responsividade com baselines novos somente depois da revisão visual.
- Baseline da exploração anterior: tipos passaram; 111 testes shared, 163 server, 340 web passaram e 1 teste de Pill falhou por expectativa de classe `bg-coral-soft`. Não declarar regressão nova sem comparar com esse estado.
- Avaliar controle por teclado, foco/restauração em modais, contraste, toque ≥44px, nomes longos, scroll e ausência de sobreposição nos dois temas.

## Fontes

Fontes locais Manrope (400, 800) e Space Grotesk (700), distribuídas pelo Google Fonts; arquivos de licença junto aos assets. Nenhum pedido de fonte externa é feito pelos estudos.

## Validação dos estudos — 6 de setembro de 2026

- Scripts inline A/B/C passaram em verificação de sintaxe JavaScript.
- Inspeção renderizada: landing A/B/C; sala A com 6 e 12 pessoas; A mobile escuro; B mobile; C mobile claro/escuro.
- Navegação local e controles de votação/revelação foram exercitados no navegador. A com voto 5 e seis pessoas exibiu mediana 5, média 5,7 e intervalo 3–8.
- B com uma pessoa e voto ½ exibiu mediana/média 0,5 e intervalo 0,5–0,5.
- C com uma pessoa e pausa exibiu estatísticas vazias; nova rodada ocultou o painel; duas pessoas com 0 e 5 exibiram 2,5; com ½ e 5 exibiram mediana exata 2,75.
- Viewport real 360×800: `document.documentElement.scrollWidth === innerWidth === 360` em A, B e C. A e B renderizaram 12 participantes nesse teste.
- Revisão independente encontrou cinco problemas de simulação/mobile; foram corrigidos. A revisão de fechamento confirmou quatro categorias e pediu preservar precisão da mediana fracionária em C; correção confirmada no navegador com resultado 2,75.
- Nenhuma alteração nesta etapa em páginas de produção, backend, schemas ou transporte. Tipos/build/E2E do produto serão executados quando a identidade escolhida for integrada.
- Isto não é uma certificação de acessibilidade: axe, testes multiclient do produto e a matriz integral de estados continuam na etapa de integração.

## Revisão de cores da mesa compartilhada

O usuário escolheu a composição A e pediu substituir suas cores, mantendo light/dark. A proposta agora oferece Azul tinta (sugestão inicial), Ameixa e Grafite e âmbar, além do verde original para comparação. Nenhuma das novas paletas está aprovada ainda. A troca preserva tela, voto e estado da rodada.

Cada paleta define fundo, superfície, texto, texto secundário, mesa, ação, foco, símbolo e avatar local; o tema escuro tem valores próprios. Checagem dos tokens: menor contraste de texto/botão nas seis combinações 5,53:1; menor contraste de foco contra a mesa 5,11:1. JavaScript validado por sintaxe; Azul tinta inspecionado renderizado. A aprovação pendente é da cor, não mais da composição.
