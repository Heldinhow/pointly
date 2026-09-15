import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
	url: "http://localhost/",
});

const win = dom.window as unknown as Record<string, unknown>;

globalThis.window = win as unknown as Window & typeof globalThis;
globalThis.document = win.document as Document;
globalThis.navigator = win.navigator as Navigator;
globalThis.Element = win.Element as typeof Element;
globalThis.HTMLElement = win.HTMLElement as typeof HTMLElement;
globalThis.Node = win.Node as typeof Node;
globalThis.Event = win.Event as typeof Event;
globalThis.CustomEvent = win.CustomEvent as typeof CustomEvent;
globalThis.MouseEvent = win.MouseEvent as typeof MouseEvent;
globalThis.KeyboardEvent = win.KeyboardEvent as typeof KeyboardEvent;
globalThis.getComputedStyle = win.getComputedStyle as typeof getComputedStyle;

// jsdom não implementa top layer. O nwsapi entra em recursão em :modal
// (consultado pelo Floating UI); nenhum elemento está nesse estado aqui.
const matches = Element.prototype.matches;
Element.prototype.matches = function (selector: string): boolean {
	if (selector === ":modal" || selector === ":fullscreen") return false;
	return matches.call(this, selector);
};

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

if (typeof globalThis.requestAnimationFrame !== "function") {
	const raf = ((callback: FrameRequestCallback) =>
		setTimeout(() => callback(Date.now()), 0)) as unknown as typeof requestAnimationFrame;
	const caf = ((handle: number) => clearTimeout(handle)) as unknown as typeof cancelAnimationFrame;
	globalThis.requestAnimationFrame = raf;
	globalThis.cancelAnimationFrame = caf;
	if (typeof win.requestAnimationFrame !== "function") {
		win.requestAnimationFrame = raf as unknown as typeof win.requestAnimationFrame;
		win.cancelAnimationFrame = caf as unknown as typeof win.cancelAnimationFrame;
	}
}

if (typeof globalThis.window.matchMedia !== "function") {
	globalThis.window.matchMedia = ((query: string) => ({
		matches: false,
		media: query,
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => false,
	}) as unknown as MediaQueryList) as typeof window.matchMedia;
}
