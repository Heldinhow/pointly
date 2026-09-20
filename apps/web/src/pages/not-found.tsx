import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
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
	{ code: string; title: string; description: string; back: string; join: string }
> = {
	"pt-BR": {
		code: "Erro 404",
		title: "Página não encontrada",
		description: "Este endereço não existe por aqui. Confira o link ou o código do convite.",
		back: "Voltar ao início",
		join: "Entrar com código",
	},
	en: {
		code: "Error 404",
		title: "Page not found",
		description: "This address doesn't exist here. Check the link or the invite code.",
		back: "Back to home",
		join: "Join with code",
	},
};

/** Extrai um código de convite da URL atual (`?code=`) ou de um segmento
 * de sala (`/en/s/ABXD`). O Join normaliza de novo; aqui só preservamos a
 * intenção para não mandar quem tem convite de volta à estaca zero. */
function detectInviteCode(pathname: string, search: string): string {
	const clean = (value: string): string =>
		value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
	const fromQuery = clean(new URLSearchParams(search).get("code") ?? "");
	if (fromQuery) return fromQuery;
	const segments = pathname.split("/").filter(Boolean);
	const roomIndex = segments.findIndex(
		(segment) => segment.toLowerCase() === "s",
	);
	if (roomIndex >= 0 && segments[roomIndex + 1]) {
		return clean(segments[roomIndex + 1]);
	}
	return "";
}

export function NotFoundPage({
	lang = "pt-BR",
}: {
	lang?: Lang;
}): React.ReactElement {
	const copy = NOT_FOUND_COPY[lang];
	const location = useLocation();
	const inviteCode = detectInviteCode(location.pathname, location.search);
	const joinTo = inviteCode
		? `/join?mode=join&code=${inviteCode}`
		: "/join?mode=join";
	useEffect(() => {
		const previous = document.title;
		document.title =
			lang === "en" ? "Page not found · Pointly" : "Página não encontrada · Pointly";
		return () => {
			document.title = previous;
		};
	}, [lang]);
	return (
		<div className="not-found-page">
			<Card className="not-found-card">
				<CardHeader className="not-found-header">
					<p className="not-found-code">{copy.code}</p>
					<CardTitle render={<h1 />}>{copy.title}</CardTitle>
					<CardDescription>{copy.description}</CardDescription>
				</CardHeader>
				<CardFooter className="not-found-footer">
					<Button render={<Link to={lang === "en" ? "/en" : "/"} />}>
						{copy.back}
					</Button>
					<Button
						variant="outline"
						render={<Link to={joinTo} />}
					>
						{copy.join}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
