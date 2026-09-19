import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { Separator } from "@/components/ui/separator";
import { NUDGE_CATALOG } from "@/lib/nudges";
import { PROJECTILE_CATALOG } from "@/lib/projectiles";
import type { NudgeId, ProjectileType } from "@/lib/protocol";
import { ProjectileIcon } from "./projectile-flight";
import "./projectile-menu.css";

export function ProjectileMenu({ target, cooldownSecs, onThrow, onNudge, className, children, align = "center", side = "top" }: {
	target: { id: string; nick: string };
	cooldownSecs: number;
	onThrow: (targetId: string, type: ProjectileType) => void;
	onNudge?: (targetId: string, nudgeId: NudgeId) => void;
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
					aria-label={`Interagir com ${target.nick}`}
					openOnHover
				>
					{children}
				</MenuTrigger>
				<MenuPopup
					aria-label={`Interagir com ${target.nick}`}
					align={align === "left" ? "start" : align === "right" ? "end" : "center"}
					side={side}
					sideOffset={side === "top" ? 8 : 6}
					className="projectile-menu"
				>
					<p className="projectile-menu-heading">Arremessar em {target.nick}</p>
					<p className="projectile-menu-status" data-testid="projectile-cooldown">
						{cooldownSecs > 0 ? `Recarregando · ${cooldownSecs}s` : "Escolha um projétil"}
					</p>
					{PROJECTILE_CATALOG.map(({ type, label, epic }) => (
						<MenuItem
							key={type}
							data-testid={`projectile-${type}`}
							aria-label={`${label} em ${target.nick}`}
							disabled={cooldownSecs > 0}
							onClick={() => onThrow(target.id, type)}
							className={epic ? "projectile-menu-item projectile-menu-item--epic" : "projectile-menu-item"}
						>
							<ProjectileIcon type={type} />
							<span className="projectile-menu-label">{label}</span>
							{epic ? <span className="projectile-menu-epic">épica</span> : null}
						</MenuItem>
					))}
					{onNudge ? (
						<>
							<Separator className="projectile-menu-divider" />
							<p className="projectile-menu-heading">Cutucar {target.nick}</p>
							<div className="projectile-menu-nudges">
								{NUDGE_CATALOG.map(({ id, label }) => (
									<MenuItem
										key={id}
										data-testid={`nudge-${id}`}
										aria-label={`Cutucar ${target.nick} com ${label}`}
										disabled={cooldownSecs > 0}
										onClick={() => onNudge(target.id, id)}
										className="projectile-menu-item projectile-menu-item--nudge"
									>
										<span className="projectile-menu-label">{label}</span>
									</MenuItem>
								))}
							</div>
						</>
					) : null}
				</MenuPopup>
			</Menu>
		</div>
	);
}
