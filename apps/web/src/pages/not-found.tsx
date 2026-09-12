/**
 * 404 — PT-BR, links p/ / e /join, autofocus no título.
 */
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export function NotFound() {
	const titleRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		titleRef.current?.focus();
	}, []);

	return (
		<div
			data-testid="page-not-found"
			className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#09090b] px-6 text-center text-zinc-100"
		>
			<p className="font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase">
				404
			</p>
			<h1
				ref={titleRef}
				tabIndex={-1}
				className="text-3xl font-medium tracking-tight outline-none sm:text-4xl"
			>
				Essa página não existe.
			</h1>
			<p className="max-w-md text-base leading-relaxed text-zinc-400">
				O endereço pode estar incompleto ou a sala já terminou. Volte ao
				início para criar uma sala ou entre com um código.
			</p>
			<div className="flex flex-wrap items-center justify-center gap-3">
				<Link
					to="/"
					className="rounded-md bg-zinc-100 px-5 py-3 font-mono text-xs font-semibold tracking-[0.08em] text-zinc-950 uppercase transition-colors hover:bg-white"
				>
					Ir para o início
				</Link>
				<Link
					to="/join"
					className="rounded-md border border-zinc-700 px-5 py-3 font-mono text-xs font-semibold tracking-[0.08em] text-zinc-200 uppercase transition-colors hover:border-zinc-500 hover:text-white"
				>
					Entrar com código
				</Link>
			</div>
		</div>
	);
}
