import { ArrowRightIcon, CheckIcon, EyeIcon, RotateCcwIcon } from "lucide-react";
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Deck } from "@/components/deck";
import { PokerTable } from "@/components/poker-table";
import { Button } from "@/components/ui/button";
import { formatMean, formatMedian, formatRange } from "@/lib/deck";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useConsensusStats, voteSelectionText } from "@/lib/stats";
import type { Vote } from "@planning-poker/shared";
import { HOME_CONTENT } from "@/pages/home-content";
import "./round-demo.css";

const SIMULATED_TEAM: ReadonlyArray<{ nick: string; vote: Vote }> = [
	{ nick: "Bia", vote: "5" },
	{ nick: "Caio", vote: "8" },
	{ nick: "Dani", vote: "5" },
];

export interface RoundDemoProps {
	lang?: Lang;
	className?: string;
	id?: string;
	"data-testid"?: string;
	/**
	 * `false` esconde o CTA pós-reveal — as landings não abrem um segundo
	 * caminho de conversão.
	 */
	showCreate?: boolean;
}

/**
 * Rodada local reutilizável da home/landings (issue #10): seleção de carta,
 * voto oculto, reveal, estatísticas e reset — 100% local, sem WebSocket e
 * sem tocar o backend. Reutiliza os componentes de domínio reais
 * (`PokerTable`, `Deck`) e o conteúdo localizado de `home-content`.
 */
export function RoundDemo({
	lang = "pt-BR",
	className,
	id,
	"data-testid": testId,
	showCreate = true,
}: RoundDemoProps): React.ReactElement {
	const content = HOME_CONTENT[lang];
	const titleId = useId();
	const [myVote, setMyVote] = useState<Vote | null>(null);
	const [revealed, setRevealed] = useState(false);
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
			nick: content.demo.you,
			seatIndex: 0,
			hasVoted: myVote !== null,
			value: revealed ? myVote : null,
			status: "connected" as const,
		},
		...SIMULATED_TEAM.map((member, index) => ({
			id: member.nick.toLowerCase(),
			nick: member.nick,
			seatIndex: index + 1,
			hasVoted: true,
			value: revealed ? member.vote : null,
			status: "connected" as const,
		})),
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
		<section
			className={cn("round-demo", className)}
			id={id}
			data-testid={testId}
			tabIndex={-1}
			data-revealed={revealed ? "true" : "false"}
			aria-labelledby={titleId}
		>
			<h2 id={titleId} className="sr-only">
				{content.demo.titleLead} {content.demo.titleEnd}
			</h2>
			<p className="round-demo__caption">{content.demo.intro}</p>
			<PokerTable
				seats={seats}
				playerId="you"
				revealed={revealed}
				compact
				lang={lang}
			>
				<div className="round-demo__story">
					<span className="round-demo__kicker">{content.demo.kicker}</span>
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
				className="round-demo__selection"
				data-testid="demo-selection"
				aria-live="polite"
			>
				{selectionText}
			</p>
			<Deck currentVote={myVote} onSelect={handleSelect} lang={lang} />
			{!revealed ? (
				<div className="round-demo__action">
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
				<div className="round-demo__results">
					<p
						data-testid="demo-revealed"
						className="round-demo__revealed-label"
					>
						<CheckIcon aria-hidden="true" /> {content.demo.revealed}
					</p>
					<ul
						className="round-demo__vote-list"
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
						className="round-demo__stats"
					>
						<div className="round-demo__stat-primary">
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
						<details className="round-demo__stat-detail">
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
									className="round-demo__distribution"
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
							className="round-demo__no-numerics"
						>
							{content.demo.noNumerics}
						</p>
					)}
					<div className="round-demo__results-actions">
						{showCreate && (
							<Button
								type="button"
								data-testid="demo-create"
								render={<Link to="/join" />}
							>
								{content.demo.createWithTeam}{" "}
								<ArrowRightIcon aria-hidden="true" />
							</Button>
						)}
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
		</section>
	);
}
