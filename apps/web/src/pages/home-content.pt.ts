import type { HomeContent } from "./home-content";

export const HOME_CONTENT_PT: HomeContent = {
	lang: "pt-BR",
	hero: {
		h1Lead: "Planning poker online grátis",
		h1Em: "para o seu time.",
		lede: "Planning poker sem cadastro. Reúna o time, escolha suas cartas e transforme estimativas diferentes em uma conversa que faz o projeto avançar.",
		createRoom: "Criar sala",
		enterWithCode: "Entrar com código",
		tryRound: "Experimente uma rodada",
	},
	visual: {
		kicker: "História em votação",
		story: "Checkout mobile",
		waiting: "3 de 4 votaram · falta você",
		you: "Você",
	},
	demo: {
		titleLead: "Sua vez de votar.",
		titleEnd: "A sala revela.",
		intro:
			"Escolha sua carta. Bia, Caio e Dani já votaram — a revelação mostra como a conversa começa.",
		kicker: "História em votação",
		story: "Checkout mobile",
		statusWaiting: "3 de 4 votaram · falta você",
		statusAllVoted: "Todos votaram · hora de revelar",
		statusRevealed: "Votos revelados",
		reveal: "Revelar votos simulados",
		revealAriaEmpty: "Escolha uma carta para revelar",
		hintEmpty:
			"Escolha sua estimativa para revelar. Os votos do time são simulados.",
		hintReady: "Com sua carta na mesa, revele os votos simulados.",
		revealed: "Votos revelados. A conversa pode avançar.",
		votesAria: "Votos simulados",
		you: "Você",
		statsUnanimous: "Unânime",
		statsNoNumerics: "Sem votos numéricos",
		statsSingle: "Voto único",
		statsMedian: "Mediana",
		captionMean: "média",
		captionRange: "intervalo",
		statsDetails: "Detalhes",
		pipTitle: (count, value) =>
			`${count} ${count > 1 ? "votos" : "voto"} em ${value}`,
		noNumerics: "Só pausa ou ninguém votou. Sem média, mediana nem intervalo.",
		createWithTeam: "Criar sala",
		retry: "Tentar de novo",
	},
	how: {
		title: "Agora, reúna seu time.",
		steps: [
			{
				title: "Crie a sala",
				body: "Escolha seu apelido e comece sem cadastro.",
			},
			{
				title: "Compartilhe o código",
				body: "Convide o time onde vocês já conversam.",
			},
			{
				title: "Estimem juntos",
				body: "Revelem as cartas e conversem sobre as diferenças.",
			},
		],
		cta: "Criar sala",
	},
};
