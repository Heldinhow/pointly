/**
 * App — root component (scaffold spell-rebuild).
 *
 * ThemeProvider (dark default) > MotionConfig (reducedMotion="user") >
 * NetworkBanner + AppRouter + ToastHost.
 *
 * Páginas (landing/join/arena/full) e peças spell são plugadas
 * pelos workers paralelos — este arquivo só compõe a casca.
 */
import { MotionConfig } from "motion/react";
import { NetworkBanner } from "@/components/analytics";
import { ToastHost } from "@/components/feedback/toast";
import { AppRouter } from "@/routes";
import { ThemeProvider } from "@/theme/theme";

export function App() {
	return (
		<ThemeProvider>
			<MotionConfig reducedMotion="user">
				<NetworkBanner />
				<AppRouter />
				<ToastHost />
			</MotionConfig>
		</ThemeProvider>
	);
}
