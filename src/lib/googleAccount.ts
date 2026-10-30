const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

export const hasGoogleClientId = !!CLIENT_ID

export function pickGoogleAccount(onAccount: (info: { email: string; name?: string }) => void) {
  if (!CLIENT_ID || !(window as any).google?.accounts?.oauth2) return

  const client = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'email profile',
    callback: async (tokenResponse: any) => {
      if (!tokenResponse.access_token) return
      try {
        const res = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`
        )
        const info = await res.json()
        if (info.email) onAccount({ email: info.email, name: info.name })
      } catch { /* ignore */ }
    },
  })

  client.requestAccessToken({ prompt: 'select_account' })
}

export function pickGoogleEmail(onEmail: (email: string) => void) {
  pickGoogleAccount(({ email }) => onEmail(email))
}
