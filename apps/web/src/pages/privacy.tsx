import type { Lang } from "@/lib/i18n";
import "./privacy.css";

const CONTENT = {
	"pt-BR": {
		title: "Privacidade no Pointly",
		updated: "Atualizada em 23 de setembro de 2026",
		intro:
			"O Pointly permite estimar em grupo sem conta. Esta página explica quais dados são usados para manter uma sala funcionando e como controlar as informações guardadas no seu navegador.",
		sections: [
			{
				title: "Dados usados na sala",
				paragraphs: [
					"Para entrar, você informa um apelido e recebe um identificador aleatório do navegador. O servidor usa esses dados, o código da sala, os votos e o estado da rodada para manter a sessão em tempo real. Não pedimos conta nem e-mail para jogar.",
					"O apelido, o voto e a presença ficam visíveis às pessoas que participam da mesma sala. A sala é temporária: os dados ativos ficam em memória e a sala é removida quando todos saem. O Pointly não mantém histórico de salas ou estimativas.",
				],
			},
			{
				title: "Foto de perfil",
				paragraphs: [
					"A foto é opcional. Se você escolher uma, o navegador a redimensiona antes de enviá-la à sala; ela fica visível para as outras pessoas participantes. A cópia local permanece no armazenamento do navegador até você removê-la ou limpar esses dados.",
					"A cópia enviada ao servidor existe apenas enquanto a sala está ativa e é removida junto com ela quando todos saem.",
				],
			},
			{
				title: "Armazenamento no navegador",
				paragraphs: [
					"O Pointly usa armazenamento local para manter preferências de tema e idioma, um rascunho do apelido, a foto opcional e os dados mínimos necessários para retomar uma conexão. A escolha sobre analytics também é guardada localmente. Você pode apagar esses dados nas configurações do navegador.",
					"O Pointly não usa cookies próprios para manter a sala ou a identidade. Se analytics estiver habilitado e você aceitar, o Google Analytics poderá usar cookies de medição conforme a configuração da propriedade.",
				],
			},
			{
				title: "Analytics",
				paragraphs: [
					"Se o Google Analytics estiver habilitado na versão do serviço que você acessa, o script só será carregado depois que você aceitar analytics. A medição usa páginas e eventos de uso do produto; códigos de sala e parâmetros da URL são removidos dos pageviews. Recusar não impede criar ou entrar em uma sala.",
					"Quando analytics estiver ativo, você pode alterar ou retirar a escolha em “Configurações de privacidade”, no rodapé. A retirada impede novos eventos do Pointly; ela não apaga dados que já tenham sido processados pelo Google.",
					"O prazo de retenção dos dados enviados ao Google é definido nas configurações da propriedade do Analytics e não pelo navegador. Consulte a configuração da propriedade em uso para saber o prazo vigente.",
				],
			},
			{
				title: "Contato",
				paragraphs: [
					"Para dúvidas ou solicitações sobre privacidade, escreva para",
				],
			},
		],
		contact: "contato@pointly.com",
	},
	en: {
		title: "Privacy at Pointly",
		updated: "Last updated September 23, 2026",
		intro:
			"Pointly lets teams estimate together without accounts. This page explains what data is used to run a room and how to control information stored in your browser.",
		sections: [
			{
				title: "Data used in a room",
				paragraphs: [
					"To join, you provide a nickname and your browser receives a random identifier. The server uses these details, the room code, votes and round state to keep the session working in real time. An account or email is not required to play.",
					"Your nickname, vote and presence are visible to people in the same room. Rooms are temporary: active data stays in memory and the room is removed when everyone leaves. Pointly does not keep room or estimate history.",
				],
			},
			{
				title: "Profile picture",
				paragraphs: [
					"A picture is optional. If you choose one, your browser resizes it before sending it to the room; it is visible to other participants. A local copy stays in browser storage until you remove it or clear that data.",
					"The copy sent to the server exists only while the room is active and is removed with the room when everyone leaves.",
				],
			},
			{
				title: "Browser storage",
				paragraphs: [
					"Pointly uses local browser storage for theme and language preferences, a nickname draft, the optional picture and the minimum details needed to resume a connection. Your analytics choice is also stored locally. You can delete this data in your browser settings.",
					"Pointly does not use its own cookies to keep a room or identity. If analytics is enabled and you accept, Google Analytics may use measurement cookies according to the property's settings.",
				],
			},
			{
				title: "Analytics",
				paragraphs: [
					"If Google Analytics is enabled in the version of the service you access, its script is loaded only after you accept analytics. Measurement uses pages and product-usage events; room codes and URL parameters are removed from page views. Rejecting analytics does not prevent you from creating or joining a room.",
					"When analytics is active, you can change or withdraw your choice using “Privacy settings” in the footer. Withdrawal stops new Pointly events; it does not erase data already processed by Google.",
					"The retention period for data sent to Google is set in the Analytics property, not in your browser. Check the active property settings for the current period.",
				],
			},
			{
				title: "Contact",
				paragraphs: [
					"For privacy questions or requests, email",
				],
			},
		],
		contact: "contato@pointly.com",
	},
} as const;

export function PrivacyPage({ lang }: { lang: Lang }): React.ReactElement {
	const copy = CONTENT[lang];
	return (
		<article className="privacy-page">
			<header className="privacy-page__header">
				<h1>{copy.title}</h1>
				<p className="privacy-page__updated">{copy.updated}</p>
				<p className="privacy-page__intro">{copy.intro}</p>
			</header>
			{copy.sections.map((section) => (
				<section className="privacy-page__section" key={section.title}>
					<h2>{section.title}</h2>
					{section.paragraphs.map((paragraph) => (
						<p key={paragraph}>{paragraph}</p>
					))}
					{section.title === "Contato" || section.title === "Contact" ? (
						<a href={`mailto:${copy.contact}`}>{copy.contact}</a>
					) : null}
				</section>
			))}
		</article>
	);
}
