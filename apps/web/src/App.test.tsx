import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { __resetAnalyticsForTests } from "./lib/analytics";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "./lib/consent";
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

const JSDOM_USER_AGENT = window.navigator.userAgent;

function stubUserAgent(userAgent: string): void {
  Object.defineProperty(window.navigator, "userAgent", {
    value: userAgent,
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
  // `/join` e `/s/*` são lazy: a primeira leitura do conteúdo espera o chunk.
  test("uma nova tela começa no topo e recebe o foco no conteúdo", async () => {
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
      expect(await screen.findByLabelText("Apelido")).toBeTruthy();
    } finally {
      window.scrollTo = originalScrollTo;
    }
  });
  test("navegação para entrar com código atualiza o formulário já aberto", async () => {
    render(
      <MemoryRouter initialEntries={["/join"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("group", { name: "Código da sala" })).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: "Entrar com código" }));
    expect(
      await screen.findByRole("group", { name: "Código da sala" }),
    ).toBeTruthy();
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

  test("seletor em rota do app (/join) alterna EN/PT na hora", async () => {
    render(
      <MemoryRouter initialEntries={["/join"]}>
        <App />
      </MemoryRouter>,
    );

    const [toggle] = screen.getAllByTestId("language-switch");
    fireEvent.click(toggle!);
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("en");
    expect(await screen.findByLabelText("Nickname")).toBeTruthy();

    const [backToPt] = screen.getAllByTestId("language-switch");
    fireEvent.click(backToPt!);
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("pt-BR");
    expect(screen.getByLabelText("Apelido")).toBeTruthy();
  });

  test("preferência EN leva /join para inglês", async () => {
    window.localStorage.setItem(LANG_STORAGE_KEY, "en");
    render(
      <MemoryRouter initialEntries={["/join"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText("Nickname")).toBeTruthy();
    expect(
      screen.getByRole("radiogroup", {
        name: "Create a room or join with a code",
      }),
    ).toBeTruthy();
  });

  test("navegador EN sem preferência vê /join em inglês", async () => {
    stubNavigatorLanguages(["en-US"]);
    render(
      <MemoryRouter initialEntries={["/join"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText("Nickname")).toBeTruthy();
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

describe("App (higiene GSC — redirect de locale e robots por rota)", () => {
  beforeEach(() => {
    window.scrollTo = (() => {}) as typeof window.scrollTo;
    document.head.querySelector('meta[name="robots"]')?.remove();
  });

  afterEach(() => {
    document.head.querySelector('meta[name="robots"]')?.remove();
    stubUserAgent(JSDOM_USER_AGENT);
  });

  test("Googlebot em inglês fica na home pt (sem redirect client-side)", () => {
    stubNavigatorLanguages(["en-US"]);
    stubUserAgent(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    );

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("home-hero").textContent).toMatch(
      /Planning poker online grátis/,
    );
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBeNull();
  });

  test("navegador EN comum segue indo para /en", () => {
    stubNavigatorLanguages(["en-US"]);
    stubUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    );

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

  test("/join e /s/* recebem noindex em runtime", () => {
    const robots = () =>
      document.head.querySelector('meta[name="robots"]')?.getAttribute("content");

    const { unmount } = render(
      <MemoryRouter initialEntries={["/join"]}>
        <App />
      </MemoryRouter>,
    );
    expect(robots()).toBe("noindex");
    unmount();

    render(
      <MemoryRouter initialEntries={["/s/ABCD"]}>
        <App />
      </MemoryRouter>,
    );
    expect(robots()).toBe("noindex");
  });

  test("rota pública não herda noindex do shell/404", () => {
    const stale = document.createElement("meta");
    stale.setAttribute("name", "robots");
    stale.setAttribute("content", "noindex");
    document.head.appendChild(stale);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });
});

describe("App com analytics e consentimento", () => {
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

  beforeEach(() => {
    __resetAnalyticsForTests();
    clearGaEnv();
    removeGtagScripts();
    delete window.gtag;
    delete window.dataLayer;
    window.localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
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
    window.localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
  });

  for (const route of ["/join?code=ABCD&mode=join", "/s/ABCD"]) {
    test(`${route} não inicializa analytics antes da escolha`, () => {
      render(
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>,
      );
      expect(calls).toEqual([]);
      expect(window.dataLayer).toBeUndefined();
      expect(
        document.querySelectorAll('script[src*="googletagmanager.com"]'),
      ).toHaveLength(0);
      expect(screen.getByTestId("analytics-consent-banner")).toBeTruthy();
    });
  }

  test("Aceitar persiste a escolha, carrega o gtag e envia o page_view atual", async () => {
    render(
      <MemoryRouter initialEntries={["/join?code=ABCD&mode=join"]}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("analytics-consent-accept"));

    expect(
      window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY),
    ).toBe("granted");
    expect(
      document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]'),
    ).toHaveLength(1);
    await waitFor(() => {
      expect(calls).toContainEqual([
        "event",
        "page_view",
        { page_path: "/join" },
      ]);
    });
    expect(screen.queryByTestId("analytics-consent-banner")).toBeNull();
  });

  test("Recusar persiste denied e mantém zero requests; dá para rever no rodapé", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("analytics-consent-reject"));

    expect(
      window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY),
    ).toBe("denied");
    expect(calls).toEqual([]);
    expect(
      document.querySelectorAll('script[src*="googletagmanager.com"]'),
    ).toHaveLength(0);
    expect(screen.queryByTestId("analytics-consent-banner")).toBeNull();

    fireEvent.click(screen.getByTestId("analytics-consent-open"));
    expect(screen.getByTestId("analytics-consent-banner")).toBeTruthy();
    expect(screen.getByTestId("analytics-consent-close")).toBeTruthy();
    fireEvent.click(screen.getByTestId("analytics-consent-accept"));
    expect(
      window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY),
    ).toBe("granted");
    expect(
      document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]'),
    ).toHaveLength(1);
  });

  test("sem Measurement ID não mostra banner de consentimento", () => {
    clearGaEnv();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId("analytics-consent-banner")).toBeNull();
    expect(screen.queryByTestId("analytics-consent-open")).toBeNull();
  });
});
