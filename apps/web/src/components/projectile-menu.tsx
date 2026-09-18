import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { PROJECTILE_CATALOG } from "@/lib/projectiles";
import type { ProjectileType } from "@/lib/protocol";
import { ProjectileIcon } from "./projectile-flight";
import "./projectile-menu.css";

export function ProjectileMenu({ target, cooldownSecs, onThrow, className, children, align = "center", side = "top" }: {
	target: { id: string; nick: string };
	cooldownSecs: number;
	onThrow: (targetId: string, type: ProjectileType) => void;
	className: string;
	children: React.ReactNode;
	align?: "left" | "center" | "right";
	side?: "top" | "bottom";
}): React.ReactElement {
	return (
		<div className="projectile-menu-wrap">
			{cooldownSecs > 0 ? (
			<span className="sr-only" role="status">
				Recarregando · {cooldownSecs}s
			</span>
		) : null}
			<Menu modal={false}>
				<MenuTrigger
					className={className}
					aria-label={`Arremessar em ${target.nick}`}
					openOnHover
				>
					{children}
				</MenuTrigger>
				<MenuPopup
					aria-label={`Arremessar em ${target.nick}`}
					align={align === "left" ? "start" : align === "right" ? "end" : "center"}
					side={side}
					sideOffset={side === "top" ? 8 : 6}
					className="projectile-menu"
				>
					<p className="projectile-menu-heading">Arremessar em {target.nick}</p>
					<p className="projectile-menu-status" data-testid="projectile-cooldown">
						{cooldownSecs > 0 ? `Recarregando · ${cooldownSecs}s` : "Escolha um projétil"}
					</p>
					{PROJECTILE_CATALOG.map(({ type, label }) => (
						<MenuItem
							key={type}
							data-testid={`projectile-${type}`}
							aria-label={`${label} em ${target.nick}`}
							disabled={cooldownSecs > 0}
							onClick={() => onThrow(target.id, type)}
							className="projectile-menu-item"
						>
							<ProjectileIcon type={type} />
							{label}
						</MenuItem>
					))}
				</MenuPopup>
			</Menu>
		</div>
	);
}
