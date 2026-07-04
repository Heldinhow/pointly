/**
 * Pointly app entry.
 *
 * Phase 1 (T3): placeholder only — renders "Pointly" headline.
 * Phase 5 (T24): router takes over with /, /join, /arena, /full routes.
 *
 * `index.css` é importado aqui (Tailwind do T25, fonte, tokens).
 * `App.tsx` permanece como placeholder; T26 (primitive library) vai
 * modificá-lo para renderizar `<AppRouter/>`.
 *
 * **StrictMode desabilitado em dev** (Phase 8 — T42): o ciclo
 * mount/unmount/remount do StrictMode quebra a inicialização do
 * WebSocket client (`useArenaLoop`), que fecha o socket antes de
 * ele ser estabelecido. `WebSocket is closed before the connection
 * is established.` é apenas um warning do browser, mas o segundo
 * mount não consegue reconectar a tempo. Em produção, StrictMode
 * é um no-op (só roda em dev), então desabilitar aqui é seguro.
 */

import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
	throw new Error("Mount node #root not found in document.");
}

createRoot(rootEl).render(<App />);
