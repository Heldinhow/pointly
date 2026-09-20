import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { __resetAnalyticsForTests } from "./lib/analytics";
import { LANG_STORAGE_KEY } from "./lib/language";

function stubNavigatorLanguages(languages: readonly string[]): void {
  Object.defineProperty(window.navigator, "languages", {
    value: languages,
    configurable: true,
  });
  Object.defineProperty(window.navigator, "language", {
    value: languages[0],
    configurable: true,
  });
}

beforeEach(() => {
  // jsdom nasce en-US; o default dos testes é um navegador pt-BR.
  stubNavigatorLanguages(["pt-BR"]);
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("App (issue #158 — polimento e auditoria)", () => {
  test("uma nova tela começa no topo e recebe o foco no conteúdo", () => {
    const originalScrollTo = window.scrollTo;
    const calls: ScrollToOptions[] = [];
    window.scrollTo = ((options: ScrollToOptions) => calls.push(options)) as typeof window.scrollTo;
    try {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>,
      );
      fireEvent.click(screen.getByTestId("home-cta-create"));
      expect(calls).toEqual([{ top: 0, behavior: "instant" }]);
      expect(document.activeElement).toBe(screen.getByRole("main"));
      expect(screen.getByLabelText("Apelido")).toBeTruthy();
    } finally {
      window.scrollTo = originalScrollTo;
    }
  });
  test("navegação para entrar com código atualiza o formulário já aberto", () => {
    render(
      <MemoryRouter initialEntries={["/join"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("group", { name: "Código da sala" })).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: "Entrar com código" }));
    expect(screen.getByRole("group", { name: "Código da sala" })).toBeTruthy();
  });
  test("skip link leva ao conteúdo principal", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const skip = screen.getByRole("link", { name: /pular para o conteúdo/i });
    expect(skip.getAttribute("href")).toBe("#conteudo");
    const main = screen.getByRole("main");
    expect(main.getAttribute("id")).toBe("conteudo");
  });

  test("marcos de navegação presentes nas duas superfícies", () => {
    render(
      <MemoryRouter initialEntries={["/join"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("main").getAttribute("id")).toBe("conteudo");
  });
});

describe("App (15.T8 — seleção de idioma)", () => {
  beforeEach(() => {
    window.scrollTo = (() => {}) as typeof window.scrollTo;
  });

  test("seletor na home pt leva para /en e registra a escolha", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const switches = screen.getAllByTestId("language-switch");
    expect(switches).toHaveLength(2);
    for (const link of switches) {
      expect(link.getAttribute("href")).toBe("/en");
      expect(link.getAttribute("hreflang")).toBe("en");
    }
    expect(
      screen.getAllByRole("link", { name: "Ver esta página em inglês" }),
    ).toHaveLength(2);

    fireEvent.click(switches[0]!);

    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("en");
    expect(screen.getByTestId("home-hero").textContent).toMatch(
      /Free online planning poker/,
    );
  });

  test("seletor na home EN leva de volta para /", () => {
    render(
      <MemoryRouter initialEntries={["/en"]}>
        <App />
      </MemoryRouter>,
    );

    const [link] = screen.getAllByRole("link", {
      name: "View this page in Portuguese",
    });
    expect(link!.getAttribute("href")).toBe("/");
    expect(link!.textContent).toBe("PT");

    fireEvent.click(link!);
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("pt-BR");
    expect(screen.getByTestId("home-hero").textContent).toMatch(
      /Planning poker online grátis/,
    );
  });

  test("seletor em rota do app (/join) alterna EN/PT na hora", () => {
    render(
      <MemoryRouter initialEntries={["/join"]}>
        <App />
      </MemoryRouter>,
    );

    const [toggle] = screen.getAllByTestId("language-switch");
    fireEvent.click(toggle!);
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("en");
    expect(screen.getByLabelText("Nickname")).toBeTruthy();

    const [backToPt] = screen.getAllByTestId("language-switch");
    fireEvent.click(backToPt!);
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("pt-BR");
    expect(screen.getByLabelText("Apelido")).toBeTruthy();
  });

  test("preferência EN leva /join para inglês", () => {
    window.localStorage.setItem(LANG_STORAGE_KEY, "en");
    render(
      <MemoryRouter initialEntries={["/join"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Nickname")).toBeTruthy();
    expect(
      screen.getByRole("radiogroup", {
        name: "Create a room or join with a code",
      }),
    ).toBeTruthy();
  });

  test("navegador EN sem preferência vê /join em inglês", () => {
    stubNavigatorLanguages(["en-US"]);
    render(
      <MemoryRouter initialEntries={["/join"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Nickname")).toBeTruthy();
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBeNull();
  });

  test("preferência EN não muda as rotas públicas (path manda)", () => {
    window.localStorage.setItem(LANG_STORAGE_KEY, "en");
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("home-hero").textContent).toMatch(
      /Planning poker online grátis/,
    );
  });

  test("1ª visita na raiz com navegador em inglês vai para /en sem gravar preferência", () => {
    stubNavigatorLanguages(["en-US"]);
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("home-hero").textContent).toMatch(
      /Free online planning poker/,
    );
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBeNull();
  });

  test("preferência salva suprime o redirect da raiz", () => {
    stubNavigatorLanguages(["en-US"]);
    window.localStorage.setItem(LANG_STORAGE_KEY, "pt-BR");
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("home-hero").textContent).toMatch(
      /Planning poker online grátis/,
    );
  });

  test("navegador pt nunca é redirecionado a partir de /en", () => {
    render(
      <MemoryRouter initialEntries={["/en"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("home-hero").textContent).toMatch(
      /Free online planning poker/,
    );
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBeNull();
  });
});

describe("App (GA4 — pageview nunca vaza código de sala)", () => {
  const GA_ID = "G-TESTAPP";
  let calls: unknown[][];

  function setGaEnv(id: string): void {
    process.env.VITE_GA_MEASUREMENT_ID = id;
    (import.meta.env as Record<string, string | undefined>).VITE_GA_MEASUREMENT_ID =
      id;
  }

  function clearGaEnv(): void {
    delete process.env.VITE_GA_MEASUREMENT_ID;
    delete (import.meta.env as Record<string, string | undefined>)
      .VITE_GA_MEASUREMENT_ID;
  }

  function removeGtagScripts(): void {
    for (const node of document.querySelectorAll(
      'script[src*="googletagmanager.com/gtag/js"]',
    )) {
      node.remove();
    }
  }

  function pageViewPaths(): string[] {
    return calls
      .filter((args) => args[0] === "event" && args[1] === "page_view")
      .map((args) => (args[2] as Record<string, unknown> | undefined)?.page_path)
      .filter((path): path is string => typeof path === "string");
  }

  beforeEach(() => {
    __resetAnalyticsForTests();
    clearGaEnv();
    removeGtagScripts();
    delete window.gtag;
    delete window.dataLayer;
    window.scrollTo = (() => {}) as typeof window.scrollTo;
    setGaEnv(GA_ID);
    calls = [];
    window.gtag = (...args: unknown[]) => {
      calls.push(args);
    };
  });

  afterEach(() => {
    __resetAnalyticsForTests();
    clearGaEnv();
    removeGtagScripts();
    delete window.gtag;
    delete window.dataLayer;
  });

  test("/join?code=XXXX envia /join (query descartada)", () => {
    render(
      <MemoryRouter initialEntries={["/join?code=ABCD&mode=join"]}>
        <App />
      </MemoryRouter>,
    );

    expect(pageViewPaths()).toEqual(["/join"]);
    expect(JSON.stringify(calls)).not.toContain("ABCD");
  });

  test("/s/XXXX envia /s/[room] (código mascarado)", () => {
    render(
      <MemoryRouter initialEntries={["/s/ABCD"]}>
        <App />
      </MemoryRouter>,
    );

    // Sem sessão, a arena redireciona para /join — ambos os pageviews
    // devem sair sanitizados.
    const paths = pageViewPaths();
    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0]).toBe("/s/[room]");
    for (const path of paths) {
      expect(["/s/[room]", "/join"]).toContain(path);
    }
    expect(JSON.stringify(calls)).not.toContain("ABCD");
  });
});
