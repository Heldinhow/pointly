/** Four pieces coming together: the shared-table identity. */
export function Brand({ className = "" }: { className?: string }) {
	return (
		<span className={`pointly-brand ${className}`}>
			<span className="pointly-mark" aria-hidden="true"><i /><i /><i /><i /></span>
			<span>pointly</span>
		</span>
	);
}
