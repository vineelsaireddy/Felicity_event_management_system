import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data);
        } catch (error) {
          console.error('Error fetching user:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password, role) => {
    let response;
    if (role === 'participant') {
      response = await authAPI.participantLogin({ email, password });
    } else if (role === 'organizer') {
      response = await authAPI.organizerLogin({ email, password });
    } else if (role === 'admin') {
      response = await authAPI.adminLogin({ email, password });
    }

    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    return user;
  };

  const signup = async (data) => {
    const response = await authAPI.participantSignup(data);
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
