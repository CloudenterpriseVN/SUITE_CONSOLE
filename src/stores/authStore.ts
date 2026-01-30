import { atom, useAtom } from 'jotai'
import { auth, googleProvider } from '@/lib/firebase'
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth'

export interface AuthUser {
  accountNo: string
  name?: string
  email: string
  role: string[]
  avatar?: string
  exp: number
}

// Create atoms
export const userAtom = atom<AuthUser | null>(null)
export const accessTokenAtom = atom<string>('')

// Helper để convert Firebase User sang AuthUser
const firebaseUserToAuthUser = (user: User): AuthUser => ({
  accountNo: user.uid,
  name: user.displayName ?? '',
  email: user.email ?? '',
  avatar: user.photoURL ?? '',
  role: [],
  exp: 0,
})

// Sign in with Google
export const signInWithGoogle = async (
  setUser: (user: AuthUser | null) => void,
  setAccessToken: (token: string) => void
) => {
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user
  const token = await user.getIdToken()

  const authUser = firebaseUserToAuthUser(user)

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

// Hook để sync Firebase auth state với atoms
export const useAuthSync = () => {
  const [, setUser] = useAtom(userAtom)
  const [, setAccessToken] = useAtom(accessTokenAtom)

  const syncAuth = () => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken()
        const authUser = firebaseUserToAuthUser(firebaseUser)
        setUser(authUser)
        setAccessToken(token)
      } else {
        setUser(null)
        setAccessToken('')
      }
    })
  }

  return { syncAuth }
}

// Hook lấy current user - ưu tiên từ atom, fallback về Firebase
export const useCurrentUser = (): AuthUser | null => {
  const [user] = useAtom(userAtom)

  // Nếu atom đã có user thì dùng
  if (user) return user

  // Fallback: lấy từ Firebase currentUser
  const firebaseUser = auth.currentUser
  if (firebaseUser) {
    return firebaseUserToAuthUser(firebaseUser)
  }

  return null
}
