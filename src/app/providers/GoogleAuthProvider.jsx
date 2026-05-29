import React, { createContext, useContext, useState, useEffect } from 'react';

const GoogleAuthContext = createContext(null);

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
].join(' ');

// Função auxiliar para carregar dinamicamente o script do GIS se ele falhar no index.html
const loadGsiScript = () => {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
};

export function GoogleAuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [googleAccount, setGoogleAccount] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const isConfigured = !!clientId;

  // Carregar dados de perfil a partir do token
  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const accountInfo = {
          name: data.name,
          email: data.email,
          picture: data.picture
        };
        setGoogleAccount(accountInfo);
        localStorage.setItem('google_account_info', JSON.stringify(accountInfo));
      } else {
        // Se o token estiver inválido, limpa
        if (response.status === 401) {
          logoutGoogle();
        }
      }
    } catch (err) {
      console.error('[GoogleAuth] Erro ao buscar informações do usuário:', err);
    }
  };

  // Inicializar o script e carregar do localStorage
  useEffect(() => {
    loadGsiScript().then(() => {
      setInitialized(true);
    });

    const cachedToken = localStorage.getItem('google_access_token');
    const cachedExpiry = localStorage.getItem('google_token_expiry');
    const cachedAccount = localStorage.getItem('google_account_info');

    if (cachedToken && cachedExpiry) {
      const expiryTime = parseInt(cachedExpiry, 10);
      // Se faltar mais de 5 minutos para expirar, usar o cache
      if (expiryTime > Date.now() + 5 * 60 * 1000) {
        setAccessToken(cachedToken);
        if (cachedAccount) {
          setGoogleAccount(JSON.parse(cachedAccount));
        } else {
          fetchUserInfo(cachedToken);
        }
      } else {
        // Expirado
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_token_expiry');
        localStorage.removeItem('google_account_info');
      }
    }
  }, []);

  // Inicializar o cliente do Google Identity Services
  useEffect(() => {
    if (initialized && isConfigured && window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: GOOGLE_SCOPES,
          callback: (response) => {
            if (response.access_token) {
              setAccessToken(response.access_token);
              const expiry = Date.now() + (response.expires_in || 3600) * 1000;
              localStorage.setItem('google_access_token', response.access_token);
              localStorage.setItem('google_token_expiry', expiry.toString());
              fetchUserInfo(response.access_token);
            }
          },
        });
        setTokenClient(client);
      } catch (err) {
        console.error('[GoogleAuth] Falha ao inicializar TokenClient:', err);
      }
    }
  }, [initialized, isConfigured, clientId]);

  const loginGoogle = () => {
    if (!isConfigured) {
      alert('Integração com Google não configurada. Defina VITE_GOOGLE_CLIENT_ID no arquivo .env.');
      return;
    }
    if (tokenClient) {
      // Solicitar token. Se já houver consentimento prévio, será rápido e silencioso
      tokenClient.requestAccessToken({ prompt: '' });
    } else {
      console.warn('[GoogleAuth] TokenClient não está pronto.');
    }
  };

  const logoutGoogle = () => {
    if (accessToken) {
      try {
        // Revogar o token de acesso no servidor do Google para segurança
        window.google?.accounts?.oauth2?.revoke(accessToken, () => {
          console.log('[GoogleAuth] Token revogado com sucesso.');
        });
      } catch (e) {
        console.warn('[GoogleAuth] Erro ao revogar token:', e);
      }
    }
    setAccessToken(null);
    setGoogleAccount(null);
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
    localStorage.removeItem('google_account_info');
  };

  // Helper para obter o token ativo (solicita renovação se necessário)
  const getGoogleToken = async () => {
    const cachedToken = localStorage.getItem('google_access_token');
    const cachedExpiry = localStorage.getItem('google_token_expiry');
    
    if (cachedToken && cachedExpiry) {
      const expiryTime = parseInt(cachedExpiry, 10);
      if (expiryTime > Date.now() + 60 * 1000) {
        return cachedToken;
      }
    }

    // Se expirou ou não existe, abre o fluxo de login
    loginGoogle();
    return null;
  };

  const value = {
    loginGoogle,
    logoutGoogle,
    getGoogleToken,
    accessToken,
    googleAccount,
    isConfigured,
    initialized
  };

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (!context) throw new Error('useGoogleAuth must be used within GoogleAuthProvider');
  return context;
};
