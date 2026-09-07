
import type * as React from "react";
import { cn } from "./utils";

type PaddingSize = "sm" | "md" | "lg";

const PAD_CLASSES: Record<PaddingSize, string> = {
	sm: "p-4",
	md: "p-7",
	lg: "p-10",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	
	padding?: PaddingSize;
	
	noNoise?: boolean;
	ref?: React.Ref<HTMLDivElement>;
}


export function Card({
	className,
	padding = "md",
	noNoise = false,
	children,
	ref,
	...props
}: CardProps) {
	return (
		<div
			ref={ref}
			data-testid="card-root"
			className={cn(
				"pointly-card bg-surface rounded-card shadow-card border border-ink/5 relative",
				!noNoise && "surface-noise",
				PAD_CLASSES[padding],
				className,
			)}
			{...props}
		>
			
			<div className="relative z-10">{children}</div>
		</div>
	);
}


export function CardHeader({
	className,
	ref,
	...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
	return (
		<div
			ref={ref}
			className={cn("flex flex-col gap-2 mb-5", className)}
			{...props}
		/>
	);
}


export function CardBody({
	className,
	ref,
	...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
	return (
		<div
			ref={ref}
			className={cn("flex flex-col gap-4", className)}
			{...props}
		/>
	);
}


export function CardFooter({
	className,
	ref,
	...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
	return (
		<div
			ref={ref}
			className={cn("flex items-center gap-3 mt-6", className)}
			{...props}
		/>
	);
}
