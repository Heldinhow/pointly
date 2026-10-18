import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import { DECK_VALUES, type Player, type Vote } from "@planning-poker/shared";
import { SALA_DISCONNECT_GRACE_MS, SALA_SEAT_COUNT, SALA_SPECTATOR_CAP, Sala, SalaError } from "./sala";

function makePlayer(id: string, role: "host" | "player" | "spectator", joinedAt: number): Player {
	return {
		id,
		uuid: `00000000-0000-4000-8000-${id.padStart(12, "0")}`,
		nick: id,
		role,
		seatIndex: 0,
		hasVoted: false,
		value: null,
		status: "connected",
		joinedAt,
	};
}

function snapshotAll(sala: Sala): string {
	return JSON.stringify({
		phase: sala.phase,
		round: sala.round,
		hostId: sala.hostId,
		historiaAtualId: sala.historiaAtualId,
		pauta: sala.pauta,
		domainVotes: Object.fromEntries(sala.votes),
		players: [...sala.players.values()],
		views: [sala.toState(undefined), ...[...sala.players.keys()].map((id) => sala.toState(id))],
	});
}

function expectValid(sala: Sala): void {
	if (
		sala.phase !== "idle" &&
		sala.phase !== "voting" &&
		sala.phase !== "revealable" &&
		sala.phase !== "revealed"
	) {
		throw new Error(`invariante violada: fase desconhecida ${String(sala.phase)}`);
	}
	if (!Number.isInteger(sala.round) || sala.round < 1) {
		throw new Error(`invariante violada: round inválido ${sala.round}`);
	}
	if (sala.phase === "idle" && sala.votes.size > 0) {
		throw new Error("invariante violada: fase idle com votos registrados");
	}
	const players = [...sala.players.values()];
	const ids = new Set(players.map((p) => p.id));
	if (ids.size !== players.length) {
		throw new Error("invariante violada: ids de players duplicados");
	}
	if (players.length > SALA_SEAT_COUNT + SALA_SPECTATOR_CAP) {
		throw new Error(`invariante violada: players acima do limite (${players.length})`);
	}
	const voters = players.filter((p) => p.role !== "spectator");
	if (voters.length > SALA_SEAT_COUNT) {
		throw new Error(`invariante violada: votantes acima de ${SALA_SEAT_COUNT}`);
	}
	const seats = new Set<number>();
	for (const p of voters) {
		if (!Number.isInteger(p.seatIndex) || p.seatIndex < 0 || p.seatIndex > SALA_SEAT_COUNT - 1) {
			throw new Error(`invariante violada: assento fora de 0..11 para ${p.id}`);
		}
		if (seats.has(p.seatIndex)) {
			throw new Error(`invariante violada: assento duplicado ${p.seatIndex} para ${p.id}`);
		}
		seats.add(p.seatIndex);
	}
	for (const p of players) {
		if (p.role === "spectator" && p.seatIndex !== -1) {
			throw new Error(`invariante violada: espectador ${p.id} com assento ${p.seatIndex}`);
		}
		if (p.hasVoted !== (p.value !== null)) {
			throw new Error(`invariante violada: hasVoted incoerente com value em ${p.id}`);
		}
	}
	if (sala.votes.size > voters.length) {
		throw new Error(`invariante violada: votes (${sala.votes.size}) acima de votantes (${voters.length})`);
	}
	for (const [id, vote] of sala.votes) {
		const player = sala.players.get(id);
		if (!player) {
			throw new Error(`invariante violada: voto órfão de ${id}`);
		}
		if (player.role === "spectator") {
			throw new Error(`invariante violada: espectador ${id} com voto`);
		}
		if (player.value !== vote) {
			throw new Error(`invariante violada: voto divergente do player ${id}`);
		}
		if (!DECK_VALUES.includes(vote)) {
			throw new Error(`invariante violada: voto fora do deck em ${id}`);
		}
	}
	if (voters.length > 0) {
		if (sala.hostId === null) {
			throw new Error("invariante violada: hostId nulo com votantes presentes");
		}
		const host = sala.players.get(sala.hostId);
		if (!host) {
			throw new Error(`invariante violada: host ${sala.hostId} inexistente`);
		}
		if (host.role !== "host") {
			throw new Error(`invariante violada: host ${sala.hostId} sem role host`);
		}
	}
	if (players.length === 0 && sala.hostId !== null) {
		throw new Error("invariante violada: hostId não nulo em sala vazia");
	}
	if (voters.length === 0 && players.length > 0 && sala.hostId !== null) {
		throw new Error("invariante violada: hostId não nulo com apenas espectadores");
	}
	if (sala.pauta.length > 50) {
		throw new Error(`invariante violada: pauta acima de 50 (${sala.pauta.length})`);
	}
	const historiaIds = new Set<string>();
	for (let i = 0; i < sala.pauta.length; i++) {
		const historia = sala.pauta[i]!;
		if (historia.ordem !== i) {
			throw new Error(`invariante violada: ordem ${historia.ordem} diferente do índice ${i}`);
		}
		if (historiaIds.has(historia.id)) {
			throw new Error(`invariante violada: id de história duplicado ${historia.id}`);
		}
		historiaIds.add(historia.id);
		if (historia.pontos !== null && !Number.isFinite(historia.pontos)) {
			throw new Error(`invariante violada: pontos não finitos em ${historia.id}`);
		}
	}
	if (sala.historiaAtualId !== null && !historiaIds.has(sala.historiaAtualId)) {
		throw new Error(`invariante violada: história ativa ${sala.historiaAtualId} fora da pauta`);
	}
	const domainVotes = Object.fromEntries(sala.votes);
	const viewers: (string | undefined)[] = [undefined, ...ids, "ghost"];
	for (const viewer of viewers) {
		const snap = sala.toState(viewer);
		if (sala.phase === "revealed") {
			const snapKeys = Object.keys(snap.votes);
			if (snapKeys.length !== Object.keys(domainVotes).length) {
				throw new Error("invariante violada: snapshot revelado com quantidade de votos divergente");
			}
			for (const key of snapKeys) {
				if (!Object.hasOwn(domainVotes, key)) {
					throw new Error(`invariante violada: snapshot revelado com voto extra ${key}`);
				}
				if (snap.votes[key] !== domainVotes[key]) {
					throw new Error(`invariante violada: snapshot revelado divergente em ${key}`);
				}
			}
		} else {
			for (const key of Object.keys(snap.votes)) {
				if (key !== viewer) {
					throw new Error(`invariante violada: voto de ${key} vazou para a visão ${String(viewer)}`);
				}
			}
			for (const p of snap.players) {
				if (p.id !== viewer && p.value !== null) {
					throw new Error(`invariante violada: value de ${p.id} vazou para a visão ${String(viewer)}`);
				}
			}
		}
		for (const p of snap.players) {
			if (Object.hasOwn(p, "uuid")) {
				throw new Error(`invariante violada: uuid exposto no snapshot de ${p.id}`);
			}
		}
	}
}

function expectRejectedWithoutMutation(sala: Sala, run: () => void, code: SalaError["code"]): void {
	const before = snapshotAll(sala);
	let caught: unknown;
	try {
		run();
	} catch (err) {
		caught = err;
	}
	expect(caught).toBeInstanceOf(SalaError);
	expect((caught as SalaError).code).toBe(code);
	expect(snapshotAll(sala)).toBe(before);
}

type Action =
	| { kind: "join"; spectator: boolean }
	| { kind: "leave"; pick: number }
	| { kind: "disconnect"; pick: number }
	| { kind: "reconnect"; pick: number }
	| { kind: "vote"; pick: number; value: Vote }
	| { kind: "reveal"; pick: number }
	| { kind: "newRound" }
	| { kind: "addHistoria"; titulo: string }
	| { kind: "selectHistoria"; pick: number; clear: boolean }
	| { kind: "updateHistoria"; pick: number; titulo: string }
	| { kind: "moveHistoria"; pick: number; toIndex: number }
	| { kind: "removeHistoria"; pick: number; confirm: boolean }
	| { kind: "tick"; advance: number };

const pickArb = fc.nat({ max: 50 });
const tituloArb = fc.integer({ min: 1, max: 9999 }).map((n) => "T" + n);
const voteArb = fc.constantFrom(...DECK_VALUES);
const advanceArb = fc.nat({ max: SALA_DISCONNECT_GRACE_MS * 2 });

const actionArb: fc.Arbitrary<Action> = fc.oneof(
	{ weight: 6, arbitrary: fc.record({ kind: fc.constant("vote" as const), pick: pickArb, value: voteArb }) },
	{ weight: 3, arbitrary: fc.record({ kind: fc.constant("join" as const), spectator: fc.constant(false) }) },
	{ weight: 1, arbitrary: fc.record({ kind: fc.constant("join" as const), spectator: fc.constant(true) }) },
	{ weight: 3, arbitrary: fc.record({ kind: fc.constant("addHistoria" as const), titulo: tituloArb }) },
	{ weight: 2, arbitrary: fc.record({ kind: fc.constant("leave" as const), pick: pickArb }) },
	{ weight: 2, arbitrary: fc.record({ kind: fc.constant("reveal" as const), pick: pickArb }) },
	{ weight: 2, arbitrary: fc.constant({ kind: "newRound" as const }) },
	{ weight: 2, arbitrary: fc.record({ kind: fc.constant("tick" as const), advance: advanceArb }) },
	{ weight: 2, arbitrary: fc.record({ kind: fc.constant("selectHistoria" as const), pick: pickArb, clear: fc.boolean() }) },
	{ weight: 1, arbitrary: fc.record({ kind: fc.constant("disconnect" as const), pick: pickArb }) },
	{ weight: 1, arbitrary: fc.record({ kind: fc.constant("reconnect" as const), pick: pickArb }) },
	{ weight: 1, arbitrary: fc.record({ kind: fc.constant("updateHistoria" as const), pick: pickArb, titulo: tituloArb }) },
	{ weight: 1, arbitrary: fc.record({ kind: fc.constant("moveHistoria" as const), pick: pickArb, toIndex: pickArb }) },
	{ weight: 1, arbitrary: fc.record({ kind: fc.constant("removeHistoria" as const), pick: pickArb, confirm: fc.boolean() }) },
);

const actionListArb = fc.array(actionArb, { minLength: 1, maxLength: 40 });

function runSequence(actions: readonly Action[]): void {
	const sala = new Sala("AB12", makePlayer("h1", "host", 1000), 1000);
	let clock = 1000;
	let seq = 0;
	let roundsStarted = 0;
	for (const action of actions) {
		const before = snapshotAll(sala);
		const players = [...sala.players.values()];
		const editor = players.find((p) => p.role !== "spectator");
		try {
			switch (action.kind) {
				case "join": {
					const id = `p${++seq}`;
					sala.addPlayer(makePlayer(id, action.spectator ? "spectator" : "player", clock++));
					break;
				}
				case "leave": {
					if (players.length === 0) break;
					sala.removePlayer(players[action.pick % players.length]!.id);
					break;
				}
				case "disconnect": {
					if (players.length === 0) break;
					sala.markDisconnected(players[action.pick % players.length]!.id, clock);
					break;
				}
				case "reconnect": {
					if (players.length === 0) break;
					const target = players[action.pick % players.length]!;
					sala.markConnected(target.uuid);
					break;
				}
				case "vote": {
					if (players.length === 0) break;
					sala.castVote(players[action.pick % players.length]!.id, action.value);
					break;
				}
				case "reveal": {
					if (players.length === 0) break;
					sala.reveal(players[action.pick % players.length]!.id);
					break;
				}
				case "newRound": {
					sala.startNewRound();
					roundsStarted += 1;
					break;
				}
				case "addHistoria": {
					if (!editor) break;
					sala.addHistoria(editor.id, { titulo: action.titulo });
					break;
				}
				case "selectHistoria": {
					if (!editor || sala.pauta.length === 0) break;
					const target = sala.pauta[action.pick % sala.pauta.length]!;
					sala.selectHistoria(editor.id, action.clear ? null : target.id);
					break;
				}
				case "updateHistoria": {
					if (!editor || sala.pauta.length === 0) break;
					const target = sala.pauta[action.pick % sala.pauta.length]!;
					sala.updateHistoria(editor.id, target.id, { titulo: action.titulo });
					break;
				}
				case "moveHistoria": {
					if (!editor || sala.pauta.length === 0) break;
					const target = sala.pauta[action.pick % sala.pauta.length]!;
					sala.moveHistoria(editor.id, target.id, action.toIndex % sala.pauta.length);
					break;
				}
				case "removeHistoria": {
					if (!editor || sala.pauta.length === 0) break;
					const target = sala.pauta[action.pick % sala.pauta.length]!;
					sala.removeHistoria(editor.id, target.id, { confirmScored: action.confirm });
					break;
				}
				case "tick": {
					clock += action.advance;
					const removed = sala.tickGracePeriod(clock);
					for (const id of removed) {
						if (sala.players.has(id)) {
							throw new Error(`invariante violada: ${id} removido pelo tick continua na sala`);
						}
					}
					break;
				}
			}
		} catch (err) {
			if (err instanceof SalaError) {
				if (snapshotAll(sala) !== before) {
					throw new Error(`invariante violada: ação ${action.kind} rejeitada (${err.code}) mutou o estado`);
				}
			} else {
				throw err;
			}
		}
		expectValid(sala);
		if (sala.round !== 1 + roundsStarted) {
			throw new Error(`invariante violada: round ${sala.round} diverge de ${1 + roundsStarted}`);
		}
	}
}

test("qualquer sequência aleatória de ações mantém o estado válido", () => {
	fc.assert(
		fc.property(actionListArb, (actions) => {
			runSequence(actions);
		}),
		{ numRuns: 120 },
	);
}, 30000);

describe("Sala — propriedades", () => {
	test("antes do reveal nenhum voto de outro jogador vaza na visão projetada", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 0, max: 4 }),
				fc.integer({ min: 0, max: 2 }),
				fc.array(fc.oneof(fc.constant(null), voteArb), { minLength: 5, maxLength: 5 }),
				(extraVoters, spectatorCount, votes) => {
					const sala = new Sala("AB12", makePlayer("p1", "host", 1000), 1000);
					let clock = 1001;
					const voterIds = ["p1"];
					for (let i = 0; i < extraVoters; i++) {
						const id = `p${voterIds.length + 1}`;
						sala.addPlayer(makePlayer(id, "player", clock++));
						voterIds.push(id);
					}
					let nextId = voterIds.length + 1;
					for (let i = 0; i < spectatorCount; i++) {
						sala.addPlayer(makePlayer(`p${nextId++}`, "spectator", clock++));
					}
					const applied = new Map<string, Vote>();
					for (let i = 0; i < voterIds.length; i++) {
						const value = votes[i] ?? null;
						if (value !== null) {
							sala.castVote(voterIds[i]!, value);
							applied.set(voterIds[i]!, value);
						}
					}
					expect(sala.phase).not.toBe("revealed");
					const viewers: (string | undefined)[] = [undefined, ...sala.players.keys(), "ghost"];
					const domainBefore = snapshotAll(sala);
					for (const viewer of viewers) {
						const snap = sala.toState(viewer);
						for (const key of Object.keys(snap.votes)) {
							expect(viewer).toBe(key);
						}
						for (const p of snap.players) {
							if (p.id === viewer) {
								expect(p.value).toBe(applied.get(p.id) ?? null);
								if (applied.has(p.id)) {
									expect(snap.votes[p.id]).toBe(applied.get(p.id)!);
								}
							} else {
								expect(p.value).toBeNull();
							}
						}
					}
					expect(snapshotAll(sala)).toBe(domainBefore);
				},
			),
			{ numRuns: 200 },
		);
	});

	test("reveal é idempotente: segundo reveal é rejeitado sem mutar o estado", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 2, max: 4 }),
				fc.array(fc.boolean(), { minLength: 4, maxLength: 4 }),
				fc.array(voteArb, { minLength: 4, maxLength: 4 }),
				(voterCount, chosen, values) => {
					const sala = new Sala("AB12", makePlayer("p1", "host", 1000), 1000);
					for (let i = 1; i < voterCount; i++) {
						sala.addPlayer(makePlayer(`p${i + 1}`, "player", 1000 + i));
					}
					let appliedAny = false;
					for (let i = 0; i < voterCount; i++) {
						if (chosen[i]) {
							sala.castVote(`p${i + 1}`, values[i]!);
							appliedAny = true;
						}
					}
					if (!appliedAny) {
						sala.castVote("p1", values[0]!);
					}
					expect(["voting", "revealable"]).toContain(sala.phase);
					const nums = [...sala.votes.values()]
						.map((v) => (v === "☕" ? null : v === "½" ? 0.5 : Number(v)))
						.filter((n): n is number => n !== null)
						.sort((a, b) => a - b);
					const mid = Math.floor(nums.length / 2);
					const expectedMedian =
						nums.length === 0
							? null
							: nums.length % 2 === 0
								? (nums[mid - 1]! + nums[mid]!) / 2
								: nums[mid]!;
					const expectedMean =
						nums.length === 0 ? null : nums.reduce((sum, n) => sum + n, 0) / nums.length;
					const expectedRange: [number, number] | null =
						nums.length === 0 ? null : [nums[0]!, nums[nums.length - 1]!];
					const expectedUnanimous = nums.length >= 2 && nums.every((n) => n === nums[0]);
					const votesBefore = Object.fromEntries(sala.votes);
					const outcome = sala.reveal("p1");
					expect(outcome.votes).toEqual(votesBefore);
					expect(outcome.median).toBe(expectedMedian);
					expect(outcome.mean).toBe(expectedMean);
					expect(outcome.range).toEqual(expectedRange);
					expect(outcome.unanimous).toBe(expectedUnanimous);
					expect(sala.phase).toBe("revealed");
					expectRejectedWithoutMutation(sala, () => sala.reveal("p2"), "invalid_phase");
				},
			),
			{ numRuns: 200 },
		);
	});

	test("nova rodada limpa todos os votos e incrementa round", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 1, max: 4 }),
				fc.array(fc.boolean(), { minLength: 4, maxLength: 4 }),
				fc.array(voteArb, { minLength: 4, maxLength: 4 }),
				(voterCount, chosen, values) => {
					const sala = new Sala("AB12", makePlayer("p1", "host", 1000), 1000);
					for (let i = 1; i < voterCount; i++) {
						sala.addPlayer(makePlayer(`p${i + 1}`, "player", 1000 + i));
					}
					let appliedAny = false;
					for (let i = 0; i < voterCount; i++) {
						if (chosen[i]) {
							sala.castVote(`p${i + 1}`, values[i]!);
							appliedAny = true;
						}
					}
					if (!appliedAny) {
						sala.castVote("p1", values[0]!);
					}
					if (voterCount > 1) {
						sala.markDisconnected("p2", 5000);
					}
					sala.reveal("p1");
					const roundBefore = sala.round;
					expect(sala.votes.size).toBeGreaterThan(0);
					sala.startNewRound();
					expect(sala.votes.size).toBe(0);
					for (const p of sala.players.values()) {
						expect(p.value).toBeNull();
						expect(p.hasVoted).toBe(false);
					}
					if (voterCount > 1) {
						expect(sala.getPlayer("p2")!.status).toBe("disconnected");
					}
					expect(sala.round).toBe(roundBefore + 1);
					expect(sala.phase).toBe("voting");
				},
			),
			{ numRuns: 200 },
		);
	});

	test("espectador nunca vota, nunca ocupa assento e nunca vira host", () => {
		const roomActionArb = fc.oneof(
			{ weight: 3, arbitrary: fc.record({ kind: fc.constant("join" as const), spectator: fc.constant(false) }) },
			{ weight: 2, arbitrary: fc.record({ kind: fc.constant("join" as const), spectator: fc.constant(true) }) },
			{ weight: 2, arbitrary: fc.record({ kind: fc.constant("leave" as const), pick: pickArb }) },
		);
		fc.assert(
			fc.property(
				fc.array(roomActionArb, { minLength: 1, maxLength: 16 }),
				pickArb,
				(actions, basePick) => {
					const sala = new Sala("AB12", makePlayer("p1", "host", 1000), 1000);
					let clock = 1001;
					let seq = 1;
					const spectatorIds = new Set<string>();
					for (const action of actions) {
						const players = [...sala.players.values()];
						if (action.kind === "join") {
							const id = `p${++seq}`;
							try {
								sala.addPlayer(makePlayer(id, action.spectator ? "spectator" : "player", clock++));
								if (action.spectator) spectatorIds.add(id);
							} catch (err) {
								if (!(err instanceof SalaError)) throw err;
							}
						} else if (players.length > 0) {
							sala.removePlayer(players[action.pick % players.length]!.id);
						}
					}
					const players = [...sala.players.values()];
					const voters = players.filter((p) => p.role !== "spectator");
					const spectators = players.filter((p) => p.role === "spectator");
					expect(voters.length).toBeLessThanOrEqual(SALA_SEAT_COUNT);
					expect(players.length).toBeLessThanOrEqual(SALA_SEAT_COUNT + SALA_SPECTATOR_CAP);
					if (sala.hostId !== null) {
						const host = sala.getPlayer(sala.hostId);
						expect(host).toBeDefined();
						expect(host!.role).toBe("host");
						expect(spectatorIds.has(sala.hostId)).toBe(false);
					}
					for (const id of spectatorIds) {
						const player = sala.getPlayer(id);
						if (player) expect(player.role).toBe("spectator");
					}
					for (let i = 0; i < spectators.length; i++) {
						const spectator = spectators[i]!;
						expect(spectator.seatIndex).toBe(-1);
						const value = DECK_VALUES[(basePick + i) % DECK_VALUES.length]!;
						expectRejectedWithoutMutation(sala, () => sala.castVote(spectator.id, value), "role_denied");
					}
					expectValid(sala);
				},
			),
			{ numRuns: 200 },
		);
	});

	test("sala criada por espectador fica sem host até o primeiro votante assumir", () => {
		const sala = new Sala("AB12", makePlayer("s1", "spectator", 1000), 1000);
		expect(sala.hostId).toBeNull();
		expect(sala.getPlayer("s1")!.seatIndex).toBe(-1);
		expectRejectedWithoutMutation(sala, () => sala.castVote("s1", "5"), "role_denied");
		const promoted = sala.addPlayer(makePlayer("p1", "player", 1001));
		expect(promoted.role).toBe("host");
		expect(sala.hostId).toBe("p1");
		expect(promoted.seatIndex).toBe(0);
		expect(sala.getPlayer("s1")!.role).toBe("spectator");
	});

	test("contagem de votos nunca excede o número de jogadores votantes", () => {
		const voteActionArb = fc.oneof(
			{ weight: 4, arbitrary: fc.record({ kind: fc.constant("vote" as const), pick: pickArb, value: voteArb }) },
			{ weight: 2, arbitrary: fc.record({ kind: fc.constant("join" as const), spectator: fc.boolean() }) },
			{ weight: 2, arbitrary: fc.record({ kind: fc.constant("leave" as const), pick: pickArb }) },
		);
		fc.assert(
			fc.property(fc.array(voteActionArb, { minLength: 1, maxLength: 16 }), (actions) => {
				const sala = new Sala("AB12", makePlayer("p1", "host", 1000), 1000);
				let clock = 1001;
				let seq = 1;
				for (const action of actions) {
					const players = [...sala.players.values()];
					if (action.kind === "join") {
						try {
							sala.addPlayer(makePlayer(`p${++seq}`, action.spectator ? "spectator" : "player", clock++));
						} catch (err) {
							if (!(err instanceof SalaError)) throw err;
						}
					} else if (players.length > 0) {
						const target = players[action.pick % players.length]!;
						if (action.kind === "leave") {
							sala.removePlayer(target.id);
						} else {
							try {
								sala.castVote(target.id, action.value);
							} catch (err) {
								if (!(err instanceof SalaError)) throw err;
							}
						}
					}
					const voterCount = [...sala.players.values()].filter((p) => p.role !== "spectator").length;
					expect(sala.votes.size).toBeLessThanOrEqual(voterCount);
					expectValid(sala);
				}
			}),
			{ numRuns: 200 },
		);
	});

	test("troca de pauta respeita fases: livre em idle/revealed, bloqueada em voting sem invalidar votos", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 1, max: 5 }),
				pickArb,
				pickArb,
				voteArb,
				(historiaCount, selectPick, activePick, value) => {
					const sala = new Sala("AB12", makePlayer("p1", "host", 1000), 1000);
					sala.addPlayer(makePlayer("p2", "player", 1001));
					for (let i = 0; i < historiaCount; i++) {
						sala.addHistoria("p1", { titulo: `T${i + 1}` });
					}
					const ids = sala.pauta.map((h) => h.id);
					const firstPick = ids[selectPick % ids.length]!;
					sala.selectHistoria("p1", firstPick);
					expect(sala.historiaAtualId).toBe(firstPick);
					sala.selectHistoria("p1", null);
					expect(sala.historiaAtualId).toBeNull();
					const chosenActive = ids[activePick % ids.length]!;
					sala.selectHistoria("p1", chosenActive);
					expect(sala.historiaAtualId).toBe(chosenActive);
					sala.castVote("p1", value);
					expect(sala.phase).toBe("voting");
					const differentId = ids.find((id) => id !== sala.historiaAtualId) ?? "h_inexistente";
					expectRejectedWithoutMutation(sala, () => sala.selectHistoria("p1", differentId), "invalid_phase");
					sala.castVote("p2", value);
					expect(sala.phase).toBe("revealable");
					expectRejectedWithoutMutation(sala, () => sala.selectHistoria("p1", differentId), "invalid_phase");
					expect(sala.votes.size).toBe(2);
					expectRejectedWithoutMutation(sala, () => sala.startNewRound(), "invalid_phase");
					const activeId = sala.historiaAtualId!;
					expectRejectedWithoutMutation(sala, () => sala.moveHistoria("p1", activeId, 0), "invalid_phase");
					expectRejectedWithoutMutation(
						sala,
						() => sala.removeHistoria("p1", activeId, { confirmScored: true }),
						"invalid_phase",
					);
					sala.reveal("p1");
					expect(sala.phase).toBe("revealed");
					const afterRevealPick = ids.find((id) => id !== sala.historiaAtualId) ?? ids[0]!;
					sala.selectHistoria("p1", afterRevealPick);
					expect(sala.historiaAtualId).toBe(afterRevealPick);
				},
			),
			{ numRuns: 200 },
		);
	});

	test("saída do host promove votante mais antigo; espectador nunca assume", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 0, max: 4 }),
				fc.integer({ min: 0, max: 2 }),
				(extraVoters, spectatorCount) => {
					const sala = new Sala("AB12", makePlayer("p1", "host", 1000), 1000);
					let clock = 1001;
					for (let i = 0; i < extraVoters; i++) {
						sala.addPlayer(makePlayer(`p${i + 2}`, "player", clock++));
					}
					for (let i = 0; i < spectatorCount; i++) {
						sala.addPlayer(makePlayer(`p${extraVoters + i + 2}`, "spectator", clock++));
					}
					const result = sala.removePlayer("p1");
					const remainingVoters = [...sala.players.values()].filter((p) => p.role !== "spectator");
					if (remainingVoters.length > 0) {
						const oldest = remainingVoters.reduce((a, b) => (a.joinedAt < b.joinedAt ? a : b));
						expect(result.promoted).toBe(oldest.id);
						expect(result.promoted).toBe(sala.hostId);
						expect(sala.getPlayer(result.promoted!)!.role).toBe("host");
					} else {
						expect(result.promoted).toBeNull();
						expect(sala.hostId).toBeNull();
					}
				},
			),
			{ numRuns: 200 },
		);
	});

	test("voto fora do deck e un-vote são rejeitados sem mutar o estado", () => {
		const invalidValueArb = fc.oneof(fc.constant(null), fc.constantFrom("4", "10", "99", "-1", "", "abc"));
		fc.assert(
			fc.property(invalidValueArb, (value) => {
				const sala = new Sala("AB12", makePlayer("p1", "host", 1000), 1000);
				sala.addPlayer(makePlayer("p2", "player", 1001));
				sala.castVote("p1", "5");
				expectRejectedWithoutMutation(sala, () => sala.castVote("p1", value as Vote | null), "invalid_vote");
				expect(sala.getPlayer("p1")!.value).toBe("5");
			}),
			{ numRuns: 200 },
		);
	});
});

test.failing("BUG CONHECIDO: reconectar votante em revealable mantém fase revealable com votante conectado sem voto", () => {
	const sala = new Sala("AB12", makePlayer("p1", "host", 1000), 1000);
	sala.addPlayer(makePlayer("p2", "player", 1001));
	sala.addPlayer(makePlayer("p3", "player", 1002));
	sala.markDisconnected("p2", 2000);
	sala.castVote("p1", "5");
	sala.castVote("p3", "8");
	expect(sala.phase).toBe("revealable");
	const p2 = sala.getPlayer("p2")!;
	sala.markConnected(p2.uuid);
	const connectedVoters = [...sala.players.values()].filter((p) => p.status === "connected" && p.role !== "spectator");
	const revealableComVotanteSemVoto =
		sala.phase === "revealable" && connectedVoters.some((p) => !p.hasVoted);
	expect(revealableComVotanteSemVoto).toBe(false);
});
