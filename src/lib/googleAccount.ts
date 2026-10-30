const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

export const hasGoogleClientId = !!CLIENT_ID

type AccountInfo = { email: string; name?: string }
let pendingCallback: ((info: AccountInfo) => void) | null = null
let fallbackContainer: HTMLDivElement | null = null
let backdropEl: HTMLDivElement | null = null

function removeFallback() {
  fallbackContainer?.remove()
  backdropEl?.remove()
  fallbackContainer = null
  backdropEl = null
}

function showFallbackButton() {
  const gid = (window as any).google?.accounts?.id
  if (!gid || !CLIENT_ID || fallbackContainer) return

  const container = document.createElement('div')
  Object.assign(container.style, {
    position: 'fixed', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)', zIndex: '9999',
    background: '#fff', borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
    padding: '20px', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: '12px',
  })

  const label = document.createElement('p')
  label.textContent = 'Select your Google account'
  Object.assign(label.style, { fontSize: '14px', color: '#374151', margin: '0', fontWeight: '500' })

  const btnWrap = document.createElement('div')

  const cancelBtn = document.createElement('button')
  cancelBtn.textContent = 'Cancel'
  Object.assign(cancelBtn.style, {
    fontSize: '13px', color: '#9ca3af', background: 'none',
    border: 'none', cursor: 'pointer', padding: '4px',
  })
  cancelBtn.onclick = removeFallback

  const backdrop = document.createElement('div') as HTMLDivElement
  Object.assign(backdrop.style, {
    position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.4)', zIndex: '9998',
  })
  backdrop.onclick = removeFallback

  container.append(label, btnWrap, cancelBtn)
  document.body.append(backdrop, container)
  fallbackContainer = container
  backdropEl = backdrop

  gid.renderButton(btnWrap, {
    type: 'standard', theme: 'outline', size: 'large',
    text: 'continue_with', shape: 'rectangular', width: 280,
  })
}

// Single entry point used by all pages.
// onAccount receives email (always) and name (if available, for signup).
export function pickGoogleAccount(onAccount: (info: AccountInfo) => void) {
  if (!CLIENT_ID) return
  const gid = (window as any).google?.accounts?.id
  if (!gid) return

  removeFallback()
  pendingCallback = onAccount

  gid.initialize({
    client_id: CLIENT_ID,
    callback: (credentialResponse: any) => {
      try {
        const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]))
        if (payload.email) {
          removeFallback()
          pendingCallback?.({ email: payload.email, name: payload.name })
        }
      } catch { /* ignore */ }
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  })

  gid.prompt((notification: any) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
      showFallbackButton()
    }
  })
}

// Convenience wrapper for pages that only need email
export function pickGoogleEmail(onEmail: (email: string) => void) {
  pickGoogleAccount(({ email }) => onEmail(email))
}
