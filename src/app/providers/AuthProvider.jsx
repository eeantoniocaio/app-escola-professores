import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../shared/services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase.from('perfis').select('papel, nome').eq('id', userId).maybeSingle();
      if (data) {
        setUserRole(data.papel);
        setUserName(data.nome);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const linkProfileName = async (name) => {
    if (!session?.user?.id) return false;
    const { error } = await supabase
      .from('perfis')
      .update({ nome: name })
      .eq('id', session.user.id);
    if (!error) {
      setUserName(name);
      return true;
    }
    console.error('Error linking profile name:', error);
    return false;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setUserRole(null);
        setUserName(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    userRole,
    userName,
    linkProfileName,
    authLoading,
    setSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
