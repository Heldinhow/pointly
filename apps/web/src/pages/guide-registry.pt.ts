import { PATHS } from "../seo/paths";

export type GuideLink = { to: string; label: string };

export type GuideRegistryEntry = {
	id: string;
	path: string;
	title: string;
	description: string;
	readingTime: string;
	keyword: string;
	related: readonly string[];
};

export const GUIDE_REGISTRY_PT: readonly GuideRegistryEntry[] = [
	{
		id: "como-jogar",
		path: PATHS.howToPlayPt,
		title: "Como jogar planning poker, passo a passo",
		description:
			"O roteiro de uma sessão real: papéis, rodada a rodada, tempo por história e o que fazer quando os votos divergem.",
		readingTime: "6 min de leitura",
		keyword: "como jogar planning poker",
		related: [
			"o-que-e",
			"story-points",
			"votos-divergentes-planning-poker",
			"agenda-sessao-planning-poker",
		],
	},
	{
		id: "o-que-e",
		path: PATHS.whatIsPt,
		title: "O que é planning poker?",
		description:
			"De onde veio, por que o voto simultâneo funciona e quando usar o ritual — com um exemplo prático de rodada.",
		readingTime: "5 min de leitura",
		keyword: "o que é planning poker",
		related: [
			"story-points",
			"como-jogar",
			"estimativa-agil",
			"scrum-poker-vs-planning-poker",
		],
	},
	{
		id: "story-points",
		path: PATHS.storyPointsPt,
		title: "Story points: o que são e como estimar",
		description:
			"Escala, sequência de Fibonacci, story points vs horas e como calibrar a estimativa com uma história de referência.",
		readingTime: "7 min de leitura",
		keyword: "story points",
		related: [
			"o-que-e",
			"fibonacci-estimativa-agil",
			"story-points-vs-horas",
			"t-shirt-sizing",
		],
	},
	{
		id: "planning-poker-remoto",
		path: PATHS.planningPokerRemotoPt,
		title: "Planning poker remoto: estimar com time distribuído",
		description:
			"Como rodar a sessão em videochamada sem ancoragem: agenda de 45 minutos, fusos horários e checklist de facilitação.",
		readingTime: "8 min de leitura",
		keyword: "planning poker remoto",
		related: [
			"como-jogar",
			"o-que-e",
			"agenda-sessao-planning-poker",
			"comparativo-ferramentas",
		],
	},
	{
		id: "story-points-vs-horas",
		path: PATHS.storyPointsVsHorasPt,
		title: "Story points vs horas: como responder quando fica pronto",
		description:
			"Por que não converter ponto em hora e como prever prazo com a velocidade do time, em faixa.",
		readingTime: "7 min de leitura",
		keyword: "story points vs horas",
		related: [
			"story-points",
			"fibonacci-estimativa-agil",
			"estimativa-agil",
			"planning-poker-remoto",
		],
	},
	{
		id: "fibonacci-estimativa-agil",
		path: PATHS.fibonacciEstimativaPt,
		title: "Fibonacci na estimativa ágil: por que 1, 2, 3, 5, 8, 13",
		description:
			"A sequência clássica e a modificada, o que cada faixa de valor significa e o que fazer quando a história chega a 13.",
		readingTime: "7 min de leitura",
		keyword: "fibonacci",
		related: [
			"story-points",
			"t-shirt-sizing",
			"story-points-vs-horas",
			"como-jogar",
		],
	},
	{
		id: "t-shirt-sizing",
		path: PATHS.tShirtSizingPt,
		title: "T-shirt sizing: escala PP-GG e conversão em pontos",
		description:
			"Estimativa por tamanhos para triagem de backlog, com tabelas de conversão para story points.",
		readingTime: "7 min de leitura",
		keyword: "t-shirt sizing",
		related: [
			"fibonacci-estimativa-agil",
			"story-points",
			"comparativo-ferramentas",
			"estimativa-agil",
		],
	},
	{
		id: "estimativa-agil",
		path: PATHS.estimativaAgilPt,
		title: "Estimativa ágil: o mapa completo",
		description:
			"Relativa x absoluta, story points, Fibonacci, t-shirt sizing, planning poker e velocidade, com link para cada guia.",
		readingTime: "9 min de leitura",
		keyword: "estimativa ágil",
		related: [
			"story-points",
			"o-que-e",
			"fibonacci-estimativa-agil",
			"t-shirt-sizing",
		],
	},
	{
		id: "votos-divergentes-planning-poker",
		path: PATHS.votosDivergentesPt,
		title: "Votos divergentes no planning poker: como conduzir a discussão",
		description:
			"Roteiro de 5 passos para depois do reveal: quem fala primeiro, como perguntar e quando dividir a história.",
		readingTime: "6 min de leitura",
		keyword: "votos divergentes",
		related: [
			"como-jogar",
			"planning-poker-remoto",
			"agenda-sessao-planning-poker",
			"planning-poker-para-devs",
		],
	},
	{
		id: "planning-poker-para-devs",
		path: PATHS.planningPokerParaDevsPt,
		title: "Planning poker para devs: bugs, spikes e tarefas técnicas",
		description:
			"Como estimar bug, investigação com timebox e dívida técnica, com opções em vez de regra.",
		readingTime: "7 min de leitura",
		keyword: "planning poker para devs",
		related: [
			"votos-divergentes-planning-poker",
			"story-points",
			"como-jogar",
			"agenda-sessao-planning-poker",
		],
	},
	{
		id: "agenda-sessao-planning-poker",
		path: PATHS.agendaSessaoPt,
		title: "Agenda de sessão de planning poker: modelo de 45 minutos",
		description:
			"Papéis, blocos com tempo sugerido e checklist de antes, durante e depois da estimativa.",
		readingTime: "6 min de leitura",
		keyword: "agenda",
		related: [
			"como-jogar",
			"planning-poker-remoto",
			"votos-divergentes-planning-poker",
			"estimativa-agil",
		],
	},
	{
		id: "scrum-poker-vs-planning-poker",
		path: PATHS.scrumPokerVsPlanningPokerPt,
		title: "Scrum poker x planning poker: qual é a diferença?",
		description:
			"Os nomes da mesma técnica (pointing poker, pôquer de planejamento) e qual usar no seu time.",
		readingTime: "4 min de leitura",
		keyword: "scrum poker",
		related: [
			"o-que-e",
			"como-jogar",
			"comparativo-ferramentas",
			"estimativa-agil",
		],
	},
	{
		id: "comparativo-ferramentas",
		path: PATHS.comparativoPt,
		title: "Planning poker online grátis: comparativo",
		description:
			"Pointly, Point Poker, SprintsPoker, Scrum Poker Online e Utilaria lado a lado: cadastro, limite de participantes, baralhos, anúncios e extras.",
		readingTime: "8 min de leitura",
		keyword: "comparativo",
		related: [
			"como-jogar",
			"o-que-e",
			"planning-poker-remoto",
			"scrum-poker-vs-planning-poker",
		],
	},
];

export const GUIDE_BY_ID: ReadonlyMap<string, GuideRegistryEntry> = new Map(
	GUIDE_REGISTRY_PT.map((guide) => [guide.id, guide]),
);

export const GUIDE_BY_PATH: ReadonlyMap<string, GuideRegistryEntry> = new Map(
	GUIDE_REGISTRY_PT.map((guide) => [guide.path, guide]),
);

export function relatedGuidesPt(path: string): readonly GuideLink[] {
	const guide = GUIDE_BY_PATH.get(path);
	if (!guide) throw new Error(`Guia sem registro: ${path}`);
	return guide.related.map((id) => {
		const related = GUIDE_BY_ID.get(id);
		if (!related) throw new Error(`Relacionado sem registro: ${id}`);
		return { to: related.path, label: related.title };
	});
}
