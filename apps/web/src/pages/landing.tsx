import { ArrowRightIcon, CoffeeIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DECK_FACES,
  LANDING_CONTENT,
  type LandingContent,
} from "@/pages/landing-content";
import "./landing.css";

function DeckStrip(): React.ReactElement {
  return (
    <div className="pt-landing__deck-stage" aria-hidden="true">
      <ul className="pt-landing__deck" role="presentation">
        {DECK_FACES.map((face) => (
          <li
            key={face}
            className={
              face === "☕"
                ? "pt-landing__deck-card pt-landing__deck-card--pause"
                : "pt-landing__deck-card"
            }
          >
            {face === "☕" ? (
              <CoffeeIcon aria-hidden="true" className="pt-landing__deck-icon" />
            ) : (
              face
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingPage({
  content,
}: {
  content: LandingContent;
}): React.ReactElement {
  return (
    <div className="pt-landing">
      <div className="pt-landing__shell">
        <section className="pt-landing__hero" data-testid="landing-hero">
          <div className="pt-landing__hero-copy">
            <p className="pt-landing__kicker">{content.kicker}</p>
            <h1>{content.h1}</h1>
            <p className="pt-landing__lede">{content.lede}</p>
            <div className="pt-landing__hero-actions">
              <Button size="xl" render={<Link to="/join" />}>
                {content.ctaLabel} <ArrowRightIcon aria-hidden="true" />
              </Button>
              <a href="#how-it-works" className="pt-landing__text-link">
                {content.howAnchorLabel}
              </a>
            </div>
          </div>
          <div className="pt-landing__hero-visual">
            <DeckStrip />
            <p className="pt-landing__deck-note">{content.deckNote}</p>
          </div>
        </section>

        <section
          className="pt-landing__how"
          id="how-it-works"
          aria-labelledby="landing-how-title"
        >
          <div className="pt-landing__section-intro">
            <h2 id="landing-how-title">{content.how.title}</h2>
            <p>{content.how.intro}</p>
          </div>
          <ol className="pt-landing__steps" role="list" data-testid="landing-steps">
            {content.how.steps.map((step, index) => (
              <li key={step.title}>
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
          {/* Ação secundária: hero e fechamento já têm o primário (1 CTA principal por tela). */}
          <Link
            to="/join"
            className="pt-landing__text-link pt-landing__steps-action"
          >
            {content.ctaLabel} <ArrowRightIcon aria-hidden="true" />
          </Link>
        </section>

        <section
          className="pt-landing__why"
          aria-labelledby="landing-why-title"
        >
          <div className="pt-landing__section-intro">
            <h2 id="landing-why-title">{content.why.title}</h2>
            <p>{content.why.intro}</p>
          </div>
          <ul className="pt-landing__points" role="list" data-testid="landing-points">
            {content.why.points.map((point) => (
              <li key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {content.sections.map((section) => (
          <section key={section.title} className="pt-landing__prose">
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </section>
        ))}

        <section
          className="pt-landing__faq"
          id="faq"
          aria-labelledby="landing-faq-title"
        >
          <div className="pt-landing__section-intro">
            <h2 id="landing-faq-title">{content.faq.title}</h2>
          </div>
          <dl className="pt-landing__faq-list" data-testid="landing-faq">
            {content.faq.items.map((item) => (
              <div key={item.question} className="pt-landing__faq-item">
                <dt>{item.question}</dt>
                <dd>{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          className="pt-landing__closing"
          aria-labelledby="landing-closing-title"
        >
          <h2 id="landing-closing-title">{content.closing.title}</h2>
          <p>{content.closing.body}</p>
          <Button
            size="xl"
            data-testid="landing-cta-bottom"
            render={<Link to="/join" />}
          >
            {content.ctaLabel} <ArrowRightIcon aria-hidden="true" />
          </Button>
          <p className="pt-landing__cross-link">
            {content.guidesLink.text}{" "}
            <Link to={content.guidesLink.to}>{content.guidesLink.label}</Link>.
          </p>
          <p className="pt-landing__cross-link pt-landing__cross-link--quiet">
            {content.crossLink.text}{" "}
            <Link to={content.crossLink.to}>{content.crossLink.label}</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}

export function PlanningPokerLandingPage(): React.ReactElement {
  return <LandingPage content={LANDING_CONTENT["pt-BR"]["planning-poker"]} />;
}

export function ScrumPokerLandingPage(): React.ReactElement {
  return <LandingPage content={LANDING_CONTENT["pt-BR"]["scrum-poker"]} />;
}

export function PlanningPokerEnPage(): React.ReactElement {
  return <LandingPage content={LANDING_CONTENT.en["planning-poker"]} />;
}

export function ScrumPokerEnPage(): React.ReactElement {
  return <LandingPage content={LANDING_CONTENT.en["scrum-poker"]} />;
}
