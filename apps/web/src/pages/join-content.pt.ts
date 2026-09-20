import type { JoinContent } from "./join-content";

export const JOIN_CONTENT_PT: JoinContent = {
	lang: "pt-BR",
	intro: {
		h1Line1: "Seu time.",
		h1Line2: "Na mesma mesa.",
		copy: "Abra uma sala para começar uma rodada ou use o código de um convite. Sem cadastro, sem espera.",
		stepsAria: "Como funciona",
		steps: [
			{ title: "Crie a sala", body: "Escolha um apelido, sem conta." },
			{ title: "Compartilhe o código", body: "Convide onde o time já conversa." },
			{
				title: "Estimem juntos",
				body: "Revelem e conversem sobre as diferenças.",
			},
		],
	},
	card: {
		titleCreate: "Prepare sua sala",
		titleJoin: "Entre na sala",
		description: "Sem cadastro, só um apelido para a mesa.",
		modesAria: "Criar sala ou entrar com código",
		createRoom: "Criar sala",
		joinWithCode: "Entrar com código",
		nickLabel: "Apelido",
		nickPlaceholder: "Como o time te chama?",
		nickHint: "2 a 20 caracteres, sem espaços duplos.",
		codeLabel: "Código da sala",
		codeHint: "4 letras ou números. Cole o código do convite.",
		codeCharAria: (index) => `Caractere ${index + 1} de 4`,
		spectatorTitle: "Entrar como espectador",
		spectatorHint: "Assiste e reage, mas não vota nem ocupa assento.",
		errorTitle: "Não foi possível entrar",
		submitCreate: "Criar sala",
		submitJoin: "Entrar na sala",
		statusCreating: "Criando sala…",
		statusJoining: "Entrando na sala…",
	},
};
