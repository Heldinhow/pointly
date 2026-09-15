import { describe, expect, test } from "bun:test";
import {
	buildThrowProjectileMessage,
	isProjectileOutcome,
	isProjectileType,
	parseServerEvent,
} from "./protocol";

describe("protocol — projéteis (issue #157)", () => {
	test("isProjectileType aceita os 5 tipos e rejeita desconhecidos e removidos", () => {
		for (const type of [
			"paper_ball",
			"paper_plane",
			"rock",
			"brick",
			"tomato",
		] as const) {
			expect(isProjectileType(type)).toBe(true);
		}
		expect(isProjectileType("fireball")).toBe(false);
		expect(isProjectileType("coffee")).toBe(false);
		expect(isProjectileType(null)).toBe(false);
	});

	test("isProjectileOutcome aceita hit/dodge/deflect", () => {
		expect(isProjectileOutcome("hit")).toBe(true);
		expect(isProjectileOutcome("dodge")).toBe(true);
		expect(isProjectileOutcome("deflect")).toBe(true);
		expect(isProjectileOutcome("miss")).toBe(false);
	});

	test("buildThrowProjectileMessage monta o evento C→S", () => {
		expect(buildThrowProjectileMessage("p_beto", "tomato")).toEqual({
			type: "throw_projectile",
			payload: { targetPlayerId: "p_beto", projectileType: "tomato" },
		});
	});

	test("parseServerEvent aceita projectile_thrown válido", () => {
		const event = parseServerEvent(
			JSON.stringify({
				type: "projectile_thrown",
				payload: {
					senderPlayerId: "p_ana",
					targetPlayerId: "p_beto",
					projectileType: "tomato",
					outcome: "hit",
				},
			}),
		);
		expect(event).toEqual({
			type: "projectile_thrown",
			payload: {
				senderPlayerId: "p_ana",
				targetPlayerId: "p_beto",
				projectileType: "tomato",
				outcome: "hit",
			},
		});
	});

	test("parseServerEvent rejeita projectile_thrown malformado", () => {
		expect(
			parseServerEvent(
				JSON.stringify({
					type: "projectile_thrown",
					payload: {
						senderPlayerId: "p_ana",
						targetPlayerId: "p_beto",
						projectileType: "fireball",
						outcome: "hit",
					},
				}),
			),
		).toBeNull();
		expect(
			parseServerEvent(
				JSON.stringify({
					type: "projectile_thrown",
					payload: {
						senderPlayerId: "",
						targetPlayerId: "p_beto",
						projectileType: "tomato",
						outcome: "hit",
					},
				}),
			),
		).toBeNull();
	});
});
