import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  Brand,
  ShellHeader,
  ShellMain,
  SkipLink,
  useHeaderScrolled,
} from "@/components/shell";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/lib/theme";
import { ArenaPage } from "@/pages/arena";
import { HomePage } from "@/pages/home";
import { JoinPage } from "@/pages/join";
import { NotFoundPage } from "@/pages/not-found";

export default function App(): React.ReactElement {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const inArena = pathname.startsWith("/s/");
  const scrolled = useHeaderScrolled();

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SkipLink />
      <ShellHeader data-scrolled={scrolled ? "true" : "false"}>
        {inArena ? (
          <Brand />
        ) : (
          <Link to="/" aria-label="Pointly, início">
            <Brand />
          </Link>
        )}
        <div className="site-nav">
          {!inArena && (
            <nav aria-label="Navegação principal">
              <NavLink to="/" end>
                Início
              </NavLink>
              <NavLink to="/join?mode=join">Entrar com código</NavLink>
            </nav>
          )}
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </ShellHeader>
      <ShellMain id="conteudo">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/s/:code" element={<ArenaPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ShellMain>
      {!inArena && (
        <footer className="site-footer">
          <span>Pointly · Planning poker, juntos.</span>
          <span>Sem cadastro. Direto à conversa.</span>
        </footer>
      )}
    </div>
  );
}
