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
	epic?: boolean;
}> = [
	{ type: "paper_ball", label: "Bola de papel" },
	{ type: "paper_plane", label: "Aviãozinho de papel" },
	{ type: "rock", label: "Pedra" },
	{ type: "brick", label: "Tijolo" },
	{ type: "tomato", label: "Tomate" },
	{ type: "chair", label: "Cadeirada do Datena", epic: true },
];
