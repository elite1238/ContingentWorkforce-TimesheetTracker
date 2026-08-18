import { createContext, useContext, useState, useCallback } from 'react'
import { login as apiLogin } from '../api'

const AuthContext = createContext(null)

function parseJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return {}
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('wb_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password)
    const { token, roles, permissions, employeeId } = data
    const claims = parseJwt(token)
    const userObj = {
      token,
      username: data.username ?? claims.sub,
      roles: roles ?? [],
      permissions: permissions ?? [],
      employeeId: employeeId ?? null,
    }
    localStorage.setItem('wb_token', token)
    localStorage.setItem('wb_user', JSON.stringify(userObj))
    setUser(userObj)
    return userObj
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('wb_token')
    localStorage.removeItem('wb_user')
    setUser(null)
  }, [])

  const isManager = user?.roles?.includes('MANAGER')
  const isEmployee = user?.roles?.includes('EMPLOYEE')
  const hasPermission = (p) => user?.permissions?.includes(p)

  return (
    <AuthContext.Provider value={{ user, login, logout, isManager, isEmployee, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
