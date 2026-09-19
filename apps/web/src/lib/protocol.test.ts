import { describe, expect, test } from "bun:test";
import {
	buildSendNudgeMessage,
	buildThrowProjectileMessage,
	buildUpdateAvatarMessage,
	isNudgeId,
	isProjectileOutcome,
	isProjectileType,
	parseServerEvent,
} from "./protocol";

describe("protocol — projéteis (issue #157)", () => {
	test("isProjectileType aceita os 6 tipos e rejeita desconhecidos e removidos", () => {
		for (const type of [
			"paper_ball",
			"paper_plane",
			"rock",
			"brick",
			"tomato",
			"chair",
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

	test("buildUpdateAvatarMessage monta set com o dataURL", () => {
		expect(buildUpdateAvatarMessage("data:image/jpeg;base64,AAA")).toEqual({
			type: "update_avatar",
			payload: { avatar: "data:image/jpeg;base64,AAA" },
		});
	});

	test("buildUpdateAvatarMessage monta clear com null", () => {
		expect(buildUpdateAvatarMessage(null)).toEqual({
			type: "update_avatar",
			payload: { avatar: null },
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

describe("protocol — cutucadas (issue #172)", () => {
	test("isNudgeId aceita os 4 ids fixos e rejeita o resto", () => {
		for (const id of ["bora", "cafe", "polemica", "confia"] as const) {
			expect(isNudgeId(id)).toBe(true);
		}
		expect(isNudgeId("texto_livre")).toBe(false);
		expect(isNudgeId("")).toBe(false);
		expect(isNudgeId(null)).toBe(false);
	});

	test("buildSendNudgeMessage monta o evento C→S", () => {
		expect(buildSendNudgeMessage("p_beto", "bora")).toEqual({
			type: "send_nudge",
			payload: { targetPlayerId: "p_beto", nudgeId: "bora" },
		});
	});

	test("parseServerEvent aceita nudge_sent válido", () => {
		const event = parseServerEvent(
			JSON.stringify({
				type: "nudge_sent",
				payload: {
					senderPlayerId: "p_ana",
					targetPlayerId: "p_beto",
					nudgeId: "cafe",
				},
			}),
		);
		expect(event).toEqual({
			type: "nudge_sent",
			payload: {
				senderPlayerId: "p_ana",
				targetPlayerId: "p_beto",
				nudgeId: "cafe",
			},
		});
	});

	test("parseServerEvent rejeita nudge_sent malformado", () => {
		expect(
			parseServerEvent(
				JSON.stringify({
					type: "nudge_sent",
					payload: {
						senderPlayerId: "p_ana",
						targetPlayerId: "p_beto",
						nudgeId: "fire",
					},
				}),
			),
		).toBeNull();
		expect(
			parseServerEvent(
				JSON.stringify({
					type: "nudge_sent",
					payload: {
						senderPlayerId: "",
						targetPlayerId: "p_beto",
						nudgeId: "bora",
					},
				}),
			),
		).toBeNull();
	});
});
