import { useEffect, useId, useRef, useState } from "react";
import { PROJECTILE_CATALOG } from "@/lib/projectiles";
import type { ProjectileType } from "@/lib/protocol";
import { ProjectileIcon } from "./projectile-flight";
import "./projectile-menu.css";

// Painel próprio em vez do coss Menu: o Menu (Base UI + floating-ui)
// trava o loop do bun test neste ambiente jsdom, e um painel adjacente
// ao assento não precisa de portal nem flip de viewport.
export function ProjectileMenu({ target, cooldownSecs, onThrow, className, children, align = "center", side = "top" }: {
	target: { id: string; nick: string };
	cooldownSecs: number;
	onThrow: (targetId: string, type: ProjectileType) => void;
	className: string;
	children: React.ReactNode;
	align?: "left" | "center" | "right";
	side?: "top" | "bottom";
}): React.ReactElement {
	const [open, setOpen] = useState(false);
	const wrapRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const menuId = useId();
	const touchOnly = () =>
		typeof window !== "undefined" &&
		typeof window.matchMedia === "function" &&
		window.matchMedia("(hover: none)").matches;

	useEffect(() => {
		if (!open) return;
		const onPointer = (event: PointerEvent) => {
			if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
		};
		document.addEventListener("pointerdown", onPointer);
		return () => document.removeEventListener("pointerdown", onPointer);
	}, [open ]);

	function focusItem(delta: number): void {
		const items = Array.from(
			wrapRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
		);
		if (items.length === 0) return;
		const active = document.activeElement as HTMLElement | null;
		const index = active ? items.indexOf(active) : -1;
		const next = items[(index + delta + items.length) % items.length];
		next?.focus();
	}

	function onKeyDown(event: React.KeyboardEvent): void {
		if (event.key === "Escape") {
			if (open) {
				event.preventDefault();
				setOpen(false);
				triggerRef.current?.focus();
			}
			return;
		}
		if (!open) return;
		if (event.key === "ArrowDown") {
			event.preventDefault();
			focusItem(1);
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			focusItem(-1);
		} else if (event.key === "Home") {
			event.preventDefault();
			wrapRef.current
				?.querySelector<HTMLElement>('[role="menuitem"]')
				?.focus();
		} else if (event.key === "End") {
			event.preventDefault();
			const items = wrapRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
			if (items && items.length > 0) items[items.length - 1]?.focus();
		}
	}

	return (
		<div
			ref={wrapRef}
			className="projectile-menu-wrap"
			onMouseEnter={() => {
				if (!touchOnly()) setOpen(true);
			}}
			onMouseLeave={() => {
				if (!touchOnly()) setOpen(false);
			}}
			onKeyDown={onKeyDown}
		>
			<button
				ref={triggerRef}
				type="button"
				className={className}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-controls={menuId}
				aria-label={`Arremessar em ${target.nick}`}
				onClick={() => {
					if (touchOnly()) setOpen((value) => !value);
					else setOpen(true);
				}}
			>
				{children}
			</button>
			{open ? (
				<div
					role="menu"
					id={menuId}
					aria-label={`Arremessar em ${target.nick}`}
					data-align={align}
					data-side={side}
					className="projectile-menu"
				>
					<p className="projectile-menu-heading">Arremessar em {target.nick}</p>
					<p className="projectile-menu-status" aria-live="polite" data-testid="projectile-cooldown">
						{cooldownSecs > 0 ? `Recarregando · ${cooldownSecs}s` : "Escolha um projétil"}
					</p>
					{PROJECTILE_CATALOG.map(({ type, label }) => (
						<button
							key={type}
							type="button"
							role="menuitem"
							data-testid={`projectile-${type}`}
							aria-label={`${label} em ${target.nick}`}
							disabled={cooldownSecs > 0}
							onClick={() => {
								onThrow(target.id, type);
								setOpen(false);
							}}
							className="projectile-menu-item"
						>
							<ProjectileIcon type={type} />
							{label}
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}
