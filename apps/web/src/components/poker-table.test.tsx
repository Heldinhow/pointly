import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { cardPlacement, PokerTable, type TablePlayer } from "./poker-table";

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

describe("PokerTable cartas na mesa", () => {
	test("voto pré-reveal baixa a carta no feltro, não no assento", () => {
		const { container } = render(
			<PokerTable
				seats={[seated({ hasVoted: true })]}
				playerId="p_ana"
				revealed={false}
			/>,
		);
		const card = container.querySelector(
			".poker-table-cards .poker-played-card",
		);
		expect(card?.className).toMatch(/poker-played-card--dealt/);
		expect(card?.className).not.toMatch(/--face/);
		expect(card?.querySelector(".poker-card-pattern")).toBeTruthy();
		expect(container.querySelector(".poker-seat .poker-played-card")).toBeNull();
	});

	test("sem voto não há carta", () => {
		const { container } = render(
			<PokerTable seats={[seated()]} playerId="p_ana" revealed={false} />,
		);
		expect(container.querySelector(".poker-played-card")).toBeNull();
	});

	test("pós-reveal a carta vira face e mostra o valor", () => {
		const { container } = render(
			<PokerTable
				seats={[seated({ hasVoted: true, value: "5" })]}
				playerId="p_ana"
				revealed
			/>,
		);
		const card = container.querySelector(
			".poker-table-cards .poker-played-card",
		);
		expect(card?.className).toMatch(/poker-played-card--face/);
		expect(card?.className).not.toMatch(/--dealt/);
		expect(card?.textContent).toBe("5");
	});
});

/** Mesa desktop e feltro (`inset 44px 45px` + borda 10px) do CSS real. */
const TABLE_H = 430;
const CARD_W = 30;
const CARD_H = 42;
/** Pill "Votou" medido no browser: fundo em y 85.4 (topo) e avatar em 344.6 (base). */
const PILL_BOTTOM = 85.4;
const BOTTOM_AVATAR_TOP = 344.6;

function feltEllipse(width: number) {
	return {
		cx: width / 2,
		cy: TABLE_H / 2,
		a: (width - 110) / 2,
		b: (TABLE_H - 108) / 2,
	};
}

function cardBox(seat: number, width: number) {
	const { x, y, dx, dy, rotate } = cardPlacement(seat, false, {
		w: width,
		h: TABLE_H,
	});
	const cx = (x / 100) * width + dx;
	const cy = (y / 100) * TABLE_H + dy;
	return { cx, cy, rotate, rad: (rotate * Math.PI) / 180 };
}

function corners(seat: number, width: number) {
	const { cx, cy, rad } = cardBox(seat, width);
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	return [
		[-1, -1],
		[1, -1],
		[1, 1],
		[-1, 1],
	].map(([sx, sy]) => {
		const dx = (sx * CARD_W) / 2;
		const dy = (sy * CARD_H) / 2;
		return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
	});
}

function overlapsBox(seat: number, width: number, box: {
	left: number;
	right: number;
	top: number;
	bottom: number;
}): boolean {
	const bbox = cardBBox(seat, width);
	return (
		bbox.right > box.left &&
		bbox.left < box.right &&
		bbox.bottom > box.top &&
		bbox.top < box.bottom
	);
}

/** Caixa alinhada aos eixos da carta rotacionada. */
function cardBBox(seat: number, width: number) {
	const { cx, cy, rad } = cardBox(seat, width);
	const halfW = (CARD_W * Math.abs(Math.cos(rad)) + CARD_H * Math.abs(Math.sin(rad))) / 2;
	const halfH = (CARD_W * Math.abs(Math.sin(rad)) + CARD_H * Math.abs(Math.cos(rad))) / 2;
	return {
		left: cx - halfW,
		right: cx + halfW,
		top: cy - halfH,
		bottom: cy + halfH,
	};
}

describe("cardPlacement (geometria da mesa)", () => {
	// 637px = arena mais estreita no desktop (≤1050px empilha a sidebar);
	// 986px = mais larga (viewport 1050px); 920px = 1440px+.
	const WIDTHS = [637, 920, 986];

	test("carta inteira dentro do feltro em toda largura desktop", () => {
		for (const width of WIDTHS) {
			const { cx, cy, a, b } = feltEllipse(width);
			for (let seat = 0; seat < 12; seat++) {
				for (const corner of corners(seat, width)) {
					const dx = (corner.x - cx) / a;
					const dy = (corner.y - cy) / b;
					expect(dx * dx + dy * dy).toBeLessThanOrEqual(1);
				}
			}
		}
	});

	test("carta não invade o texto central (caixas conservadoras medidas)", () => {
		for (const width of WIDTHS) {
			const middle = width / 2;
			// Título + descrição (glifos ~249px) e linha do botão (~307px), com folga.
			const textBox = { left: middle - 130, right: middle + 130, top: 146.9, bottom: 232.2 };
			const panelBox = { left: middle - 160, right: middle + 160, top: 244.1, bottom: 284.1 };
			for (let seat = 0; seat < 12; seat++) {
				expect(overlapsBox(seat, width, textBox)).toBe(false);
				expect(overlapsBox(seat, width, panelBox)).toBe(false);
			}
		}
	});

	test("carta fica na frente do assento (mesma coluna do avatar)", () => {
		const seats = [
			[18, 9],
			[34, 9],
			[50, 9],
			[66, 9],
			[82, 9],
			[95, 50],
			[82, 91],
			[66, 91],
			[50, 91],
			[34, 91],
			[18, 91],
			[5, 50],
		];
		for (let seat = 0; seat < 12; seat++) {
			const p = cardPlacement(seat);
			const [seatX] = seats[seat];
			if (seatX === 5 || seatX === 95) {
				// Laterais: mesma altura do assento, 90px para dentro da borda.
				expect(p.y).toBe(50);
				expect(Math.abs(p.dx)).toBe(90);
				expect(p.dx).toBe(seatX > 50 ? -90 : 90);
			} else {
				expect(p.x).toBe(seatX);
				expect(p.dx).toBe(0);
			}
		}
	});

	test("carta não encosta no pill do assento nem no avatar", () => {
		for (const width of WIDTHS) {
			for (const seat of [0, 1, 2, 3, 4]) {
				expect(cardBBox(seat, width).top).toBeGreaterThanOrEqual(PILL_BOTTOM);
			}
			// Fila de baixo: carta acima do avatar do assento (não do pill).
			for (const seat of [6, 7, 8, 9, 10]) {
				expect(cardBBox(seat, width).bottom).toBeLessThanOrEqual(BOTTOM_AVATAR_TOP);
			}
		}
	});

	test("tela estreita empurra a carta para dentro; tela larga cola na borda", () => {
		const narrow = cardPlacement(0, false, { w: 637, h: TABLE_H });
		const wide = cardPlacement(0, false, { w: 920, h: TABLE_H });
		expect(narrow.y).toBeGreaterThan(wide.y);
	});

	test("mobile mantém a carta ao lado do avatar (2 colunas)", () => {
		const rows = [0, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 0];
		for (let seat = 0; seat < 12; seat++) {
			const p = cardPlacement(seat);
			expect(p.mobileX).toBe(seat < 6 ? 9 : 91);
			expect(p.mobileY).toBeCloseTo(8 + rows[seat] * 16.8, 5);
		}
	});

	test("compact usa a mesa da demonstração (4 assentos)", () => {
		const cornersDemo = [
			[38.5, 29.5],
			[61.5, 29.5],
			[61.5, 70.5],
			[38.5, 70.5],
		];
		for (let seat = 0; seat < 4; seat++) {
			const p = cardPlacement(seat, true);
			expect(p.x).toBe(cornersDemo[seat][0]);
			expect(p.y).toBe(cornersDemo[seat][1]);
		}
	});
});
