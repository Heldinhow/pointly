/**
 * Clipboard com fallback para contextos sem Async Clipboard API.
 * Extraído de `arena.tsx` — único dono de `execCommand("copy")`.
 */
export async function copyText(text: string): Promise<void> {
	const clipboard = navigator.clipboard;
	if (clipboard && typeof clipboard.writeText === "function") {
		await clipboard.writeText(text);
		return;
	}
	const area = document.createElement("textarea");
	area.value = text;
	area.setAttribute("readonly", "");
	area.style.position = "absolute";
	area.style.left = "-9999px";
	document.body.appendChild(area);
	area.select();
	document.execCommand("copy");
	document.body.removeChild(area);
}
