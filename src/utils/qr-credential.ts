const QR_HMAC_SECRET = "suite-wms-qr-hmac-secret-2024"

export interface QRCredential {
  version: "1"
  teamId: string
  teamName: string
  subscriptionId: string
  appCode: string
  issuedBy: string
  issuedAt: number
  expiresAt: number
  signature: string
}

async function signPayload(payload: object): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(QR_HMAC_SECRET)
  const payloadData = encoder.encode(JSON.stringify(payload))

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign("HMAC", key, payloadData)
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

export async function generateQRCredential(opts: {
  team: { id: string; name: string }
  subscriptionId: string
  issuedBy: string
  ttlMs: number
}): Promise<string> {
  const now = Date.now()
  const payload = {
    version: "1" as const,
    teamId: opts.team.id,
    teamName: opts.team.name,
    subscriptionId: opts.subscriptionId,
    appCode: "wms",
    issuedBy: opts.issuedBy,
    issuedAt: now,
    expiresAt: now + opts.ttlMs,
  }
  const signature = await signPayload(payload)
  const credential: QRCredential = { ...payload, signature }
  return btoa(JSON.stringify(credential))
}