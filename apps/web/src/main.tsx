import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/geist";
import "@fontsource/geist/500.css";
import "@fontsource/geist/600.css";
import "@fontsource/geist/700.css";
import "@fontsource/geist-mono";
import "@fontsource/geist-mono/500.css";
import "@fontsource/geist-mono/600.css";
import "@fontsource/geist-mono/700.css";
import App from "./App";
import "./index.css";
import "./brand.css";

const root = document.getElementById("root");
if (!root) throw new Error("Elemento #root não encontrado.");

const app = (
	<StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</StrictMode>
);

// Rotas pré-renderizadas chegam com HTML pronto (build do G1): hidrata em vez
// de recriar; rotas do shell SPA (/join, /s/:code) seguem no createRoot.
if (root.hasChildNodes()) {
	hydrateRoot(root, app);
} else {
	createRoot(root).render(app);
}
