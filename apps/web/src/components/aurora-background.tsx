/**
 * Fundo animado "Aurora" (direção v2): três blobs de gradiente radial em
 * deriva lenta + véu de grade estático. Decorativo puro — sem JS, sem
 * interação, só `transform/opacity` (GPU-friendly). As cores/força são
 * tokens de tema em `index.css` (`--aurora-*`); a geometria vive em
 * `brand.css`. `prefers-reduced-motion` colapsa tudo via a rede global.
 */
export function AuroraBackground(): React.ReactElement {
	return (
		<div className="aurora" aria-hidden="true">
			<i className="aurora__blob aurora__blob--1" />
			<i className="aurora__blob aurora__blob--2" />
			<i className="aurora__blob aurora__blob--3" />
		</div>
	);
}
