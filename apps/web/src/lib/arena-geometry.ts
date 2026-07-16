/**
 * Table Geometry & Seat Placement Constants and Helpers.
 *
 * Provides a single source of truth for the ellipse layout parameters
 * and distributes seats among players without overlaps.
 */

// Table radius in pixels (matching SVG ellipse bounds)
export const TABLE_RX = 420;
export const TABLE_RY = 210;
// Table center relative to the 960x560 container (offset vertically to avoid clipping)
export const TABLE_CX = 480;
export const TABLE_CY = 280;

/**
 * Calculates position (left, top) for a seat given its angle (degrees, 0=right, 90=bottom).
 */
export function seatPosition(angleDeg: number): { left: number; top: number } {
	const rad = (angleDeg * Math.PI) / 180;
	return {
		left: TABLE_CX + Math.cos(rad) * TABLE_RX,
		top: TABLE_CY + Math.sin(rad) * TABLE_RY,
	};
}

/**
 * Distributes 12 seats: player local ("VOCÊ") locked at 90° (6 o'clock);
 * others distributed through the remaining 11 positions.
 */
export function assignSeatAngles(
	mePlayerId: string | null,
	playerIds: string[],
): Map<string, number> {
	const map = new Map<string, number>();
	// VOCÊ locked at 90°
	if (mePlayerId) map.set(mePlayerId, 90);

	const others = playerIds.filter((id) => id !== mePlayerId);
	// Available angles avoiding 90° to prevent overlaps, filled clockwise starting at 60°
	const otherAngles = [60, 30, 0, 330, 300, 270, 240, 210, 180, 150, 120];

	for (let i = 0; i < others.length; i++) {
		const angle = otherAngles[i % otherAngles.length]!;
		map.set(others[i]!, angle);
	}
	return map;
}
