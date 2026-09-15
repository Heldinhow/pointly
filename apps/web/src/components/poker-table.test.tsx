import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PokerTable, type TablePlayer } from "./poker-table";

const AVATAR = "data:image/jpeg;base64,AAA";

function seated(overrides: Partial<TablePlayer> = {}): TablePlayer {
	return {
		id: "p_ana",
		nick: "Ana",
		seatIndex: 0,
		hasVoted: false,
		value: null,
		status: "connected",
		...overrides,
	};
}

afterEach(() => {
	cleanup();
});

describe("PokerTable avatar (AV-04)", () => {
	test("com avatar renderiza img no círculo em vez das iniciais", () => {
		const { container } = render(
			<PokerTable
				seats={[seated({ avatar: AVATAR })]}
				playerId="p_ana"
				hostId="p_ana"
				revealed={false}
			/>,
		);
		const circle = container.querySelector(".poker-avatar");
		expect(circle).toBeTruthy();
		const img = screen.getByRole("img", { name: "Ana" }) as HTMLImageElement;
		expect(img.getAttribute("src")).toBe(AVATAR);
		expect(img.className).toMatch(/poker-avatar-img/);
		expect(circle?.textContent).not.toMatch("AN");
	});

	test("sem avatar exibe as iniciais", () => {
		const { container } = render(
			<PokerTable seats={[seated()]} playerId="p_ana" revealed={false} />,
		);
		expect(container.querySelector(".poker-avatar img")).toBeNull();
		expect(container.querySelector(".poker-avatar")?.textContent).toMatch(
			"AN",
		);
	});

	test("avatar null exibe as iniciais", () => {
		const { container } = render(
			<PokerTable
				seats={[seated({ avatar: null })]}
				playerId="p_ana"
				revealed={false}
			/>,
		);
		expect(container.querySelector(".poker-avatar img")).toBeNull();
		expect(container.querySelector(".poker-avatar")?.textContent).toMatch(
			"AN",
		);
	});

	test("erro de load volta para as iniciais sem círculo vazio", () => {
		const { container } = render(
			<PokerTable
				seats={[seated({ avatar: AVATAR })]}
				playerId="p_ana"
				revealed={false}
			/>,
		);
		fireEvent.error(screen.getByRole("img", { name: "Ana" }));
		expect(container.querySelector(".poker-avatar img")).toBeNull();
		expect(container.querySelector(".poker-avatar")?.textContent).toMatch(
			"AN",
		);
	});

	test("âncora de projéteis inalterada com avatar", () => {
		const { container } = render(
			<PokerTable
				seats={[seated({ id: "p_beto", nick: "Beto", avatar: AVATAR })]}
				playerId="p_ana"
				revealed={false}
			/>,
		);
		const anchored = container.querySelector(
			'.poker-avatar[data-projectile-player="p_beto"]',
		);
		expect(anchored).toBeTruthy();
		expect(anchored?.querySelector("img")?.getAttribute("src")).toBe(AVATAR);
	});
});
