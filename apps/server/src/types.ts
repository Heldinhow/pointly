/**
 * Shared server-internal types.
 */

/**
 * Outcome of a single Sala tick (or aggregate hub tick) for the timer state machine.
 * Used by Hub.tickAllTimers() to drive the WS reconciliation cadence (ADR-002).
 *
 * - `'idle'`    — phase !== 'voting', or no rooms active
 * - `'ticking'` — voting in progress, timer > 0
 * - `'fired'`   — auto-reveal fired this tick (timer just hit 0)
 */
export type TickResult = "idle" | "ticking" | "fired";
