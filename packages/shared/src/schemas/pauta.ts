/**
 * Pauta / História contract — Pointly (issue #161, parent #160).
 *
 * Contrato compartilhado SOMENTE: schemas Zod + tipos + dispatch na união C→S.
 * Sem lógica de domínio de Sala aqui (isso é #162+). Server (#163) e client
 * (#164+) consomem estes schemas — não redefinam em outro lugar.
 *
 * Domínio (ROADMAP Agora/1):
 *   História — item estimável da pauta (título 1–120, critério texto puro
 *              ≤1000 opcional, pontos = mediana pós-reveal ou null, ordem).
 *   Pauta    — lista efêmera em memória (≤50) + historiaAtualId nullable.
 *   Pontuação — mediana pós-reveal carimbada na história ativa.
 *
 * Eventos finos C→S (dispatch por `event.type`):
 *   historia_add / historia_update / historia_move / historia_remove /
 *   historia_select
 *
 * Erros S→C (reuso + novos):
 *   - `pauta_cheia` / `historia_nao_encontrada` (novos neste contrato)
 *   - `invalid_phase` / `role_denied` (já existiam — reuso: ex. select em
 *     voting/revealable falha com invalid_phase; espectador escreve → role_denied)
 *
 * @see https://github.com/Heldinhow/pointly/issues/161
 * @see https://github.com/Heldinhow/pointly/issues/160
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Limites (SSOT — não repetir literais em docs; referenciar estas constantes)
// ---------------------------------------------------------------------------

/** Título da história: mínimo 1 char (após trim). */
export const HISTORIA_TITULO_MIN = 1;
/** Título da história: máximo 120 chars. */
export const HISTORIA_TITULO_MAX = 120;
/** Critério (texto puro): máximo 1000 chars, opcional. */
export const HISTORIA_CRITERIO_MAX = 1000;
/** Pauta: máximo 50 histórias por sala. */
export const PAUTA_MAX_HISTORIAS = 50;
/** Índice máximo de destino no move (50 itens → 0..49). */
export const PAUTA_MAX_TO_INDEX = PAUTA_MAX_HISTORIAS - 1;

// ---------------------------------------------------------------------------
// Blocos reutilizáveis
// ---------------------------------------------------------------------------

/** ID da história (gerado no server em #162; contrato só exige non-empty). */
export const HistoriaIdSchema = z.string().min(1, "historia id: mínimo 1 char");
export type HistoriaId = z.infer<typeof HistoriaIdSchema>;

/**
 * Título 1–120. Rejeita vazio, só-espaços e >120.
 * Espelha o estilo de `NickSchema` (trim + sem-espaços-nas-pontas não se
 * aplica aqui — título pode ter pontuação; só barramos vazio/só-espaços).
 */
export const HistoriaTituloSchema = z
	.string()
	.min(HISTORIA_TITULO_MIN, "titulo: mínimo 1 char")
	.max(HISTORIA_TITULO_MAX, "titulo: máximo 120 chars")
	.refine((s) => s.trim().length > 0, "titulo: não pode ser só espaços");
export type HistoriaTitulo = z.infer<typeof HistoriaTituloSchema>;

/** Critério em texto puro (sem markdown rico) ≤1000. Opcional na história. */
export const HistoriaCriterioSchema = z
	.string()
	.max(HISTORIA_CRITERIO_MAX, "criterio: máximo 1000 chars");
export type HistoriaCriterio = z.infer<typeof HistoriaCriterioSchema>;

/**
 * Pontuação = mediana pós-reveal. `null` enquanto não pontuada.
 * Tipo numérico espelha `VotesRevealedEventSchema.median` (number|null).
 */
export const HistoriaPontosSchema = z.number().nullable();
export type HistoriaPontos = z.infer<typeof HistoriaPontosSchema>;

/** Posição na pauta (0-based). Ordenação estável definida no domínio (#162). */
export const HistoriaOrdemSchema = z.number().int().min(0);
export type HistoriaOrdem = z.infer<typeof HistoriaOrdemSchema>;

// ---------------------------------------------------------------------------
// História + Pauta
// ---------------------------------------------------------------------------

/**
 * História — item estimável da pauta.
 *
 *   id       — server-assigned (non-empty)
 *   titulo   — 1–120, não só-espaços
 *   criterio — texto puro ≤1000, opcional (ausente = sem critério)
 *   pontos   — mediana pós-reveal ou null
 *   ordem    — índice 0-based na pauta
 */
export const HistoriaSchema = z.object({
	id: HistoriaIdSchema,
	titulo: HistoriaTituloSchema,
	criterio: HistoriaCriterioSchema.optional(),
	pontos: HistoriaPontosSchema,
	ordem: HistoriaOrdemSchema,
});
export type Historia = z.infer<typeof HistoriaSchema>;

/**
 * Pauta — lista efêmera ≤50. A 51ª deve ser rejeitada pelo domínio com
 * erro `pauta_cheia` (código em `ErrorCodeSchema`).
 */
export const PautaSchema = z.array(HistoriaSchema).max(
	PAUTA_MAX_HISTORIAS,
	"pauta_cheia: máximo 50 histórias",
);
export type Pauta = z.infer<typeof PautaSchema>;

/**
 * ID da história ativa da rodada. `null` = nenhuma ativa (ex. pauta vazia
 * ou seleção limpa). Non-empty quando presente.
 */
export const HistoriaAtualIdSchema = z.string().min(1).nullable();
export type HistoriaAtualId = z.infer<typeof HistoriaAtualIdSchema>;

// ---------------------------------------------------------------------------
// Payloads C→S (5 eventos finos)
// ---------------------------------------------------------------------------

/**
 * `historia_add { titulo, criterio? }` — cria história no fim da pauta.
 * Server gera id/ordem/pontos=null (#162). Pauta cheia → `pauta_cheia`.
 */
export const HistoriaAddPayloadSchema = z
	.object({
		titulo: HistoriaTituloSchema,
		criterio: HistoriaCriterioSchema.optional(),
	})
	.strict();
export type HistoriaAddPayload = z.infer<typeof HistoriaAddPayloadSchema>;

/**
 * `historia_update { id, titulo?, criterio? }` — edição parcial.
 * Exige ao menos um campo editável. `criterio: null` limpa o critério
 * (vira ausente no domínio #162).
 */
export const HistoriaUpdatePayloadSchema = z
	.object({
		id: HistoriaIdSchema,
		titulo: HistoriaTituloSchema.optional(),
		criterio: HistoriaCriterioSchema.nullable().optional(),
	})
	.strict()
	.refine(
		(d) => d.titulo !== undefined || d.criterio !== undefined,
		"update: informe titulo ou criterio",
	);
export type HistoriaUpdatePayload = z.infer<typeof HistoriaUpdatePayloadSchema>;

/**
 * `historia_move { id, toIndex }` — reordena (sem drag-and-drop na UI;
 * índice explícito). `toIndex` 0..49; fora da pauta real → domínio
 * responde `historia_nao_encontrada`.
 */
export const HistoriaMovePayloadSchema = z
	.object({
		id: HistoriaIdSchema,
		toIndex: z.number().int().min(0).max(PAUTA_MAX_TO_INDEX),
	})
	.strict();
export type HistoriaMovePayload = z.infer<typeof HistoriaMovePayloadSchema>;

/** `historia_remove { id }` — remove da pauta. Id ausente → `historia_nao_encontrada`. */
export const HistoriaRemovePayloadSchema = z
	.object({
		id: HistoriaIdSchema,
	})
	.strict();
export type HistoriaRemovePayload = z.infer<typeof HistoriaRemovePayloadSchema>;

/**
 * `historia_select { historiaId }` — define a história ativa da rodada.
 * `null` limpa a ativa. Troca em `voting`/`revealable` deve falhar com
 * `invalid_phase` sem invalidar votos (regra #162, código já existe).
 */
export const HistoriaSelectPayloadSchema = z
	.object({
		historiaId: HistoriaIdSchema.nullable(),
	})
	.strict();
export type HistoriaSelectPayload = z.infer<typeof HistoriaSelectPayloadSchema>;
