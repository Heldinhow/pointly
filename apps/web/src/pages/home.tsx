import {
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardPanel } from "@/components/ui/card";
import { Deck } from "@/components/deck";
import { PokerTable } from "@/components/poker-table";
import {
  formatMean,
  formatMedian,
  formatRange,
} from "@/lib/deck";
import type { Lang } from "@/lib/i18n";
import { useConsensusStats, voteSelectionText } from "@/lib/stats";
import type { Vote } from "@planning-poker/shared";
import { HOME_CONTENT } from "./home-content";
import "./home.css";

const SIMULATED_TEAM: ReadonlyArray<{ nick: string; vote: Vote }> = [
  { nick: "Bia", vote: "5" },
  { nick: "Caio", vote: "8" },
  { nick: "Dani", vote: "5" },
];

export function HomePage({
  lang = "pt-BR",
}: {
  lang?: Lang;
}): React.ReactElement {
  const content = HOME_CONTENT[lang];
  const [myVote, setMyVote] = useState<Vote | null>(null);
  const [revealed, setRevealed] = useState(false);
  const visualRef = useRef<HTMLDivElement | null>(null);
  // Mesa viva: tilt 3D sutil só com transform, só em pointer fino e sem
  // reduced-motion. Sem JS a mesa continua estática e visível.
  useEffect(() => {
    const el = visualRef.current;
    if (!el || typeof window === "undefined" || !("matchMedia" in window))
      return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");
    if (reduce.matches || !fine.matches) return;
    const stage = el.querySelector<HTMLElement>("[data-tilt-stage]");
    if (!stage) return;
    let frame = 0;
    const onMove = (e: PointerEvent): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        stage.style.transform = `rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg)`;
      });
    };
    const onLeave = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        stage.style.transform = "";
      });
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  const revealedVotes: Array<Vote | string> =
    myVote === null ? [] : [myVote, ...SIMULATED_TEAM.map((mate) => mate.vote)];
  const {
    consensus,
    noNumerics,
    isSingleNumeric,
    isUnanimousSignal,
    voteGroups,
    resultsAriaLabel,
  } = useConsensusStats(revealedVotes, lang);
  const selectionText = voteSelectionText(myVote, { revealed, lang });
  const seats = [
    {
      id: "you",
      nick: content.visual.you,
      seatIndex: 0,
      hasVoted: myVote !== null,
      value: revealed ? myVote : null,
      status: "connected" as const,
    },
    {
      id: "bia",
      nick: "Bia",
      seatIndex: 1,
      hasVoted: true,
      value: revealed ? "5" : null,
      status: "connected" as const,
    },
    {
      id: "caio",
      nick: "Caio",
      seatIndex: 2,
      hasVoted: true,
      value: revealed ? "8" : null,
      status: "connected" as const,
    },
    {
      id: "dani",
      nick: "Dani",
      seatIndex: 3,
      hasVoted: true,
      value: revealed ? "5" : null,
      status: "connected" as const,
    },
  ];
  function handleSelect(value: Vote): void {
    if (myVote !== value) setMyVote(value);
  }
  function handleReveal(): void {
    if (myVote !== null && !revealed) setRevealed(true);
  }
  function handleRetry(): void {
    setMyVote(null);
    setRevealed(false);
  }

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
            <a href="#demo" className="pt-home__demo-link">
              {content.hero.tryRound}
            </a>
          </div>
          <div
            className="pt-home__hero-visual"
            data-testid="home-hero-visual"
            aria-hidden="true"
            ref={visualRef}
          >
            <div className="pt-home__table-stage" data-tilt-stage>
              <div className="pt-home__felt">
                <span className="pt-home__felt-kicker">
                  {content.visual.kicker}
                </span>
                <strong className="pt-home__felt-story">
                  {content.visual.story}
                </strong>
                <div className="pt-home__fan">
                  <span
                    className="pt-home__mini-card"
                    style={{ "--i": 0 } as CSSProperties}
                  >
                    5
                  </span>
                  <span
                    className="pt-home__mini-card pt-home__mini-card--top"
                    style={{ "--i": 1 } as CSSProperties}
                  >
                    8
                  </span>
                  <span
                    className="pt-home__mini-card pt-home__mini-card--back"
                    style={{ "--i": 2 } as CSSProperties}
                  >
                    <span className="pt-home__mini-card-pattern" />
                  </span>
                </div>
                <span className="pt-home__felt-status">
                  <span className="pt-home__dots">
                    <i className="is-in" />
                    <i className="is-in" />
                    <i className="is-in" />
                    <i className="is-you" />
                  </span>
                  {content.visual.waiting}
                </span>
              </div>
              <span
                className="pt-home__seat pt-home__seat--bia"
                style={{ "--i": 0 } as CSSProperties}
              >
                <i>BI</i>
                <b>Bia</b>
                <em className="pt-home__seat-card" />
              </span>
              <span
                className="pt-home__seat pt-home__seat--caio"
                style={{ "--i": 1 } as CSSProperties}
              >
                <i>CA</i>
                <b>Caio</b>
                <em className="pt-home__seat-card" />
              </span>
              <span
                className="pt-home__seat pt-home__seat--dani"
                style={{ "--i": 2 } as CSSProperties}
              >
                <i>DA</i>
                <b>Dani</b>
                <em className="pt-home__seat-card" />
              </span>
              <span
                className="pt-home__seat pt-home__seat--you"
                style={{ "--i": 3 } as CSSProperties}
              >
                <i>{lang === "en" ? "YO" : "VO"}</i>
                <b>{content.visual.you}</b>
              </span>
            </div>
          </div>
        </section>
        <section
          className="pt-home__demo-wrap"
          id="demo"
          data-testid="demo"
          tabIndex={-1}
          aria-labelledby="demo-title"
        >
          <div className="pt-home__section-intro">
            <div>
              <h2 id="demo-title">
                <span className="pt-home__demo-title-end">
                  {content.demo.titleLead}
                </span>{" "}
                <span className="pt-home__demo-title-end">
                  {content.demo.titleEnd}
                </span>
              </h2>
            </div>
            <p>{content.demo.intro}</p>
          </div>
          <Card className="pt-home__demo-card">
            <CardPanel className="pt-home__demo-panel">
              <PokerTable
                seats={seats}
                playerId="you"
                revealed={revealed}
                compact
                lang={lang}
              >
                <div className="pt-home__table-center">
                  <span className="pt-home__table-kicker">
                    {content.demo.kicker}
                  </span>
                  <strong>{content.demo.story}</strong>
                  <small>
                    {revealed
                      ? content.demo.statusRevealed
                      : myVote === null
                        ? content.demo.statusWaiting
                        : content.demo.statusAllVoted}
                  </small>
                </div>
              </PokerTable>
              <p
                className="pt-home__selection"
                data-testid="demo-selection"
                aria-live="polite"
              >
                {selectionText}
              </p>
              <Deck currentVote={myVote} onSelect={handleSelect} lang={lang} />
              {!revealed ? (
                <div className="pt-home__demo-action">
                  <Button
                    type="button"
                    data-testid="demo-reveal"
                    disabled={myVote === null}
                    onClick={handleReveal}
                    aria-label={
                      myVote === null
                        ? content.demo.revealAriaEmpty
                        : content.demo.reveal
                    }
                  >
                    <EyeIcon aria-hidden="true" /> {content.demo.reveal}
                  </Button>
                  <span data-testid="demo-reveal-hint" aria-live="polite">
                    {myVote === null
                      ? content.demo.hintEmpty
                      : content.demo.hintReady}
                  </span>
                </div>
              ) : (
                <div className="pt-home__results">
                  <p
                    data-testid="demo-revealed"
                    className="pt-home__revealed-label"
                  >
                    <CheckIcon aria-hidden="true" /> {content.demo.revealed}
                  </p>
                  <ul
                    className="pt-home__vote-list"
                    aria-label={content.demo.votesAria}
                    data-testid="demo-votes"
                  >
                    <li data-testid="demo-vote-voce">
                      {content.demo.you} {myVote}
                    </li>
                    {SIMULATED_TEAM.map((mate) => (
                      <li
                        key={mate.nick}
                        data-testid={`demo-vote-${mate.nick.toLowerCase()}`}
                      >
                        {mate.nick} {mate.vote}
                      </li>
                    ))}
                  </ul>
                  <output
                    aria-live="polite"
                    aria-label={resultsAriaLabel}
                    data-testid="stats-pill"
                    data-stats-unanimous={isUnanimousSignal ? "true" : "false"}
                    className="pt-home__stats"
                  >
                    <div className="pt-home__stat-primary">
                      {isUnanimousSignal ? (
                        <span data-testid="stats-unanimous-badge">
                          {content.demo.statsUnanimous}
                        </span>
                      ) : (
                        <small data-testid="stats-eyebrow">
                          {noNumerics
                            ? content.demo.statsNoNumerics
                            : isSingleNumeric
                              ? content.demo.statsSingle
                              : content.demo.statsMedian}
                        </small>
                      )}
                      <strong data-testid="stats-result-value">
                        {formatMedian(consensus.median)}
                      </strong>
                    </div>
                    <details className="pt-home__stat-detail">
                      <summary>{content.demo.statsDetails}</summary>
                      <span data-testid="stats-caption">
                        {content.demo.captionMean}{" "}
                        <b data-testid="stats-mean-value">
                          {formatMean(consensus.mean)}
                        </b>{" "}
                        · {content.demo.captionRange}{" "}
                        <b data-testid="stats-range-value">
                          {formatRange(consensus.range)}
                        </b>
                      </span>
                      {voteGroups.length > 0 && (
                        <span
                          data-testid="stats-distribution"
                          className="pt-home__distribution"
                        >
                          {voteGroups.map((group) => (
                            <span
                              key={group.value}
                              data-testid={`stats-pip-${group.value}`}
                              title={content.demo.pipTitle(
                                group.count,
                                group.value,
                              )}
                            >
                              {group.count}×{group.value}
                            </span>
                          ))}
                        </span>
                      )}
                    </details>
                  </output>
                  {noNumerics && (
                    <p
                      data-testid="stats-no-numerics"
                      className="pt-home__no-numerics"
                    >
                      {content.demo.noNumerics}
                    </p>
                  )}
                  <div className="pt-home__results-actions">
                    <Button
                      type="button"
                      data-testid="demo-create"
                      render={<Link to="/join" />}
                    >
                      {content.demo.createWithTeam}{" "}
                      <ArrowRightIcon aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      data-testid="demo-retry"
                      onClick={handleRetry}
                    >
                      <RotateCcwIcon aria-hidden="true" /> {content.demo.retry}
                    </Button>
                  </div>
                </div>
              )}
            </CardPanel>
          </Card>
        </section>
        <section className="pt-home__how" id="como-funciona">
          <div className="pt-home__section-intro pt-home__section-intro--how">
            <div>
              <h2>{content.how.title}</h2>
            </div>
          </div>
          <ol className="pt-home__steps" role="list">
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
          <Button
            size="xl"
            className="pt-home__closing-action"
            data-testid="home-cta-create-bottom"
            render={<Link to="/join" />}
          >
            {content.how.cta} <ArrowRightIcon aria-hidden="true" />
          </Button>
        </section>
      </div>
    </div>
  );
}
