import type { Lang } from "./i18n";
import type { ProjectileType } from "./protocol";

/**
 * Catálogo de projéteis disponíveis em qualquer fase.
 * SSOT — antes duplicado entre `arena.tsx` e `PROJECTILE_TYPES` do protocolo.
 */
export const PROJECTILE_COOLDOWN_MS = 1000;
export const PROJECTILE_CHAIR_COOLDOWN_MS = 8000;

export const PROJECTILE_CATALOG: ReadonlyArray<{
	type: ProjectileType;
	label: Record<Lang, string>;
	epic?: boolean;
}> = [
	{
		type: "paper_ball",
		label: { "pt-BR": "Bola de papel", en: "Paper ball" },
	},
	{
		type: "paper_plane",
		label: { "pt-BR": "Aviãozinho de papel", en: "Paper plane" },
	},
	{ type: "rock", label: { "pt-BR": "Pedra", en: "Rock" } },
	{ type: "brick", label: { "pt-BR": "Tijolo", en: "Brick" } },
	{ type: "tomato", label: { "pt-BR": "Tomate", en: "Tomato" } },
	{
		type: "chair",
		label: { "pt-BR": "Cadeirada do Datena", en: "Flying chair" },
		epic: true,
	},
];
