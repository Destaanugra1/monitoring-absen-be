const out = document.getElementById('out')
const pkEl = document.getElementById('pk')
const authStateEl = document.getElementById('authState')

const ENV = window.__ENV__ || {}
const PK = ENV.CLERK_PUBLISHABLE_KEY
const API_BASE = ENV.API_BASE || ''
pkEl.textContent = PK || '(missing)'

let clerkLoaded = false

function log(obj, label) {
  const ts = new Date().toISOString()
  const text = label ? `# ${label} @ ${ts}\n` : `# ${ts}\n`
  out.textContent = text + JSON.stringify(obj, null, 2)
}

function waitForClerkGlobal(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const iv = setInterval(() => {
      if (window.Clerk) {
        clearInterval(iv)
        resolve(window.Clerk)
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(iv)
        reject(new Error('Clerk global not found'))
      }
    }, 50)
  })
}

function injectClerkScript(pk) {
  return new Promise((resolve, reject) => {
    try {
      const existing = document.querySelector('script[data-clerk-publishable-key]')
      if (existing) return resolve()
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js'
      s.async = true
      s.crossOrigin = 'anonymous'
      s.setAttribute('data-clerk-publishable-key', pk)
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Failed to load Clerk CDN script'))
      document.head.appendChild(s)
    } catch (e) { reject(e) }
  })
}

async function loadClerk() {
  try {
    if (!PK) {
      log({ error: 'Missing CLERK_PUBLISHABLE_KEY from /env.js' })
      return
    }
    // Inject the script with proper data attribute so Clerk can initialize
    await injectClerkScript(PK)
    await waitForClerkGlobal(20000)
    // Use the global Clerk singleton and load with the publishable key
    await window.Clerk.load({ publishableKey: PK })
    clerkLoaded = true
    updateAuthState()
  } catch (e) {
    log({ error: e?.message || String(e) }, 'Clerk load error')
  }
}

function updateAuthState() {
  const userId = window.Clerk?.user?.id || null
  const isSignedIn = !!window.Clerk?.user
  authStateEl.textContent = isSignedIn ? `Signed in as ${userId}` : 'Signed out'
}

async function signIn() {
  try {
    if (!clerkLoaded) throw new Error('Clerk not loaded yet')
    if (window.Clerk && typeof window.Clerk.openSignIn === 'function') {
      await window.Clerk.openSignIn()
    } else if (window.Clerk && typeof window.Clerk.redirectToSignIn === 'function') {
      await window.Clerk.redirectToSignIn()
    } else {
      throw new Error('Clerk instance not ready')
    }
    updateAuthState()
  } catch (e) { log({ error: e?.message || String(e) }, 'Sign In error') }
}

async function signOut() {
  try {
    await window.Clerk?.signOut()
    updateAuthState()
  } catch (e) { log({ error: e?.message || String(e) }, 'Sign Out error') }
}

async function getToken(opts = {}) {
  // Without template should return a session token acceptable by backend
  return await window.Clerk?.session?.getToken(opts)
}

async function callApi(path, method = 'GET', body) {
  const token = await getToken() // if needed: { template: 'postman' }
  if (!token) return log({ error: 'No token. Please sign in first.' }, 'Token')

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  log({ status: res.status, data: json }, `${method} ${path}`)
}

// Wire buttons
document.getElementById('btnSignIn').addEventListener('click', signIn)
document.getElementById('btnSignOut').addEventListener('click', signOut)

document.getElementById('btnToken').addEventListener('click', async () => {
  const token = await getToken()
  log({ token: token ? token.slice(0, 32) + '…' : null }, 'Token (prefix)')
})

document.getElementById('btnDebug').addEventListener('click', () => callApi('/auth/debug'))
document.getElementById('btnSync').addEventListener('click', () => callApi('/auth/sync', 'POST'))
document.getElementById('btnMe').addEventListener('click', () => callApi('/me'))

window.addEventListener('load', loadClerk)
