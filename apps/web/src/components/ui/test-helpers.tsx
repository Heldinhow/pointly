/**
 * test-helpers — bootstrap para testes com @testing-library/react + bun:test.
 *
 * Phase 5 (T26).
 *
 * **Setup do DOM**: feito em `src/test-jsdom.ts` (preload do bunfig.toml),
 * que instala `globalThis.document/window/etc` ANTES de qualquer test-file
 * ser importado. Esse arquivo NÃO importa `@testing-library/react` porque
 * a lib cacheia `screen.body` em module-load.
 *
 * **Este arquivo**:
 *  - Importa matchers do @testing-library/jest-dom (side-effect).
 *  - Augment types de Matchers<T> com assinaturas jest-dom (TS only).
 *  - Re-exporta `render`, `screen`, `cleanup`, `act` para testes.
 *  - Registra auto-cleanup após cada teste (RTL exige).
 */
import "@testing-library/jest-dom";
import { afterEach } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

import type {} from "./jest-dom-augment";

afterEach(() => {
	cleanup();
});

export { render, screen, cleanup };
export { act, fireEvent, renderHook } from "@testing-library/react";
