const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

export const hasGoogleClientId = !!CLIENT_ID

let initialized = false
let pendingCallback: ((info: { email: string; name?: string }) => void) | null = null

function setup() {
  if (initialized) return
  const gid = (window as any).google?.accounts?.id
  if (!gid || !CLIENT_ID) return
  gid.initialize({
    client_id: CLIENT_ID,
    use_fedcm_for_prompt: true,
    callback: (credentialResponse: any) => {
      try {
        const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]))
        if (payload.email) {
          pendingCallback?.({ email: payload.email, name: payload.name })
        }
      } catch { /* ignore */ }
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  })
  initialized = true
}

export function pickGoogleAccount(onAccount: (info: { email: string; name?: string }) => void) {
  if (!CLIENT_ID) return
  const gid = (window as any).google?.accounts?.id
  if (!gid) return

  setup()
  pendingCallback = onAccount
  // prompt() with use_fedcm_for_prompt:true shows the browser-native
  // FedCM account picker — no popup page, credential goes straight to callback
  gid.prompt()
}

export function pickGoogleEmail(onEmail: (email: string) => void) {
  pickGoogleAccount(({ email }) => onEmail(email))
}
