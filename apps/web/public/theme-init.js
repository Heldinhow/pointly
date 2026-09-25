try {
	var stored = localStorage.getItem("pointly-theme");
	if (
		stored === "light" ||
		(stored !== "dark" &&
			window.matchMedia("(prefers-color-scheme: light)").matches)
	) {
		document.documentElement.classList.remove("dark");
	} else {
		document.documentElement.classList.add("dark");
	}
} catch {
	document.documentElement.classList.add("dark");
}
