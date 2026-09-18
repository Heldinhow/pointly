import type { ProjectileType } from "./protocol";

/**
 * Catálogo de projéteis disponíveis em qualquer fase.
 * SSOT — antes duplicado entre `arena.tsx` e `PROJECTILE_TYPES` do protocolo.
 */
export const PROJECTILE_COOLDOWN_MS = 1000;
export const PROJECTILE_CHAIR_COOLDOWN_MS = 8000;

export const PROJECTILE_CATALOG: ReadonlyArray<{
	type: ProjectileType;
	label: string;
	emoji: string;
	epic?: boolean;
}> = [
	{ type: "paper_ball", label: "Bola de papel", emoji: "" },
	{ type: "paper_plane", label: "Aviãozinho de papel", emoji: "" },
	{ type: "rock", label: "Pedra", emoji: "🪨" },
	{ type: "brick", label: "Tijolo", emoji: "🧱" },
	{ type: "tomato", label: "Tomate", emoji: "🍅" },
	{ type: "chair", label: "Cadeirada do Datena", emoji: "", epic: true },
];
