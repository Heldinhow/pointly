/** Two estimation cards share a compact, theme-aware mark. */
export function Brand({ className = "" }: { className?: string }) {
	return (
		<span className={`pointly-brand ${className}`}>
			<svg
				className="pointly-mark"
				viewBox="0 0 32 32"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				aria-hidden="true"
				focusable="false"
			>
				<g className="pointly-mark-card pointly-mark-back">
					<rect x="6" y="5" width="15" height="22" rx="2.5" />
				</g>
				<g className="pointly-mark-card pointly-mark-front">
					<rect x="12" y="5" width="15" height="22" rx="2.5" fill="var(--bg)" />
					<path d="m19.5 12.5 2.5 3.5-2.5 3.5L17 16Z" strokeLinejoin="round" />
				</g>
			</svg>
			<span>pointly</span>
		</span>
	);
}
