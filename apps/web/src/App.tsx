import { Suspense, lazy, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Brand,
  ShellHeader,
  ShellMain,
  SkipLink,
  useHeaderScrolled,
} from "@/components/shell";
import { LanguageLink } from "@/components/language-link";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Spinner } from "@/components/ui/spinner";
import {
  isPublicIndexablePath,
  resolveInternalLang,
  shouldRedirectRootToEnglish,
  subscribeLanguage,
} from "@/lib/language";
import { syncRobotsMeta } from "@/seo/robots";
import type { Lang } from "@/lib/i18n";
import {
  initAnalytics,
  isAnalyticsConfigured,
  sanitizePagePath,
  trackPageView,
} from "@/lib/analytics";
import { AnalyticsConsentBanner } from "@/components/analytics-consent";
import {
  readAnalyticsConsent,
  subscribeAnalyticsConsent,
  writeAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/consent";
import { useTheme } from "@/lib/theme";
import {
  GuidesHubEnPage,
  GuidesHubPtPage,
  HowToPlayEnPage,
  HowToPlayPtPage,
  StoryPointsEnPage,
  StoryPointsPtPage,
  WhatIsEnPage,
  WhatIsPtPage,
  AgendaSessaoPtPage,
  EstimativaAgilPtPage,
  FibonacciEstimativaPtPage,
  PlanningPokerComparativoPtPage,
  PlanningPokerParaDevsPtPage,
  PlanningPokerRemotoPtPage,
  ScrumPokerVsPlanningPokerPtPage,
  StoryPointsVsHorasPtPage,
  TShirtSizingPtPage,
  VotosDivergentesPtPage,
} from "@/pages/guide";
import { HomePage } from "@/pages/home";
import {
  PlanningPokerEnPage,
  PlanningPokerLandingPage,
  ScrumPokerEnPage,
  ScrumPokerLandingPage,
} from "@/pages/landing";
import { NotFoundPage } from "@/pages/not-found";

// Rotas do app, fora do prerender: chunk separado, fora do HTML inicial.
const JoinPage = lazy(() =>
  import("@/pages/join").then((module) => ({ default: module.JoinPage })),
);
const ArenaPage = lazy(() =>
  import("@/pages/arena").then((module) => ({ default: module.ArenaPage })),
);

export default function App(): React.ReactElement {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const inArena = pathname.startsWith("/s/");
  const isEnPath = pathname === "/en" || pathname.startsWith("/en/");
  const isPublic = isPublicIndexablePath(pathname);
  // Rotas públicas mandam pelo path (SEO/prerender). Nas internas
  // (`/join`, `/s/:code`, 404) o idioma vem da preferência/navegador.
  const pathLang: Lang | null = isEnPath ? "en" : isPublic ? "pt-BR" : null;
  const internalLang = useSyncExternalStore(
    subscribeLanguage,
    resolveInternalLang,
    resolveInternalLang,
  );
  const lang: Lang = pathLang ?? internalLang;
  const isEn = lang === "en";
  const showLanguageSwitch = !inArena && isPublic;
  const scrolled = useHeaderScrolled();
  const previousPath = useRef(pathname);
  // Consentimento é client-only (localStorage). Ler via useSyncExternalStore
  // ainda na hidratação agenda um update síncrono quando há escolha salva e
  // derruba o Suspense com React #421; mount + subscribe no efeito é seguro.
  const [analyticsConsent, setAnalyticsConsent] =
    useState<AnalyticsConsent | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);

  useEffect(() => {
    setAnalyticsConsent(readAnalyticsConsent());
    return subscribeAnalyticsConsent(() => {
      setAnalyticsConsent(readAnalyticsConsent());
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = isEn ? "en" : "pt-BR";
  }, [isEn]);

  // GA4: init uma vez; pageviews em mudanças de rota (SPA). O consentimento
  // é dependência: aceitar carrega o gtag e dispara o page_view da rota atual.
  useEffect(() => {
    initAnalytics();
  }, [analyticsConsent]);

  useEffect(() => {
    // page_path sanitizado: `/s/:code` → `/s/[room]` e query nunca é
    // enviada (`/join?code=` vira `/join`). Sem page_title: títulos SEO
    // vivem no prerender/HTML estático; `document.title` no momento da
    // troca de rota seria stale na maioria das rotas.
    trackPageView(sanitizePagePath(pathname));
  }, [pathname, analyticsConsent]);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    window.scrollTo({ top: 0, behavior: "instant" });
    document.getElementById("conteudo")?.focus({ preventScroll: true });
  }, [pathname]);

  // 1ª visita (15.T8): raiz, sem escolha registrada e navegador em inglês
  // → home EN. Nunca o contrário, nunca fora da raiz (SERP pt não sofre bounce)
  // e nunca para crawlers: bot em inglês fica na home PT/x-default, senão o
  // redirect client-side vira “Página com redirecionamento” no GSC.
  useEffect(() => {
    if (!shouldRedirectRootToEnglish(pathname)) return;
    navigate("/en", { replace: true });
  }, [pathname, navigate]);

  // `noindex` acompanha a rota no SPA: /join, /s/* e 404 carregam o meta
  // (o serve-web também manda X-Robots-Tag no shell) e uma navegação
  // client-side de volta a rota pública não pode herdar o noindex.
  useEffect(() => {
    syncRobotsMeta(isPublic);
  }, [isPublic]);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SkipLink label={isEn ? "Skip to content" : undefined} />
      <ShellHeader data-scrolled={scrolled ? "true" : "false"}>
        {inArena ? (
          <Brand />
        ) : (
          <Link to={isEn ? "/en" : "/"} aria-label={isEn ? "Pointly, home" : "Pointly, início"}>
            <Brand />
          </Link>
        )}
        <div className="site-nav">
          {!inArena && (
            <nav aria-label={isEn ? "Main navigation" : "Navegação principal"}>
              <NavLink to={isEn ? "/en" : "/"} end>
                {isEn ? "Home" : "Início"}
              </NavLink>
              <NavLink to="/join?mode=join">
                {isEn ? "Enter with code" : "Entrar com código"}
              </NavLink>
            </nav>
          )}
          {showLanguageSwitch ? (
            <LanguageLink pathname={pathname} lang={lang} />
          ) : (
            <LanguageToggle lang={lang} />
          )}
          <ThemeToggle
            theme={theme}
            onToggle={toggle}
            lang={lang}
          />
        </div>
      </ShellHeader>
      <ShellMain id="conteudo" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="site-loading">
              <Spinner aria-label={isEn ? "Loading" : "Carregando"} />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/en" element={<HomePage lang="en" />} />
            <Route path="/planning-poker" element={<PlanningPokerLandingPage />} />
            <Route path="/scrum-poker" element={<ScrumPokerLandingPage />} />
            <Route path="/guias" element={<GuidesHubPtPage />} />
            <Route path="/guias/como-jogar-planning-poker" element={<HowToPlayPtPage />} />
            <Route path="/guias/o-que-e-planning-poker" element={<WhatIsPtPage />} />
            <Route path="/guias/story-points" element={<StoryPointsPtPage />} />
            <Route
              path="/guias/planning-poker-remoto"
              element={<PlanningPokerRemotoPtPage />}
            />
            <Route
              path="/guias/story-points-vs-horas"
              element={<StoryPointsVsHorasPtPage />}
            />
            <Route
              path="/guias/fibonacci-estimativa-agil"
              element={<FibonacciEstimativaPtPage />}
            />
            <Route path="/guias/t-shirt-sizing" element={<TShirtSizingPtPage />} />
            <Route
              path="/planning-poker-online-gratis-comparativo"
              element={<PlanningPokerComparativoPtPage />}
            />
            <Route
              path="/guias/estimativa-agil"
              element={<EstimativaAgilPtPage />}
            />
            <Route
              path="/guias/votos-divergentes-planning-poker"
              element={<VotosDivergentesPtPage />}
            />
            <Route
              path="/guias/planning-poker-para-devs"
              element={<PlanningPokerParaDevsPtPage />}
            />
            <Route
              path="/guias/agenda-sessao-planning-poker"
              element={<AgendaSessaoPtPage />}
            />
            <Route
              path="/guias/scrum-poker-vs-planning-poker"
              element={<ScrumPokerVsPlanningPokerPtPage />}
            />
            <Route path="/en/planning-poker" element={<PlanningPokerEnPage />} />
            <Route path="/en/scrum-poker" element={<ScrumPokerEnPage />} />
            <Route path="/en/guides" element={<GuidesHubEnPage />} />
            <Route
              path="/en/guides/how-to-play-planning-poker"
              element={<HowToPlayEnPage />}
            />
            <Route
              path="/en/guides/what-is-planning-poker"
              element={<WhatIsEnPage />}
            />
            <Route path="/en/guides/story-points" element={<StoryPointsEnPage />} />
            <Route path="/join" element={<JoinPage lang={lang} />} />
            <Route path="/s/:code" element={<ArenaPage lang={lang} />} />
            <Route path="*" element={<NotFoundPage lang={lang} />} />
          </Routes>
        </Suspense>
      </ShellMain>
      {!inArena && (
        <footer className="site-footer">
          <span>
            {isEn ? "Pointly · Planning poker, together." : "Pointly · Planning poker, juntos."}
          </span>
          <nav
            className="site-footer__nav"
            aria-label={isEn ? "Guides and tools" : "Guias e ferramentas"}
          >
            <NavLink to={isEn ? "/en/planning-poker" : "/planning-poker"}>
              Planning poker
            </NavLink>
            <NavLink to={isEn ? "/en/scrum-poker" : "/scrum-poker"}>
              Scrum poker
            </NavLink>
            <NavLink to={isEn ? "/en/guides" : "/guias"}>
              {isEn ? "Guides" : "Guias"}
            </NavLink>
            {!isEn && (
              <NavLink to="/planning-poker-online-gratis-comparativo">
                Comparativo
              </NavLink>
            )}
            {showLanguageSwitch ? (
              <LanguageLink pathname={pathname} lang={lang} />
            ) : (
              <LanguageToggle lang={lang} />
            )}
            {isAnalyticsConfigured() && (
              <button
                type="button"
                data-testid="analytics-consent-open"
                onClick={() => setConsentOpen(true)}
              >
                {isEn ? "Privacy" : "Privacidade"}
              </button>
            )}
          </nav>
          <span>
            {isEn
              ? "No signup. Straight to the conversation."
              : "Sem cadastro. Direto à conversa."}
          </span>
        </footer>
      )}
      <AnalyticsConsentBanner
        lang={lang}
        open={consentOpen}
        choice={analyticsConsent}
        onChoice={(choice) => {
          writeAnalyticsConsent(choice);
          setConsentOpen(false);
        }}
        onClose={() => setConsentOpen(false)}
      />
    </div>
  );
}
