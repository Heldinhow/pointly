import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RoundDemo } from "@/components/round-demo";
import type { Lang } from "@/lib/i18n";
import { HOME_CONTENT } from "./home-content";
import "./home.css";

/**
 * Home: o produto real é o hero. A rodada local (`RoundDemo`) fica na
 * primeira dobra, ao lado do headline alinhado à esquerda e do CTA primário;
 * o alvo `#demo` vive no próprio componente da rodada.
 */
export function HomePage({
  lang = "pt-BR",
}: {
  lang?: Lang;
}): React.ReactElement {
  const content = HOME_CONTENT[lang];

  return (
    <div className="pt-home">
      <div className="pt-home__shell">
        <section className="pt-home__hero" data-testid="home-hero">
          <div className="pt-home__hero-copy">
            <h1>
              {content.hero.h1Lead}
              <br />
              <em>{content.hero.h1Em}</em>
            </h1>
            <p className="pt-home__hero-lede">{content.hero.lede}</p>
            <div className="pt-home__hero-actions">
              <Button
                size="xl"
                data-testid="home-cta-create"
                render={<Link to="/join" />}
              >
                {content.hero.createRoom} <ArrowRightIcon aria-hidden="true" />
              </Button>
              <Link
                to="/join?mode=join"
                className="pt-home__text-link"
                data-testid="home-cta-join"
              >
                {content.hero.enterWithCode}
              </Link>
            </div>
          </div>
          <div className="pt-home__hero-demo">
            <RoundDemo lang={lang} id="demo" data-testid="demo" />
          </div>
        </section>
        <section className="pt-home__how" id="como-funciona">
          <div className="pt-home__how-intro">
            <h2>{content.how.title}</h2>
          </div>
          <ol className="pt-home__steps" role="list">
            {content.how.steps.map((step, index) => (
              <li key={step.title}>
                <span className="pt-home__step-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="pt-home__how-action">
            <Button
              size="xl"
              data-testid="home-cta-create-bottom"
              render={<Link to="/join" />}
            >
              {content.how.cta} <ArrowRightIcon aria-hidden="true" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
