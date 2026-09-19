import { afterEach, describe, expect, test } from "bun:test";
import {
	browserPrefersEnglish,
	isPublicIndexablePath,
	LANG_STORAGE_KEY,
	languageSwitchTarget,
	readLanguagePreference,
	rememberLanguage,
} from "./language";

function stubLanguages(
	languages: readonly string[] | undefined,
	language?: string,
): void {
	Object.defineProperty(window.navigator, "languages", {
		value: languages,
		configurable: true,
	});
	if (language) {
		Object.defineProperty(window.navigator, "language", {
			value: language,
			configurable: true,
		});
	}
}

afterEach(() => {
	window.localStorage.clear();
});

describe("seleção de idioma (15.T8)", () => {
	test("troca aponta para o alternate da mesma página", () => {
		expect(languageSwitchTarget("/", "pt-BR")).toBe("/en");
		expect(languageSwitchTarget("/en", "en")).toBe("/");
		expect(languageSwitchTarget("/planning-poker", "pt-BR")).toBe(
			"/en/planning-poker",
		);
		expect(languageSwitchTarget("/en/planning-poker", "en")).toBe(
			"/planning-poker",
		);
		expect(languageSwitchTarget("/guias/story-points", "pt-BR")).toBe(
			"/en/guides/story-points",
		);
		expect(languageSwitchTarget("/en/guides/story-points", "en")).toBe(
			"/guias/story-points",
		);
	});

	test("barra final é normalizada", () => {
		expect(languageSwitchTarget("/en/", "en")).toBe("/");
		expect(isPublicIndexablePath("/guias/")).toBe(true);
	});

	test("sem alternate cai na home do idioma", () => {
		expect(languageSwitchTarget("/join", "pt-BR")).toBe("/en");
		expect(languageSwitchTarget("/rota-inexistente", "pt-BR")).toBe("/en");
		expect(languageSwitchTarget("/join", "en")).toBe("/");
	});

	test("seletor só aparece em rota pública indexável", () => {
		expect(isPublicIndexablePath("/")).toBe(true);
		expect(isPublicIndexablePath("/en")).toBe(true);
		expect(isPublicIndexablePath("/en/guides")).toBe(true);
		expect(isPublicIndexablePath("/join")).toBe(false);
		expect(isPublicIndexablePath("/s/ABCD")).toBe(false);
		expect(isPublicIndexablePath("/404")).toBe(false);
		expect(isPublicIndexablePath("/qualquer")).toBe(false);
	});

	test("preferência só é lida quando válida", () => {
		expect(readLanguagePreference()).toBeNull();
		rememberLanguage("en");
		expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("en");
		expect(readLanguagePreference()).toBe("en");
		window.localStorage.setItem(LANG_STORAGE_KEY, "fr");
		expect(readLanguagePreference()).toBeNull();
	});

	test("detecção do navegador: só o idioma primário conta", () => {
		stubLanguages(["en-US", "pt-BR"]);
		expect(browserPrefersEnglish()).toBe(true);
		stubLanguages(["pt-BR", "en-US"]);
		expect(browserPrefersEnglish()).toBe(false);
		stubLanguages(undefined, "en-GB");
		expect(browserPrefersEnglish()).toBe(true);
		stubLanguages(undefined, "pt-BR");
		expect(browserPrefersEnglish()).toBe(false);
	});
});
