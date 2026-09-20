import type { ArenaContent } from "./arena-content";

export const ARENA_CONTENT_PT: ArenaContent = {
	lang: "pt-BR",
	phase: {
		idle: "Aguardando votos",
		voting: "Votando",
		revealable: "Pronta para revelar",
		revealed: "Revelada",
	},
	loading: {
		reconnectTitle: "Não foi possível reconectar",
		retry: "Tentar de novo",
		backToJoin: "Voltar à entrada",
		reconnectingAria: "Reconectando",
		loadingAria: "Carregando sala",
		reconnecting: "Reconectando…",
		loading: "Carregando sala…",
	},
	toolbar: {
		room: "Sala",
		round: (round, phase) => `Rodada ${round} · ${phase}`,
		presenceSpectators: (voters, spectators, voted) =>
			`${voters} jogando · ${spectators} assistindo · ${voted} ${
				voted === 1 ? "votou" : "votaram"
			}`,
		presence: (connected, voted) =>
			`${connected} na sala · ${voted} ${voted === 1 ? "votou" : "votaram"}`,
		leave: "Sair da sala",
	},
	reconnecting: {
		title: "Reconectando…",
		hint: (attempt) =>
			`Tentativa ${attempt} de reconexão — o placar pode estar desatualizado.`,
		retryNow: "Tentar agora",
	},
	connectionLost: {
		title: "Conexão perdida",
		hint: "O placar pode estar desatualizado. Tente se conectar de novo.",
		retry: "Tentar de novo",
	},
	playArea: {
		aria: "Mesa de planning poker",
		caption: "Mesa de planning poker",
		seatsLeft: (taken, total) => `${taken} de ${total} lugares`,
	},
	reveal: {
		titleRevealed: "Cartas na mesa",
		titleReady: "Vamos revelar?",
		titleVoting: "Qual é a sua estimativa?",
		descRevealed: "Votos revelados. Discutam as diferenças.",
		descReady: "Todos votaram.",
		descCanReveal: "Já temos votos. Qualquer pessoa pode revelar.",
		descWaiting:
			"Aguardando o primeiro voto. Escolha uma carta para começar.",
		reveal: "Revelar votos",
		revealAria: "Revelar votos (atalho R)",
		revealAriaWaiting: "Aguardando votos para revelar",
		revealHint: "revela",
		revealHintReady: " · vai à discussão.",
		revealHintWaiting: " · disponível após o primeiro voto.",
		newRound: "Nova rodada",
		newRoundConfirm: "Confirmar nova rodada",
		newRoundAria: "Nova rodada (atalho N, exige confirmação)",
		newRoundAriaConfirm: "Confirmar nova rodada (atalho N)",
		newRoundHint:
			"Prontos para a próxima estimativa? Os votos serão limpos após sua confirmação.",
		newRoundHintConfirm:
			"Ative de novo para confirmar e limpar os votos. A confirmação expira em 5 segundos.",
		errorTitle: "Não foi possível revelar",
		newRoundErrorTitle: "Não foi possível abrir nova rodada",
	},
	projectile: {
		hint: "Passe o mouse ou toque em alguém para arremessar · 1s de intervalo (cadeirada: 8s).",
		errorTitle: "Não foi possível interagir",
		cooldown: (secs) =>
			`Recarregando · aguarde ${secs}s para arremessar de novo.`,
		unavailable: "Arremesso indisponível: escolha outro participante conectado.",
		nudgeCooldown: (secs) =>
			`Recarregando · aguarde ${secs}s para cutucar de novo.`,
		nudgeUnavailable:
			"Cutucada indisponível: escolha outro participante conectado.",
	},
	deck: {
		spectatorTitle: "Você está assistindo",
		title: "Sua estimativa",
		spectatorDesc:
			"Espectadores acompanham e reagem, mas não votam. Para votar, saia e entre como jogador.",
		pickAdjustable: "Escolha uma carta para votar. Você pode ajustar depois.",
		spectatorVoteError:
			"Espectadores não votam. Para votar, saia e entre como jogador.",
		errorTitle: "Não foi possível votar",
	},
	tableNote: {
		estimate: "Estimativas independentes. Conversas em conjunto.",
		revealShortcut: "revelar",
		newRoundShortcut: "nova rodada",
	},
	sidebar: {
		aria: "Informações da sala",
		youAre: "Você é",
		watching: " · Assistindo",
		selfHost: " · Host da sala",
		hostLead: " · Host: ",
		avatarErrorTitle: "Não foi possível trocar a foto",
		avatarError: "Não foi possível trocar a foto. Tente de novo.",
		spectators: (count) => `Assistindo (${count}):`,
	},
	invite: {
		title: "Convidar o time",
		description: "Compartilhe o link e reúna o time à mesa.",
		linkAria: "Link de convite",
		copy: "Copiar",
		copied: "Copiado!",
		copyFeedback: "Link copiado! É só enviar ao time.",
		copyError:
			"Não foi possível copiar. Selecione o link e copie manualmente.",
		hide: "Ocultar convite",
		show: "Mostrar convite",
	},
	results: {
		title: "Resultados",
		description:
			"Média, mediana, menor e maior estimativa · pausa e ausência ficam fora dos cálculos.",
		unanimous: "Unânime",
		noNumerics: "Sem votos numéricos",
		single: "Voto único",
		median: "Mediana",
		mean: "média",
		range: "intervalo",
		pipTitle: (count, value) =>
			`${count} ${count > 1 ? "votos" : "voto"} em ${value}`,
		noNumericsNote:
			"Só pausa ou ninguém votou · sem média, mediana nem intervalo.",
		justifyLead: "Justifica primeiro:",
	},
	waiting: {
		spectatorTitle: "Acompanhe a votação.",
		title: "Cada opinião conta.",
		spectatorBody:
			"As cartas ficam escondidas até a revelação. Você assiste sem votar.",
		body: "As cartas ficam escondidas até a revelação. Escolha sem influência do time.",
		solo: "Você está sozinho. Copie o convite para chamar o time. Dá para votar sozinho para testar o fluxo.",
		soloSpectator: "Você está sozinho. Copie o convite para chamar o time.",
	},
	errors: {
		genericAction: "Não foi possível completar a ação.",
		vote: "Não foi possível registrar o voto.",
		interact: "Não foi possível interagir.",
		reveal: "Não foi possível revelar.",
		newRound: "Não foi possível abrir nova rodada.",
	},
};
