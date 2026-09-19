import type { GuideCopy, GuideHubCopy } from "./guide-content";

const META_PT = "Pointly · atualizado em setembro de 2026";

export const GUIDE_HUB_PT: GuideHubCopy = {
	lang: "pt-BR",
	kicker: "Aprenda o ritual",
	h1: "Guias de planning poker",
	lede: "Guias práticos para rodar estimativas melhores: comece pelo passo a passo, entenda o porquê e domine os story points.",
	cards: [
		{
			to: "/guias/como-jogar-planning-poker",
			readingTime: "6 min de leitura",
			title: "Como jogar planning poker, passo a passo",
			description:
				"O roteiro de uma sessão real: papéis, rodada a rodada, tempo por história e o que fazer quando os votos divergem.",
		},
		{
			to: "/guias/o-que-e-planning-poker",
			readingTime: "5 min de leitura",
			title: "O que é planning poker?",
			description:
				"De onde veio, por que o voto simultâneo funciona e quando usar o ritual — com um exemplo prático de rodada.",
		},
		{
			to: "/guias/story-points",
			readingTime: "7 min de leitura",
			title: "Story points: o que são e como estimar",
			description:
				"Escala, sequência de Fibonacci, story points vs horas e como calibrar a estimativa com uma história de referência.",
		},
	],
	closing: {
		title: "Pronto para estimar junto?",
		body: "Crie a sala, mande o código para o time e comece a primeira rodada.",
		cta: "Criar sala",
	},
};

export const GUIDE_CONTENT_PT: Record<string, GuideCopy> = {
	"como-jogar": {
		lang: "pt-BR",
		path: "/guias/como-jogar-planning-poker",
		h1: "Como jogar planning poker, passo a passo",
		lede: "O roteiro completo de uma sessão real: quem faz o quê, quanto tempo dura cada história e como destravar a conversa quando os votos divergem.",
		meta: `6 min de leitura · ${META_PT}`,
		tocLabel: "Neste guia",
		back: { to: "/guias", label: "Guias de planning poker" },
		sections: [
			{
				id: "antes-de-comecar",
				title: "Antes de começar: o que preparar",
				blocks: [
					{
						type: "p",
						text: "Planning poker rende quando a história chega descrita, não quando o time descobre o que ela é na hora do voto. Antes de abrir a sala, garanta três coisas: o item do backlog com contexto e critérios de aceite, as pessoas que constroem presentes e um lugar para registrar o número no fim.",
					},
					{
						type: "p",
						text: "Vale reservar também alguns minutos de leitura silenciosa antes da votação: quem vai votar precisa de tempo para pensar no tamanho, não de uma resposta na ponta da língua.",
					},
					{
						type: "p",
						text: "Deixe também o link da sala pronto antes de começar: quem entra atrasado não precisa esperar uma nova rodada — entra na próxima história sem atrapalhar o ritmo.",
					},
					{
						type: "p",
						text: "A sala da Pointly cobre a parte da votação: escolha um apelido, compartilhe o código de 4 caracteres no canal do time e comece quando todos estiverem dentro.",
					},
				],
			},
			{
				id: "quem-vota",
				title: "Quem vota (e quem não vota)",
				blocks: [
					{
						type: "p",
						text: "Estima quem constrói. Desenvolvedores e quem vai executar a história votam; produto, design e quem facilita participam da conversa, mas ficam fora do voto.",
					},
					{
						type: "p",
						text: "Isso evita a estimativa contaminada por quem não sente o esforço no dia a dia — e evita que o número vire promessa de entrega. Quem facilita tem outro papel: garantir que todos entendam a história antes de votar e que a conversa não vire defesa de posição.",
					},
					{
						type: "p",
						text: "Em times pequenos é natural acumular papéis. O combinado importa mais que a regra: se a mesma pessoa constrói e facilita, alguém conduz a rodada em rodízio e todos votam.",
					},
					{
						type: "p",
						text: "Uma heurística simples: se a pessoa vai colocar a mão no que será entregue — código, design, dado —, ela vota. Se a participação é de contexto ou decisão, ela conversa.",
					},
				],
			},
			{
				id: "a-rodada-em-7-passos",
				title: "A rodada em 7 passos",
				blocks: [
					{
						type: "p",
						text: "A ordem abaixo vale para qualquer história. O que muda com a prática é o tempo de cada passo, não a sequência.",
					},
					{
						type: "steps",
						items: [
							{
								title: "Descreva a história.",
								body: "Quem conhece o item lê o contexto e os critérios de aceite em voz alta. Se houver mock, print ou link, mostre para o time.",
							},
							{
								title: "Tire dúvidas antes do voto.",
								body: "Perguntas de entendimento acontecem agora, não depois do reveal. Se a resposta ainda não existe, considere estimar com a carta de pausa.",
							},
							{
								title: "Votem em segredo.",
								body: "Cada pessoa escolhe uma carta sem ver a dos outros — é o voto simultâneo que evita a ancoragem da primeira opinião.",
							},
							{
								title: "Revelem juntos.",
								body: "Todas as cartas viram ao mesmo tempo. A mediana, a média e o intervalo aparecem na mesa, junto da distribuição dos votos.",
							},
							{
								title: "Menor e maior explicam.",
								body: "Quem votou menos e quem votou mais falam primeiro; o resto do time escuta antes de responder.",
							},
							{
								title: "Conversem sobre a diferença.",
								body: "O objetivo é entender o que cada voto enxergou — não convencer ninguém. Muitas vezes quem muda é a história, não a pessoa.",
							},
							{
								title: "Feche ou vote de novo.",
								body: "O time fecha no número combinado ou faz uma segunda rodada com o que aprendeu. Rodadas extras são baratas; retrabalho, não.",
							},
						],
					},
				],
			},
			{
				id: "quanto-tempo",
				title: "Quanto tempo isso leva",
				blocks: [
					{
						type: "p",
						text: "Com prática, uma história pequena leva de 2 a 5 minutos — incluindo a discussão. Itens complexos podem chegar a 10. Se a conversa passar disso, o problema não é a estimativa: falta contexto, e o item volta para refinamento.",
					},
					{
						type: "p",
						text: "Em uma planning de duas horas, o time costuma estimar entre 15 e 30 itens nesse ritmo, dependendo do tamanho das histórias e de quanto a conversa se espalha.",
					},
					{
						type: "callout",
						label: "Dica",
						text: "Percebeu que o time está discutindo a solução e não o tamanho? Use a carta de pausa: a história precisa de mais contexto antes de virar número.",
					},
				],
			},
			{
				id: "quando-os-votos-divergem",
				title: "Quando os votos divergem",
				blocks: [
					{
						type: "p",
						text: "Divergência não é erro — é informação. O tamanho do spread diz quanto de conversa a história precisa antes da próxima rodada.",
					},
					{
						type: "table",
						headers: ["Spread", "O que costuma significar", "O que fazer"],
						rows: [
							[
								"1 ponto",
								"Detalhe pequeno de entendimento",
								"Fechar no maior ou no menor valor",
							],
							[
								"2–3 pontos",
								"Critério de aceite ambíguo",
								"Conversa curta e nova rodada",
							],
							[
								"5 ou mais",
								"A história está mal descrita ou precisa ser dividida",
								"Refinar antes de estimar",
							],
						],
					},
					{
						type: "p",
						text: "A mediana é a referência natural para fechar a rodada. A média ajuda a ler o conjunto, mas não decide sozinha: o número final é do time, não da planilha.",
					},
					{
						type: "p",
						text: "Uma segunda rodada não é fracasso. Quando o spread diminui, é sinal de que a conversa funcionou — mesmo que o time ainda não tenha fechado.",
					},
				],
			},
			{
				id: "depois-do-reveal",
				title: "Depois do reveal",
				blocks: [
					{
						type: "p",
						text: "O número combinado vai para o backlog junto da história. Quando o item terminar, compare o esforço real com a estimativa: é assim que a história de referência do time fica mais honesta com o tempo.",
					},
					{
						type: "p",
						text: "Se a história mudou de escopo no meio da sprint, reestime — sem drama. Story points descrevem o que se sabia na hora do voto, não um contrato.",
					},
					{
						type: "p",
						text: "Com o tempo, o conjunto dos números estimados forma a velocity do time — e é ela que ajuda a planejar a sprint seguinte, não a estimativa isolada de um item.",
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
								title: "Estimar em horas.",
								body: "Pontos medem esforço relativo; converter para dias quebra a escala na primeira sprint.",
							},
							{
								title: "Deixar o PO votar.",
								body: "Transforma estimativa em promessa de entrega e distorce o número.",
							},
							{
								title: "Usar a média como decisão.",
								body: "O número é o começo da conversa, não o resultado dela.",
							},
							{
								title: "Pular a conversa quando todos votam igual.",
								body: "Unanimidade também merece uma pergunta de confirmação: todo mundo considerou a mesma coisa?",
							},
							{
								title: "Estimar no automático.",
								body: "Ritual sem discussão vira apontamento de horas com outro nome.",
							},
							{
								title: "Estimar sem o time completo.",
								body: "Quem não estava na conversa tende a discordar do número depois. Se alguém essencial faltou, reestime com a pessoa presente.",
							},
						],
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
					question: "Preciso de cartas físicas para jogar planning poker?",
					answer:
						"Não. A sala da Pointly serve o deck Fibonacci completo no navegador, inclusive a carta de pausa, sem instalar nada.",
				},
				{
					question: "Quem deve participar da sessão?",
					answer:
						"Quem constrói a história vota; produto, design e quem facilita participam da conversa. Todos veem a mesma mesa pelo mesmo link.",
				},
				{
					question: "Quanto tempo devo reservar para a estimativa?",
					answer:
						"Depende do tamanho do backlog: de 2 a 5 minutos por história é a média com prática. Uma planning de duas horas costuma dar de 15 a 30 itens.",
				},
				{
					question: "O que fazer quando ninguém fecha um número?",
					answer:
						"Encerre a rodada e leve o item para refinamento. Falta contexto, não consenso.",
				},
				{
					question: "Precisa de uma pessoa facilitando?",
					answer:
						"Ajuda, mas qualquer pessoa pode conduzir. Se quem facilita também constrói, combine um rodízio para conduzir a rodada.",
				},
			],
		},
		closing: {
			title: "Coloque em prática",
			body: "Crie uma sala grátis, convide o time e rode a primeira história hoje.",
			cta: "Criar sala",
			relatedLabel: "Continue",
			related: [
				{ to: "/guias/o-que-e-planning-poker", label: "O que é planning poker" },
				{ to: "/guias/story-points", label: "Story points na prática" },
				{ to: "/planning-poker", label: "Planning poker online grátis" },
			],
		},
	},
	"o-que-e": {
		lang: "pt-BR",
		path: "/guias/o-que-e-planning-poker",
		h1: "O que é planning poker?",
		lede: "De onde veio, por que funciona e quando usar — com um exemplo prático para o time estimar melhor.",
		meta: `5 min de leitura · ${META_PT}`,
		tocLabel: "Neste guia",
		back: { to: "/guias", label: "Guias de planning poker" },
		sections: [
			{
				id: "o-que-e",
				title: "O que é planning poker (e o que não é)",
				blocks: [
					{
						type: "p",
						text: "Planning poker é uma técnica de estimativa em grupo: cada pessoa vota em segredo quanto esforço uma história pede, todas as cartas viram ao mesmo tempo e o time conversa sobre as diferenças até chegar a um número que todos defendem.",
					},
					{
						type: "p",
						text: "Não é uma votação de opinião. O voto é uma leitura técnica de esforço, complexidade e incerteza — e o que importa é a conversa que o reveal provoca, não o placar.",
					},
					{
						type: "p",
						text: "Também não é uma ferramenta: cartas de papel, planilha ou uma sala no navegador são suportes diferentes para o mesmo ritual.",
					},
					{
						type: "p",
						text: "O resultado do ritual não é só um número: é um entendimento compartilhado. Duas pessoas com o mesmo número e entendimentos diferentes é um problema que aparece na sprint, não na estimativa.",
					},
				],
			},
			{
				id: "de-onde-veio",
				title: "De onde veio",
				blocks: [
					{
						type: "p",
						text: "O nome apareceu em 2002, com James Grenning, e foi popularizado por Mike Cohn nos anos seguintes como parte do kit de estimativa ágil. A raiz é mais antiga: o método Delphi, dos anos 1960, já combinava julgamento anônimo com revisão coletiva.",
					},
					{
						type: "p",
						text: "Trocar o anonimato do Delphi pelo reveal simultâneo resolveu uma parte prática: o time conversa cara a cara, mas ninguém vê o voto do outro antes de registrar o próprio.",
					},
					{
						type: "p",
						text: "O nome “poker” veio da mecânica de cartas, não do jogo em si: a ideia era dar às estimativas a informalidade de uma mesa de cartas, com a mesma seriedade de resultado.",
					},
				],
			},
			{
				id: "por-que-funciona",
				title: "Por que funciona",
				blocks: [
					{
						type: "p",
						text: "O voto simultâneo evita a ancoragem: ninguém ajusta o número para acompanhar quem falou primeiro. Quando a primeira opinião vira o número final, a estimativa é do mais confiante — ou do mais rápido —, não do time.",
					},
					{
						type: "p",
						text: "A comparação relativa faz o trabalho pesado. Times estimam melhor comparando histórias entre si, do tipo “isto é maior que aquilo?”, do que tentando medir em horas.",
					},
					{
						type: "p",
						text: "E a rodada transforma divergência em pauta: em vez de discutir a estimativa em abstrato, o time discute exatamente os pontos que fizeram os votos se separarem.",
					},
					{
						type: "p",
						text: "Há também um efeito de calibração: ao ver o voto dos colegas e ouvir o raciocínio deles, cada pessoa ajusta a própria régua. Em algumas semanas, o time fica mais consistente sem que ninguém tenha estudado uma fórmula.",
					},
					{
						type: "p",
						text: "O voto secreto também protege quem tem menos experiência: sem a pressão do olhar, a opinião minoritária aparece — e frequentemente é ela que revela o caso esquecido.",
					},
				],
			},
			{
				id: "quando-usar",
				title: "Quando usar (e quando não)",
				blocks: [
					{
						type: "p",
						text: "Use no planejamento de sprint, no refinamento do backlog e sempre que o time precisar estimar itens novos em grupo. Funciona melhor com histórias descritas, mesmo que ainda com pontas soltas.",
					},
					{
						type: "p",
						text: "Não use quando o prazo já está imposto por fora — a estimativa vira teatro — nem em itens enormes que ninguém entende: uma pausa e um spike (investigação com tempo-box) resolvem antes. Times sem nenhum domínio do assunto também estimam melhor depois de um refinamento.",
					},
					{
						type: "p",
						text: "Um sinal de que a hora é boa: o item já tem critério de aceite e ainda gera dúvidas de tamanho. Se não gera dúvida nenhuma, o voto é rápido; se gera dúvida de entendimento, o lugar é o refinamento.",
					},
				],
			},
			{
				id: "os-nomes",
				title: "Os nomes: planning poker, scrum poker, pôquer de planejamento",
				blocks: [
					{
						type: "p",
						text: "São o mesmo ritual. “Planning poker” é o nome mais antigo; “scrum poker” aparece quando o time adota Scrum e a sessão acontece no sprint planning; em português, “pôquer de planejamento” é a tradução literal, menos comum.",
					},
					{
						type: "p",
						text: "O que muda é o contexto, não a dinâmica: voto secreto, reveal simultâneo, conversa e, se precisar, nova rodada. Se o seu time usa o nome scrum poker, a página de [scrum poker online](/scrum-poker) mostra o mesmo fluxo no contexto do Scrum.",
					},
					{
						type: "p",
						text: "Times que usam Scrum costumam chamar a sessão de scrum poker mesmo quando o deck é o mesmo do planning poker — a diferença está na cerimônia, não nas cartas.",
					},
				],
			},
			{
				id: "um-exemplo",
				title: "Um exemplo prático",
				blocks: [
					{
						type: "p",
						text: "A história é “Checkout mobile”. Bia vota 3, Caio vota 8, Dani vota 5 e você vota 5. No reveal, Caio explica: considerou o pagamento com dois cartões e a integração nova que isso exige.",
					},
					{
						type: "p",
						text: "Bia percebe que esqueceu esse caso. Dani lembra que o time já resolveu algo parecido no checkout desktop. Em uma segunda rodada rápida, os votos convergem para 5 — e a história fica com esse número, agora com o mesmo entendimento para todo mundo.",
					},
					{
						type: "p",
						text: "O que ficou registrado não foi só o 5: ficou a lista de casos que o time passou a considerar — dois cartões, expiração de link. É esse acervo que faz a próxima estimativa ser mais rápida.",
					},
				],
			},
			{
				id: "como-aplicar",
				title: "Como aplicar em 5 passos",
				blocks: [
					{
						type: "steps",
						items: [
							{
								title: "Escolha a história.",
								body: "Descreva o contexto e os critérios de aceite antes de qualquer voto.",
							},
							{
								title: "Abra a sala.",
								body: "Convide quem constrói: apelido, código de 4 caracteres e todo mundo dentro em segundos, sem cadastro.",
							},
							{
								title: "Votem em segredo.",
								body: "Cada pessoa escolhe uma carta do deck Fibonacci sem ver a dos outros.",
							},
							{
								title: "Revelem e conversem.",
								body: "Ouça quem votou menos e quem votou mais antes de defender o próprio número.",
							},
							{
								title: "Feche ou repita.",
								body: "Chegue a um número que todos defendem ou faça uma segunda rodada com o que aprendeu.",
							},
						],
					},
					{
						type: "p",
						text: "O passo a passo detalhado de uma sessão inteira, com tempo por história e roteiro para divergência, está em [como jogar planning poker](/guias/como-jogar-planning-poker).",
					},
					{
						type: "p",
						text: "Se o time é novo no ritual, rode a primeira sessão com histórias já entregues: errar em itens conhecidos é barato e calibra a régua de todo mundo.",
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
					question: "O que significa planning poker?",
					answer:
						"É uma técnica de estimativa em grupo em que cada pessoa vota em segredo e os votos são revelados ao mesmo tempo, para o time conversar sobre as diferenças antes de fechar um número.",
				},
				{
					question: "Preciso de cartas físicas?",
					answer:
						"Não. Existem decks de papel, mas qualquer sala de planning poker online serve cartas digitais. A Pointly tem o deck Fibonacci completo no navegador.",
				},
				{
					question: "Qual a diferença para pôquer comum?",
					answer:
						"Só a metáfora das cartas. No planning poker não há aposta nem adversário: o objetivo é estimar esforço em grupo, não ganhar a mão.",
				},
				{
					question: "Quem pode jogar?",
					answer:
						"Qualquer pessoa que vai construir a história. Quem não executa pode participar da conversa como ouvinte, sem votar.",
				},
				{
					question: "Por que o deck é Fibonacci?",
					answer:
						"Porque a incerteza cresce com o tamanho do item: a sequência abre espaço entre os números grandes e evita falsa precisão. Detalhes no guia sobre story points.",
				},
			],
		},
		closing: {
			title: "Aplique no próximo time",
			body: "Crie uma sala grátis e transforme a próxima planning em uma conversa com número no fim.",
			cta: "Criar sala",
			relatedLabel: "Continue",
			related: [
				{ to: "/guias/como-jogar-planning-poker", label: "Como jogar, passo a passo" },
				{ to: "/guias/story-points", label: "Story points na prática" },
				{ to: "/planning-poker", label: "Planning poker online grátis" },
			],
		},
	},
	"story-points": {
		lang: "pt-BR",
		path: "/guias/story-points",
		h1: "Story points: o que são e como estimar",
		lede: "Escala, sequência de Fibonacci, story points vs horas e como calibrar com uma história de referência.",
		meta: `7 min de leitura · ${META_PT}`,
		tocLabel: "Neste guia",
		back: { to: "/guias", label: "Guias de planning poker" },
		sections: [
			{
				id: "o-que-sao",
				title: "O que são story points",
				blocks: [
					{
						type: "p",
						text: "Story points são uma unidade relativa de esforço. Eles resumem três coisas ao mesmo tempo: o trabalho necessário, a complexidade envolvida e a incerteza do que ainda não se sabe.",
					},
					{
						type: "p",
						text: "Por serem relativos, pontos não têm valor absoluto. Uma história de 5 pontos não equivale a cinco horas nem a cinco dias: equivale a “mais ou menos isto” quando comparada com outras histórias do mesmo time.",
					},
					{
						type: "p",
						text: "Também não são uma medida de produtividade individual. Story points estimam o tamanho do item, não o desempenho de quem o executou — usar a escala em avaliação de pessoas quebra o propósito dela.",
					},
					{
						type: "p",
						text: "A pergunta certa nunca é “quantas horas?”, e sim “quanto isto é comparado àquilo que já fizemos?”. A resposta vem em forma de número, mas o conteúdo é uma comparação.",
					},
				],
			},
			{
				id: "pontos-vs-horas",
				title: "Story points vs horas",
				blocks: [
					{
						type: "p",
						text: "Horas parecem precisas, mas envelhecem rápido: mudou a pessoa, a ferramenta ou o entendimento, e a estimativa perde sentido. Pontos comparam histórias entre si e sobrevivem a essas mudanças.",
					},
					{
						type: "p",
						text: "A conversão de pontos para horas parece tentadora, mas cobra caro: o time passa a estimar em horas com outro nome e perde a escala relativa. Se o número vira compromisso de prazo, ninguém estima com honestidade nunca mais.",
					},
					{
						type: "p",
						text: "O uso saudável é coletivo. A média de pontos concluídos por sprint (a velocity) ajuda o time a prever quanto consegue puxar — nunca a comparar times entre si nem a cobrar produtividade.",
					},
				],
			},
			{
				id: "a-escala-fibonacci",
				title: "A escala de Fibonacci e por que ela funciona",
				blocks: [
					{
						type: "p",
						text: "A sequência 1, 2, 3, 5, 8, 13 cresce rápido de propósito: quanto maior o item, maior a incerteza, e menos sentido faz distinguir 8 de 9. O deck do planning poker costuma acrescentar 0, ½ e uma carta de pausa.",
					},
					{
						type: "table",
						headers: ["Valor", "Quando faz sentido", "Exemplo"],
						rows: [
							["0", "Nada a fazer", "Ajuste de texto, configuração"],
							["½", "Quase nada, mas conta", "Trocar um rótulo, corrigir uma cor"],
							["1", "Pequeno e conhecido", "Ajustar a validação de um formulário"],
							["2", "Pequeno com um detalhe", "Adicionar campo com máscara e teste"],
							["3", "Médio, caminho claro", "Tela simples ligada a dados existentes"],
							["5", "Médio com integração", "Checkout mobile"],
							["8", "Grande e incerto", "Relatório com agregação nova"],
							["13", "Grande demais", "Sinal de que precisa ser dividida"],
							["Pausa", "Falta contexto", "Levar para refinamento ou spike"],
						],
					},
					{
						type: "p",
						text: "A escala não é sagrada: times usam Fibonacci modificado, potências de dois ou até tamanhos de camiseta. O que importa é ser relativa, conhecida por todos e estável ao longo do tempo.",
					},
					{
						type: "p",
						text: "Os meios pontos e o zero existem para não forçar precisão onde não há: um ajuste de texto não é meia história, é zero; um ajuste que precisa de deploy pode ser meio ponto. A escala inteira acomoda essas diferenças sem criar degraus falsos.",
					},
				],
			},
			{
				id: "como-calibrar",
				title: "Como calibrar: a história de referência",
				blocks: [
					{
						type: "p",
						text: "O jeito mais rápido de dar sentido à escala é escolher uma história de referência: um item pequeno, muito bem entendido, que o time já fez. Ele vira o “1 ponto” — e tudo é comparado com ele.",
					},
					{
						type: "p",
						text: "“1 ponto” é local. O que é 1 para um time pode ser 3 para outro, e isso não é erro: a escala mede o esforço percebido por quem constrói. Comparar pontos entre times diferentes não diz nada.",
					},
					{
						type: "p",
						text: "Revise a referência de tempos em tempos: entrou gente nova, mudou a stack, o time trocou de produto? Recalibre com uma comparação rápida de algumas histórias conhecidas.",
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
								title: "Converter pontos em horas.",
								body: "A conversão destrói a escala relativa e cria falsa precisão.",
							},
							{
								title: "Comparar velocity entre times.",
								body: "Cada time tem a própria referência; a comparação vira competição sem sentido.",
							},
							{
								title: "Usar pontos em avaliação de desempenho.",
								body: "A estimativa começa a inflar no momento em que vira nota.",
							},
							{
								title: "Reestimar por pressão.",
								body: "Mudar o número para caber na sprint inverte a lógica: o backlog é que se ajusta.",
							},
							{
								title: "Estimar tudo em pontos.",
								body: "Bugs urgentes, spikes e tarefas operacionais nem sempre pedem estimativa — só as histórias que serão planejadas.",
							},
						],
					},
				],
			},
			{
				id: "um-exemplo-de-calibracao",
				title: "Um exemplo de calibração",
				blocks: [
					{
						type: "p",
						text: "Com a referência definida (“ajustar a validação de um formulário” = 1), o time compara o backlog com ela:",
					},
					{
						type: "table",
						headers: ["Item do backlog", "Pontos", "Por quê"],
						rows: [
							["Login social", "2", "Caminho conhecido, um fluxo a mais"],
							["Recuperação de senha por email", "3", "Fluxo novo com expiração de link"],
							["Checkout mobile", "5", "Integração e casos de pagamento"],
							["Relatório em PDF", "8", "Agregação nova e layout variável"],
						],
					},
					{
						type: "p",
						text: "Repare que os números não seguem uma proporção matemática exata — nem deveriam. Eles registram a leitura do time naquele momento, comparando itens entre si.",
					},
					{
						type: "p",
						text: "Com a régua em mãos, itens futuros entram por comparação: “parece maior que o checkout? então é 8”. Em minutos, o time estima o backlog inteiro.",
					},
				],
			},
			{
				id: "como-estimar-na-pratica",
				title: "Como estimar na prática",
				blocks: [
					{
						type: "p",
						text: "Story points e planning poker andam juntos: a escala dá a linguagem, a rodada dá o processo. Em uma sala online, o time compara, vota em segredo, vê a distribuição e conversa sobre as diferenças.",
					},
					{
						type: "p",
						text: "Se o seu time está começando, funciona rodar o ritual algumas vezes com histórias já concluídas: comparar com o passado calibra a referência mais rápido do que qualquer planilha.",
					},
					{
						type: "p",
						text: "Duas dicas para a primeira sessão: estime itens que o time já entregou, para a régua nascer calibrada, e registre depois de cada sprint quantos pontos foram concluídos — o número é insumo de previsão, não de cobrança.",
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
					question: "Story points são horas?",
					answer:
						"Não. Story points medem esforço relativo, complexidade e incerteza. Converter pontos em horas cria falsa precisão e quebra a escala do time.",
				},
				{
					question: "Por que a escala usa Fibonacci?",
					answer:
						"Porque a incerteza cresce com o tamanho do item. A sequência abre espaço entre os números grandes e evita discussões sobre diferenças que ninguém consegue perceber.",
				},
				{
					question: "Quanto vale 1 story point?",
					answer:
						"Depende do time: 1 ponto é o tamanho da história de referência escolhida por quem constrói. Por isso pontos não se comparam entre times diferentes.",
				},
				{
					question: "Velocity serve para prever entrega?",
					answer:
						"Serve para o time prever quanto consegue puxar por sprint, com base no próprio histórico. Não serve para comparar times nem para virar meta de produtividade.",
				},
				{
					question: "Posso usar outra escala, como tamanhos de camiseta?",
					answer:
						"Pode, desde que seja relativa e conhecida por todos. Fibonacci é popular porque a progressão acompanha bem o aumento da incerteza.",
				},
				{
					question: "Como saber se a estimativa está errada?",
					answer:
						"Compare com o realizado: se itens de 5 pontos sempre viram trabalho de 8, a história de referência precisa de ajuste. A calibração é contínua, não um evento único.",
				},
			],
		},
		closing: {
			title: "Estime a próxima história",
			body: "Crie uma sala grátis e coloque a escala em prática com o time.",
			cta: "Criar sala",
			relatedLabel: "Continue",
			related: [
				{ to: "/guias/como-jogar-planning-poker", label: "Como jogar, passo a passo" },
				{ to: "/guias/o-que-e-planning-poker", label: "O que é planning poker" },
				{ to: "/scrum-poker", label: "Scrum poker online grátis" },
			],
		},
	},
};
