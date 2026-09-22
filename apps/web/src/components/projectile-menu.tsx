import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { Separator } from "@/components/ui/separator";
import type { Lang } from "@/lib/i18n";
import { NUDGE_CATALOG } from "@/lib/nudges";
import { PROJECTILE_CATALOG, PROJECTILE_CHAIR_COOLDOWN_MS } from "@/lib/projectiles";
import type { NudgeId, ProjectileType } from "@planning-poker/shared";
import { ProjectileIcon } from "./projectile-flight";
import "./projectile-menu.css";

type MenuLabels = {
	reloading: (secs: number) => string;
	interactWith: (nick: string) => string;
	throwAt: (nick: string) => string;
	choose: string;
	itemAt: (label: string, nick: string) => string;
	epic: string;
	nudge: (nick: string) => string;
	nudgeWith: (label: string, nick: string) => string;
};

const MENU_LABELS: Record<Lang, MenuLabels> = {
	"pt-BR": {
		reloading: (secs) => `Recarregando · ${secs}s`,
		interactWith: (nick) => `Interagir com ${nick}`,
		throwAt: (nick) => `Arremessar em ${nick}`,
		choose: "Escolha um projétil",
		itemAt: (label, nick) => `${label} em ${nick}`,
		epic: "Épica",
		nudge: (nick) => `Cutucar ${nick}`,
		nudgeWith: (label, nick) => `Cutucar ${nick} com ${label}`,
	},
	en: {
		reloading: (secs) => `Reloading · ${secs}s`,
		interactWith: (nick) => `Interact with ${nick}`,
		throwAt: (nick) => `Throw at ${nick}`,
		choose: "Choose a projectile",
		itemAt: (label, nick) => `${label} at ${nick}`,
		epic: "Epic",
		nudge: (nick) => `Nudge ${nick}`,
		nudgeWith: (label, nick) => `Nudge ${nick} with ${label}`,
	},
};

export function ProjectileMenu({ target, cooldownSecs, onThrow, onNudge, className, children, align = "center", side = "top", lang = "pt-BR" }: {
	target: { id: string; nick: string };
	cooldownSecs: number;
	onThrow: (targetId: string, type: ProjectileType) => void;
	onNudge?: (targetId: string, nudgeId: NudgeId) => void;
	className: string;
	children: React.ReactNode;
	align?: "left" | "center" | "right";
	side?: "top" | "bottom";
	lang?: Lang;
}): React.ReactElement {
	const labels = MENU_LABELS[lang];
	return (
		<div className="projectile-menu-wrap">
			{cooldownSecs > 0 ? (
			<span className="sr-only" role="status">
				{labels.reloading(cooldownSecs)}
			</span>
		) : null}
			<Menu modal={false}>
				<MenuTrigger
					className={className}
					aria-label={labels.interactWith(target.nick)}
					openOnHover
				>
					{children}
				</MenuTrigger>
				<MenuPopup
					aria-label={labels.interactWith(target.nick)}
					align={align === "left" ? "start" : align === "right" ? "end" : "center"}
					side={side}
					sideOffset={side === "top" ? 8 : 6}
					className="projectile-menu"
				>
					<p className="projectile-menu-heading">{labels.throwAt(target.nick)}</p>
					<p className="projectile-menu-status" data-testid="projectile-cooldown">
						{cooldownSecs > 0 ? labels.reloading(cooldownSecs) : labels.choose}
					</p>
					{PROJECTILE_CATALOG.map(({ type, label, epic }) => (
						<MenuItem
							key={type}
							data-testid={`projectile-${type}`}
							aria-label={`${labels.itemAt(label[lang], target.nick)}${epic ? ` · ${labels.epic} · ${PROJECTILE_CHAIR_COOLDOWN_MS / 1000}s` : ""}`}
							disabled={cooldownSecs > 0}
							onClick={() => onThrow(target.id, type)}
							className={epic ? "projectile-menu-item projectile-menu-item--epic" : "projectile-menu-item"}
						>
							<ProjectileIcon type={type} />
							<span className="projectile-menu-label">{label[lang]}</span>
							{epic ? <span className="projectile-menu-epic">{labels.epic} · {PROJECTILE_CHAIR_COOLDOWN_MS / 1000}s</span> : null}
						</MenuItem>
					))}
					{onNudge ? (
						<>
							<Separator className="projectile-menu-divider" />
							<p className="projectile-menu-heading">{labels.nudge(target.nick)}</p>
							<div className="projectile-menu-nudges">
								{NUDGE_CATALOG.map(({ id, label }) => (
									<MenuItem
										key={id}
										data-testid={`nudge-${id}`}
										aria-label={labels.nudgeWith(label[lang], target.nick)}
										disabled={cooldownSecs > 0}
										onClick={() => onNudge(target.id, id)}
										className="projectile-menu-item projectile-menu-item--nudge"
									>
										<span className="projectile-menu-label">{label[lang]}</span>
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
