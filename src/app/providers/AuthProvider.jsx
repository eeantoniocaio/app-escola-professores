import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../shared/services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchProfile = async (userId, userEmail, userMetadata = {}) => {
    try {
      let { data, error } = await supabase.from('perfis').select('papel, nome, avatar_url').eq('id', userId).maybeSingle();
      
      // Se o perfil não existir (ex: primeiro login com Google), cria automaticamente
      if (!data && !error) {
        let papel = 'professor';
        let nome = userMetadata.full_name || userMetadata.name || userEmail.split('@')[0];
        let avatar = userMetadata.avatar_url || '';

        // Auto-associar e-mail da secretaria ao papel 'secretaria'
        if (userEmail === 'secretariaantoniocaio@gmail.com') {
          papel = 'secretaria';
          nome = 'Secretaria';
        }

        // Auto-associar e-mail do agente ao papel 'agente'
        if (userEmail === 'agenteantoniocaio@gmail.com' || userEmail === 'agenteantonniocaio@gmail.com') {
          papel = 'agente';
          nome = 'Agente';
        }

        // Auto-associar e-mail da biblioteca ao papel 'biblioteca'
        if (userEmail === 'bibliotecaantoniocaio@gmail.com') {
          papel = 'biblioteca';
          nome = 'Biblioteca';
        }

        const newProfile = {
          id: userId,
          nome,
          papel,
          avatar_url: avatar
        };

        const { data: insertedData, error: insertError } = await supabase
          .from('perfis')
          .insert([newProfile])
          .select()
          .maybeSingle();

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          data = insertedData;
        }
      }

      if (data) {
        let papel = data.papel;
        let nome = data.nome;
        let avatar = data.avatar_url;

        // Auto-associar e-mail da secretaria ao papel 'secretaria' e nome 'Secretaria'
        if (userEmail === 'secretariaantoniocaio@gmail.com' && papel !== 'secretaria') {
          papel = 'secretaria';
          nome = 'Secretaria';
          await supabase.from('perfis').update({ papel: 'secretaria', nome: 'Secretaria' }).eq('id', userId);
        }

        // Auto-associar e-mail do agente ao papel 'agente' e nome 'Agente'
        if ((userEmail === 'agenteantoniocaio@gmail.com' || userEmail === 'agenteantonniocaio@gmail.com') && papel !== 'agente') {
          papel = 'agente';
          nome = 'Agente';
          await supabase.from('perfis').update({ papel: 'agente', nome: 'Agente' }).eq('id', userId);
        }

        // Auto-associar e-mail da biblioteca ao papel 'biblioteca' e nome 'Biblioteca'
        if (userEmail === 'bibliotecaantoniocaio@gmail.com' && papel !== 'biblioteca') {
          papel = 'biblioteca';
          nome = 'Biblioteca';
          await supabase.from('perfis').update({ papel: 'biblioteca', nome: 'Biblioteca' }).eq('id', userId);
        }

        setUserRole(papel);
        setUserName(nome);
        setAvatarUrl(avatar);
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

  const updateAvatarUrl = async (url) => {
    if (!session?.user?.id) return false;
    const { error } = await supabase
      .from('perfis')
      .update({ avatar_url: url })
      .eq('id', session.user.id);
    if (!error) {
      setAvatarUrl(url);
      return true;
    }
    console.error('Error updating avatar url:', error);
    return false;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
      else setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
      else {
        setUserRole(null);
        setUserName(null);
        setAvatarUrl(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isMaster = session?.user?.email === 'andre.avancini@servidor.educacao.sp.gov.br' && 
    (userName?.toLowerCase() === 'andré' || userName?.toLowerCase() === 'andre');

  const value = {
    session,
    userRole,
    userName,
    avatarUrl,
    isMaster,
    linkProfileName,
    updateAvatarUrl,
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
