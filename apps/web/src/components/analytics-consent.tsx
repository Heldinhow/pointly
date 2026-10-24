import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { isAnalyticsConfigured } from "@/lib/analytics";
import type { AnalyticsConsent } from "@/lib/consent";
import type { Lang } from "@/lib/i18n";

interface AnalyticsConsentBannerProps {
	lang: Lang;
	/** Força reabrir as preferências depois de uma escolha já salva. */
	open: boolean;
	choice: AnalyticsConsent | null;
	onChoice: (choice: AnalyticsConsent) => void;
	onClose: () => void;
}

/**
 * Banner de consentimento (LGPD): opt-in explícito antes de qualquer request
 * ao Google. Sem escolha salva ele aparece em toda rota; com escolha, só
 * reaparece quando o usuário abre "Privacidade" no rodapé.
 *
 * `mounted` evita divergência de hidratação: o prerender não conhece o
 * localStorage e não deve gravar o banner no HTML estático.
 */
export function AnalyticsConsentBanner({
	lang,
	open,
	choice,
	onChoice,
	onClose,
}: AnalyticsConsentBannerProps): React.ReactElement | null {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted || !isAnalyticsConfigured()) return null;
	if (choice !== null && !open) return null;

	const isEn = lang === "en";

	return (
		<section
			data-testid="analytics-consent-banner"
			role="dialog"
			aria-modal="false"
			aria-labelledby="analytics-consent-title"
			aria-describedby="analytics-consent-description"
			className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-card-foreground shadow-[0_-8px_30px_rgba(0,0,0,0.14)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[min(26rem,calc(100vw-3rem))] sm:rounded-xl sm:border sm:pb-4"
		>
			<h2
				id="analytics-consent-title"
				className="font-heading text-base font-semibold"
			>
				{isEn ? "Cookies and usage analytics" : "Cookies e análise de uso"}
			</h2>
			<p
				id="analytics-consent-description"
				className="mt-1 text-sm text-muted-foreground"
			>
				{isEn
					? "We use Google Analytics to understand how Pointly is used. It only loads if you accept. If you decline, no requests are sent to Google."
					: "Usamos o Google Analytics para entender como o Pointly é usado. Ele só carrega se você aceitar. Se recusar, nenhuma requisição é enviada ao Google."}
			</p>
			<div className="mt-4 flex flex-wrap items-center gap-2">
				<Button
					data-testid="analytics-consent-accept"
					size="sm"
					onClick={() => onChoice("granted")}
				>
					{isEn ? "Accept" : "Aceitar"}
				</Button>
				<Button
					data-testid="analytics-consent-reject"
					size="sm"
					variant="outline"
					onClick={() => onChoice("denied")}
				>
					{isEn ? "Decline" : "Recusar"}
				</Button>
				{choice !== null && (
					<Button
						data-testid="analytics-consent-close"
						size="sm"
						variant="ghost"
						onClick={onClose}
					>
						{isEn ? "Close" : "Fechar"}
					</Button>
				)}
			</div>
		</section>
	);
}
