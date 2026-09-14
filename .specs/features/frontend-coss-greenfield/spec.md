# Spec — Frontend greenfield em coss (Pointly)

> Status: **ready-for-agent** · última atualização: 2026-09-13
> Decisão do solicitante: greenfield com componentes coss do zero (não restaurar o frontend anterior) + nova identidade visual sobre coss (não manter a identidade Spell anterior).
> Backend pronto: Bun + Hono + WebSocket em `/ws`, REST `GET /api/v1/salas/:code`, estado em memória.
> Glossário de domínio: `CONTEXT.md` (Sala, Host, Player, Apelido, Código, Assento, Rodada, Voto, Reveal, Mediana, Deck, Timer, Projétil, Arremesso, Cooldown).
> ADRs de referência: estado em memória efêmero; Bun + Hono + WebSocket; React + Vite + TS sem SSR e sem Context para a Sala; Zustand + Zod com schemas compartilhados como fonte única do wire format; UUID client-side para reconnect; Host é criador, não governante (reveal e nova rodada democráticos); Tailwind + primitivos de UI copiáveis + Bun Test + Playwright multi-client.

## Problem Statement

Times ágeis (até 12 pessoas por Sala) precisam estimar trabalho de forma síncrona em calls de planning sem cadastro, sem e-mail e sem plano pago. O backend do Pointly já existe e é source of truth para fase, Timer, Votos e presença — mas o diretório do frontend está vazio, então hoje não há como criar Sala, entrar, votar, revelar ou abrir nova Rodada pelo navegador.

## Solution

Single-page application React + Vite + TypeScript, estado global com Zustand, validação com Zod espelhando os schemas compartilhados, estilização Tailwind v4 CSS-first e 100% dos primitivos de UI vindos do catálogo coss (sobre Base UI), com identidade visual nova dark-first própria. Três superfícies: página inicial (com demonstração simulada), entrada/criação de Sala e Arena da Sala. Comunicação em tempo real via WebSocket e um pre-check REST de existência da Sala antes do join. Atalhos de teclado para revelar e nova Rodada, Timer compartilhado visível, estatísticas pós-reveal e interações de Projétil com cooldown.

## User Stories

### Criar Sala e entrar

1. Como visitante, quero usar o site sem cadastro informando um Apelido de 2 a 20 caracteres, para entrar rápido na estimativa.
2. Como Player criador, quero criar uma Sala e receber automaticamente um Código de quatro caracteres assumindo o papel de Host, para convidar o time.
3. Como convidado, quero entrar informando o Código (convertido para maiúsculas) ou abrindo o link de convite com a Sala já preenchida, para não errar na digitação.
4. Como visitante, quero que campos inválidos impeçam o envio e que Código inexistente retorne "Sala não encontrada", para entender o que corrigir.
5. Como time, quero que Apelidos repetidos sejam aceitos como Players distintos, para não travar homônimos.
6. Como visitante, quero que a existência da Sala seja verificada antes do join, para falhar rápido com mensagem clara em vez de erro genérico de socket.

### Compartilhar e acompanhar a Sala

7. Como Player, quero copiar o link de convite com confirmação de cópia, para compartilhar a Sala.
8. Como único Player na Sala, quero ver o convite com opção de ocultá-lo, para focar quando quiser.
9. Como Host sozinho, quero conseguir votar mesmo sem companhia, para testar o fluxo.
10. Como Player, quero identificar a Sala, o número da Rodada, quem sou eu e quem é o Host, para me situar.
11. Como Player, quero ver presença e quantidade de Votos atualizadas em tempo real, para saber o andamento.
12. Como Player tardio, quero entrar com uma Rodada já em andamento, para não esperar a próxima.

### Votar

13. Como Player, quero estimar com o Deck fixo (0, ½, 1, 2, 3, 5, 8, 13 e pausa para café), para cobrir a escala do time.
14. Como Player, quero manter uma estimativa por Rodada e poder substituí-la, para corrigir minha leitura.
15. Como Player, quero que clicar de novo na mesma carta mantenha o Voto sem removê-lo, para não perder meu Voto por duplo clique.
16. Como Player, quero conhecer minha escolha antes do Reveal e ver dos demais apenas "Aguardando" ou "Votou", para não ancorar minha estimativa.
17. Como time, quero que a pausa conte como participação mas fique fora dos cálculos numéricos, para pausar sem distorcer as estatísticas.

### Controlar o tempo

18. Como Sala, quero cada Rodada com 60 segundos parados até o primeiro Voto e contagem compartilhada depois, para dar ritmo sem pressa inicial.
19. Como Player, quero ver o tempo restante compartilhado e o estado crítico (coral) na reta final, para sentir a urgência.
20. Como Sala, quero informar "pronta para revelar" quando todos votarem sem revelar de imediato, para o time escolher o momento.
21. Como Sala, quero Reveal automático ao zerar o Timer mesmo com faltantes, para a Rodada nunca travar.

### Revelar e discutir

22. Como qualquer Player, quero revelar após pelo menos um Voto via comando ou atalho R, encerrando a contagem e indo à discussão, sem depender do Host.
23. Como time, quero ver todos os Votos individuais após o Reveal e manter sem estimativa quem não votou (sem zero automático), para discutir com dados honestos.
24. Como Player, quero votar ou alterar meu Voto depois do Reveal com resultado atualizado para todos, para convergir na discussão.

### Calcular os resultados

25. Como time, quero ver média, mediana, menor e maior estimativa e quantidade de Votos por valor, para decidir o encaminhamento.
26. Como time, quero ver identificados unanimidade, Voto único e ausência de Votos numéricos, para ler o consenso de relance.
27. Como time, quero que ½ valha 0,5 e zero seja Voto válido, com pausa e ausência fora dos cálculos, para estatísticas corretas.

### Começar outra Rodada

28. Como qualquer Player, quero solicitar nova Rodada com segunda ativação de confirmação (com expiração que volta ao estado inicial) e atalho N com a mesma confirmação, para evitar Rodada acidental.
29. Como Sala, quero que a nova Rodada incremente o número, limpe Votos e resultados e restaure os 60 segundos mantendo Código, convite e Players, para recomeçar sem fricção.

### Manter a sessão e a continuidade

30. Como Player, quero recarregar a página e recuperar identidade, Sala e Rodada atual, para não perder meu lugar.
31. Como Player, quero sair da Sala atualizando a presença para os demais, para o time saber quem ficou.
32. Como Sala, quero que a saída do Host promova automaticamente outro Player (o mais antigo) e tudo continue funcionando, para não depender de uma pessoa.

### Funcionalidades complementares

33. Como visitante, quero na página inicial escolher uma estimativa, revelar Votos simulados, consultar estatísticas e tentar de novo, para entender o produto sem entrar em Sala.
34. Como Player após o Reveal, quero enviar a outro Player uma interação (bola de papel, tomate, café, pato, estrela, coração ou aplausos) com intervalo de recarga entre envios, para descontrair a discussão.

## Implementation Decisions

- **Módulos a construir:** roteador de superfícies (inicial, entrada, Arena); cliente WebSocket (URL resolvível por ambiente, reconnect com backoff, heartbeat de ping, hello único por conexão); identidade client-side (UUID persistido para reconnect, normalização do Código para maiúsculas alfanuméricas); pré-check REST de Sala; store global plano da Arena (Sala, eu, fase, Timer, último resultado de Reveal); componentes de Deck, Assentos, Timer, resultados, convite e Projéteis; camada de demonstração simulada da página inicial sem socket.
- **Seam de teste/integração:** um único seam alto — o conjunto store da Arena + cliente WebSocket. Handlers de domínio do servidor não são tocados; o frontend apenas consome o wire format. Essa escolha foi confirmada com o solicitante via decisão greenfield.
- **Contrato de API consumido:** eventos cliente→servidor para hello, votar, revelar, nova Rodada, sair, ping e arremessar Projétil; eventos servidor→cliente para boas-vindas, estado da Sala, Voto computado (individual no primeiro Voto da Rodada, agregado nos seguintes, sem expor valores pré-reveal), Votos revelados com estatísticas, início de Rodada, saída de Player, fim de Sala, Projétil arremessado, erros tipados e pong.
- **Regras de negócio espelhadas no cliente (servidor continua source of truth):** Apelido 2–20 sem espaços duplos nem nas pontas; Código de 4 alfanuméricos maiúsculos; un-vote proibido; mesma carta em duplo clique é no-op sem broadcast; pausa participa mas não entra nos cálculos; Timer 60s parado até o primeiro Voto, crítico na reta final, auto-reveal no zero; qualquer Player revela ou abre nova Rodada; nova Rodada exige confirmação dupla com expiração; cooldown entre arremessos com sorteio de desfecho (acerto, desvio, rebote) vindo do servidor.
- **Composição coss (verificar importações e hierarquias trigger/conteúdo na documentação de cada primitivo antes de codar; não inventar APIs):** botões para ações primárias e cópia com feedback; cartões e molduras para Sala, resultados e demonstração; avatares com grupo sobreposto para os 12 Assentos; selos para Host, "eu", estado de Voto e Timer crítico; campos e grupos com rótulo acima e erro abaixo para Apelido e Código (campo de código curto para os 4 caracteres); brindes (toasts) via gerenciador do catálogo para cópia, erros e cooldown; diálogos para confirmação de nova Rodada; dicas (tooltips) para atalhos; medidores de progresso para o Timer; esqueletos para carregamento do estado; estado vazio para Sala solo; indicador de teclado para R e N.
- **Sistema de design (Tailwind v4, configuração CSS-first):** tokens em três camadas (primitivos → semânticos → componente), cores em formato perceptual, um único acento com saturação contida travado na página inteira, uma escala de raio documentada e seguida em toda parte, tipografia display + mono para números/Timer/Código, modo escuro como padrão respeitando preferência do sistema, escala de z-index semântica documentada.
- **Direção de produto:** calibragem intermediária — assimetria moderada, movimento presente mas sempre motivado (Voto, Reveal, Projétil, Timer crítico) com respeito a preferência por movimento reduzido, densidade de app diário. Proibidos os padrões-telhado de IA: gradiente roxo/néon, hero de métrica gigante, cartões idênticos em grade infinita, rótulo pequeno em caixa alta sobre toda seção, ilustrações SVG desenhadas à mão, screenshots falsos de divs.
- **Interações:** atalho R revela, atalho N pede/confirma nova Rodada; remetente recebe estado completo após votar (o evento de Voto não carrega valor por privacidade); edição pós-reveal retransmite resultado; saída envia despedida após boas-vindas; reconexão reenvia hello com o mesmo UUID.
- **Decisões de arquitetura herdadas e respeitadas:** sem renderização no servidor; sem Context para a Sala; schemas compartilhados como fonte única do wire format; Sala efêmera some com o último Player; presença com período de graça para desconectados.

## Testing Decisions

- **O que é um bom teste aqui:** apenas comportamento externo observável (o que o Player vê e o que trafega no socket), nunca detalhes de implementação de componentes ou do store.
- **Módulos a testar:** normalização e validação de Apelido/Código; espelho client-side das estatísticas de consenso; guards de atalho e da confirmação dupla de nova Rodada com expiração; cooldown de Projéteis; máquina de estados da Arena (fases, Timer, Reveal, nova Rodada).
- **Prior art:** suíte de testes do servidor como especificação executável do contrato; testes multi-cliente com automação de navegador como referência para os fluxos de sincronia.
- **Cobertura por nível:** unidade para validadores, consenso e guards; integração contra servidor WebSocket simulado (hello→boas-vindas, Voto→estado/evento de Voto, Timer zerado→Reveal, Projétil com cooldown); ponta a ponta com dois navegadores na mesma Sala (sigilo pré-reveal, Reveal coletivo, estatísticas, reload que recupera, saída do Host que promove, auto-reveal no zero, demonstração da inicial).
- **Gates antes de declarar pronto:** verificação de tipos sem emissão, suíte de testes do frontend, auditoria de contraste e navegação por teclado, Core Web Vitals dentro do alvo, página verificada nos dois temas e em mobile estreito e paisagem.

## Out of Scope

Restaurar o código do frontend anterior; qualquer mudança no backend, banco ou autenticação; chat, voz ou vídeo; histórico de Rodadas; mais de 12 Assentos por Sala; novos tipos de Projétil; renderização no servidor; internacionalização além de pt-BR; analytics além de medição opcional desativada por padrão; curva de aprendizado de outros produtos como referência obrigatória.

## Further Notes

- Ordem de execução sugerida: contrato compartilhado mínimo primeiro, depois scaffold com coss e tokens, depois entrada e demonstração inicial, depois Arena (Assentos, Deck, Timer, Reveal, resultados), depois nova Rodada com atalhos, depois Projéteis, por fim reconnect, heartbeat, polimento e auditoria.
- O pré-check REST de existência acontece no submit da entrada, antes do hello via socket; o handler de hello continua sendo a autoridade final contra condição de corrida.
- Publicar este spec como issue com o rótulo de triagem de pronto-para-agente; quebrar em tickets tracers só depois da aprovação do spec.
