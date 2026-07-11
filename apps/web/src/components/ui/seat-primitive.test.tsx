/**
 * Seat (primitive) tests — T26 verify (bonus test).
 *
 * Cobre estados visuais do Seat primitive: isYou, isHost, votedMedian, unanimous.
 */
import { describe, expect, test } from "bun:test";
import { render, screen } from "./test-helpers";
import { SeatPrimitive } from "./seat";

describe("SeatPrimitive", () => {
	test("isYou=true aplica borda coral 2px (border-coral border-2)", () => {
		const { container } = render(<SeatPrimitive isYou>Ana</SeatPrimitive>);
		const seat = container.firstElementChild;
		expect(seat?.className).toContain("border-coral");
		expect(seat?.className).toContain("border-2");
	});

	test("isYou=false tem borda ink/5 (default)", () => {
		const { container } = render(<SeatPrimitive>Bob</SeatPrimitive>);
		const seat = container.firstElementChild;
		expect(seat?.className).toContain("border-ink/5");
		expect(seat?.className).not.toContain("border-coral");
	});

	test("isHost=true renderiza ★ mostarda com aria-label='Host — gerencia a mesa'", () => {
		render(<SeatPrimitive isHost>Host</SeatPrimitive>);
		expect(screen.getByLabelText("Host — gerencia a mesa")).toBeInTheDocument();
	});

	test("isHost=false NÃO renderiza star", () => {
		const { queryByLabelText } = render(<SeatPrimitive>Regular</SeatPrimitive>);
		expect(queryByLabelText("Host — gerencia a mesa")).toBeNull();
	});

	test("state=disconnected aplica opacity-40", () => {
		const { container } = render(
			<SeatPrimitive state="disconnected">x</SeatPrimitive>,
		);
		const seat = container.firstElementChild;
		expect(seat?.className).toContain("opacity-40");
	});

	test("votedMedian=true && !unanimous aplica borda mustard 2px (sem isYou)", () => {
		const { container } = render(
			<SeatPrimitive votedMedian>median</SeatPrimitive>,
		);
		const seat = container.firstElementChild;
		expect(seat?.className).toContain("border-mustard");
		expect(seat?.className).toContain("border-2");
	});

	test("votedMedian=true && unanimous=true NÃO aplica borda mustard", () => {
		const { container } = render(
			<SeatPrimitive votedMedian unanimous>
				unanimous
			</SeatPrimitive>,
		);
		const seat = container.firstElementChild;
		expect(seat?.className).not.toContain("border-mustard");
	});

	test("votedMedian=true && isYou=true && unanimity aplica box-shadow inset mustard (gold inner)", () => {
		const { container } = render(
			<SeatPrimitive isYou votedMedian>
				you-and-median
			</SeatPrimitive>,
		);
		const seat = container.firstElementChild as HTMLElement;
		expect(seat.style.boxShadow).toContain("inset");
		expect(seat.style.boxShadow).toContain("var(--mustard)");
	});

	test("data-seat-state/data-seat-is-you presente", () => {
		const { container } = render(
			<SeatPrimitive isYou isHost state="voted">
				x
			</SeatPrimitive>,
		);
		const seat = container.firstElementChild as HTMLElement;
		expect(seat.dataset.seatState).toBe("voted");
		expect(seat.dataset.seatIsYou).toBe("true");
		expect(seat.dataset.seatIsHost).toBe("true");
	});
});
