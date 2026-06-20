// ─── Toast store + imperative API ──────────────────────────────────────────
//
// A tiny Zustand store backs an in-house, Sileo-inspired notification system.
// The imperative `toast` object can be called from anywhere — React components,
// the API client, or validators — so error codes resolved via i18n surface to
// the user without prop drilling.

import { create } from "zustand"
import i18n from "@/i18n"

export type ToastVariant = "success" | "error" | "warning" | "info"

export interface ToastOptions {
   /** Optional heading; defaults to the variant's generic localized title. */
   title?: string
   description?: string
   /** Auto-dismiss delay in ms. `0` keeps the toast until dismissed. */
   duration?: number
}

/** A string is shorthand for `{ title }`. */
export type ToastInput = string | ToastOptions

export interface ToastItem {
   id: string
   variant: ToastVariant
   title: string
   description?: string
   duration: number
}

/** Max simultaneously visible toasts; older ones drop off the stack. */
const MAX_TOASTS = 3
const DEFAULT_DURATION = 4500

interface ToastState {
   toasts: ToastItem[]
   push: (toast: ToastItem) => void
   dismiss: (id: string) => void
   clear: () => void
}

export const useToastStore = create<ToastState>((set) => ({
   toasts: [],
   push: (toast) =>
      set((state) => ({ toasts: [...state.toasts, toast].slice(-MAX_TOASTS) })),
   dismiss: (id) =>
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
   clear: () => set({ toasts: [] }),
}))

function newId(): string {
   if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID()
   }
   return Math.random().toString(36).slice(2)
}

/** Generic, localized heading per variant (e.g. "Algo salió mal"). */
function defaultTitle(variant: ToastVariant): string {
   return i18n.t(`toast.${variant}`, { ns: "common" })
}

/**
 * Normalizes input into `{ title, description }`. A plain string is treated as
 * the *description*, paired with the variant's generic title — matching the
 * Sileo "short title + detail" layout. An object can override either.
 */
function normalize(
   input: ToastInput,
   variant: ToastVariant,
): { title: string; description?: string; duration?: number } {
   if (typeof input === "string") {
      return { title: defaultTitle(variant), description: input }
   }
   return {
      title: input.title ?? defaultTitle(variant),
      description: input.description,
      duration: input.duration,
   }
}

function notify(variant: ToastVariant, input: ToastInput): string {
   const { title, description, duration } = normalize(input, variant)
   const id = newId()
   useToastStore.getState().push({
      id,
      variant,
      title,
      description,
      duration: duration ?? DEFAULT_DURATION,
   })
   return id
}

/**
 * Imperative notifications. Examples:
 *   toast.error("Connection error")
 *   toast.success({ title: "Saved", description: "Your goals were updated" })
 */
export const toast = {
   success: (input: ToastInput) => notify("success", input),
   error: (input: ToastInput) => notify("error", input),
   warning: (input: ToastInput) => notify("warning", input),
   info: (input: ToastInput) => notify("info", input),
   dismiss: (id: string) => useToastStore.getState().dismiss(id),
   clear: () => useToastStore.getState().clear(),
}
