import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  GUIDE_CONTENT,
  GUIDE_HUB,
  type GuideBlock,
  type GuideCopy,
  type GuideHubCopy,
} from "@/pages/guide-content";
import "./guide.css";

const RICH_TEXT = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Converte `[rótulo](/rota)` em link interno; o resto vira texto. */
function richText(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(RICH_TEXT)) {
    const index = match.index ?? 0;
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index));
    nodes.push(
      <Link key={`${index}-${match[2]}`} to={match[2]}>
        {match[1]}
      </Link>,
    );
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function GuideBlockView({ block }: { block: GuideBlock }): React.ReactElement {
  switch (block.type) {
    case "p":
      return <p>{richText(block.text)}</p>;
    case "steps":
      return (
        <ol className="pt-guide__steps" role="list">
          {block.items.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong> {richText(item.body)}
            </li>
          ))}
        </ol>
      );
    case "list":
      return (
        <ul className="pt-guide__list" role="list">
          {block.items.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong> {richText(item.body)}
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="pt-guide__table-wrap">
          <table className="pt-guide__table">
            <thead>
              <tr>
                {block.headers.map((header) => (
                  <th key={header} scope="col">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join("|")}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${cellIndex}-${cell}`}>{richText(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "callout":
      return (
        <aside className="pt-guide__callout" aria-label={block.label}>
          <p className="pt-guide__callout-label">{block.label}</p>
          <p>{richText(block.text)}</p>
        </aside>
      );
  }
}

export function GuidePage({
  content,
}: {
  content: GuideCopy;
}): React.ReactElement {
  return (
    <div className="pt-guide">
      <article className="pt-guide__article" data-testid="guide-article">
        <nav className="pt-guide__back">
          <Link to={content.back.to}>
            <ArrowLeftIcon aria-hidden="true" /> {content.back.label}
          </Link>
        </nav>

        <header className="pt-guide__header">
          <h1>{content.h1}</h1>
          <p className="pt-guide__lede">{content.lede}</p>
          <p className="pt-guide__meta">{content.meta}</p>
        </header>

        <nav className="pt-guide__toc" aria-label={content.tocLabel}>
          <p className="pt-guide__toc-title">{content.tocLabel}</p>
          <ol>
            {content.sections.map((section, index) => (
              <li key={section.id}>
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        {content.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="pt-guide__section"
            aria-labelledby={`${section.id}-title`}
          >
            <h2 id={`${section.id}-title`}>{section.title}</h2>
            {section.blocks.length === 0 ? (
              <dl className="pt-guide__faq" data-testid="guide-faq">
                {content.faq.items.map((item) => (
                  <div key={item.question}>
                    <dt>{item.question}</dt>
                    <dd>{item.answer}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              section.blocks.map((block, blockIndex) => (
                <GuideBlockView key={blockIndex} block={block} />
              ))
            )}
          </section>
        ))}

        <section className="pt-guide__closing">
          <h2>{content.closing.title}</h2>
          <p>{content.closing.body}</p>
          <Button size="xl" render={<Link to="/join" />}>
            {content.closing.cta} <ArrowRightIcon aria-hidden="true" />
          </Button>
          <p className="pt-guide__related">
            {content.closing.relatedLabel}:{" "}
            {content.closing.related.map((link, index) => (
              <span key={link.to}>
                {index > 0 && " · "}
                <Link to={link.to}>{link.label}</Link>
              </span>
            ))}
          </p>
        </section>
      </article>
    </div>
  );
}

export function GuideHubPage({
  content,
}: {
  content: GuideHubCopy;
}): React.ReactElement {
  return (
    <div className="pt-guides-hub">
      <header className="pt-guides-hub__header">
        <p className="pt-guides-hub__kicker">{content.kicker}</p>
        <h1>{content.h1}</h1>
        <p className="pt-guides-hub__lede">{content.lede}</p>
      </header>

      <ul className="pt-guides-hub__list" role="list">
        {content.cards.map((guide) => (
          <li key={guide.to}>
            <Card className="pt-guides-hub__card" render={<Link to={guide.to} />}>
              <CardHeader>
                <p className="pt-guides-hub__meta">{guide.readingTime}</p>
                <CardTitle render={<h2 />}>{guide.title}</CardTitle>
                <CardDescription>{guide.description}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>

      <section className="pt-guides-hub__closing">
        <h2>{content.closing.title}</h2>
        <p>{content.closing.body}</p>
        <Button size="xl" render={<Link to="/join" />}>
          {content.closing.cta} <ArrowRightIcon aria-hidden="true" />
        </Button>
      </section>
    </div>
  );
}

export function GuidesHubPtPage(): React.ReactElement {
  return <GuideHubPage content={GUIDE_HUB["pt-BR"]} />;
}

export function GuidesHubEnPage(): React.ReactElement {
  return <GuideHubPage content={GUIDE_HUB.en} />;
}

export function HowToPlayPtPage(): React.ReactElement {
  return <GuidePage content={GUIDE_CONTENT["pt-BR"]["como-jogar"]} />;
}

export function HowToPlayEnPage(): React.ReactElement {
  return <GuidePage content={GUIDE_CONTENT.en["how-to-play"]} />;
}

export function WhatIsPtPage(): React.ReactElement {
  return <GuidePage content={GUIDE_CONTENT["pt-BR"]["o-que-e"]} />;
}

export function WhatIsEnPage(): React.ReactElement {
  return <GuidePage content={GUIDE_CONTENT.en["what-is"]} />;
}

export function StoryPointsPtPage(): React.ReactElement {
  return <GuidePage content={GUIDE_CONTENT["pt-BR"]["story-points"]} />;
}

export function StoryPointsEnPage(): React.ReactElement {
  return <GuidePage content={GUIDE_CONTENT.en["story-points"]} />;
}
