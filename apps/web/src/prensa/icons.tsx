import type * as React from "react";

/**
 * Prensa — F0.3: set de ícones de tinta.
 *
 * Desenhados do zero para a direção "Prensa" (oficina gráfica: papel, tinta,
 * UMA cor de sinal). NÃO derivam do lucide nem de nenhum asset antigo.
 *
 * Contrato do set:
 * - grid 24 (`viewBox="0 0 24 24"`), traço único e consistente de 1.75px;
 * - cantos retos (`strokeLinecap="square"`, `strokeLinejoin="miter"`);
 * - `currentColor` (herdam a cor do texto); sem `fill` exceto em pontos
 *   maciços de dado/alerta (pequenos `rect` com `fill="currentColor"`).
 */

export type PrensaIconProps = React.SVGProps<SVGSVGElement> & {
	/** Largura/altura em px (quadrado). Padrão 24 (grid). */
	size?: number;
};

const STROKE = 1.75;

function Base({
	size = 24,
	children,
	...props
}: PrensaIconProps): React.ReactElement {
	const labelled = Boolean(
		props["aria-label"] || props["aria-labelledby"],
	);
	return (
		<svg
			{...props}
			aria-hidden={props["aria-hidden"] ?? (labelled ? undefined : true)}
			fill="none"
			focusable="false"
			height={props.height ?? size}
			stroke="currentColor"
			strokeLinecap="square"
			strokeLinejoin="miter"
			strokeWidth={STROKE}
			viewBox="0 0 24 24"
			width={props.width ?? size}
			xmlns="http://www.w3.org/2000/svg"
		>
			{children}
		</svg>
	);
}

function Dot({
	x,
	y,
	s = 2,
}: {
	x: number;
	y: number;
	s?: number;
}): React.ReactElement {
	return (
		<rect
			fill="currentColor"
			height={s}
			stroke="none"
			width={s}
			x={x}
			y={y}
		/>
	);
}

export function ArrowUpIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M12 19V5" />
			<path d="M6 11l6-6 6 6" />
		</Base>
	);
}

export function ArrowDownIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M12 5v14" />
			<path d="M6 13l6 6 6-6" />
		</Base>
	);
}

export function ArrowLeftIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M19 12H5" />
			<path d="M11 6l-6 6 6 6" />
		</Base>
	);
}

export function ArrowRightIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M5 12h14" />
			<path d="M13 6l6 6-6 6" />
		</Base>
	);
}

export function CheckIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M4.5 12.5l5 5L19.5 6.5" />
		</Base>
	);
}

export function ChevronDownIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M6 9.5l6 6 6-6" />
		</Base>
	);
}

export function ChevronRightIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M9.5 6l6 6-6 6" />
		</Base>
	);
}

/** Alerta em bloco de prensa: moldura quadrada + barra + ponto maciço. */
export function CircleAlertIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<rect height="14" width="14" x="5" y="5" />
			<path d="M12 8.5v5" />
			<Dot s={2} x={11} y={16} />
		</Base>
	);
}

export function ClipboardListIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<rect height="16" width="12" x="6" y="4.5" />
			<rect height="4" width="6" x="9" y="2.5" />
			<path d="M9 11h6" />
			<path d="M9 14.2h6" />
			<path d="M9 17.4h4" />
		</Base>
	);
}

/** Pausa = xícara de oficina (corpo + alça + pires). */
export function CoffeeIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M5 9h11v6.5H5z" />
			<path d="M16 10h2.5v4.5H16" />
			<path d="M6.5 19.5h9" />
		</Base>
	);
}

export function CopyIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M5 15V4h11" />
			<rect height="11" width="11" x="9" y="9" />
		</Base>
	);
}

export function CrownIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M4 17V8l4 3.5L12 5l4 6.5L20 8v9H4z" />
			<path d="M4 20.5h16" />
		</Base>
	);
}

/** Dados de mesa: dois blocos + pontos maciços. */
export function DicesIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<rect height="11" width="11" x="3.5" y="3.5" />
			<rect height="7.5" width="7.5" x="13" y="13" />
			<Dot s={1.8} x={6} y={6} />
			<Dot s={1.8} x={10} y={10} />
			<Dot s={1.8} x={15.6} y={15.6} />
		</Base>
	);
}

/** Olho angular (losango + pupila quadrada). */
export function EyeIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M2.5 12L12 5.5 21.5 12 12 18.5Z" />
			<rect height="4" width="4" x="10" y="10" />
		</Base>
	);
}

export function EyeOffIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M2.5 12L12 5.5 21.5 12 12 18.5Z" />
			<rect height="4" width="4" x="10" y="10" />
			<path d="M4 20L20 4" />
		</Base>
	);
}

export function ImagePlusIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<rect height="12" width="14" x="3" y="5" />
			<path d="M3 15.5l4.5-4.5 3 3 2-2 4.5 4.5" />
			<Dot s={2} x={6} y={8} />
			<path d="M18 14v7" />
			<path d="M14.5 17.5h7" />
		</Base>
	);
}

export function ListChecksIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M2.5 6.5l1.5 1.5 3-3" />
			<path d="M2.5 12.5l1.5 1.5 3-3" />
			<path d="M2.5 18.5l1.5 1.5 3-3" />
			<path d="M10 6.5h10" />
			<path d="M10 12.5h10" />
			<path d="M10 18.5h10" />
		</Base>
	);
}

/** Carregamento: 8 marcas de registro ao redor do centro (gira no spinner). */
export function Loader2Icon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M12 3v3.5" />
			<path d="M12 17.5V21" />
			<path d="M21 12h-3.5" />
			<path d="M3 12h3.5" />
			<path d="M19 5l-2.5 2.5" />
			<path d="M5 19l2.5-2.5" />
			<path d="M5 5l2.5 2.5" />
			<path d="M19 19l-2.5-2.5" />
		</Base>
	);
}

export function LogOutIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M14 4h6v16h-6" />
			<path d="M10 12H3" />
			<path d="M7 7l-4 5 4 5" />
		</Base>
	);
}

export function MinusIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M5 12h14" />
		</Base>
	);
}

export function MoonIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z" />
		</Base>
	);
}

export function PencilIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M4 20l1-4L16.5 4.5l3 3L8 19l-4 1z" />
			<path d="M14 7l3 3" />
		</Base>
	);
}

export function PlusIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M12 5v14" />
			<path d="M5 12h14" />
		</Base>
	);
}

export function RotateCcwIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M20 12a8 8 0 1 1-2.6-5.9" />
			<path d="M17.5 3.5v4h-4" />
		</Base>
	);
}

/** Sol de prova: bloco central + 8 raios retos. */
export function SunIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<rect height="6" width="6" x="9" y="9" />
			<path d="M12 2.5V6" />
			<path d="M12 18v3.5" />
			<path d="M21.5 12H18" />
			<path d="M2.5 12H6" />
			<path d="M19 5l-2 2" />
			<path d="M5 19l2-2" />
			<path d="M5 5l2 2" />
			<path d="M19 19l-2-2" />
		</Base>
	);
}

export function Trash2Icon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M4 6.5h16" />
			<path d="M9.5 6.5V4h5v2.5" />
			<path d="M6.5 6.5l1 14h9l1-14" />
			<path d="M10 10.5v6" />
			<path d="M14 10.5v6" />
		</Base>
	);
}

/** Pessoa em bloco (cabeça + corpo em retas). */
export function UserRoundIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<rect height="6" width="6" x="9" y="3.5" />
			<path d="M5 15h14v5.5H5z" />
		</Base>
	);
}

export function UsersIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<rect height="5" width="5" x="7" y="4" />
			<path d="M3.5 20v-2.5h12V20" />
			<rect height="4" width="4" x="15.5" y="5.5" />
			<path d="M16 12.5h4.5V15" />
		</Base>
	);
}

/** Voto = urna com fenda + marca de escolha. */
export function VoteIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<rect height="10" width="16" x="4" y="10" />
			<path d="M8 10V7h8v3" />
			<path d="M8.5 15l2.5 2.5 5-5.5" />
		</Base>
	);
}

export function XIcon(props: PrensaIconProps): React.ReactElement {
	return (
		<Base {...props}>
			<path d="M6 6l12 12" />
			<path d="M18 6L6 18" />
		</Base>
	);
}

/** Inventário estável do set (30 nomes; cobre todo o uso via lucide hoje). */
export const PRENSA_ICON_NAMES = [
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"Check",
	"ChevronDown",
	"ChevronRight",
	"CircleAlert",
	"ClipboardList",
	"Coffee",
	"Copy",
	"Crown",
	"Dices",
	"Eye",
	"EyeOff",
	"ImagePlus",
	"ListChecks",
	"Loader2",
	"LogOut",
	"Minus",
	"Moon",
	"Pencil",
	"Plus",
	"RotateCcw",
	"Sun",
	"Trash2",
	"UserRound",
	"Users",
	"Vote",
	"X",
] as const;

export type PrensaIconName = (typeof PRENSA_ICON_NAMES)[number];

export const PRENSA_ICONS: Record<PrensaIconName, (p: PrensaIconProps) => React.ReactElement> = {
	ArrowUp: ArrowUpIcon,
	ArrowDown: ArrowDownIcon,
	ArrowLeft: ArrowLeftIcon,
	ArrowRight: ArrowRightIcon,
	Check: CheckIcon,
	ChevronDown: ChevronDownIcon,
	ChevronRight: ChevronRightIcon,
	CircleAlert: CircleAlertIcon,
	ClipboardList: ClipboardListIcon,
	Coffee: CoffeeIcon,
	Copy: CopyIcon,
	Crown: CrownIcon,
	Dices: DicesIcon,
	Eye: EyeIcon,
	EyeOff: EyeOffIcon,
	ImagePlus: ImagePlusIcon,
	ListChecks: ListChecksIcon,
	Loader2: Loader2Icon,
	LogOut: LogOutIcon,
	Minus: MinusIcon,
	Moon: MoonIcon,
	Pencil: PencilIcon,
	Plus: PlusIcon,
	RotateCcw: RotateCcwIcon,
	Sun: SunIcon,
	Trash2: Trash2Icon,
	UserRound: UserRoundIcon,
	Users: UsersIcon,
	Vote: VoteIcon,
	X: XIcon,
};

/** Acesso genérico pelo nome (para tabelas e testes). */
export function PrensaIcon({
	name,
	...props
}: PrensaIconProps & { name: PrensaIconName }): React.ReactElement {
	const Cmp = PRENSA_ICONS[name];
	return <Cmp data-icon={name} data-slot="prensa-icon" {...props} />;
}
