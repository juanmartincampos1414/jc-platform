import type { SupabaseClient } from "@supabase/supabase-js"

// Helpers de TikTok Content Posting API (Direct Post, FILE_UPLOAD).
// Las credenciales viven en jclaude_profiles.social_credentials.tiktok.

export const TIKTOK_API = "https://open.tiktokapis.com/v2"

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET

export type TikTokCreds = {
  open_id: string
  access_token: string
  refresh_token: string
  token_expires_at: string
  refresh_expires_at?: string
  scope?: string
}

// Guarda/mergea las credenciales de TikTok sin pisar el resto de social_credentials.
export async function persistTikTok(
  supabase: SupabaseClient,
  workspaceId: string,
  tk: TikTokCreds
): Promise<void> {
  const { data: existing } = await supabase
    .from("jclaude_profiles")
    .select("social_credentials, connected_networks")
    .eq("workspace_id", workspaceId)
    .single()

  const social = (existing?.social_credentials as Record<string, unknown>) ?? {}
  const networks = new Set<string>((existing?.connected_networks as string[]) ?? [])
  networks.add("tiktok")

  await supabase.from("jclaude_profiles").upsert(
    {
      workspace_id: workspaceId,
      social_credentials: { ...social, tiktok: tk },
      connected_networks: Array.from(networks),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id" }
  )
}

// Lee las credenciales de TikTok y refresca el access token si está por vencer
// (los access tokens de TikTok duran ~24h; el refresh token dura más).
export async function getTikTokCreds(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<TikTokCreds | null> {
  const { data: profile } = await supabase
    .from("jclaude_profiles")
    .select("social_credentials")
    .eq("workspace_id", workspaceId)
    .single()

  const tk = (profile?.social_credentials as { tiktok?: TikTokCreds } | null)?.tiktok
  if (!tk?.access_token) return null

  const expMs = new Date(tk.token_expires_at).getTime()
  if (Number.isFinite(expMs) && Date.now() > expMs - 5 * 60 * 1000) {
    const refreshed = await refreshTikTokToken(tk.refresh_token)
    if (refreshed) {
      const merged: TikTokCreds = { ...tk, ...refreshed }
      await persistTikTok(supabase, workspaceId, merged)
      return merged
    }
  }
  return tk
}

async function refreshTikTokToken(refreshToken: string): Promise<Partial<TikTokCreds> | null> {
  if (!CLIENT_KEY || !CLIENT_SECRET) return null
  const res = await fetch(`${TIKTOK_API}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  })
  const d = await res.json()
  if (!d.access_token) return null
  return {
    access_token: d.access_token,
    refresh_token: d.refresh_token ?? refreshToken,
    token_expires_at: new Date(Date.now() + (d.expires_in ?? 86400) * 1000).toISOString(),
    refresh_expires_at: new Date(Date.now() + (d.refresh_expires_in ?? 0) * 1000).toISOString(),
    scope: d.scope,
  }
}
