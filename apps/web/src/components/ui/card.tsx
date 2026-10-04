"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type React from "react";
import { cn } from "@/lib/utils";

/**
 * Prensa — F0.4: cartão (folha de papel).
 *
 * API estável (mesmos exports, `render`, `data-slot`). Superfície
 * `--surface`, tinta `--ink`, régua `--line`, raio `--radius-md`, recorte duro
 * `--shadow-cut`. Sem blur/gradiente/pílula/glow; títulos em Archivo.
 */
export function Card({
	className,
	render,
	...props
}: useRender.ComponentProps<"div">): React.ReactElement {
	const defaultProps = {
		className: cn(
			"relative flex flex-col rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-cut)]",
			className,
		),
		"data-slot": "card",
	};

	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(defaultProps, props),
		render,
	});
}

export function CardFrame({
	className,
	render,
	...props
}: useRender.ComponentProps<"div">): React.ReactElement {
	const defaultProps = {
		className: cn(
			"relative flex flex-col rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-cut)] [--clip-bottom:-1rem] [--clip-top:-1rem] has-data-[slot=table-container]:overflow-hidden *:data-[slot=table-container]:-m-px *:data-[slot=table-container]:w-[calc(100%+2px)] *:data-[slot=card]:-m-px *:data-[slot=card]:rounded-none *:data-[slot=card]:border-[var(--line)] *:data-[slot=card]:shadow-none *:data-[slot=card]:[clip-path:inset(var(--clip-top)_1px_var(--clip-bottom)_1px)] *:data-[slot=card]:last:[--clip-bottom:1px] *:data-[slot=card]:first:[--clip-top:1px]",
			className,
		),
		"data-slot": "card-frame",
	};

	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(defaultProps, props),
		render,
	});
}

export function CardFrameHeader({
	className,
	render,
	...props
}: useRender.ComponentProps<"div">): React.ReactElement {
	const defaultProps = {
		className: cn(
			"relative flex grid auto-rows-min grid-rows-[auto_auto] flex-col items-start gap-x-4 border-b border-[var(--line)] px-6 py-4 has-data-[slot=card-frame-action]:grid-cols-[1fr_auto]",
			className,
		),
		"data-slot": "card-frame-header",
	};

	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(defaultProps, props),
		render,
	});
}

export function CardFrameTitle({
	className,
	render,
	...props
}: useRender.ComponentProps<"div">): React.ReactElement {
	const defaultProps = {
		className: cn(
			"font-[var(--font-display)] self-center font-semibold text-sm text-[var(--ink)]",
			className,
		),
		"data-slot": "card-frame-title",
	};

	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(defaultProps, props),
		render,
	});
}

export function CardFrameDescription({
	className,
	render,
	...props
}: useRender.ComponentProps<"div">): React.ReactElement {
	const defaultProps = {
		className: cn(
			"self-center text-[var(--ink-muted)] text-sm",
			className,
		),
		"data-slot": "card-frame-description",
	};

	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(defaultProps, props),
		render,
	});
}

export function CardFrameAction({
	className,
	render,
	...props
}: useRender.ComponentProps<"div">): React.ReactElement {
	const defaultProps = {
		className: cn(
			"col-start-2 nth-3:row-span-2 nth-3:row-start-1 inline-flex self-center justify-self-end",
			className,
		),
		"data-slot": "card-frame-action",
	};

	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(defaultProps, props),
		render,
	});
}

export function CardFrameFooter({
	className,
	render,
	...props
}: useRender.ComponentProps<"div">): React.ReactElement {
	const defaultProps = {
		className: cn(
			"border-t border-[var(--line)] px-6 py-4",
			className,
		),
		"data-slot": "card-frame-footer",
	};

	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(defaultProps, props),
		render,
	});
}

export function CardHeader({
	className,
	render,
	...props
}: useRender.ComponentProps<"div">): React.ReactElement {
	const defaultProps = {
		className: cn(
			"grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 p-6 in-[[data-slot=card]:has(>[data-slot=card-panel])]:pb-4 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
			className,
		),
		"data-slot": "card-header",
	};

	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(defaultProps, props),
		render,
	});
}

export function CardTitle({
	className,
	render,
	...props
}: useRender.ComponentProps<"div">): React.ReactElement {
	const defaultProps = {
		className: cn(
			"font-[var(--font-display)] font-semibold text-lg leading-none tracking-[-0.01em] text-[var(--ink)]",
			className,
		),
		"data-slot": "card-title",
	};

	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(defaultProps, props),
		render,
	});
}

export function CardDescription({
	className,
	render,
	...props
}: useRender.ComponentProps<"div">): React.ReactElement {
	const defaultProps = {
		className: cn("text-[var(--ink-muted)] text-sm", className),
		"data-slot": "card-description",
	};

	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(defaultProps, props),
		render,
	});
}

export function CardAction({
	className,
	render,
	...props
}: useRender.ComponentProps<"div">): React.ReactElement {
	const defaultProps = {
		className: cn(
			"col-start-2 row-span-2 row-start-1 inline-flex self-start justify-self-end",
			className,
		),
		"data-slot": "card-action",
	};

	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(defaultProps, props),
		render,
	});
}

export function CardPanel({
	className,
	render,
	...props
}: useRender.ComponentProps<"div">): React.ReactElement {
	const defaultProps = {
		className: cn(
			"flex-1 p-6 in-[[data-slot=card]:has(>[data-slot=card-header]:not(.border-b))]:pt-0 in-[[data-slot=card]:has(>[data-slot=card-footer]:not(.border-t))]:pb-0",
			className,
		),
		"data-slot": "card-panel",
	};

	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(defaultProps, props),
		render,
	});
}

export function CardFooter({
	className,
	render,
	...props
}: useRender.ComponentProps<"div">): React.ReactElement {
	const defaultProps = {
		className: cn(
			"flex items-center border-t border-[var(--line)] p-6 in-[[data-slot=card]:has(>[data-slot=card-panel])]:pt-4",
			className,
		),
		"data-slot": "card-footer",
	};

	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(defaultProps, props),
		render,
	});
}

export { CardPanel as CardContent };
