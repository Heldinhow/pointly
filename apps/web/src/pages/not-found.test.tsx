import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { NotFoundPage } from "./not-found";
import type { Lang } from "@/lib/i18n";

afterEach(() => {
	cleanup();
});

function renderNotFound(entry: string, lang: Lang): void {
	render(
		<MemoryRouter initialEntries={[entry]}>
			<Routes>
				<Route path="*" element={<NotFoundPage lang={lang} />} />
			</Routes>
		</MemoryRouter>,
	);
}

describe("NotFoundPage", () => {
	test("preserva o código de /en/s/ABXD no link de entrar", () => {
		renderNotFound("/en/s/abxd", "en");
		expect(
			screen
				.getByRole("link", { name: "Join with code" })
				.getAttribute("href"),
		).toBe("/join?mode=join&code=ABXD");
	});

	test("preserva o ?code= da URL atual", () => {
		renderNotFound("/qualquer?code=zz99", "pt-BR");
		expect(
			screen
				.getByRole("link", { name: "Entrar com código" })
				.getAttribute("href"),
		).toBe("/join?mode=join&code=ZZ99");
	});

	test("sem código detectado, o link vai ao join genérico", () => {
		renderNotFound("/nada-aqui", "pt-BR");
		expect(
			screen
				.getByRole("link", { name: "Entrar com código" })
				.getAttribute("href"),
		).toBe("/join?mode=join");
	});
});
