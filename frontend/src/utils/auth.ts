import type { Role } from '../config/menus'

export type SessionUser = { id: number; username: string; role: Role; apiToken?: string }

const KEY = 'hrms_user'

export function saveUser(user: SessionUser) {
  sessionStorage.setItem(KEY, JSON.stringify(user))
}

export function getUser(): SessionUser | null {
  const raw = sessionStorage.getItem(KEY)
  if (!raw) return null
  try {
    const user = JSON.parse(raw) as SessionUser
    // normalize role casing to match Role union (lowercase)
    if (user && (user as any).role) {
      try {
        ;(user as any).role = (String((user as any).role).toLowerCase()) as Role
      } catch {
        /* ignore */
      }
    }
    return user
  } catch {
    return null
  }
}

export function clearUser() {
  sessionStorage.removeItem(KEY)
}
