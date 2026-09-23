import { afterEach, describe, expect, test } from "bun:test";
import {
	browserPrefersEnglish,
	isPublicIndexablePath,
	isSearchEngineBot,
	LANG_STORAGE_KEY,
	languageSwitchTarget,
	readLanguagePreference,
	rememberLanguage,
	resolveInternalLang,
	shouldRedirectRootToEnglish,
	subscribeLanguage,
} from "./language";

const GOOGLEBOT_UA =
	"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const CHROME_UA =
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

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

	test("rotas internas: preferência salva → navegador → pt-BR", () => {
		stubLanguages(["pt-BR"]);
		expect(resolveInternalLang()).toBe("pt-BR");

		stubLanguages(["en-US"]);
		expect(resolveInternalLang()).toBe("en");

		rememberLanguage("pt-BR");
		stubLanguages(["en-US"]);
		expect(resolveInternalLang()).toBe("pt-BR");

		rememberLanguage("en");
		stubLanguages(["pt-BR"]);
		expect(resolveInternalLang()).toBe("en");
	});

	test("mudança de preferência notifica os observadores", () => {
		let notifications = 0;
		const unsubscribe = subscribeLanguage(() => {
			notifications += 1;
		});
		rememberLanguage("en");
		expect(notifications).toBe(1);
		unsubscribe();
		rememberLanguage("pt-BR");
		expect(notifications).toBe(1);
	});
});

describe("higiene GSC — crawler não segue o redirect de locale", () => {
	test("UAs de buscadores são reconhecidos; navegador comum não", () => {
		const bots = [
			GOOGLEBOT_UA,
			"Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
			"Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
			"Mozilla/5.0 (compatible; DuckDuckBot/1.0; +http://duckduckgo.com/duckduckbot.html)",
			"Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/140.0.0.0 Safari/537.36",
			"facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
		];
		for (const ua of bots) expect(isSearchEngineBot(ua)).toBe(true);

		expect(isSearchEngineBot(CHROME_UA)).toBe(false);
		expect(isSearchEngineBot("")).toBe(false);
		expect(isSearchEngineBot(undefined)).toBe(false);
	});

	test("bot em inglês fica na raiz; usuário EN sem preferência ainda vai para /en", () => {
		stubLanguages(["en-US"]);

		expect(shouldRedirectRootToEnglish("/", GOOGLEBOT_UA)).toBe(false);
		expect(shouldRedirectRootToEnglish("/", CHROME_UA)).toBe(true);
	});

	test("redirect exige raiz, sem preferência e navegador em inglês", () => {
		stubLanguages(["en-US"]);
		expect(shouldRedirectRootToEnglish("/en", CHROME_UA)).toBe(false);
		expect(shouldRedirectRootToEnglish("/guias", CHROME_UA)).toBe(false);
		expect(shouldRedirectRootToEnglish("/join", CHROME_UA)).toBe(false);

		rememberLanguage("pt-BR");
		expect(shouldRedirectRootToEnglish("/", CHROME_UA)).toBe(false);

		window.localStorage.clear();
		stubLanguages(["pt-BR"]);
		expect(shouldRedirectRootToEnglish("/", CHROME_UA)).toBe(false);
	});
});
