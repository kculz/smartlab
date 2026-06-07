import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useEffect } from 'react';

export const useAuth = () => {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  return { user, token, logout };
};

export const useRequireAuth = (allowedRoles?: string[]) => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      navigate('/unauthorized');
    }
  }, [token, user, allowedRoles, navigate]);

  return { user, token };
};
