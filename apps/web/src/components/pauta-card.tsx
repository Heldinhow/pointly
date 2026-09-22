import {
	ArrowDownIcon,
	ArrowUpIcon,
	ClipboardListIcon,
	ListChecksIcon,
	MinusIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
	VoteIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
	Historia,
	HistoriaAtualId,
	HistoriaId,
	Pauta,
	Phase,
} from "@planning-poker/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardPanel,
	CardTitle,
} from "@/components/ui/card";
import {
	Collapsible,
	CollapsiblePanel,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONFIRM_TIMEOUT_MS } from "@/lib/confirm";
import type { Lang } from "@/lib/i18n";
import { formatPontos, sortPauta } from "@/lib/pauta";
import { cn } from "@/lib/utils";
import { ARENA_CONTENT } from "@/pages/arena-content";
import "./pauta-card.css";

/** Erro visual da pauta: inline no campo (add/edit) ou no alerta do card. */
type PautaError = { scope: "add" | "edit" | "card"; message: string } | null;

export interface PautaCardProps {
	pauta: Pauta | undefined;
	historiaAtualId: HistoriaAtualId | undefined;
	phase: Phase;
	isSpectator: boolean;
	lang?: Lang;
	/** Erro do servidor roteado pela Arena (historia_nao_encontrada, pauta_cheia, invalid_phase, role_denied). */
	serverError?: string | null;
	onAdd: (input: { titulo: string; criterio?: string }) => boolean;
	onUpdate: (
		id: string,
		patch: { titulo?: string; criterio?: string | null },
	) => boolean;
	onMove: (id: string, toIndex: number) => boolean;
	onRemove: (id: string, options?: { confirmScored?: boolean }) => boolean;
	onSelect: (id: HistoriaId | null) => boolean;
}

/**
 * Card Pauta da Arena (#165, parent #160): criar, editar, mover, selecionar
 * e apagar histórias sem sair da sala. Sem drag e sem modal — mover usa
 * ↑↓ por índice; apagar pontuada usa a confirmação dupla padrão (5s, mesmo
 * countdown da Nova Rodada). Números da Pontuação em mono tabular e
 * `aria-live` na lista e no badge. A ativa governa a rodada (deck).
 */
export function PautaCard({
	pauta,
	historiaAtualId,
	phase,
	isSpectator,
	lang = "pt-BR",
	serverError = null,
	onAdd,
	onUpdate,
	onMove,
	onRemove,
	onSelect,
}: PautaCardProps): React.ReactElement {
	const content = ARENA_CONTENT[lang].pauta;
	const historias = sortPauta(pauta);
	const locked = phase === "voting" || phase === "revealable";

	const [novoTitulo, setNovoTitulo] = useState("");
	const [novoCriterio, setNovoCriterio] = useState("");
	const [criterioOpen, setCriterioOpen] = useState(false);
	const [localError, setLocalError] = useState<PautaError>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editTitulo, setEditTitulo] = useState("");
	const [editCriterio, setEditCriterio] = useState("");
	const [editCriterioOpen, setEditCriterioOpen] = useState(false);
	const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(
		null,
	);
	const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const error: PautaError =
		localError ??
		(serverError !== null ? { scope: "card", message: serverError } : null);

	// Timeout e remoção da lista desarmam a confirmação dupla sem trafegar.
	useEffect(() => {
		if (confirmingRemoveId === null) return;
		if (!historias.some((h) => h.id === confirmingRemoveId)) {
			setConfirmingRemoveId(null);
		}
	}, [historias, confirmingRemoveId]);

	useEffect(() => {
		return () => {
			if (removeTimer.current) clearTimeout(removeTimer.current);
		};
	}, []);

	function armRemove(id: string): void {
		setLocalError(null);
		setConfirmingRemoveId(id);
		if (removeTimer.current) clearTimeout(removeTimer.current);
		removeTimer.current = setTimeout(() => {
			removeTimer.current = null;
			setConfirmingRemoveId(null);
		}, CONFIRM_TIMEOUT_MS);
	}

	function disarmRemove(): void {
		if (removeTimer.current) {
			clearTimeout(removeTimer.current);
			removeTimer.current = null;
		}
		setConfirmingRemoveId(null);
	}

	function handleAdd(event: React.FormEvent<HTMLFormElement>): void {
		event.preventDefault();
		const titulo = novoTitulo.trim();
		if (titulo.length === 0) {
			setLocalError({ scope: "add", message: content.emptyTitle });
			return;
		}
		const criterio = novoCriterio.trim();
		setLocalError(null);
		const sent =
			criterio.length > 0 ? onAdd({ titulo, criterio }) : onAdd({ titulo });
		if (!sent) {
			setLocalError({ scope: "add", message: content.error });
			return;
		}
		setNovoTitulo("");
		setNovoCriterio("");
		setCriterioOpen(false);
	}

	function startEdit(historia: Historia): void {
		setLocalError(null);
		setEditingId(historia.id);
		setEditTitulo(historia.titulo);
		setEditCriterio(historia.criterio ?? "");
		setEditCriterioOpen(historia.criterio !== undefined);
	}

	function handleUpdate(historia: Historia): void {
		const titulo = editTitulo.trim();
		if (titulo.length === 0) {
			setLocalError({ scope: "edit", message: content.emptyTitle });
			return;
		}
		const criterio = editCriterio.trim();
		setLocalError(null);
		const sent = onUpdate(historia.id, {
			titulo,
			criterio: criterio.length > 0 ? criterio : null,
		});
		if (!sent) {
			setLocalError({ scope: "edit", message: content.error });
			return;
		}
		setEditingId(null);
	}

	function handleMove(id: string, toIndex: number): void {
		if (toIndex < 0 || toIndex >= historias.length) return;
		setLocalError(null);
		if (!onMove(id, toIndex)) {
			setLocalError({ scope: "card", message: content.error });
		}
	}

	function handleSelect(id: string): void {
		setLocalError(null);
		if (!onSelect(id)) {
			setLocalError({ scope: "card", message: content.error });
		}
	}

	function handleRemove(historia: Historia): void {
		if (historia.pontos !== null && confirmingRemoveId !== historia.id) {
			armRemove(historia.id);
			return;
		}
		disarmRemove();
		setLocalError(null);
		const sent =
			historia.pontos !== null
				? onRemove(historia.id, { confirmScored: true })
				: onRemove(historia.id);
		if (!sent) {
			setLocalError({ scope: "card", message: content.error });
		}
	}

	return (
		<Card className="arena-pauta" data-testid="pauta-card">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ListChecksIcon aria-hidden="true" />
					{content.title}
				</CardTitle>
				<CardDescription>{content.description}</CardDescription>
			</CardHeader>
			<CardPanel className="flex flex-col gap-3">
				{!isSpectator ? (
					<form
						className="pauta-add"
						onSubmit={handleAdd}
						noValidate
						data-testid="pauta-add-form"
					>
						<Field invalid={error?.scope === "add"}>
							<FieldLabel htmlFor="pauta-novo-titulo">
								{content.addLabel}
							</FieldLabel>
							<Input
								id="pauta-novo-titulo"
								data-testid="pauta-novo-titulo"
								name="titulo"
								size="sm"
								value={novoTitulo}
								maxLength={120}
								placeholder={content.tituloPlaceholder}
								autoComplete="off"
								aria-invalid={error?.scope === "add" ? true : undefined}
								aria-describedby={
									error?.scope === "add" ? "historia-error" : undefined
								}
								onChange={(event) => {
									setNovoTitulo(event.target.value);
									if (localError?.scope === "add") setLocalError(null);
								}}
							/>
							<Collapsible open={criterioOpen} onOpenChange={setCriterioOpen}>
								<CollapsibleTrigger
									className={cn(
										buttonVariants({ variant: "ghost", size: "sm" }),
										"pauta-criterio-toggle",
									)}
									data-testid="pauta-criterio-toggle"
								>
									{criterioOpen ? (
										<MinusIcon aria-hidden="true" />
									) : (
										<PlusIcon aria-hidden="true" />
									)}
									{criterioOpen
										? content.criterioToggleOpen
										: content.criterioToggle}
								</CollapsibleTrigger>
								<CollapsiblePanel>
									<div className="pauta-criterio-field">
										<FieldLabel htmlFor="pauta-novo-criterio">
											{content.criterioLabel}
										</FieldLabel>
										<Textarea
											id="pauta-novo-criterio"
											data-testid="pauta-novo-criterio"
											name="criterio"
											size="sm"
											value={novoCriterio}
											maxLength={1000}
											placeholder={content.criterioPlaceholder}
											onChange={(event) =>
												setNovoCriterio(event.target.value)
											}
										/>
									</div>
								</CollapsiblePanel>
							</Collapsible>
							{error?.scope === "add" ? (
								<FieldError
									id="historia-error"
									data-testid="historia-error"
									match={true}
								>
									{error.message}
								</FieldError>
							) : null}
							<Button
								type="submit"
								size="sm"
								data-testid="pauta-add-button"
								className="pauta-add-button"
							>
								<PlusIcon aria-hidden="true" />
								{content.add}
							</Button>
						</Field>
					</form>
				) : (
					<p className="pauta-spectator" data-testid="pauta-spectator">
						{content.spectator}
					</p>
				)}

				{error?.scope === "card" ? (
					<Alert variant="error">
						<AlertDescription data-testid="historia-error">
							{error.message}
						</AlertDescription>
					</Alert>
				) : null}

				{historias.length === 0 ? (
					<p className="pauta-empty" data-testid="pauta-empty">
						<ClipboardListIcon aria-hidden="true" />
						<span>{content.empty}</span>
					</p>
				) : (
					<ol
						className="pauta-list"
						data-testid="pauta-list"
						aria-label={content.listAria}
						aria-live="polite"
					>
						{historias.map((historia, index) => {
							const isActive = historia.id === historiaAtualId;
							const editing = editingId === historia.id;
							const itemLocked = locked && isActive;
							const canMove = !isSpectator && !itemLocked;
							const canRemove = !isSpectator && !itemLocked;
							const canSelect = !isSpectator && !locked;
							const confirming = confirmingRemoveId === historia.id;
							const actionHint = isSpectator
								? content.spectator
								: itemLocked
									? content.lockedHint
									: undefined;
							return (
								<li
									key={historia.id}
									className="pauta-item"
									data-testid={`pauta-item-${historia.id}`}
									data-active={isActive ? "true" : "false"}
									aria-current={isActive ? "true" : undefined}
								>
									<div className="pauta-item-head">
										<span className="pauta-item-index" aria-hidden="true">
											{index + 1}
										</span>
										<div className="pauta-item-body">
											{editing ? (
												<Field
													className="pauta-item-form"
													invalid={error?.scope === "edit"}
												>
													<FieldLabel
														htmlFor={`pauta-edit-titulo-${historia.id}`}
													>
														{content.tituloLabel}
													</FieldLabel>
													<Input
														id={`pauta-edit-titulo-${historia.id}`}
														data-testid={`pauta-edit-titulo-${historia.id}`}
														size="sm"
														value={editTitulo}
														maxLength={120}
														autoComplete="off"
														aria-invalid={
															error?.scope === "edit" ? true : undefined
														}
														aria-describedby={
															error?.scope === "edit"
																? "historia-error"
																: undefined
														}
														onChange={(event) => {
															setEditTitulo(event.target.value);
															if (localError?.scope === "edit") {
																setLocalError(null);
															}
														}}
													/>
													<Button
														type="button"
														variant="link"
														size="xs"
														className="pauta-criterio-inline"
														data-testid={`pauta-edit-criterio-toggle-${historia.id}`}
														aria-expanded={editCriterioOpen}
														onClick={() =>
															setEditCriterioOpen((open) => !open)
														}
													>
														{editCriterioOpen
															? content.criterioToggleOpen
															: content.criterioToggle}
													</Button>													{editCriterioOpen ? (
														<Textarea
															aria-label={content.criterioLabel}
															data-testid={`pauta-edit-criterio-${historia.id}`}
															size="sm"
															value={editCriterio}
															maxLength={1000}
															placeholder={content.criterioPlaceholder}
															onChange={(event) =>
																setEditCriterio(event.target.value)
															}
														/>
													) : null}
													{error?.scope === "edit" ? (
														<FieldError
															id="historia-error"
															data-testid="historia-error"
															match={true}
														>
															{error.message}
														</FieldError>
													) : null}
												</Field>
											) : (
												<>
													<span className="pauta-item-title">
														{historia.titulo}
													</span>
													{historia.criterio !== undefined ? (
														<p className="pauta-item-criterio">
															{historia.criterio}
														</p>
													) : null}
												</>
											)}
											<div className="pauta-item-meta">
												{isActive ? (
													<span
														className="pauta-active"
														data-testid={`pauta-active-${historia.id}`}
													>
														{content.active}
													</span>
												) : null}
												{historia.pontos !== null ? (
													<span
														className="pauta-score"
														data-testid={`pauta-pontos-${historia.id}`}
													>
														<span className="pauta-score-label">
															{content.scoredLabel}
														</span>
														<span
															className="pauta-score-value font-mono tabular-nums"
															aria-live="polite"
														>
															{formatPontos(historia.pontos)}
														</span>
													</span>
												) : null}
											</div>
										</div>
									</div>
									<div className="pauta-actions">
										{editing ? (
											<>
												<Button
													type="button"
													size="xs"
													data-testid={`pauta-save-${historia.id}`}
													onClick={() => handleUpdate(historia)}
												>
													{content.save}
												</Button>
												<Button
													type="button"
													variant="ghost"
													size="xs"
													data-testid={`pauta-cancel-${historia.id}`}
													onClick={() => {
														setEditingId(null);
														setLocalError(null);
													}}
												>
													{content.cancel}
												</Button>
											</>
										) : (
											<>
												<Button
													type="button"
													variant="ghost"
													size="icon-sm"
													data-testid={`pauta-up-${historia.id}`}
													aria-label={content.moveUpAria(historia.titulo)}
													title={actionHint ?? content.moveUpAria(historia.titulo)}
													disabled={!canMove || index === 0}
													onClick={() => handleMove(historia.id, index - 1)}
												>
													<ArrowUpIcon aria-hidden="true" />
												</Button>
												<Button
													type="button"
													variant="ghost"
													size="icon-sm"
													data-testid={`pauta-down-${historia.id}`}
													aria-label={content.moveDownAria(historia.titulo)}
													title={
														actionHint ?? content.moveDownAria(historia.titulo)
													}
													disabled={!canMove || index === historias.length - 1}
													onClick={() => handleMove(historia.id, index + 1)}
												>
													<ArrowDownIcon aria-hidden="true" />
												</Button>
												<Button
													type="button"
													variant="ghost"
													size="icon-sm"
													data-testid={`pauta-edit-${historia.id}`}
													aria-label={content.editAria(historia.titulo)}
													title={actionHint ?? content.editAria(historia.titulo)}
													disabled={isSpectator}
													onClick={() => startEdit(historia)}
												>
													<PencilIcon aria-hidden="true" />
												</Button>
												<Button
													type="button"
													variant={confirming ? "destructive-outline" : "ghost"}
													size={confirming ? "xs" : "icon-sm"}
													data-testid={`pauta-remove-${historia.id}`}
													data-confirming={confirming ? "true" : "false"}
													aria-label={
														confirming
															? content.removeConfirm
															: content.removeAria(historia.titulo)
													}
													title={actionHint ?? content.removeAria(historia.titulo)}
													disabled={!canRemove}
													onClick={() => handleRemove(historia)}
												>
													<Trash2Icon aria-hidden="true" />
													{confirming ? content.removeConfirm : null}
												</Button>
											</>
										)}
										{!editing && !isActive ? (
											<Button
												type="button"
												variant="outline"
												size="xs"
												className="pauta-select"
												data-testid={`pauta-select-${historia.id}`}
												disabled={!canSelect}
												title={actionHint ?? content.selectAria(historia.titulo)}
												aria-label={content.selectAria(historia.titulo)}
												onClick={() => handleSelect(historia.id)}
											>
												<VoteIcon aria-hidden="true" />
												{content.select}
											</Button>
										) : null}
									</div>
									{confirming ? (
										<div className="pauta-confirm">
											<span
												className="pauta-hint"
												data-testid={`pauta-remove-hint-${historia.id}`}
												aria-live="polite"
											>
												{content.confirmHint}
											</span>
											<span
												className="arena-confirm-countdown"
												data-testid={`pauta-remove-countdown-${historia.id}`}
												aria-hidden="true"
												style={{
													animationDuration: `${CONFIRM_TIMEOUT_MS}ms`,
												}}
											/>
										</div>
									) : null}
								</li>
							);
						})}
					</ol>
				)}
			</CardPanel>
		</Card>
	);
}
