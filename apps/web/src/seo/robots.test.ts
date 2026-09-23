import { afterEach, describe, expect, test } from "bun:test";
import { ROBOTS_META_SELECTOR, syncRobotsMeta } from "./robots";

function robotsMeta(): Element | null {
	return document.head.querySelector(ROBOTS_META_SELECTOR);
}

afterEach(() => {
	robotsMeta()?.remove();
});

describe("meta robots em runtime (higiene GSC)", () => {
	test("rota não indexável ganha noindex, sem duplicar", () => {
		syncRobotsMeta(false);
		syncRobotsMeta(false);

		const metas = document.head.querySelectorAll(ROBOTS_META_SELECTOR);
		expect(metas).toHaveLength(1);
		expect(metas[0]?.getAttribute("content")).toBe("noindex");
	});

	test("rota indexável remove o noindex herdado", () => {
		syncRobotsMeta(false);
		syncRobotsMeta(true);
		expect(robotsMeta()).toBeNull();
	});

	test("rota indexável sem meta não cria nada", () => {
		syncRobotsMeta(true);
		expect(robotsMeta()).toBeNull();
	});
});
