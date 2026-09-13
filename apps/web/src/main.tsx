/**
 * Entry do app (scaffold spell-rebuild).
 *
 * StrictMode DESABILITADO de propósito: o ciclo mount/unmount/remount
 * quebra a inicialização do WebSocket client (`useArenaLoop`) — fecha
 * o socket antes de ele ser estabelecido. Em produção StrictMode é
 * no-op, então desabilitar aqui é seguro. (Decisão portada do cliente
 * anterior; worker da arena conta com isso.)
 */
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { init as initAnalytics } from "./lib/analytics";
import "@fontsource/geist/latin-400.css";
import "@fontsource/geist/latin-500.css";
import "@fontsource/geist/latin-600.css";
import "@fontsource/geist/latin-700.css";
import "@fontsource/geist-mono/latin-400.css";
import "@fontsource/geist-mono/latin-500.css";
import "@fontsource/geist-mono/latin-600.css";
import "./index.css";

initAnalytics();

const rootEl = document.getElementById("root");
if (!rootEl) {
	throw new Error("Mount node #root not found in document.");
}

createRoot(rootEl).render(<App />);
