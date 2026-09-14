import type { ProjectileOutcome, ProjectileType } from "./protocol";

/**
 * Catálogo de projéteis pós-reveal (issue #157).
 * SSOT — antes duplicado entre `arena.tsx` e `PROJECTILE_TYPES` do protocolo.
 */
export const PROJECTILE_COOLDOWN_MS = 5000;
export const PROJECTILE_FEED_LIMIT = 5;

export const PROJECTILE_CATALOG: ReadonlyArray<{
	type: ProjectileType;
	label: string;
	emoji: string;
}> = [
	{ type: "paper_ball", label: "Bola de papel", emoji: "🧻" },
	{ type: "tomato", label: "Tomate", emoji: "🍅" },
	{ type: "coffee", label: "Café", emoji: "☕" },
	{ type: "rubber_duck", label: "Pato", emoji: "🦆" },
	{ type: "star", label: "Estrela", emoji: "⭐" },
	{ type: "heart", label: "Coração", emoji: "❤️" },
	{ type: "claps", label: "Aplausos", emoji: "👏" },
];

const PROJECTILE_OUTCOME_LABEL: Record<ProjectileOutcome, string> = {
	hit: "acertou em cheio",
	dodge: "foi desviado",
	deflect: "foi rebatido",
};

/** Texto do feed com origem e destino claros (visível para a Sala). */
export function projectileFeedText(item: {
	senderNick: string;
	targetNick: string;
	projectileType: ProjectileType;
	outcome: ProjectileOutcome;
}): string {
	const catalog = PROJECTILE_CATALOG.find((c) => c.type === item.projectileType);
	const emoji = catalog ? `${catalog.emoji} ` : "";
	const label = catalog?.label ?? item.projectileType;
	const outcome = PROJECTILE_OUTCOME_LABEL[item.outcome] ?? item.outcome;
	return `${item.senderNick} jogou ${emoji}${label} em ${item.targetNick} · ${outcome}.`;
}
