import { useEffect, useRef } from "react";
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
import { ThemeToggle } from "@/components/theme-toggle";
import {
  browserPrefersEnglish,
  isPublicIndexablePath,
  readLanguagePreference,
} from "@/lib/language";
import { useTheme } from "@/lib/theme";
import { ArenaPage } from "@/pages/arena";
import {
  GuidesHubEnPage,
  GuidesHubPtPage,
  HowToPlayEnPage,
  HowToPlayPtPage,
  StoryPointsEnPage,
  StoryPointsPtPage,
  WhatIsEnPage,
  WhatIsPtPage,
} from "@/pages/guide";
import { HomePage } from "@/pages/home";
import { JoinPage } from "@/pages/join";
import {
  PlanningPokerEnPage,
  PlanningPokerLandingPage,
  ScrumPokerEnPage,
  ScrumPokerLandingPage,
} from "@/pages/landing";
import { NotFoundPage } from "@/pages/not-found";

export default function App(): React.ReactElement {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const inArena = pathname.startsWith("/s/");
  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  const lang = isEn ? "en" : "pt-BR";
  const showLanguageSwitch = !inArena && isPublicIndexablePath(pathname);
  const scrolled = useHeaderScrolled();
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    window.scrollTo({ top: 0, behavior: "instant" });
    document.getElementById("conteudo")?.focus({ preventScroll: true });
  }, [pathname]);

  // 1ª visita (15.T8): raiz, sem escolha registrada e navegador em inglês
  // → home EN. Nunca o contrário, e nunca fora da raiz (SERP pt não sofre bounce).
  useEffect(() => {
    if (pathname !== "/") return;
    if (readLanguagePreference() !== null) return;
    if (!browserPrefersEnglish()) return;
    navigate("/en", { replace: true });
  }, [pathname, navigate]);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SkipLink label={isEn ? "Skip to content" : undefined} />
      <ShellHeader data-scrolled={scrolled ? "true" : "false"}>
        {inArena ? (
          <Brand />
        ) : (
          <Link to="/" aria-label={isEn ? "Pointly, home" : "Pointly, início"}>
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
          {showLanguageSwitch && (
            <LanguageLink pathname={pathname} lang={lang} />
          )}
          <ThemeToggle
            theme={theme}
            onToggle={toggle}
            lang={isEn ? "en" : "pt-BR"}
          />
        </div>
      </ShellHeader>
      <ShellMain id="conteudo" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/en" element={<HomePage lang="en" />} />
          <Route path="/planning-poker" element={<PlanningPokerLandingPage />} />
          <Route path="/scrum-poker" element={<ScrumPokerLandingPage />} />
          <Route path="/guias" element={<GuidesHubPtPage />} />
          <Route path="/guias/como-jogar-planning-poker" element={<HowToPlayPtPage />} />
          <Route path="/guias/o-que-e-planning-poker" element={<WhatIsPtPage />} />
          <Route path="/guias/story-points" element={<StoryPointsPtPage />} />
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
          <Route path="/join" element={<JoinPage />} />
          <Route path="/s/:code" element={<ArenaPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
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
            {showLanguageSwitch && (
              <LanguageLink pathname={pathname} lang={lang} />
            )}
          </nav>
          <span>
            {isEn
              ? "No signup. Straight to the conversation."
              : "Sem cadastro. Direto à conversa."}
          </span>
        </footer>
      )}
    </div>
  );
}
