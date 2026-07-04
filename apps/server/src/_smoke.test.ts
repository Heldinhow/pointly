/**
 * Smoke test: server importa `@planning-poker/shared` via workspace.
 * Confirma que T11 barrel está descoberto pelo Bun workspaces.
 */
import { describe, expect, test } from "bun:test";
import {
	SalaStateSchema,
	computeConsensus,
	generateUniqueCode,
	type SalaState,
	type HelloPayload,
} from "@planning-poker/shared";

describe("server ↔ @planning-poker/shared workspace", () => {
	test("importa schemas e tipos", () => {
		expect(SalaStateSchema).toBeDefined();
		expect(typeof computeConsensus).toBe("function");
		expect(typeof generateUniqueCode).toBe("function");

		// Tipos usados como anotações (TS-only — compilação já validou)
		const empty: SalaState | null = null;
		const hello: HelloPayload = {
			uuid: "550e8400-e29b-41d4-a716-446655440000",
			nick: "Ana",
		};
		expect(empty).toBeNull();
		expect(hello.nick).toBe("Ana");
	});
});
