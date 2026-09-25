import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n";
import { Link } from "react-router-dom";
import "./analytics-consent.css";

const COPY: Record<
	Lang,
	{
		title: string;
		body: string;
		privacy: string;
		accept: string;
		reject: string;
	}
> = {
	"pt-BR": {
		title: "Analytics, só com sua escolha",
		body: "O Pointly pode usar o Google Analytics para entender o uso do produto. A medição não começa sem sua autorização. Você pode mudar essa escolha pelo rodapé.",
		privacy: "Política de privacidade",
		accept: "Aceitar analytics",
		reject: "Recusar analytics",
	},
	en: {
		title: "Analytics only with your choice",
		body: "Pointly may use Google Analytics to understand product usage. Measurement does not start without your permission. You can change this choice from the footer.",
		privacy: "Privacy policy",
		accept: "Accept analytics",
		reject: "Reject analytics",
	},
};

export function AnalyticsConsent({
	lang,
	onChoose,
}: {
	lang: Lang;
	onChoose: (granted: boolean) => void;
}): React.ReactElement {
	const copy = COPY[lang];
	return (
		<section
			className="analytics-consent"
			aria-labelledby="analytics-consent-title"
			aria-describedby="analytics-consent-description"
			role="region"
		>
			<div className="analytics-consent__copy">
				<h2 id="analytics-consent-title">{copy.title}</h2>
				<p id="analytics-consent-description">{copy.body}</p>
				<Link to={lang === "en" ? "/en/privacy" : "/privacidade"}>
					{copy.privacy}
				</Link>
			</div>
			<div className="analytics-consent__actions">
				<Button type="button" variant="outline" onClick={() => onChoose(false)}>
					{copy.reject}
				</Button>
				<Button type="button" onClick={() => onChoose(true)}>
					{copy.accept}
				</Button>
			</div>
		</section>
	);
}
