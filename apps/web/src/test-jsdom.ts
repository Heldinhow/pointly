/**
 * test-jsdom — preloaded via bunfig.toml. Instala DOM globals ANTES de
 * qualquer test-file ser importado. Não importa `@testing-library/react`
 * (que cacheia `screen` em module-load) — só seta globals.
 *
 * Phase 5 (T26). Bun:test executa `bunfig preload` ANTES dos test files,
 * então `screen` vê `document.body` definido.
 */
import { JSDOM } from "jsdom";

if (typeof globalThis.document === "undefined") {
	const dom = new JSDOM("<!doctype html><html><body></body></html>", {
		url: "http://localhost/",
	});
	const g = globalThis as any;
	g.window = dom.window;
	g.document = dom.window.document;
	g.navigator = dom.window.navigator;
	g.HTMLElement = dom.window.HTMLElement;
	g.Element = dom.window.Element;
	g.Node = dom.window.Node;
	g.Text = dom.window.Text;
	g.getComputedStyle = dom.window.getComputedStyle;
}
