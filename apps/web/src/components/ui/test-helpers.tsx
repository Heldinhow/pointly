/**
 * test-helpers — bootstrap para testes com @testing-library/react + bun:test.
 *
 * Phase 5 (T26). Loop-self-improve issue #54: `render` continua sendo o
 * render cru de RTL (não wrappa em provider), porque múltiplos testes
 * assumem `container.firstChild === null` quando o componente não
 * renderiza (ToastProvider sempre renderiza um viewport, então wrappear
 * quebraria essa asserção). Para wrappear em `<ToastProvider>` use
 * `renderWithProviders` deste módulo.
 *
 * **Setup do DOM**: feito em `src/test-jsdom.ts` (preload do bunfig.toml),
 * que instala `globalThis.document/window/etc` ANTES de qualquer test-file
 * ser importado. Esse arquivo NÃO importa `@testing-library/react` porque
 * a lib cacheia `screen.body` em module-load.
 *
 * **Este arquivo**:
 *  - Importa matchers do @testing-library/jest-dom (side-effect).
 *  - Augment types de Matchers<T> com assinaturas jest-dom (TS only).
 *  - Re-exporta `render` (cru) + `renderWithProviders` (wrappa em
 *    `<ToastProvider>`) + `screen`, `cleanup`.
 *  - Registra auto-cleanup após cada teste (RTL exige).
 */
import "@testing-library/jest-dom";
import { afterEach } from "bun:test";
import {
	cleanup,
	render as rtlRender,
	screen,
} from "@testing-library/react";
import type { ReactElement } from "react";
import { ToastProvider } from "./toast";

import type {} from "./jest-dom-augment";

afterEach(() => {
	cleanup();
});

/**
 * Render que wrappa em `<ToastProvider>`. Use quando o componente sob
 * teste (ou algum descendente) chamar `useToast()`. Para componentes
 * que NÃO usam toast, prefira `render` (sem provider) — assim testes
 * que verificam "container.firstChild === null" continuam funcionando.
 */
function renderWithProviders(
	ui: ReactElement,
	options?: Parameters<typeof rtlRender>[1],
) {
	return rtlRender(<ToastProvider>{ui}</ToastProvider>, options);
}

export { renderWithProviders, screen, cleanup };
// `render` cru — re-exportado por último pra deixar claro que NÃO wrappa.
export { render, act, fireEvent, renderHook } from "@testing-library/react";
