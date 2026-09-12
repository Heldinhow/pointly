/**
 * seat-card.test — cooldown global de projéteis (spell-rebuild).
 *
 * O cooldown é por sender (global, `window.__pointly_cooldown_until__`),
 * não por card: arremessou pra um alvo, qualquer outro alvo bloqueia por 5s.
 */
import "../../test-jsdom";
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Player } from "@planning-poker/shared";
import {
	__resetProjectileCooldownForTests,
	SeatCard,
} from "./seat-card";

function makePlayer(overrides: Partial<Player> = {}): Player {
	return {
		id: "p_1",
		uuid: "00000000-0000-4000-8000-000000000000",
		nick: "Helder",
		role: "player",
		seatIndex: 0,
		hasVoted: true,
		value: null,
		status: "connected",
		joinedAt: 1_000_000,
		...overrides,
	};
}

afterEach(() => {
	cleanup();
	__resetProjectileCooldownForTests();
});

describe("SeatCard projectile cooldown", () => {
	test("segundo arremesso em <5s bloqueado mesmo em outro alvo", () => {
		const calls: Array<{ target: string; type: string }> = [];
		const onThrow = (targetPlayerId: string, type: string) =>
			void calls.push({ target: targetPlayerId, type });
		render(
			<>
				<SeatCard
					player={makePlayer({ id: "p_2", nick: "Maya", seatIndex: 1 })}
					isYou={false}
					faceUp
					onThrow={onThrow}
				/>
				<SeatCard
					player={makePlayer({
						id: "p_3",
						uuid: "00000000-0000-4000-8000-000000000002",
						nick: "Luna",
						seatIndex: 2,
					})}
					isYou={false}
					faceUp
					onThrow={onThrow}
				/>
			</>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: "Arremessar projétil em Maya" }),
		);
		fireEvent.click(screen.getByRole("menuitem", { name: "🍅 tomato" }));
		expect(calls).toHaveLength(1);
		expect(calls[0]).toMatchObject({ target: "p_2", type: "tomato" });

		// outro alvo, dentro do cooldown → bloqueado
		fireEvent.click(
			screen.getByRole("button", { name: "Arremessar projétil em Luna" }),
		);
		fireEvent.click(screen.getByRole("menuitem", { name: "⭐ star" }));
		expect(calls).toHaveLength(1);
	});

	test("após o cooldown, arremesso libera de novo", () => {
		const calls: string[] = [];
		const ui = (
			<SeatCard
				player={makePlayer({ id: "p_2", nick: "Maya", seatIndex: 1 })}
				isYou={false}
				faceUp
				onThrow={(target) => void calls.push(target)}
			/>
		);
		render(ui);
		fireEvent.click(
			screen.getByRole("button", { name: "Arremessar projétil em Maya" }),
		);
		fireEvent.click(screen.getByRole("menuitem", { name: "🍅 tomato" }));
		expect(calls).toHaveLength(1);

		// nova montagem (cooldown local zerado) + cooldown global expirado
		cleanup();
		__resetProjectileCooldownForTests();
		render(ui);
		fireEvent.click(
			screen.getByRole("button", { name: "Arremessar projétil em Maya" }),
		);
		fireEvent.click(screen.getByRole("menuitem", { name: "🍅 tomato" }));
		expect(calls).toHaveLength(2);
	});
});
