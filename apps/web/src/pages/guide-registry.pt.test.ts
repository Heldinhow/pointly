import { describe, expect, test } from "bun:test";
import { GUIDE_CONTENT, GUIDE_HUB } from "./guide-content";
import { GUIA_MAPA_PT } from "./guide-content-seo.pt";
import {
	GUIDE_BY_ID,
	GUIDE_REGISTRY_PT,
	relatedGuidesPt,
} from "./guide-registry.pt";

const GENERIC = /^(clique aqui|leia mais|saiba mais|aqui)$/i;

describe("Registro de guias PT (SSOT)", () => {
	test("ids e paths espelham o conteúdo publicado", () => {
		expect(Object.keys(GUIDE_CONTENT["pt-BR"]).sort()).toEqual(
			GUIDE_REGISTRY_PT.map((guide) => guide.id).sort(),
		);

		for (const guide of GUIDE_REGISTRY_PT) {
			expect(guide.path.startsWith("/")).toBe(true);
			expect(GUIDE_CONTENT["pt-BR"][guide.id]?.path).toBe(guide.path);
		}

		expect(
			GUIDE_REGISTRY_PT.some(
				(guide) =>
					guide.path === "/planning-poker-online-gratis-comparativo",
			),
		).toBe(true);
		expect(
			GUIDE_REGISTRY_PT.filter((guide) => guide.path.startsWith("/guias/")),
		).toHaveLength(GUIDE_REGISTRY_PT.length - 1);
		expect(GUIDE_REGISTRY_PT.some((guide) => guide.id === "story-points")).toBe(
			true,
		);
		expect(GUIDE_REGISTRY_PT.some((guide) => guide.id === "o-que-e")).toBe(
			true,
		);
	});

	test("hub e mapa projetam o registro sem lista paralela", () => {
		expect(GUIDE_HUB["pt-BR"].cards.map((card) => card.to)).toEqual(
			GUIDE_REGISTRY_PT.map((guide) => guide.path),
		);
		expect(GUIA_MAPA_PT.map((item) => item.to)).toEqual(
			GUIDE_REGISTRY_PT.filter(
				(guide) => guide.id !== "estimativa-agil",
			).map((guide) => guide.path),
		);
	});

	test("cada guia tem 3–4 relacionados válidos, sem auto-link", () => {
		const ids = new Set(GUIDE_REGISTRY_PT.map((guide) => guide.id));

		for (const guide of GUIDE_REGISTRY_PT) {
			expect(guide.related.length).toBeGreaterThanOrEqual(3);
			expect(guide.related.length).toBeLessThanOrEqual(4);
			expect(new Set(guide.related).size).toBe(guide.related.length);
			expect(guide.related).not.toContain(guide.id);
			for (const id of guide.related) expect(ids.has(id)).toBe(true);

			const links = relatedGuidesPt(guide.path);
			expect(links.map((link) => link.to)).toEqual(
				guide.related.map((id) => GUIDE_BY_ID.get(id)!.path),
			);
		}
	});

	test("âncoras são descritivas, têm a palavra-chave e nunca são genéricas", () => {
		for (const guide of GUIDE_REGISTRY_PT) {
			expect(guide.title.toLowerCase()).toContain(
				guide.keyword.toLowerCase(),
			);
			expect(guide.title).not.toMatch(GENERIC);

			for (const link of relatedGuidesPt(guide.path)) {
				const target = GUIDE_REGISTRY_PT.find(
					(candidate) => candidate.path === link.to,
				);
				expect(target).toBeTruthy();
				expect(link.label.toLowerCase()).toContain(
					target?.keyword.toLowerCase() ?? "",
				);
				expect(link.label).not.toMatch(GENERIC);
			}
		}
	});
});
