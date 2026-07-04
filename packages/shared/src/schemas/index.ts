/**
 * Barrel re-export de schemas (sala + events).
 *
 * Cada módulo individual exporta seus schemas. Este arquivo serve de "ponto
 * único" para re-exports downstream (types.ts, index.ts).
 */
export * from "./sala";
export * from "./events";
