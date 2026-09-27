import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
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
