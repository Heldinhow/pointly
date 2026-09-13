/**
 * 404 — PT-BR, links p/ / e /join, autofocus no título.
 */
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/spell/badge";
import { RichButton } from "@/components/spell/rich-button";

export function NotFound() {
	const titleRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		titleRef.current?.focus();
	}, []);

	return (
		<div
			data-testid="page-not-found"
			className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-[#09090b] bg-[radial-gradient(ellipse_55%_30%_at_50%_0%,rgba(52,211,153,0.07),transparent_70%)] px-6 text-center text-zinc-100 [html.light_&]:bg-zinc-100 [html.light_&]:text-zinc-900"
		>
			<Badge variant="blue" className="font-mono tracking-[0.2em] uppercase">
				404
			</Badge>
			<h1
				ref={titleRef}
				tabIndex={-1}
				className="text-3xl font-medium tracking-tight outline-none sm:text-4xl"
			>
				Essa página não existe.
			</h1>
			<p className="max-w-md text-base leading-relaxed text-zinc-400 [html.light_&]:text-zinc-600">
				O endereço pode estar incompleto ou a sala já terminou. Volte ao
				início para criar uma sala ou entre com um código.
			</p>
			<div className="flex flex-wrap items-center justify-center gap-3">
				<RichButton color="emerald" size="lg" asChild className="rounded-full">
					<Link to="/">Ir para o início</Link>
				</RichButton>
				<RichButton color="zinc" size="lg" asChild className="rounded-full">
					<Link to="/join">Entrar com código</Link>
				</RichButton>
			</div>
		</div>
	);
}
