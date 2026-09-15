/**
 * Avatar schema tests — avatar-perfil-mesa T1 (AV-03).
 *
 * Derivado da spec: dataURL jpeg/png/webp com teto ~40KB, opcional/nullable
 * em PlayerSchema (ausente/null = iniciais). Run: `bun --filter @planning-poker/shared test`.
 */
import { describe, expect, test } from "bun:test";
import { AvatarSchema, PlayerSchema } from "./sala";

const JPEG = "data:image/jpeg;base64,/9j/4AAQ";
const PNG = "data:image/png;base64,iVBORw0KGgo=";
const WEBP = "data:image/webp;base64,UklGRg==";

const validPlayer = {
	id: "p1",
	uuid: "550e8400-e29b-41d4-a716-446655440000",
	nick: "Ana",
	role: "host" as const,
	seatIndex: 0,
	hasVoted: false,
	value: null,
	status: "connected" as const,
	joinedAt: 1700000000000,
};

describe("AvatarSchema", () => {
	test("aceita dataURL jpeg válida", () => {
		expect(AvatarSchema.safeParse(JPEG).success).toBe(true);
	});

	test("aceita dataURL png válida", () => {
		expect(AvatarSchema.safeParse(PNG).success).toBe(true);
	});

	test("aceita dataURL webp válida", () => {
		expect(AvatarSchema.safeParse(WEBP).success).toBe(true);
	});

	test("rejeita gif (formato fora do v1)", () => {
		expect(
			AvatarSchema.safeParse("data:image/gif;base64,R0lGODlh").success,
		).toBe(false);
	});

	test("rejeita svg (formato fora do v1)", () => {
		expect(
			AvatarSchema.safeParse("data:image/svg+xml;base64,PHN2Zz4=").success,
		).toBe(false);
	});

	test("rejeita string sem prefixo dataURL", () => {
		expect(AvatarSchema.safeParse("https://exemplo.com/foto.jpg").success).toBe(
			false,
		);
	});

	test("rejeita dataURL acima do teto ~40KB", () => {
		const oversized = `data:image/jpeg;base64,${"A".repeat(40000)}`;
		expect(oversized.length).toBeGreaterThan(40000);
		expect(AvatarSchema.safeParse(oversized).success).toBe(false);
	});
});

describe("PlayerSchema avatar", () => {
	test("aceita player sem avatar (fallback iniciais)", () => {
		const r = PlayerSchema.safeParse(validPlayer);
		expect(r.success).toBe(true);
	});

	test("aceita avatar null (removido)", () => {
		const r = PlayerSchema.safeParse({ ...validPlayer, avatar: null });
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.avatar).toBeNull();
	});

	test("aceita avatar jpeg válido e preserva o valor", () => {
		const r = PlayerSchema.safeParse({ ...validPlayer, avatar: JPEG });
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.avatar).toBe(JPEG);
	});

	test("rejeita avatar acima do teto", () => {
		const oversized = `data:image/jpeg;base64,${"A".repeat(40000)}`;
		expect(
			PlayerSchema.safeParse({ ...validPlayer, avatar: oversized }).success,
		).toBe(false);
	});
});
