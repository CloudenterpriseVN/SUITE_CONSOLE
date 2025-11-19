import Cookies from 'js-cookie'
import { atom, useAtom } from 'jotai'
import { auth, googleProvider } from '@/lib/firebase'
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'

const ACCESS_TOKEN = 'access_token'

export interface AuthUser {
  accountNo: string
  name?: string
  email: string
  role: string[]
  avatar?: string
  exp: number
}

// Initialize user from localStorage
const getInitialUser = (): AuthUser | null => {
  try {
    const stored = localStorage.getItem('auth_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Initialize token from Cookies
const getInitialToken = (): string => {
  try {
    const stored = Cookies.get(ACCESS_TOKEN)
    return stored ? JSON.parse(stored) : ''
  } catch {
    return ''
  }
}

// Create atoms
export const userAtom = atom<AuthUser | null>(getInitialUser())
export const accessTokenAtom = atom<string>(getInitialToken())

// Sign in with Google
export const signInWithGoogle = async (
  setUser: (user: AuthUser | null) => void,
  setAccessToken: (token: string) => void
) => {
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user
  const token = await user.getIdToken()

  const authUser: AuthUser = {
    accountNo: user.uid,
    name: user.displayName ?? '',
    email: user.email ?? '',
    avatar: user.photoURL ?? '',
    role: [],
    exp: 0,
  }

  // Save to localStorage and Cookies
  localStorage.setItem('auth_user', JSON.stringify(authUser))
  Cookies.set(ACCESS_TOKEN, JSON.stringify(token))

  // Update atoms
  setUser(authUser)
  setAccessToken(token)
}

// Sign out
export const signOut = async (
  setUser: (user: AuthUser | null) => void,
  setAccessToken: (token: string) => void
) => {
  try {
    await firebaseSignOut(auth)
  } finally {
    // Clear storage
    localStorage.removeItem('auth_user')
    Cookies.remove(ACCESS_TOKEN)

    // Reset atoms
    setUser(null)
    setAccessToken('')
  }
}

// Backward compatibility hook
export const useAuthStore = () => {
  const [user, setUser] = useAtom(userAtom)
  const [accessToken, setAccessToken] = useAtom(accessTokenAtom)

  return {
    auth: {
      user,
      accessToken,
      signInWithGoogle: async () => {
        await signInWithGoogle(setUser, setAccessToken)
      },
      signOut: async () => {
        await signOut(setUser, setAccessToken)
      },
    },
  }
}

// Helper to reset auth state (for use outside React components)
export const resetAuthState = () => {
  localStorage.removeItem('auth_user')
  Cookies.remove(ACCESS_TOKEN)
}
