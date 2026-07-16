import { ThemeProvider } from "./components/theme-provider";
/**
 * App — root component.
 *
 * Phase 5 (T26): wrap router com ToastProvider para feedback de UI
 * (voto, sala cheia, reconnect). Pages consomem via `useToast()`.
 *
 * Phase 6 (T37): monta <ToastQueue /> invisível que escuta store events
 * e dispara toasts via useToast(). Primeiro voto, reveal, sala_ended, etc.
 */
import { ToastQueue } from "./components/toast-queue";
import { ToastProvider } from "./components/ui/toast";
import { AppRouter } from "./routes";

export function App() {
	return (
		<ThemeProvider>
			<ToastProvider>
				<ToastQueue />
				<AppRouter />
			</ToastProvider>
		</ThemeProvider>
	);
}
