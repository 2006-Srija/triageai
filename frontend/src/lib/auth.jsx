import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      user_id: payload.user_id,
      tenant_id: payload.tenant_id,
      role: payload.role,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('triageai_token');
    if (token) return decodeToken(token);
    return null;
  });

  const [orgName, setOrgName] = useState(localStorage.getItem('triageai_org_name') || '');

  const login = useCallback((token, org) => {
    localStorage.setItem('triageai_token', token);
    if (org) {
      localStorage.setItem('triageai_org_name', org.name);
      setOrgName(org.name || '');
    }
    setUser(decodeToken(token));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('triageai_token');
    localStorage.removeItem('triageai_org_name');
    setUser(null);
    setOrgName('');
  }, []);

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem('triageai_org_name');
      if (stored) setOrgName(stored);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, orgName, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
