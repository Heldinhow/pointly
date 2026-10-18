import type { GuideCopy } from "./guide-content";

const META_OUT_2026 = "Pointly · atualizado em outubro de 2026";

export const SITE_GUIDE_CONTENT_PT: Record<string, GuideCopy> = {
	"planning-poker-remoto": {
		lang: "pt-BR",
		path: "/guias/planning-poker-remoto",
		h1: "Planning poker remoto: como estimar com time distribuído",
		lede: "Planning poker remoto funciona igual ao presencial: cada pessoa vota em segredo e as cartas são reveladas juntas. Em chamada de vídeo, use uma ferramenta que esconda os votos até todos votarem, em vez de digitar números no chat, que causa ancoragem. Discuta primeiro os extremos, limite o tempo por história e registre o valor combinado.",
		meta: `8 min de leitura · ${META_OUT_2026}`,
		tocLabel: "Neste guia",
		back: { to: "/guias", label: "Guias de planning poker" },
		sections: [
			{
				id: "o-que-muda-no-remoto",
				title: "O que muda quando o time vira remoto",
				blocks: [
					{
						type: "p",
						text: "Presencial, o voto secreto acontece por gesto: todos seguram a carta virada e viram juntas. Em chamada de vídeo, o padrão vira digitar o número no chat ou falar a estimativa em voz alta, e aí a primeira resposta ancora todas as outras. O ritual continua o mesmo; muda o cuidado para preservá-lo.",
					},
					{
						type: "list",
						items: [
							{
								title: "Voto no chat = ancoragem.",
								body: "Quem digita primeiro vira a referência. Os demais ajustam o número para perto do que já viram, mesmo sem perceber. É o efeito que o voto simultâneo existe para evitar.",
							},
							{
								title: "Atenção dispersa e histórias não lidas.",
								body: "Em casa, é fácil entrar na reunião sem ter aberto o item do backlog. Contexto escrito com antecedência e um ou dois minutos de leitura silenciosa antes do voto resolvem boa parte disso.",
							},
						],
					},
					{
						type: "p",
						text: "Há também o efeito das câmeras desligadas. Não é preciso exigir vídeo, mas ajuda combinar que quem fala se identifica pelo nome e que quem votou diferente tem espaço antes de o próximo item entrar na fila.",
					},
					{
						type: "p",
						text: "O que separa a estimativa remota de uma votação comum é o reveal simultâneo. O guia [o que é planning poker](/guias/o-que-e-planning-poker) explica por que revelar tudo junto muda a conversa, e a lógica vale igual quando o time está espalhado em videochamadas.",
					},
				],
			},
			{
				id: "sessao-remota-em-6-passos",
				title: "Como montar a sessão remota em 6 passos",
				blocks: [
					{
						type: "p",
						text: "A ordem abaixo serve para qualquer time distribuído. O que muda de um time para outro é o tempo de cada passo, não a sequência.",
					},
					{
						type: "steps",
						items: [
							{
								title: "Compartilhe o backlog antes.",
								body: "Item, contexto e critérios de aceite no canal do time com pelo menos algumas horas de antecedência, para quem vai votar chegar com a história lida.",
							},
							{
								title: "Escolha uma história de referência.",
								body: "Um item pequeno, conhecido e já entregue vira o parâmetro de comparação. O guia de [story points](/guias/story-points) mostra como calibrar essa régua.",
							},
							{
								title: "Crie a sala e convide.",
								body: "No [Pointly](/join), escolha um apelido e mande o código de 4 caracteres ou o link no chat da chamada. Sem cadastro e sem instalação, cada pessoa entra pelo navegador.",
							},
							{
								title: "Leia em silêncio, depois vote.",
								body: "Antes do voto, um minuto de leitura calada do item. Cada pessoa escolhe a carta sem ver a dos outros.",
							},
							{
								title: "Revelem juntos e discutam os extremos.",
								body: "A mediana, a média, o intervalo e a distribuição aparecem para todos. Quem votou menos e quem votou mais explicam primeiro, e o resto do time escuta antes de responder.",
							},
							{
								title: "Feche e registre.",
								body: "Depois de uma eventual segunda rodada, o valor combinado vai para o item no backlog, onde o time já trabalha. O número não pode morrer na ata da reunião.",
							},
						],
					},
					{
						type: "p",
						text: "Tudo o que é da votação acontece na sala: criar, votar, revelar e abrir nova rodada. [Crie uma sala](/join) e rode uma história de ponta a ponta antes da reunião com o time inteiro.",
					},
				],
			},
			{
				id: "agenda-de-exemplo",
				title: "Agenda de exemplo para 45 minutos",
				blocks: [
					{
						type: "p",
						text: "A agenda abaixo é uma sugestão, não uma regra. Ela reserva a maior parte do tempo para as histórias principais e deixa a abertura curta.",
					},
					{
						type: "table",
						headers: ["Bloco", "Tempo", "O que acontece"],
						rows: [
							[
								"Abertura",
								"5 min",
								"Contexto da sessão, combinado de tempo e leitura das primeiras histórias",
							],
							[
								"Calibração",
								"10 min",
								"Duas ou três histórias conhecidas para alinhar a régua de quem entrou depois",
							],
							[
								"Histórias principais",
								"20 min",
								"Votação, reveal e conversa sobre as divergências",
							],
							[
								"Reestimativa",
								"5 min",
								"Segunda rodada apenas para os itens que ficaram em aberto",
							],
							[
								"Fechamento",
								"5 min",
								"Registro dos valores combinados e próximos passos",
							],
						],
					},
					{
						type: "p",
						text: "Se a conversa de uma história passar de cinco minutos sem chegar a lugar nenhum, o problema costuma ser falta de contexto, não falta de consenso. Leve o item para refinamento e siga para o próximo. Uma sessão que termina com oito histórias fechadas vale mais que uma que travou na terceira.",
					},
					{
						type: "p",
						text: "Duas coisas ajudam a manter o ritmo: revezar quem apresenta cada história e anotar as dúvidas que aparecerem para responder fora da sessão. A reunião não precisa resolver tudo, só precisa fechar números com entendimento suficiente.",
					},
				],
			},
			{
				id: "fusos-horarios",
				title: "Fusos horários diferentes: opções",
				blocks: [
					{
						type: "p",
						text: "Time espalhado em vários fusos não tem solução mágica, mas tem dois caminhos que funcionam na prática.",
					},
					{
						type: "list",
						items: [
							{
								title: "Horário central rotativo.",
								body: "A sessão tem um horário fixo que muda de faixa a cada semana ou a cada quinzena, para não sacrificar sempre as mesmas pessoas.",
							},
							{
								title: "Discussão assíncrona fora da ferramenta.",
								body: "Contexto e dúvidas vão para o item no backlog ou para um canal escrito ao longo do dia; a votação acontece na próxima janela em que todos conseguem estar ao vivo.",
							},
						],
					},
					{
						type: "p",
						text: "Vale a honestidade sobre a ferramenta: o Pointly é uma sala em tempo real. Ela funciona quando o time está junto, ao vivo, com o reveal acontecendo na tela de todos. Não há modo assíncrono de votação, então a janela em que todos coincidem continua sendo necessária.",
					},
					{
						type: "p",
						text: "Evite fingir que o time inteiro votou quando metade assistiu à gravação depois. Estimativa é uma conversa, e quem não participou tende a discordar do número exatamente na sprint em que ele importa.",
					},
				],
			},
			{
				id: "erros-comuns",
				title: "Erros comuns em sessões remotas",
				blocks: [
					{
						type: "list",
						items: [
							{
								title: "Votar pelo chat ou em voz alta.",
								body: "O primeiro número dito ou digitado ancora a sala. O voto precisa ser secreto até o reveal.",
							},
							{
								title: "Estimar história que ninguém leu.",
								body: "Voto no escuro vira chute com cara de consenso. Contexto antes da reunião e leitura silenciosa na abertura.",
							},
							{
								title: "Discutir a solução em vez do tamanho.",
								body: "Quando o time começa a desenhar a implementação, a estimativa virou refinamento. Anote e siga, ou leve o item de volta.",
							},
							{
								title: "Deixar só o facilitador falar.",
								body: "No remoto é fácil a call virar apresentação de uma pessoa. Puxe explicitamente quem votou nos extremos.",
							},
							{
								title: "Passar do tempo combinado sem decidir.",
								body: "Se a história não fecha, ela volta para refinamento. Insistir só cansa o time e não melhora o número.",
							},
							{
								title: "Registrar o valor só depois, de memória.",
								body: "O número combinado vai para o backlog na hora, com a pessoa que o registrou visível para todos.",
							},
							{
								title: "Combinar tempo e ignorar o relógio.",
								body: "Sem alguém olhando o tempo, a sessão vira debate aberto. O combinado da abertura vale para todas as histórias.",
							},
						],
					},
				],
			},
			{
				id: "checklist-de-facilitacao",
				title: "Checklist de facilitação",
				blocks: [
					{
						type: "p",
						text: "Uma lista curta para conferir antes e durante a sessão remota.",
					},
					{
						type: "list",
						items: [
							{
								title: "Backlog compartilhado com antecedência.",
								body: "Cada item com contexto e critérios de aceite, no canal onde o time lê.",
							},
							{
								title: "História de referência escolhida.",
								body: "Uma pequena, já entregue e conhecida por todos.",
							},
							{
								title: "Sala criada e link no chat.",
								body: "Código de 4 caracteres ou link no mesmo lugar onde está a chamada de vídeo.",
							},
							{
								title: "Tempo combinado anunciado.",
								body: "Quanto dura a sessão e quanto, em média, cada história pode ocupar.",
							},
							{
								title: "Leitura silenciosa respeitada.",
								body: "Ninguém vota antes de o item ser lido.",
							},
							{
								title: "Extremos ouvidos primeiro.",
								body: "Quem votou menos e quem votou mais falam antes dos votos do meio.",
							},
							{
								title: "Uma segunda rodada, no máximo.",
								body: "Se o spread continuar grande, o item volta para refinamento.",
							},
							{
								title: "Valores registrados na hora.",
								body: "O número combinado entra no item do backlog antes de a reunião acabar.",
							},
						],
					},
					{
						type: "p",
						text: "Veja também: [story points vs horas](/guias/story-points-vs-horas) para responder prazo com velocidade e o [comparativo de ferramentas](/planning-poker-online-gratis-comparativo) para escolher a sala.",
					},
				],
			},
			{
				id: "perguntas-frequentes",
				title: "Perguntas frequentes",
				blocks: [],
			},
		],
		faq: {
			title: "Perguntas frequentes",
			items: [
				{
					question: "Como fazer planning poker remoto?",
					answer:
						"Cada pessoa vota em segredo na própria tela e as cartas são reveladas ao mesmo tempo. Numa chamada de vídeo, use uma ferramenta que esconda os votos até o reveal e reserve um tempo para discutir os extremos antes de fechar o número.",
				},
				{
					question: "Dá para fazer planning poker pelo Zoom, Meet ou Teams?",
					answer:
						"Sim, e a sala do Pointly funciona como uma aba ao lado da chamada: cada pessoa abre o link no navegador, vota e vê o reveal junto. A ferramenta de vídeo fica com a conversa, e a sala fica com o voto e as estatísticas.",
				},
				{
					question: "Como evitar ancoragem no planning poker online?",
					answer:
						"Nunca peça o voto pelo chat nem em voz alta. Cada pessoa escolhe a carta sem ver a dos outros, e só o reveal mostra os números. Discutir primeiro quem votou menos e quem votou mais também reduz o peso do número apresentado primeiro.",
				},
				{
					question: "Quanto tempo deve durar uma sessão remota?",
					answer:
						"Uma janela de 45 a 60 minutos costuma bastar para uma leva de histórias. Histórias pequenas levam de 2 a 5 minutos cada; se um item passa de dez minutos de conversa, falta contexto e ele deve voltar para refinamento.",
				},
				{
					question: "Quantas histórias estimar por sessão?",
					answer:
						"Depende do tamanho dos itens e de quanto o time já conhece o backlog. Com prática, uma sessão de 45 minutos cobre de 8 a 12 histórias pequenas, ou bem menos itens grandes. O critério é a qualidade da conversa, não a contagem.",
				},
				{
					question: "Como fazer com times em fusos horários diferentes?",
					answer:
						"Alterne o horário da sessão para não penalizar sempre o mesmo fuso, ou concentre a discussão no backlog escrito e use a sessão ao vivo só para votar. O Pointly é em tempo real, então a votação precisa de todos na sala ao mesmo tempo.",
				},
				{
					question: "Precisa de cadastro para usar o Pointly?",
					answer:
						"Não. O Pointly não pede conta nem email: você escolhe um apelido, cria a sala e compartilha o código de 4 caracteres ou o link. Qualquer pessoa com o código entra pelo navegador, sem instalar nada, e a sala é efêmera, some quando todos saem.",
				},
			],
		},
		closing: {
			title: "Comece agora",
			body: "Crie uma sala grátis, mande o código no chat da chamada e rode a primeira história remota hoje.",
			cta: "Criar sala",
			relatedLabel: "Continue",
			related: [
				{ to: "/guias/como-jogar-planning-poker", label: "Como jogar, passo a passo" },
				{ to: "/guias/story-points", label: "Story points na prática" },
				{
					to: "/planning-poker-online-gratis-comparativo",
					label: "Comparativo de ferramentas grátis",
				},
			],
		},
	},
	"story-points-vs-horas": {
		lang: "pt-BR",
		path: "/guias/story-points-vs-horas",
		h1: "Story points vs horas: como responder \"quando fica pronto?\" sem converter",
		lede: "Story points medem tamanho relativo, incluindo complexidade e incerteza; horas medem tempo absoluto e mudam conforme quem executa. Por isso não se converte ponto em hora. Para prever prazo, use a velocidade recente do time, em faixa, e divida o escopo restante por ela.",
		meta: `7 min de leitura · ${META_OUT_2026}`,
		tocLabel: "Neste guia",
		back: { to: "/guias", label: "Guias de planning poker" },
		sections: [
			{
				id: "o-que-cada-unidade-mede",
				title: "O que cada unidade mede",
				blocks: [
					{
						type: "p",
						text: "As duas unidades parecem responder à mesma pergunta, mas medem coisas diferentes. Ponto mede o tamanho relativo de uma história em comparação com outras. Hora mede tempo de relógio de quem executa o trabalho.",
					},
					{
						type: "table",
						headers: ["Critério", "Story points", "Horas"],
						rows: [
							[
								"O que mede",
								"Esforço relativo, complexidade e incerteza",
								"Tempo de execução",
							],
							[
								"Referência",
								"Outras histórias do time",
								"Relógio e agenda de quem executa",
							],
							[
								"Muda com quem faz",
								"Pouco, o tamanho pertence ao item",
								"Muito, experiência e contexto mudam o número",
							],
							[
								"Serve para",
								"Priorizar, planejar sprint e medir velocidade",
								"Conversar sobre capacidade e tarefas repetíveis",
							],
						],
					},
					{
						type: "p",
						text: "Nenhuma das duas é mais honesta que a outra. Elas respondem a perguntas diferentes, e usar a unidade errada para a pergunta errada produz um número com cara de precisão que não se sustenta na sprint seguinte.",
					},
				],
			},
			{
				id: "por-que-pontos-no-backlog",
				title: "Por que pontos funcionam melhor no backlog",
				blocks: [
					{
						type: "p",
						text: "No backlog, quase nada é repetível o bastante para virar hora com confiança. Uma integração nova, uma tela inédita ou uma migração têm surpresas que só aparecem durante o trabalho. Comparar histórias entre si funciona mesmo quando o desconhecido é grande.",
					},
					{
						type: "list",
						items: [
							{
								title: "Comparar é mais fácil que prever duração.",
								body: "Dizer que uma história é maior que outra é mais confiável do que dizer quantas horas cada uma vai levar.",
							},
							{
								title: "O ponto vale para qualquer pessoa que pegar a tarefa.",
								body: "Horas mudam conforme quem executa; pontos descrevem o item, não a agenda de quem o pega.",
							},
						],
					},
					{
						type: "p",
						text: "A escala, o Fibonacci e a calibração com história de referência estão no guia de [story points](/guias/story-points). Aqui o foco é a decisão entre as duas unidades e o que fazer quando alguém pede uma data.",
					},
				],
			},
			{
				id: "quando-horas-sao-a-unidade-certa",
				title: "Quando horas são a unidade certa",
				blocks: [
					{
						type: "p",
						text: "Horas não são proibidas. Existem contextos em que elas são a unidade mais útil, e forçar pontos neles só cria trabalho extra.",
					},
					{
						type: "list",
						items: [
							{
								title: "Quebra de uma história em tarefas.",
								body: "Depois que o escopo está claro, tarefas pequenas e repetíveis cabem em horas sem enganar ninguém.",
							},
							{
								title: "Contrato de escopo fechado.",
								body: "Quando o escopo está congelado por contrato, o compromisso é de prazo e a conversa acontece em dias ou horas.",
							},
							{
								title: "Trabalho repetível e operacional.",
								body: "Suporte, manutenção e atividades com histórico longo permitem estimar em tempo com boa margem de acerto.",
							},
						],
					},
					{
						type: "p",
						text: "Repare que os três casos têm algo em comum: o escopo já está estável ou o trabalho é conhecido o bastante para não mudar no meio. Sem essa estabilidade, horas viram chute com vírgula.",
					},
					{
						type: "p",
						text: "O erro não é usar horas, é misturar as duas unidades no mesmo planejamento. Uma história estimada em pontos com prazo cobrado em horas abre espaço para conversão, e a conversão é justamente o problema da próxima seção.",
					},
				],
			},
			{
				id: "a-armadilha-da-conversao",
				title: "A armadilha da conversão \"1 ponto = 4 horas\"",
				blocks: [
					{
						type: "p",
						text: "Alguém sempre propõe a fórmula: se 1 ponto virou quatro horas nas últimas sprints, basta multiplicar. O cálculo parece funcionar uma vez e para de funcionar quando o time muda, o produto muda ou o tipo de história muda de tamanho.",
					},
					{
						type: "p",
						text: "Pior que o erro do cálculo é o efeito no comportamento. No momento em que o ponto vira hora, o time começa a estimar horas com outro nome: infla o número para caber no prazo, evita item incerto e a escala relativa perde o sentido. Ninguém estima com honestidade quando o número vira compromisso.",
					},
					{
						type: "p",
						text: "Se o time precisa de uma ponte entre pontos e datas, a ponte é a velocidade, não a conversão. A velocidade vem do histórico real e é lida como faixa, não como um número fixo de horas por ponto.",
					},
					{
						type: "p",
						text: "Há quem defenda a conversão como ferramenta de comunicação para gente de fora do time, do tipo \"isso dá mais ou menos duas semanas\". Se precisar fazer isso, use a faixa de velocidade e não uma taxa fixa de horas por ponto, e deixe claro que é uma estimativa de prazo, não um compromisso.",
					},
				],
			},
			{
				id: "quando-fica-pronto",
				title: "Respondendo \"quando fica pronto?\" com velocidade",
				blocks: [
					{
						type: "p",
						text: "A previsão honesta vem de três ingredientes: a velocidade recente do time, em pontos por sprint; o total de pontos que falta; e uma margem para o desconhecido. O exemplo abaixo é ilustrativo, com números redondos escolhidos para mostrar a conta.",
					},
					{
						type: "p",
						text: "Exemplo com números fictícios. Imagine um time que fechou as últimas três sprints com 22, 26 e 24 pontos, ou seja, algo entre 22 e 26 por sprint. O backlog restante soma 60 pontos. Dividindo 60 por 24, dá cerca de 2,5 sprints; com a variação observada, a resposta honesta é \"entre dois e três sprints\", não uma data exata de calendário.",
					},
					{
						type: "p",
						text: "Repare que a resposta veio em faixa. Velocidade é uma medida instável por natureza: férias, troca de time e feriados mexem no número. Uma faixa comunica essa incerteza; uma data exata finge que ela não existe.",
					},
					{
						type: "p",
						text: "Se o prazo pedido não cabe na faixa, as opções continuam as mesmas de sempre: cortar escopo, dividir histórias ou aceitar mais incerteza. Estimar de novo para agradar o pedido só transfere o problema para a próxima sprint.",
					},
				],
			},
			{
				id: "migrando-de-horas-para-pontos",
				title: "Migrando de horas para pontos",
				blocks: [
					{
						type: "p",
						text: "A migração é mais simples do que parece e não exige parar o time por uma sprint.",
					},
					{
						type: "steps",
						items: [
							{
								title: "Escolha três histórias já entregues.",
								body: "Uma pequena, uma média e uma grande, todas bem conhecidas pelo time.",
							},
							{
								title: "Atribua pontos por comparação.",
								body: "A pequena vira 1 ou 2; as outras entram por comparação com ela, não por conversão de horas.",
							},
							{
								title: "Estime o backlog em rodadas.",
								body: "Cada item novo entra comparado às referências, no voto secreto do [planning poker](/guias/como-jogar-planning-poker).",
							},
							{
								title: "Registre os pontos concluídos por sprint.",
								body: "A soma do que foi concluído a cada sprint forma a velocidade do time.",
							},
							{
								title: "Use a velocidade para prever, não para cobrar.",
								body: "A faixa de pontos por sprint vira a faixa de previsão; ela não é meta individual de ninguém.",
							},
						],
					},
					{
						type: "p",
						text: "Quer testar o fluxo sem compromisso? [Crie uma sala no Pointly](/join) e rode uma rodada com as histórias do próximo sprint.",
					},
					{
						type: "p",
						text: "Veja também: [t-shirt sizing](/guias/t-shirt-sizing) para triar o backlog em tamanhos antes de estimar em pontos e o [comparativo de ferramentas](/planning-poker-online-gratis-comparativo) para escolher a sala.",
					},
				],
			},
			{
				id: "perguntas-frequentes",
				title: "Perguntas frequentes",
				blocks: [],
			},
		],
		faq: {
			title: "Perguntas frequentes",
			items: [
				{
					question: "Quantas horas vale um story point?",
					answer:
						"Nenhuma. O ponto não tem equivalência fixa em horas, e é isso que o torna útil: ele compara histórias entre si e sobrevive a mudanças de pessoa, ferramenta e contexto. Qualquer tabela fixa de conversão quebra na primeira sprint diferente.",
				},
				{
					question: "Qual a diferença entre story points e horas?",
					answer:
						"Pontos medem esforço relativo, incluindo complexidade e incerteza, e valem para o item independentemente de quem executa. Horas medem tempo de relógio e variam conforme quem faz. As duas respondem a perguntas diferentes, e misturá-las no mesmo planejamento confunde as duas.",
				},
				{
					question: "Dá para dar prazo usando story points?",
					answer:
						"Dá, usando a velocidade: a média de pontos concluídos por sprint, lida como faixa. Divida os pontos restantes pela faixa para estimar quantas sprints faltam para concluir o escopo. A resposta sai em intervalo, e é justamente esse intervalo que a torna honesta.",
				},
				{
					question: "O que é velocidade do time?",
					answer:
						"É a soma de pontos concluídos por sprint, medida do próprio histórico do time. Serve para prever quanto o time consegue puxar nas próximas sprints. Não serve para comparar times entre si nem para avaliar pessoas, porque cada time tem a própria escala.",
				},
				{
					question: "Posso usar horas e pontos juntos?",
					answer:
						"Pode, desde que em camadas separadas: pontos no tamanho das histórias do backlog, horas nas tarefas em que a história se desdobra durante a execução. O que não funciona é converter uma unidade na outra para fechar conta de prazo.",
				},
				{
					question: "Por que usar Fibonacci para pontos?",
					answer:
						"Porque a distância entre os números acompanha o crescimento da incerteza. Em item grande, discutir 8 contra 9 não faz sentido; com Fibonacci, a escolha vira 8 ou 13, uma diferença que o time consegue perceber e explicar. O guia de [Fibonacci](/guias/fibonacci-estimativa-agil) aprofunda o tema.",
				},
			],
		},
		closing: {
			title: "Estime com o time no Pointly",
			body: "Crie uma sala grátis e responda a próxima pergunta de prazo com uma faixa baseada em velocidade, não com conversão.",
			cta: "Criar sala",
			relatedLabel: "Continue",
			related: [
				{ to: "/guias/story-points", label: "Story points na prática" },
				{ to: "/guias/fibonacci-estimativa-agil", label: "Fibonacci na estimativa" },
				{ to: "/guias/como-jogar-planning-poker", label: "Como jogar, passo a passo" },
			],
		},
	},
	"fibonacci-estimativa-agil": {
		lang: "pt-BR",
		path: "/guias/fibonacci-estimativa-agil",
		h1: "Sequência de Fibonacci na estimativa ágil: por que usar e como aplicar",
		lede: "Times usam Fibonacci (1, 2, 3, 5, 8, 13...) porque a distância entre os números cresce junto com a incerteza: é difícil dizer se uma história grande é \"um ponto maior\" que outra. Valores altos sinalizam risco, e uma história que chega a 13 ou mais costuma pedir divisão antes do sprint.",
		meta: `7 min de leitura · ${META_OUT_2026}`,
		tocLabel: "Neste guia",
		back: { to: "/guias", label: "Guias de planning poker" },
		sections: [
			{
				id: "sequencia-classica-e-modificada",
				title: "A sequência clássica e a versão modificada",
				blocks: [
					{
						type: "p",
						text: "Na matemática, a sequência de Fibonacci começa em 0 e 1, e cada número seguinte é a soma dos dois anteriores: 0, 1, 1, 2, 3, 5, 8, 13, 21 e assim por diante. Na estimativa ágil, o time usa um recorte dessa ideia: números que crescem rápido e deixam espaço entre si.",
					},
					{
						type: "p",
						text: "A versão mais comum no planning poker vai de 1 a 13, às vezes com 0 e ½. A chamada Fibonacci modificada estende o topo com valores como 20, 40 e 100, usados mais como sinalização de item grande demais do que como estimativa precisa.",
					},
					{
						type: "p",
						text: "O ponto comum às duas é a distância crescente entre os números. É ela que carrega o recado: quanto maior o item, maior a incerteza, e menos sentido faz separar um valor do seguinte.",
					},
				],
			},
			{
				id: "por-que-nao-1-2-3-4-5",
				title: "Por que não usar 1, 2, 3, 4, 5",
				blocks: [
					{
						type: "p",
						text: "Uma escala linear parece mais simples, mas cria dois problemas. O primeiro é a falsa precisão: se 4 e 5 existem, o time discute a diferença entre eles, mesmo sem ninguém conseguir perceber essa diferença no trabalho real.",
					},
					{
						type: "p",
						text: "O segundo é o ruído virar pauta. Numa escala contínua, cada rodada rende uma discussão sobre detalhes que não mudam o plano. Com saltos maiores, a conversa fica onde importa, que é a diferença entre itens de tamanhos distintos.",
					},
					{
						type: "p",
						text: "Fica sempre a mesma dúvida: um item estimado em 5 é cinco vezes maior que um em 1? Não exatamente. A escala é ordinal, não proporcional. Ela ordena histórias por tamanho e agrupa as parecidas; não mede razão exata entre elas.",
					},
					{
						type: "p",
						text: "Existe um teste rápido para saber se a escala está funcionando: se a discussão de um item demora mais decidindo entre dois valores vizinhos do que investigando o que está dentro dele, a escala está errada ou o time precisa de mais contexto.",
					},
				],
			},
			{
				id: "o-que-cada-faixa-significa",
				title: "O que cada faixa de valor costuma significar",
				blocks: [
					{
						type: "p",
						text: "Os significados abaixo são convenção de time, não regra universal. O que vale é o que o time combinou e a história de referência usada para calibrar a escala.",
					},
					{
						type: "table",
						headers: ["Valor", "Leitura comum"],
						rows: [
							["0", "Trivial, sem trabalho de verdade"],
							["½", "Ajuste pequeno, mas com deploy"],
							["1", "Pequeno e conhecido"],
							["2", "Pequeno com um detalhe a mais"],
							["3", "Médio, caminho claro"],
							["5", "Médio com integração ou incerteza"],
							["8", "Grande e incerto"],
							["13", "Grande demais, dividir antes de começar"],
						],
					},
					{
						type: "p",
						text: "Faixas altas não são medalha nem erro: são pedido de conversa. Quando o time vota 13, a mensagem é que ninguém consegue visualizar o trabalho inteiro sem dividi-lo em partes.",
					},
				],
			},
			{
				id: "o-deck-do-pointly",
				title: "O deck do Pointly",
				blocks: [
					{
						type: "p",
						text: "A sala do Pointly usa o recorte mais comum do Fibonacci: 0, ½, 1, 2, 3, 5, 8, 13 e uma carta de pausa. Nove cartas, sem valores acima de 13.",
					},
					{
						type: "p",
						text: "O 0 e o ½ existem para que o time não precise inventar precisão onde ela não existe. Um ajuste de texto pode ser 0; um ajuste pequeno, mas que exige deploy, pode ser ½. A escala inteira acomoda essas diferenças sem criar degraus falsos.",
					},
					{
						type: "p",
						text: "A carta de pausa (☕) conta presença na votação e fica fora da média, da mediana e do intervalo. Ela serve para dois usos: pedir uma pausa de verdade ou sinalizar que a história precisa de mais contexto antes de virar número.",
					},
					{
						type: "p",
						text: "O jeito mais rápido de entender o deck é usá-lo: [crie uma sala](/join) e vote uma história com o time.",
					},
					{
						type: "p",
						text: "A distribuição dos votos que aparece depois do reveal é o que dá sentido a tudo isso: dá para ver se a história foi consenso, se ficou dividida entre pontos vizinhos ou se havia gente votando em extremos que nunca iam se encontrar.",
					},
				],
			},
			{
				id: "quando-chega-a-13",
				title: "Quando a história chega a 13 (ou mais): dividir",
				blocks: [
					{
						type: "p",
						text: "Treze é o teto do deck por um motivo prático: acima disso, a estimativa vira chute. A resposta saudável para um item que chega ao topo da escala não é votar de novo até alguém ceder, é dividir.",
					},
					{
						type: "list",
						items: [
							{
								title: "Por fluxo ou etapa.",
								body: "Cadastro, depois uso, depois relatório, cada parte entregue e testada separadamente.",
							},
							{
								title: "Por critério de aceite.",
								body: "Cada regra de negócio vira uma história, desde que cada uma tenha valor próprio.",
							},
							{
								title: "Por caso de uso.",
								body: "Um tipo de usuário ou de cenário por história.",
							},
							{
								title: "Por investigação primeiro.",
								body: "Uma investigação com tempo definido para reduzir a incerteza antes de estimar o resto.",
							},
						],
					},
					{
						type: "p",
						text: "Depois de dividir, as partes costumam sair em 2, 3 e 5, e o que era um item assustador vira três itens conversáveis. O guia [como jogar planning poker](/guias/como-jogar-planning-poker) mostra o papel da pausa e da segunda rodada nesse processo.",
					},
				],
			},
			{
				id: "calibrando-com-referencia",
				title: "Calibrando a escala com uma história de referência",
				blocks: [
					{
						type: "p",
						text: "Fibonacci não diz quanto vale o 5 até que o time combine o que é um 5. A forma mais rápida de chegar lá é escolher uma história pequena, já entregue e muito bem conhecida, e tratá-la como referência.",
					},
					{
						type: "p",
						text: "Toda história nova entra por comparação: maior ou menor que a referência? Maior quanto? Em algumas rodadas, a régua fica estável e o tempo por história cai. A calibração completa está no guia de [story points](/guias/story-points).",
					},
					{
						type: "p",
						text: "Se o time ainda não tem histórico, vale estimar itens já concluídos antes de estimar o backlog novo. Errar no passado conhecido é barato e ensina mais do que discutir o futuro em abstrato.",
					},
				],
			},
			{
				id: "alternativas",
				title: "Alternativas: potências de 2, camisetas e escala própria",
				blocks: [
					{
						type: "p",
						text: "Fibonacci é a escala mais comum, mas não é obrigatória. Potências de dois (1, 2, 4, 8, 16) cumprem o mesmo papel de abrir distância entre os valores altos. Tamanhos de camiseta (PP a GG) trocam os números por nomes e funcionam bem na triagem de backlog; o guia de [t-shirt sizing](/guias/t-shirt-sizing) cobre a técnica e a conversão para pontos.",
					},
					{
						type: "p",
						text: "O que qualquer escala precisa ter: ser relativa, conhecida por todos e estável por tempo suficiente para acumular histórico. Trocar de escala a cada sprint reinicia a curva de aprendizado do time.",
					},
					{
						type: "p",
						text: "Veja também: [story points vs horas](/guias/story-points-vs-horas) para transformar a escala em previsão de prazo e o [comparativo de ferramentas](/planning-poker-online-gratis-comparativo) para escolher onde votar.",
					},
				],
			},
			{
				id: "perguntas-frequentes",
				title: "Perguntas frequentes",
				blocks: [],
			},
		],
		faq: {
			title: "Perguntas frequentes",
			items: [
				{
					question: "Por que usar Fibonacci na estimativa ágil?",
					answer:
						"Porque a incerteza cresce com o tamanho do item. Os saltos maiores entre os números altos evitam discussões sobre diferenças que ninguém percebe no trabalho e reservam a conversa para as diferenças que realmente mudam o plano da sprint e o entendimento do time.",
				},
				{
					question: "Quais valores usar no planning poker?",
					answer:
						"O recorte mais comum vai de 0 a 13: 0, ½, 1, 2, 3, 5, 8 e 13, com uma carta de pausa. É o deck do Pointly. Times que precisam sinalizar itens muito grandes usam a versão modificada, com 20, 40 e 100 no topo da escala.",
				},
				{
					question: "O que significa estimar 13 story points?",
					answer:
						"Significa que o item está no teto da escala: grande, incerto ou mal compreendido. Na prática, é um pedido de divisão. Times costumam quebrar o item em partes menores antes de aceitá-lo no sprint, porque um 13 raramente termina dentro de uma sprint.",
				},
				{
					question: "Fibonacci modificada é diferente da original?",
					answer:
						"Sim. A clássica é a sequência matemática, em que cada número é a soma dos dois anteriores, e a ágil usa um recorte dela. A modificada estende o topo com valores como 20, 40 e 100, que funcionam como sinalização de tamanho mais do que como estimativa.",
				},
				{
					question: "Posso usar outra sequência?",
					answer:
						"Pode, e muitos times usam. Potências de 2, tamanhos de camiseta e escalas próprias funcionam, desde que sejam relativas, conhecidas pelo time e estáveis. O que importa é a distância crescente entre os valores e a consistência da escala ao longo do tempo.",
				},
				{
					question: "O que a carta de interrogação ou pausa significa?",
					answer:
						"A interrogação, em baralhos que a têm, sinaliza falta de contexto para votar. O deck do Pointly não tem essa carta, e o papel fica com a pausa (☕): ela conta presença, fica fora das estatísticas e pede mais informação antes de virar número.",
				},
			],
		},
		closing: {
			title: "Teste o baralho numa sala",
			body: "Crie uma sala grátis, vote uma história com o Fibonacci e veja como o reveal muda a conversa.",
			cta: "Criar sala",
			relatedLabel: "Continue",
			related: [
				{ to: "/guias/story-points", label: "Story points na prática" },
				{ to: "/guias/t-shirt-sizing", label: "T-shirt sizing" },
				{ to: "/guias/como-jogar-planning-poker", label: "Como jogar, passo a passo" },
			],
		},
	},
	"t-shirt-sizing": {
		lang: "pt-BR",
		path: "/guias/t-shirt-sizing",
		h1: "T-shirt sizing: o que é, escala PP-GG e como converter em story points",
		lede: "T-shirt sizing é uma estimativa relativa em tamanhos (PP, P, M, G, GG) em vez de números. É rápida e boa para triagem de backlog e roadmap. Depois, o time pode mapear cada tamanho para pontos Fibonacci, como P=2, M=3, G=5, se precisar medir velocidade.",
		meta: `7 min de leitura · ${META_OUT_2026}`,
		tocLabel: "Neste guia",
		back: { to: "/guias", label: "Guias de planning poker" },
		sections: [
			{
				id: "o-que-e",
				title: "O que é t-shirt sizing",
				blocks: [
					{
						type: "p",
						text: "T-shirt sizing é uma técnica de estimativa relativa que troca números por tamanhos de roupa: PP, P, M, G e GG. Em vez de perguntar quantos pontos um item vale, o time pergunta se ele é pequeno, médio ou grande em comparação com outros itens.",
					},
					{
						type: "p",
						text: "A força da técnica é a velocidade. Todo mundo entende a diferença entre P e GG sem explicação, e a conversa não escorrega para falsa precisão. Por isso ela é comum em triagem de backlog grande e em conversas de roadmap com pessoas fora do time técnico.",
					},
					{
						type: "p",
						text: "A limitação também é a velocidade: tamanhos não formam uma escala numérica e não acumulam velocidade de sprint sozinhos. Quando o time precisa medir quantos pontos entrega por sprint, chega a hora de converter.",
					},
					{
						type: "p",
						text: "T-shirt sizing é primo do planning poker: mesmo voto secreto, mesmo reveal simultâneo, com letras no lugar dos números. O que muda é a granularidade. Tamanhos servem a conversas mais amplas, em que a diferença entre M e G já basta para decidir.",
					},
				],
			},
			{
				id: "escala-tipica",
				title: "Escala típica e o que cada tamanho significa",
				blocks: [
					{
						type: "p",
						text: "Não existe escala oficial. A mais usada tem cinco tamanhos, com versões estendidas nas pontas. Os significados abaixo são uma convenção comum, não uma regra, e devem ganhar exemplos do seu produto.",
					},
					{
						type: "table",
						headers: ["Tamanho", "Leitura comum", "Exemplo"],
						rows: [
							["PP", "Ajuste trivial, quase sem risco", "Correção de texto ou de rótulo"],
							["P", "Pequeno e bem entendido", "Validação extra em um formulário"],
							["M", "Médio, caminho claro", "Tela nova ligada a dados existentes"],
							[
								"G",
								"Grande, com integrações ou casos extras",
								"Checkout com novo meio de pagamento",
							],
							[
								"GG",
								"Grande demais para uma sprint",
								"Relatório com agregação nova",
							],
						],
					},
					{
						type: "p",
						text: "Alguns times adicionam um PP ainda menor para itens quase prontos e um GG maior para o que precisa ser dividido. Cinco tamanhos dão conta da maioria dos casos; mais que isso reintroduz a precisão que a técnica tenta evitar.",
					},
					{
						type: "p",
						text: "Um combinado que economiza discussão: em caso de divergência entre dois tamanhos vizinhos, siga com o maior. É a postura mais segura, e você sempre pode dividir o item depois.",
					},
				],
			},
			{
				id: "como-fazer-em-6-passos",
				title: "Como fazer em 6 passos",
				blocks: [
					{
						type: "steps",
						items: [
							{
								title: "Escolha a escala.",
								body: "Cinco tamanhos bastam. Defina antes de começar e deixe os nomes visíveis para todos.",
							},
							{
								title: "Separe histórias de referência.",
								body: "Uma por tamanho, já entregues e conhecidas pelo time. Elas ancoram as comparações.",
							},
							{
								title: "Apresente o item.",
								body: "Quem conhece a história lê contexto e critérios de aceite em voz alta, como num planning poker.",
							},
							{
								title: "Votem em segredo.",
								body: "Cada pessoa escolhe um tamanho sem ver o dos outros, para evitar a ancoragem do primeiro voto.",
							},
							{
								title: "Revelem e comparem.",
								body: "Divergência entre vizinhos fecha no maior; distância de dois tamanhos ou mais pede conversa antes de fechar.",
							},
							{
								title: "Registre o tamanho.",
								body: "O tamanho vai para o item, e a próxima história entra por comparação com as referências.",
							},
						],
					},
					{
						type: "p",
						text: "Se o time já trabalha com pontos, dá para votar as histórias na sala do Pointly e converter os tamanhos depois. [Crie uma sala](/join) para testar o fluxo.",
					},
				],
			},
			{
				id: "converter-em-story-points",
				title: "Converter tamanhos em story points",
				blocks: [
					{
						type: "p",
						text: "Quando o time precisa de números para acompanhar velocidade, uma conversão resolve. As duas propostas mais comuns vêm de material de treinamento da Teaching Agile e servem como ponto de partida, não como padrão universal.",
					},
					{
						type: "table",
						headers: ["Tamanho", "Conversão linear", "Conversão ponderada"],
						rows: [
							["PP", "1", "1"],
							["P", "2", "3"],
							["M", "3", "5"],
							["G", "5", "8"],
							["GG", "8", "13"],
						],
					},
					{
						type: "p",
						text: "A linear espelha direto o Fibonacci e é mais fácil de explicar. A ponderada assume que itens grandes são desproporcionalmente mais incertos, o que costuma encaixar melhor na prática. Escolha uma, registre a decisão e mantenha até que o time tenha motivo forte para trocar.",
					},
					{
						type: "p",
						text: "Quem usa um sexto tamanho segue a progressão: 13 na linear e 21 na ponderada. Evite a conversão por horas, do tipo \"P equivale a 4 horas\". Ela mistura as duas unidades que a técnica separou de propósito e transforma tamanho em compromisso de agenda.",
					},
					{
						type: "p",
						text: "Independentemente da tabela escolhida, registre a conversão numa nota do time. Se a régua mudar no meio do trimestre, as contas de velocidade do período inteiro perdem comparabilidade.",
					},
				],
			},
			{
				id: "t-shirt-vs-story-points-vs-poker",
				title: "T-shirt sizing vs story points vs planning poker",
				blocks: [
					{
						type: "p",
						text: "As três coisas operam em camadas diferentes e não competem entre si.",
					},
					{
						type: "table",
						headers: ["Ferramenta", "O que é", "Quando usar"],
						rows: [
							[
								"T-shirt sizing",
								"Escala de tamanhos",
								"Triagem rápida de backlog grande e roadmap",
							],
							[
								"Story points",
								"Escala numérica relativa",
								"Backlog que vai virar sprint; medir velocidade",
							],
							[
								"Planning poker",
								"Ritual de votação em grupo",
								"Quando a estimativa precisa de mais de uma cabeça",
							],
						],
					},
					{
						type: "p",
						text: "A combinação comum é triar o roadmap em tamanhos, detalhar as histórias do próximo sprint em pontos e usar o planning poker em cada rodada. O guia de [story points](/guias/story-points) aprofunda a escala numérica, e o de [Fibonacci](/guias/fibonacci-estimativa-agil) explica o porquê dos valores.",
					},
				],
			},
			{
				id: "backlog-grande",
				title: "Backlog grande: estimativa por afinidade",
				blocks: [
					{
						type: "p",
						text: "Com centenas de itens, votar um por um não escala. A alternativa é a estimativa por afinidade: o time agrupa itens semelhantes e só depois atribui um tamanho a cada grupo.",
					},
					{
						type: "steps",
						items: [
							{
								title: "Espalhe os itens.",
								body: "Cards ou lista compartilhada, com tudo visível ao mesmo tempo.",
							},
							{
								title: "Agrupe em silêncio.",
								body: "Cada pessoa move itens parecidos para o mesmo grupo, sem discutir ainda.",
							},
							{
								title: "Nomeie os grupos.",
								body: "Um tamanho ou uma referência por grupo, comparando com as histórias conhecidas.",
							},
							{
								title: "Estime só as dúvidas.",
								body: "Itens que ficaram na fronteira entre grupos voltam para votação normal.",
							},
						],
					},
					{
						type: "p",
						text: "A afinidade ganha tempo na triagem, mas não substitui a discussão das histórias incertas. Os itens de fronteira são justamente onde a conversa rende mais.",
					},
					{
						type: "p",
						text: "Depois da triagem, os itens que entram no sprint voltam ao fluxo normal: votação item a item em pontos. A afinidade é porteira, não substitui o refinamento.",
					},
				],
			},
			{
				id: "erros-comuns",
				title: "Erros comuns",
				blocks: [
					{
						type: "list",
						items: [
							{
								title: "Confundir tamanho com horas.",
								body: "Tamanho é esforço relativo. Traduzir para horas na mesma frase devolve a falsa precisão que a técnica evita.",
							},
							{
								title: "Estimar item grande demais.",
								body: "Item GG precisa ser dividido, não espremido em uma sprint com um tamanho menor para caber.",
							},
							{
								title: "Trocar a escala toda sprint.",
								body: "A régua só acumula sentido com estabilidade. Trocar os nomes ou os cortes reinicia o aprendizado.",
							},
							{
								title: "Converter para pontos e cobrar os pontos.",
								body: "A conversão existe para prever, não para virar meta. Quando o número vira cobrança, ele infla.",
							},
							{
								title: "Estimar roadmap sem contexto de produto.",
								body: "Tamanho sem valor de negócio produz uma fila bonita e sem prioridade. As duas conversas precisam andar juntas.",
							},
							{
								title: "Usar t-shirt sizing para tudo.",
								body: "Tamanhos brilham na triagem; no sprint, a granularidade dos pontos evita que itens próximos pareçam iguais.",
							},
						],
					},
					{
						type: "p",
						text: "Veja também: [Fibonacci na estimativa ágil](/guias/fibonacci-estimativa-agil) para entender os valores da conversão e o [comparativo de ferramentas](/planning-poker-online-gratis-comparativo) para escolher a sala.",
					},
				],
			},
			{
				id: "perguntas-frequentes",
				title: "Perguntas frequentes",
				blocks: [],
			},
		],
		faq: {
			title: "Perguntas frequentes",
			items: [
				{
					question: "O que é t-shirt sizing?",
					answer:
						"É uma técnica de estimativa relativa que usa tamanhos de roupa (PP, P, M, G, GG) em vez de números. O time compara histórias entre si e escolhe o tamanho que representa o esforço. É rápida e funciona bem para triagem de backlog e conversas de roadmap.",
				},
				{
					question: "Qual a diferença entre t-shirt sizing e story points?",
					answer:
						"Tamanhos são nomes, pontos são números. Os dois medem a mesma coisa, o tamanho relativo do item. Tamanhos são mais rápidos e mais fáceis de explicar; pontos acumulam velocidade de sprint e entram em contas de previsão com mais naturalidade.",
				},
				{
					question: "Como converter P, M, G em story points?",
					answer:
						"Use uma tabela fixa e mantenha a mesma para o time todo. Uma conversão comum é PP=1, P=2, M=3, G=5, GG=8, que segue Fibonacci. Outra proposta pondera mais o topo: 1, 3, 5, 8 e 13. Escolha uma e registre a decisão.",
				},
				{
					question: "Quando usar t-shirt sizing?",
					answer:
						"Em triagem de backlog grande, conversas de roadmap e alinhamentos com pessoas fora do time técnico. Também serve no começo de um time novo, antes de a escala numérica fazer sentido. Para histórias que vão entrar em sprint, pontos costumam funcionar melhor.",
				},
				{
					question: "Dá para fazer t-shirt sizing com planning poker?",
					answer:
						"Dá: use cartas com letras e siga o mesmo ritual, voto secreto e reveal simultâneo. O deck do Pointly é Fibonacci, sem cartas de tamanho, então quem quer jogar em letras precisa de um baralho com P, M e G.",
				},
				{
					question: "Quantos tamanhos usar?",
					answer:
						"Cinco cobrem a maioria dos casos: PP, P, M, G e GG. Menos que isso fica difícil de diferenciar; mais que isso traz de volta a precisão que a técnica tenta evitar. O importante é que o time conheça as referências de cada tamanho.",
				},
			],
		},
		closing: {
			title: "Estime com seu time",
			body: "O Pointly usa baralho Fibonacci, não cartas de camiseta. Se o time já mapeou os tamanhos para pontos, crie a sala e estime nos pontos.",
			cta: "Criar sala",
			relatedLabel: "Continue",
			related: [
				{ to: "/guias/story-points", label: "Story points na prática" },
				{ to: "/guias/fibonacci-estimativa-agil", label: "Fibonacci na estimativa" },
				{
					to: "/planning-poker-online-gratis-comparativo",
					label: "Comparativo de ferramentas grátis",
				},
			],
		},
	},
	"comparativo-ferramentas": {
		lang: "pt-BR",
		path: "/planning-poker-online-gratis-comparativo",
		h1: "Planning poker online grátis: comparativo de ferramentas em português",
		lede: "Pointly, Point Poker, SprintsPoker, Scrum Poker Online e Utilaria oferecem planning poker grátis e sem cadastro em português, segundo o que cada site declara. As diferenças aparecem em limite de participantes, baralhos, cronômetro, anúncios e no que acontece com a sala depois. Cada linha da tabela foi conferida em 18 de outubro de 2026.",
		meta: `8 min de leitura · ${META_OUT_2026}`,
		tocLabel: "Neste comparativo",
		back: { to: "/guias", label: "Guias de planning poker" },
		sections: [
			{
				id: "como-comparamos",
				title: "Como comparamos",
				blocks: [
					{
						type: "p",
						text: "Todos os dados dos concorrentes deste comparativo foram lidos nas páginas oficiais em 18 de outubro de 2026, pelo próprio texto que cada site publica. Quando um site não declara algo, a tabela diz \"não declara\" em vez de supor.",
					},
					{
						type: "p",
						text: "Os critérios foram cadastro, preço, limite de participantes, baralhos disponíveis, anúncios, cronômetro e exportação, e o que acontece com a sala e os votos depois da sessão.",
					},
					{
						type: "p",
						text: "Nenhuma ferramenta foi testada a fundo nem teve o desempenho medido. A escolha aqui é de recurso e de encaixe com o time, não de velocidade. Os dados podem mudar, então confira no site antes de decidir.",
					},
					{
						type: "p",
						text: "Também não usamos \"melhor\" nem \"mais rápido\" em lugar nenhum. Sem teste próprio de desempenho, esse tipo de afirmação seria chute; o que dá para comparar com honestidade são recursos declarados e o que cada site promete.",
					},
				],
			},
			{
				id: "tabela-comparativa",
				title: "Tabela comparativa",
				blocks: [
					{
						type: "table",
						headers: [
							"Critério",
							"Pointly",
							"Point Poker",
							"SprintsPoker",
							"Scrum Poker Online",
							"Utilaria",
						],
						rows: [
							["Cadastro", "Não", "Não para jogar", "Não", "Não", "Não"],
							[
								"Preço",
								"Grátis",
								"Grátis",
								"Grátis",
								"Grátis; Premium US$ 40/ano",
								"Grátis",
							],
							[
								"Participantes por sala",
								"Até 12 votantes",
								"Até 20, segundo o site",
								"Até 50, segundo o site",
								"Sem limite declarado",
								"Não declara",
							],
							[
								"Baralhos",
								"Fibonacci 0 a 13 + pausa",
								"Fibonacci, camiseta e potências de 2",
								"5 baralhos",
								"Fibonacci; personalizado com conta",
								"Fibonacci, sequencial e potências de 2",
							],
							[
								"Anúncios",
								"Não",
								"Não, segundo o site",
								"Não declara",
								"Sim na versão grátis; Premium remove",
								"Sim, discretos",
							],
							[
								"Cronômetro / exportação",
								"Não tem",
								"Cronômetro e CSV",
								"Cronômetro",
								"Cronômetro e médias no Premium",
								"Não declara",
							],
							[
								"Sala e votos depois",
								"Sala efêmera, some quando todos saem",
								"Apagados ao fim da sessão, segundo o site",
								"Expira 1 hora após a última atividade",
								"Não declara",
								"Não declara",
							],
						],
					},
					{
						type: "p",
						text: "Fontes: páginas oficiais de cada ferramenta, checadas em 18/10/2026. No caso do Pointly, o limite de 12 refere-se a quem vota; a sala também aceita espectadores.",
					},
					{
						type: "callout",
						label: "Como ler a tabela",
						text: "Todos os números vêm do que cada site declara e podem ter mudado desde a checagem. Antes de decidir, abra a ferramenta e confirme os critérios que importam para o seu time.",
					},
				],
			},
			{
				id: "pointly",
				title: "Pointly",
				blocks: [
					{
						type: "p",
						text: "O Pointly é a ferramenta desta casa, então a parte de transparência vale em dobro. Sem conta e sem email: você escolhe um apelido, cria a sala e compartilha um código de 4 caracteres ou o link.",
					},
					{
						type: "p",
						text: "O que ele faz: deck Fibonacci com 0, ½, 1, 2, 3, 5, 8, 13 e carta de pausa; votação secreta com reveal simultâneo; qualquer jogador pode revelar e abrir nova rodada; e o reveal mostra mediana, média, intervalo e a distribuição dos votos. A sala é em tempo real e efêmera: quando todos saem, ela deixa de existir. O limite é de 12 votantes por sala, além de espectadores.",
					},
					{
						type: "p",
						text: "O que ele não faz: não tem modo assíncrono, histórico de sessões, exportação, integração com Jira nem baralhos além do Fibonacci. Se a sua lista de requisitos inclui exportar CSV ou estimar em cartas de camiseta, uma das outras ferramentas deste comparativo atende melhor nesse ponto.",
					},
					{
						type: "p",
						text: "Para quem: times de até 12 pessoas votando que querem começar em segundos, sem cadastro, e não precisam de extras. [Crie uma sala](/join) e veja o fluxo em um minuto.",
					},
				],
			},
			{
				id: "point-poker",
				title: "Point Poker",
				blocks: [
					{
						type: "p",
						text: "Segundo a página em português, o Point Poker é grátis e não pede conta para jogar. A conta gratuita é opcional e serve para reservar duas salas fixas de time e manter o histórico de sprints.",
					},
					{
						type: "p",
						text: "O site declara salas de até 20 pessoas, votações e histórias ilimitadas, três baralhos (Fibonacci, tamanhos de camiseta e potências de 2), cronômetro, exportação em CSV e nenhum anúncio. A revelação fica com o facilitador, e a análise mostra taxa de consenso, dispersão e pontos fora da curva.",
					},
					{
						type: "p",
						text: "As salas são declaradas temporárias: uma sala e seus votos são apagados quando a sessão termina, e salas ociosas são limpas automaticamente.",
					},
					{
						type: "p",
						text: "A página também diz que a sala é uma URL compartilhável em Slack, Teams, Zoom, Meet ou convite de calendário, e que a fila de itens pode ser colada de uma vez.",
					},
				],
			},
			{
				id: "sprintspoker",
				title: "SprintsPoker",
				blocks: [
					{
						type: "p",
						text: "O SprintsPoker se apresenta como grátis, sem cadastro e sem instalar nada. A página declara salas de até 50 participantes, com espectadores fora da contagem de votos, e um limite de vida útil: a sala expira uma hora após a última atividade.",
					},
					{
						type: "p",
						text: "O site lista cinco baralhos prontos (Fibonacci, Fibonacci modificada, tamanhos de camiseta, sequencial e potências de 2), todos com cartas de interrogação e de pausa. A visão do time mostra percentual de concordância e média, e há cronômetro opcional por rodada.",
					},
					{
						type: "p",
						text: "Segundo a página, os votos ficam no servidor até a revelação, e recarregar o navegador preserva o lugar, o nome e o voto de cada pessoa.",
					},
					{
						type: "p",
						text: "O fluxo começa pela escolha do baralho no momento de criar a sala, e cada convidado entra como votante ou como espectador.",
					},
				],
			},
			{
				id: "scrum-poker-online",
				title: "Scrum Poker Online",
				blocks: [
					{
						type: "p",
						text: "A versão grátis do Scrum Poker Online permite criar sala, votar e revelar sem cadastro, segundo a própria página. O plano Premium, de US$ 40 por ano, remove os anúncios para todos na sala e adiciona cronômetro de sessão, média e mediana automáticas, ID de sala pessoal e indicador de presença.",
					},
					{
						type: "p",
						text: "Uma conta gratuita libera outros extras: valores de carta personalizados, como tamanhos de camiseta e meios pontos, e controles de anfitrião, como decidir quem pode revelar. A página diz não limitar o número de participantes e cita 3 a 15 pessoas como o intervalo mais comum nas sessões.",
					},
					{
						type: "p",
						text: "A ferramenta não integra com Jira, e o site diz que isso é intencional: ela se apresenta como ferramenta de estimativa independente, não como gerenciador de backlog.",
					},
					{
						type: "p",
						text: "A interface está disponível em seis idiomas, o que ajuda times mistos, e a sala funciona no navegador do celular, com entrada por QR code segundo a página.",
					},
				],
			},
			{
				id: "utilaria",
				title: "Utilaria",
				blocks: [
					{
						type: "p",
						text: "A Utilaria também é grátis e sem cadastro. O diferencial que ela destaca é o orçamento por papel: Dev, QA, UX ou papéis criados pelo time estimam separadamente, e a ferramenta soma o total da história e o acumulado da sprint por disciplina.",
					},
					{
						type: "p",
						text: "A página lista voto oculto até a revelação, moderação por quem conduz, baralhos Fibonacci, sequencial e potência de 2, estatísticas de consenso e divergência, reconexão automática e anúncios discretos como forma de manter o serviço.",
					},
					{
						type: "p",
						text: "A consolidação do voto de cada papel pode ser por mediana, média, moda ou pior caso, conforme a configuração da sala.",
					},
				],
			},
			{
				id: "qual-escolher-por-cenario",
				title: "Qual escolher por cenário",
				blocks: [
					{
						type: "p",
						text: "Nenhuma das ferramentas serve melhor a todo mundo. O caminho é comparar o cenário do time com o que cada site declara.",
					},
					{
						type: "list",
						items: [
							{
								title: "Só quero votar agora, sem cadastro e sem extras.",
								body: "As cinco opções verificadas atendem; a diferença fica nos detalhes da tabela, como limite de sala e baralhos.",
							},
							{
								title: "Preciso exportar CSV.",
								body: "Point Poker declara exportação em CSV; as demais verificadas não citam esse recurso em suas páginas.",
							},
							{
								title: "Preciso de vários baralhos.",
								body: "SprintsPoker declara cinco; Point Poker e Utilaria declaram três cada.",
							},
							{
								title: "Quero orçamento por papel.",
								body: "Utilaria é a única das verificadas que declara estimativa separada por disciplina.",
							},
							{
								title: "Sala grande.",
								body: "SprintsPoker declara até 50 participantes e Point Poker, até 20. O Pointly atende até 12 votantes.",
							},
							{
								title: "Sem anúncios.",
								body: "Pointly e Point Poker não exibem anúncios; no Scrum Poker Online isso depende do Premium, e a Utilaria se mantém com anúncios discretos.",
							},
						],
					},
					{
						type: "p",
						text: "Feita a escolha, o resto é ritual: voto secreto, reveal simultâneo e conversa nos extremos. O guia [como jogar planning poker](/guias/como-jogar-planning-poker) cobre a parte que nenhuma ferramenta resolve.",
					},
					{
						type: "p",
						text: "Um último critério que não cabe na tabela: o que o time faz depois da sessão. Se o número estimado precisa voltar para outra ferramenta, opções com exportação reduzem trabalho manual e erro de digitação; se a sala é descartável por definição, isso pesa menos.",
					},
					{
						type: "p",
						text: "Veja também: [planning poker remoto](/guias/planning-poker-remoto) para rodar a sessão em videochamada e [story points vs horas](/guias/story-points-vs-horas) para responder prazo sem converter pontos.",
					},
				],
			},
			{
				id: "perguntas-frequentes",
				title: "Perguntas frequentes",
				blocks: [],
			},
		],
		faq: {
			title: "Perguntas frequentes",
			items: [
				{
					question: "Qual o melhor planning poker online grátis?",
					answer:
						"Não existe um melhor universal: as cinco ferramentas verificadas aqui são grátis e sem cadastro, e diferem em limite, baralhos, extras e anúncios. Escolha pelos critérios da sua lista, confira a tabela com a fonte de cada dado e teste em uma sessão real antes de decidir.",
				},
				{
					question: "Existe planning poker sem cadastro?",
					answer:
						"Sim. Pointly, Point Poker, SprintsPoker, Scrum Poker Online e Utilaria permitem criar sala e votar sem conta, segundo o que cada site declara. No Point Poker e no Scrum Poker Online, a conta gratuita existe, mas é opcional e libera extras.",
				},
				{
					question: "Planning poker grátis tem limite de participantes?",
					answer:
						"Depende da ferramenta. Point Poker declara até 20 pessoas por sala e SprintsPoker, até 50. O Scrum Poker Online diz não limitar. A Utilaria não declara. No Pointly, o limite é de 12 votantes por sala, além dos espectadores que acompanham sem votar.",
				},
				{
					question: "Planning poker online tem anúncios?",
					answer:
						"Em algumas, sim. O Scrum Poker Online exibe anúncios na versão grátis e os remove no Premium; a Utilaria declara anúncios discretos. Point Poker e Pointly não exibem anúncios, e o SprintsPoker não declara nada sobre isso em sua página.",
				},
				{
					question: "Qual a diferença entre planning poker e scrum poker?",
					answer:
						"É o mesmo ritual com nomes diferentes. Planning poker é o nome original; scrum poker é como muitos times chamam a mesma sessão dentro do Scrum. O que muda é o contexto da cerimônia, não as cartas nem o voto secreto.",
				},
				{
					question: "Os votos ficam salvos depois da sessão?",
					answer:
						"Depende da ferramenta. No Pointly, a sala é efêmera e some quando todos saem. O Point Poker declara apagar a sala ao fim da sessão e o SprintsPoker, expirar uma hora após a última atividade. Scrum Poker Online e Utilaria não declaram o destino dos votos.",
				},
			],
		},
		closing: {
			title: "Teste o Pointly em 1 minuto",
			body: "Crie uma sala grátis, sem cadastro, e sinta o fluxo: apelido, código de 4 caracteres e a primeira rodada.",
			cta: "Criar sala",
			relatedLabel: "Continue",
			related: [
				{ to: "/planning-poker", label: "Planning poker online grátis" },
				{ to: "/guias/como-jogar-planning-poker", label: "Como jogar, passo a passo" },
				{ to: "/guias/planning-poker-remoto", label: "Planning poker remoto" },
			],
		},
	},
};
