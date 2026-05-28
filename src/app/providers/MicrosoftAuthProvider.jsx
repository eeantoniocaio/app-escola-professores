import React, { createContext, useContext, useState, useEffect } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider, useMsal } from '@azure/msal-react';

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: import.meta.env.VITE_MICROSOFT_REDIRECT_URI || 'http://localhost:3006/',
    navigateToLoginRequestUrl: true // Redirecionar de volta para a página que iniciou o login
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  }
};

const MicrosoftAuthContext = createContext(null);

// Componente interno para escutar as mudanças de estado do MSAL React e obter tokens após o redirect
function MicrosoftAuthInner({ children, setMsAccount, setAccessToken }) {
  const { instance, accounts } = useMsal();

  useEffect(() => {
    if (accounts.length > 0) {
      const activeAccount = accounts[0];
      setMsAccount(activeAccount);
      
      // Tentar obter o token de acesso silenciosamente
      const tokenRequest = {
        scopes: ['User.Read', 'Files.Read', 'Files.Read.All'],
        account: activeAccount
      };
      
      instance.acquireTokenSilent(tokenRequest)
        .then(response => {
          setAccessToken(response.accessToken);
        })
        .catch(err => {
          console.warn('Erro ao adquirir token silencioso no loginRedirect:', err);
        });
    }
  }, [accounts, instance, setMsAccount, setAccessToken]);

  return children;
}

export function MicrosoftAuthProvider({ children }) {
  const [msalInstance, setMsalInstance] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [msAccount, setMsAccount] = useState(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
    if (clientId) {
      try {
        const pca = new PublicClientApplication(msalConfig);
        pca.initialize()
          .then(() => {
            setMsalInstance(pca);
            setInitialized(true);
            
            // Verificar se já existe uma conta ativa
            const accounts = pca.getAllAccounts();
            if (accounts.length > 0) {
              setMsAccount(accounts[0]);
            }
          })
          .catch(err => {
            console.error('Erro ao inicializar o MSAL:', err);
          });
      } catch (err) {
        console.error('Falha ao instanciar o PublicClientApplication:', err);
      }
    }
  }, []);

  const loginMicrosoft = async () => {
    if (!msalInstance || !initialized) {
      alert('A integração com o OneDrive não está inicializada ou configurada. Verifique o VITE_MICROSOFT_CLIENT_ID no arquivo .env.');
      return null;
    }

    try {
      const loginRequest = {
        scopes: ['User.Read', 'Files.Read', 'Files.Read.All']
      };
      // Usar redirect em vez de popup para suportar contas escolares/governamentais federadas (ex: SEDuc SP)
      await msalInstance.loginRedirect(loginRequest);
      return null;
    } catch (error) {
      console.error('Microsoft login failed:', error);
      return null;
    }
  };

  const getMicrosoftToken = async () => {
    if (!msalInstance || !initialized) return null;
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) return null;

    try {
      const tokenRequest = {
        scopes: ['User.Read', 'Files.Read', 'Files.Read.All'],
        account: accounts[0]
      };
      const response = await msalInstance.acquireTokenSilent(tokenRequest);
      setMsAccount(response.account);
      setAccessToken(response.accessToken);
      return response.accessToken;
    } catch (error) {
      console.warn('Acquire token silent failed, trying redirect...', error);
      return loginMicrosoft();
    }
  };

  const logoutMicrosoft = async () => {
    if (!msalInstance || !initialized) return;
    try {
      // Usar redirecionamento para logout para manter a consistência
      await msalInstance.logoutRedirect();
      setMsAccount(null);
      setAccessToken(null);
    } catch (error) {
      console.error('Microsoft logout failed:', error);
    }
  };

  const value = {
    loginMicrosoft,
    getMicrosoftToken,
    logoutMicrosoft,
    accessToken,
    msAccount,
    isConfigured: !!import.meta.env.VITE_MICROSOFT_CLIENT_ID,
    initialized
  };

  return (
    <MicrosoftAuthContext.Provider value={value}>
      {msalInstance && initialized ? (
        <MsalProvider instance={msalInstance}>
          <MicrosoftAuthInner setMsAccount={setMsAccount} setAccessToken={setAccessToken}>
            {children}
          </MicrosoftAuthInner>
        </MsalProvider>
      ) : children}
    </MicrosoftAuthContext.Provider>
  );
}

export const useMicrosoftAuth = () => {
  const context = useContext(MicrosoftAuthContext);
  if (!context) throw new Error('useMicrosoftAuth must be used within MicrosoftAuthProvider');
  return context;
};
