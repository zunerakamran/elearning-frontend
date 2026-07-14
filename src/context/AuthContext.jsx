import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      api.get('/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function register(data) {
    const res = await api.post('/register', data);
    sessionStorage.removeItem('token');
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  }

  async function login(data) {
    const { rememberMe, ...loginData } = data;
    const res = await api.post('/login', loginData);
    if (rememberMe) {
      sessionStorage.removeItem('token');
      localStorage.setItem('token', res.data.token);
    } else {
      localStorage.removeItem('token');
      sessionStorage.setItem('token', res.data.token);
    }
    setUser(res.data.user);
    return res.data.user;
  }

  async function logout() {
    await api.post('/logout');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
  }

  function updateUser(updatedUser) {
    setUser(updatedUser);
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}