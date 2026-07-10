/**
 * seat-layout tests — reg 2026-07-10 (estabilidade de assentos).
 *
 * Cobre os invariantes de `assignSeatAngles`:
 *  - VOCÊ travado em 90°
 *  - Demais em arco de 30° (sem colisão no 90°)
 *  - Estabilidade: quando alguém entra, jogadores EXISTENTES mantêm
 *    ângulo (UX bug: "seats pulam a cada room_state").
 *  - joinedAt é a chave de ordenação (não o índice do array).
 */

import { describe, expect, test } from "bun:test";
import { assignSeatAngles, seatPosition } from "./seat-layout";

/** Helper: cria player com id + joinedAt explícitos. */
function p(id: string, joinedAt: number): { id: string; joinedAt: number } {
	return { id, joinedAt };
}

// ---------------------------------------------------------------------------
// seatPosition (T31 pure)
// ---------------------------------------------------------------------------

describe("seatPosition", () => {
	test("angle=90 → bottom-center (6h)", () => {
		const pos = seatPosition(90);
		expect(pos.left).toBeCloseTo(480); // TABLE_CX + cos(90)*TABLE_RX
		expect(pos.top).toBeCloseTo(460); // TABLE_CY + sin(90)*TABLE_RY
	});

	test("angle=0 → right edge (3h)", () => {
		const pos = seatPosition(0);
		expect(pos.left).toBeCloseTo(900); // 480 + 1*420
		expect(pos.top).toBeCloseTo(250); // 250 + 0
	});

	test("angle=180 → left edge (9h)", () => {
		const pos = seatPosition(180);
		expect(pos.left).toBeCloseTo(60); // 480 + (-1)*420
		expect(pos.top).toBeCloseTo(250);
	});
});

// ---------------------------------------------------------------------------
// assignSeatAngles — invariantes básicos
// ---------------------------------------------------------------------------

describe("assignSeatAngles — VOCÊ", () => {
	test("VOCÊ sempre em 90° quando presente", () => {
		const angles = assignSeatAngles("ana", [p("ana", 100), p("bob", 200)]);
		expect(angles.get("ana")).toBe(90);
	});

	test("VOCÊ null: ninguém reservado em 90°, entra na rotação", () => {
		const angles = assignSeatAngles(null, [p("ana", 100), p("bob", 200)]);
		// Sem reserva; primeiro (menor joinedAt) recebe 30°
		expect(angles.get("ana")).toBe(30);
		expect(angles.get("bob")).toBe(60);
	});

	test("VOCÊ listado várias vezes: map não duplica (idempotente)", () => {
		const angles = assignSeatAngles("ana", [
			p("ana", 100),
			p("bob", 200),
			p("ana", 100), // duplicata defensiva
		]);
		expect(angles.get("ana")).toBe(90);
		// Bob é o único "outro" → 30°
		expect(angles.get("bob")).toBe(30);
	});
});

// ---------------------------------------------------------------------------
// assignSeatAngles — sem colisão em 90°
// ---------------------------------------------------------------------------

describe("assignSeatAngles — sem colisão em 90°", () => {
	test("4 jogadores (me + 3 outros): nenhum 'outro' em 90°", () => {
		// Cenário onde o código antigo BUGAVA: others[2] recebia 90°.
		const angles = assignSeatAngles("ana", [
			p("ana", 100),
			p("bob", 200),
			p("cal", 300),
			p("dan", 400),
		]);
		expect(angles.get("ana")).toBe(90); // VOCÊ
		expect(angles.get("bob")).toBe(30);
		expect(angles.get("cal")).toBe(60);
		expect(angles.get("dan")).toBe(120); // pula 90, vai pra próximo
	});

	test("12 jogadores (me + 11 outros): cobre todos os 11 slots sem colisão", () => {
		const players = [
			p("me", 100),
			p("p2", 200),
			p("p3", 300),
			p("p4", 400),
			p("p5", 500),
			p("p6", 600),
			p("p7", 700),
			p("p8", 800),
			p("p9", 900),
			p("p10", 1000),
			p("p11", 1100),
			p("p12", 1200),
		];
		const angles = assignSeatAngles("me", players);
		expect(angles.size).toBe(12);
		expect(angles.get("me")).toBe(90);
		const others = players.filter((x) => x.id !== "me");
		for (const o of others) {
			expect(angles.get(o.id)).not.toBe(90);
		}
		// Todos os ângulos são distintos
		const usedAngles = new Set(angles.values());
		expect(usedAngles.size).toBe(12);
	});
});

// ---------------------------------------------------------------------------
// assignSeatAngles — estabilidade (reg 2026-07-10, bug UX prod)
// ---------------------------------------------------------------------------

describe("assignSeatAngles — estabilidade por joinedAt", () => {
	test("novo jogador entra: existentes MANTÊM ângulo", () => {
		// Antes: Ana (host) + Bob. Do ponto de vista da Ana.
		const before = assignSeatAngles("ana", [p("ana", 1000), p("bob", 2000)]);
		const bobBefore = before.get("bob");

		// Depois: Ana + Bob + Cal (Cal joined last, joinedAt=3000).
		const after = assignSeatAngles("ana", [
			p("ana", 1000),
			p("bob", 2000),
			p("cal", 3000),
		]);

		// Bob mantém o ângulo; Cal pega o próximo slot.
		expect(after.get("bob")).toBe(bobBefore);
		expect(after.get("cal")).not.toBe(bobBefore);
	});

	test("ordem dos players no array NÃO afeta ângulo (joinedAt vence índice)", () => {
		// Mesmos 3 players em ordens diferentes → mesmos ângulos.
		const a = assignSeatAngles("ana", [
			p("ana", 1000),
			p("bob", 2000),
			p("cal", 3000),
		]);
		const b = assignSeatAngles("ana", [
			p("cal", 3000),
			p("bob", 2000),
			p("ana", 1000),
		]);
		expect(a.get("bob")).toBe(b.get("bob"));
		expect(a.get("cal")).toBe(b.get("cal"));
	});

	test("3 entradas consecutivas: cada novo Cal fica no próximo slot livre, sem mover existentes", () => {
		let angles = assignSeatAngles("ana", [p("ana", 1000)]);
		expect(angles.size).toBe(1);

		angles = assignSeatAngles("ana", [p("ana", 1000), p("bob", 2000)]);
		expect(angles.get("bob")).toBe(30);
		const bobStable = angles.get("bob");

		angles = assignSeatAngles("ana", [
			p("ana", 1000),
			p("bob", 2000),
			p("cal", 3000),
		]);
		expect(angles.get("bob")).toBe(bobStable); // Bob não mexeu
		expect(angles.get("cal")).toBe(60);

		angles = assignSeatAngles("ana", [
			p("ana", 1000),
			p("bob", 2000),
			p("cal", 3000),
			p("dan", 4000),
		]);
		expect(angles.get("bob")).toBe(bobStable); // Bob ainda não mexeu
		expect(angles.get("cal")).toBe(60); // Cal não mexeu
		expect(angles.get("dan")).toBe(120);
	});

	test("cenário prod: 3 jogadores, 2º sai, 3º fica — ordem dos joinedAt preserva ângulo do remanescente quando possível", () => {
		// Antes: Ana + Bob + Cal. Cal está em 60°.
		const before = assignSeatAngles("ana", [
			p("ana", 1000),
			p("bob", 2000),
			p("cal", 3000),
		]);
		expect(before.get("cal")).toBe(60);

		// Depois: Bob sai. Cal permanece.
		// joinedAt do Cal (3000) > joinedAt do Bob (2000), então na nova
		// ordenação por joinedAt Cal é o único "outro" e pega o primeiro
		// slot (30°). Documenta o comportamento conhecido: leaves causam
		// shift do remanescente — limitação documentada; solução ideal
		// exigiria state (sticky positions).
		const after = assignSeatAngles("ana", [
			p("ana", 1000),
			p("cal", 3000),
		]);
		expect(after.get("cal")).toBe(30); // shift aceito na versão atual
	});
});

describe("assignSeatAngles — sem 'me', ordenação por joinedAt", () => {
	test("3 players sem me: ordem cronológica define ângulos", () => {
		const angles = assignSeatAngles(null, [
			p("ana", 1000),
			p("bob", 2000),
			p("cal", 3000),
		]);
		expect(angles.get("ana")).toBe(30);
		expect(angles.get("bob")).toBe(60);
		expect(angles.get("cal")).toBe(90);
	});

	test("ordem aleatória no array: mesmos ângulos (joinedAt vence)", () => {
		const a = assignSeatAngles(null, [
			p("ana", 1000),
			p("bob", 2000),
			p("cal", 3000),
		]);
		const b = assignSeatAngles(null, [
			p("cal", 3000),
			p("ana", 1000),
			p("bob", 2000),
		]);
		expect(a).toEqual(b);
	});
});