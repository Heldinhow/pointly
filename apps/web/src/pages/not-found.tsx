import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { Lang } from "@/lib/i18n";
import "./join.css";

const NOT_FOUND_COPY: Record<
	Lang,
	{ code: string; title: string; description: string; back: string }
> = {
	"pt-BR": {
		code: "Erro 404",
		title: "Página não encontrada",
		description: "Este endereço não existe por aqui.",
		back: "Voltar ao início",
	},
	en: {
		code: "Error 404",
		title: "Page not found",
		description: "This address doesn't exist here.",
		back: "Back to home",
	},
};

export function NotFoundPage({
	lang = "pt-BR",
}: {
	lang?: Lang;
}): React.ReactElement {
	const copy = NOT_FOUND_COPY[lang];
	return (
		<div className="not-found-page">
			<Card className="not-found-card">
				<CardHeader className="not-found-header">
					<p className="not-found-code">{copy.code}</p>
					<CardTitle render={<h1 />}>{copy.title}</CardTitle>
					<CardDescription>{copy.description}</CardDescription>
				</CardHeader>
				<CardFooter className="not-found-footer">
					<Button variant="outline" render={<Link to={lang === "en" ? "/en" : "/"} />}>
						{copy.back}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
