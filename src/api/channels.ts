// ─── /v1/me/channels — link WhatsApp / Telegram / Signal ───────────────────

import { apiFetch, type ApiResult, type ChannelType } from "./client"

export type ChannelPath = "whatsapp" | "telegram" | "signal"

export interface LinkedChannel {
   channel: ChannelType
   identifier: string
   verified: boolean
}

export function apiListChannels(): Promise<ApiResult<{ channels: LinkedChannel[] }>> {
   return apiFetch("/me/channels")
}

/**
 * Creates or replaces a communication channel. WhatsApp expects an
 * E.164-compatible phone number; the platform normalizes and validates it.
 */
export function apiUpsertChannel(
   channel: ChannelPath,
   identifier: string,
): Promise<ApiResult<LinkedChannel>> {
   return apiFetch(`/me/channels/${channel}`, { method: "PUT", body: { identifier } })
}
