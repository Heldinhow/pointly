import type { LandingContent } from "./landing-content";

export const LANDING_CONTENT_PT: Record<string, LandingContent> = {
	"planning-poker": {
		kicker: "Planning poker · ao vivo",
		h1: "Planning poker online grátis: direto à conversa",
		lede: "Crie a sala, compartilhe o código e coloque o time para votar. Sem cadastro, sem instalação e sem plano pago — o navegador já basta.",
		deckNote: "O deck inteiro, do 0 à pausa.",
		ctaLabel: "Criar sala",
		howAnchorLabel: "Ver como funciona",
		how: {
			title: "Como funciona uma rodada",
			intro:
				"Da sala vazia ao número combinado, sem sair da reunião que o time já faria.",
			steps: [
				{
					title: "Crie a sala",
					body: "Escolha um apelido e pronto: nenhuma conta, nenhum email. Você recebe um código de 4 caracteres para convidar o time.",
				},
				{
					title: "Compartilhe o código",
					body: "Mande o código ou o link no canal onde o time já conversa. Cada pessoa entra pelo navegador, no computador ou no celular.",
				},
				{
					title: "Votem em segredo",
					body: "Cada um escolhe sua carta no deck Fibonacci — 0, ½, 1, 2, 3, 5, 8, 13 — ou a pausa, sem ver o voto dos outros.",
				},
				{
					title: "Revelem juntos",
					body: "Com todos os votos na mesa, qualquer pessoa pode revelar. Mediana, média, intervalo e a distribuição aparecem de uma vez.",
				},
				{
					title: "Conversem sobre a diferença",
					body: "Os votos que destoam apontam onde a história ainda não está clara. É ali que a conversa rende mais que o número.",
				},
				{
					title: "Siga para a próxima",
					body: "Combinado o valor, comece uma nova rodada. A sala continua a mesma enquanto o time estiver nela.",
				},
			],
		},
		why: {
			title: "Feito para o ritual, não para a ferramenta",
			intro:
				"O que o time precisa para estimar junto, sem nada em volta atrapalhando.",
			points: [
				{
					title: "Sem cadastro de verdade",
					body: "Ninguém cria conta nem informa email. O time inteiro está votando em menos de um minuto.",
				},
				{
					title: "Sala efêmera",
					body: "A sala existe enquanto o time está nela e some quando todos saem. Não sobra histórico para limpar depois.",
				},
				{
					title: "Leitura da rodada na hora",
					body: "Mediana, média e intervalo calculados no reveal, com números em fonte tabular. Se só houver pausa ou ausência, a mesa também diz.",
				},
				{
					title: "A conversa no centro",
					body: "A Pointly não estima pelo time: ela mostra onde os votos divergem para a discussão começar no lugar certo.",
				},
			],
		},
		sections: [
			{
				title: "O ritual em uma frase",
				paragraphs: [
					"Planning poker é uma técnica de estimativa em grupo: cada pessoa vota em segredo quanto esforço uma história pede, todas as cartas viram ao mesmo tempo e o time conversa sobre as diferenças até chegar a um número que todos defendem.",
					"A votação simultânea evita o efeito de ancoragem: ninguém ajusta o voto para acompanhar quem falou primeiro. É por isso que o reveal — o momento em que as cartas viram — é o coração da rodada.",
					"Um exemplo: a história “recuperação de senha por email” recebe 3, 5, 5 e 8. No reveal, quem votou 8 explica o caso de expiração do link que considerou, quem votou 3 percebe que esqueceu essa parte e o time fecha em 5 com o mesmo entendimento da história.",
					"Por que Fibonacci? A sequência cresce rápido porque a incerteza cresce junto: a diferença entre 2 e 3 é pequena, mas entre 8 e 13 ninguém afirma com segurança que uma história é exatamente um ponto maior que a outra. A carta de pausa completa o deck para os casos em que falta contexto — ela conta presença, mas fica fora dos cálculos.",
				],
			},
			{
				title: "O reveal: o que a mesa mostra",
				paragraphs: [
					"Quando o time revela, a Pointly calcula a mediana, a média e o intervalo dos votos numéricos. A mediana costuma ser o número combinado, porque não deixa um voto extremo puxar o resultado.",
					"A mesa também agrupa os votos por carta — 2×5, 1×8 — e marca rodadas unânimes ou divergentes. Se só houver pausa ou ausência, ela diz isso em vez de inventar uma média.",
					"O objetivo não é o número em si, e sim o que a distribuição revela: um 13 no meio de três 5 quase sempre significa um detalhe da história que alguém está enxergando e o resto do time ainda não.",
				],
			},
			{
				title: "Sem cadastro, sem histórico",
				paragraphs: [
					"Não há conta para criar, email para confirmar nem senha para guardar. O apelido é a única identificação, e a sala vive só enquanto o time está nela: quando a última pessoa sai, ela deixa de existir com os votos que estavam ali.",
					"Isso tira a fricção de começar — qualquer pessoa entra pelo link em segundos — e também o peso de administrar um histórico que ninguém vai consultar. Não existe versão paga escondendo recurso: o ritual inteiro é o produto.",
				],
			},
		],
		faq: {
			title: "Perguntas frequentes",
			items: [
				{
					question: "Preciso criar conta para jogar?",
					answer:
						"Não. Você escolhe um apelido e já está na sala. A Pointly não pede email nem senha, e não existe etapa de cadastro em nenhum momento.",
				},
				{
					question: "Quantas pessoas cabem em uma sala?",
					answer:
						"A Pointly foi desenhada para times de 3 a 12 pessoas. Dá para jogar com mais gente, mas a conversa fica melhor nessa faixa.",
				},
				{
					question: "Funciona no celular?",
					answer:
						"Sim. A sala abre no navegador do computador ou do celular, sem instalar nada. O link é o mesmo para todo mundo.",
				},
				{
					question: "O que acontece com os dados depois da sessão?",
					answer:
						"A sala é efêmera: ela deixa de existir quando o último participante sai e não há histórico de estimativas para gerenciar.",
				},
				{
					question: "Qual baralho a Pointly usa?",
					answer:
						"O deck Fibonacci: 0, ½, 1, 2, 3, 5, 8 e 13, mais uma carta de pausa para quando a história precisa de contexto antes de ser estimada.",
				},
				{
					question: "Dá para estimar com o time remoto?",
					answer:
						"É exatamente para isso. Cada pessoa entra pelo próprio navegador, de onde estiver, e o reveal acontece ao mesmo tempo para todos.",
				},
				{
					question: "Quanto custa usar a Pointly?",
					answer:
						"Nada. A Pointly é grátis e não tem plano pago: criar sala, votar e revelar são o produto inteiro, sem limite escondido atrás de assinatura.",
				},
			],
		},
		closing: {
			title: "Pronto para estimar sem fricção?",
			body: "Crie a sala, mande o código para o time e comece a primeira rodada em segundos.",
		},
		crossLink: {
			text: "O time chama esse ritual de scrum poker? A mesa é a mesma:",
			label: "ver a página de scrum poker",
			to: "/scrum-poker",
		},
		guidesLink: {
			text: "Prefere entender o ritual antes?",
			label: "comece pelos guias de planning poker",
			to: "/guias",
		},
	},
	"scrum-poker": {
		kicker: "Scrum poker · sem cadastro",
		h1: "Scrum poker online grátis, sem cadastro",
		lede: "Leve o scrum poker para o sprint planning: a sala fica pronta em segundos, o código de 4 caracteres convida o time e os story points saem de uma conversa.",
		deckNote: "Story points em cartas, não em horas.",
		ctaLabel: "Criar sala",
		howAnchorLabel: "Ver como funciona",
		how: {
			title: "Como funciona no sprint planning",
			intro: "Um item do backlog por rodada, do convite ao número fechado.",
			steps: [
				{
					title: "Abra a sala antes do planning",
					body: "Escolha um apelido e crie a sala sem cadastro. O código de 4 caracteres já fica pronto para o convite no canal do time.",
				},
				{
					title: "Traga o item do backlog",
					body: "Escolha a história da vez e descreva o contexto para o time. Cada item estimado é uma rodada nova, na mesma sala.",
				},
				{
					title: "Votem os story points",
					body: "Cada pessoa escolhe uma carta do deck Fibonacci. Os votos ficam escondidos até o reveal — ninguém combina por causa de quem falou primeiro.",
				},
				{
					title: "Revele e compare",
					body: "Mediana, média e intervalo aparecem juntos. Os votos destoantes mostram onde o item ainda é incerto para alguém do time.",
				},
				{
					title: "Feche a rodada e siga",
					body: "Cheguem a um número que todos defendem, registrem no backlog e comecem a próxima história sem sair da sala.",
				},
			],
		},
		why: {
			title: "Por que estimar com scrum poker",
			intro:
				"A estimativa em grupo troca o chute individual por uma decisão que o time inteiro entende.",
			points: [
				{
					title: "Sem ancoragem",
					body: "O voto simultâneo impede que a primeira opinião da reunião puxe as demais. O time decide depois de ver todas as cartas.",
				},
				{
					title: "Story points, não horas",
					body: "A escala Fibonacci mede esforço relativo e incerteza. Comparar histórias entre si rende números mais estáveis que tentar adivinhar dias.",
				},
				{
					title: "Discussão onde importa",
					body: "Quando os votos divergem, a mesa aponta a diferença exata. O time discute o item, não a estimativa em abstrato.",
				},
				{
					title: "Zero preparação",
					body: "Sem cadastrar o time, configurar board ou instalar aplicativo: uma sala, um link e o ritual acontece junto com o planning.",
				},
			],
		},
		sections: [
			{
				title: "Onde o scrum poker encaixa",
				paragraphs: [
					"Scrum poker é o nome que times Scrum dão ao planning poker: a mesma estimativa com cartas, feita durante o sprint planning. Cada pessoa escolhe uma carta da sequência de Fibonacci — 0, ½, 1, 2, 3, 5, 8, 13 — ou uma pausa, e as cartas viram juntas.",
					"O encaixe mais comum é estimar item a item durante o planning, antes de puxar trabalho para a sprint. Também funciona no refinamento do backlog, quando as histórias ainda estão amadurecendo, e em sessões avulsas de alinhamento.",
					"Como a sala não guarda histórico, cada sessão começa limpa: é o time que decide onde registrar os números — planilha, board ou ferramenta de gestão.",
				],
			},
			{
				title: "Da divergência ao número combinado",
				paragraphs: [
					"O valor do scrum poker aparece quando os votos divergem. Em vez de aceitar o primeiro número, a mesa mostra a distribuição — quatro votos em 5 e um em 8 — e a conversa vai direto ao ponto: o que quem votou 8 está considerando?",
					"A mediana é a referência natural para fechar a rodada, com a média e o intervalo ao lado. Se o item terminar unânime, melhor ainda: o time já está alinhado e pode seguir sem discussão.",
					"A carta de pausa existe para o item que ainda não dá para estimar: ela conta presença na rodada, fica fora da média e da mediana, e vira um sinal explícito de que a história precisa de mais contexto antes de receber um número.",
					"Depois da sessão, os números seguem a vida do time: entram na sprint, alimentam a velocity e ajudam a prever os próximos ciclos. A Pointly não interfere nesse passo — a sala é só o lugar da conversa, e o registro fica na ferramenta que o time já usa.",
				],
			},
			{
				title: "Time remoto, híbrido ou sala cheia",
				paragraphs: [
					"O scrum poker funciona igual para time presencial, remoto ou híbrido: cada pessoa entra pelo navegador e vota ao mesmo tempo, sem instalar nada. Em times distribuídos, o reveal simultâneo substitui o “quem acha o quê?” e dá a todos a mesma informação antes da discussão.",
					"Sem cadastro, quem entra de última hora não fica esperando aprovação: basta compartilhar o código de 4 caracteres, e a pessoa já vota na história seguinte.",
				],
			},
		],
		faq: {
			title: "Perguntas frequentes",
			items: [
				{
					question: "Scrum poker é a mesma coisa que planning poker?",
					answer:
						"Sim: são dois nomes para o mesmo ritual de estimativa com cartas. Muda o contexto em que o nome aparece, não a dinâmica da rodada.",
				},
				{
					question: "Quando fazer o scrum poker?",
					answer:
						"Em geral no sprint planning ou no refinamento do backlog, sempre que o time precisa estimar itens novos. Também funciona como alinhamento antes de puxar uma história para a sprint.",
				},
				{
					question: "O que são story points?",
					answer:
						"São unidades relativas de esforço: uma história de 5 pontos pede mais trabalho que uma de 3, sem equivaler a horas. A escala Fibonacci ajuda a manter a comparação consistente.",
				},
				{
					question: "Preciso de conta ou cadastro?",
					answer:
						"Não. Apelido e pronto. A sala é efêmera e não guarda histórico: quando o time sai, ela deixa de existir.",
				},
				{
					question: "Funciona para time remoto ou híbrido?",
					answer:
						"Sim. Cada pessoa entra pelo navegador de onde estiver, e o reveal acontece ao mesmo tempo para todo mundo.",
				},
				{
					question: "Dá para estimar mais de um item na mesma sessão?",
					answer:
						"Sim: cada item é uma rodada. Estime a história, feche o número e comece a próxima sem sair da sala.",
				},
				{
					question: "A Pointly é gratuita de verdade?",
					answer:
						"Sim, grátis e sem plano pago. Sem cadastro, sem email e sem recurso bloqueado atrás de assinatura.",
				},
			],
		},
		closing: {
			title: "Comece o próximo planning com a mesa pronta",
			body: "Crie a sala, convide o time e estime a primeira história hoje mesmo.",
		},
		crossLink: {
			text: "Ou o time chama o ritual de planning poker? Os detalhes estão aqui:",
			label: "ver a página de planning poker",
			to: "/planning-poker",
		},
		guidesLink: {
			text: "Quer se aprofundar na estimativa?",
			label: "comece pelos guias",
			to: "/guias",
		},
	},
};
