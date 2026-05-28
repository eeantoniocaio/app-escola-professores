import React, { createContext, useContext, useState, useEffect } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: import.meta.env.VITE_MICROSOFT_REDIRECT_URI || 'http://localhost:3006/',
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  }
};

let pca = null;
if (msalConfig.auth.clientId) {
  try {
    pca = new PublicClientApplication(msalConfig);
  } catch (error) {
    console.error('Failed to initialize MSAL:', error);
  }
}

const MicrosoftAuthContext = createContext(null);

export function MicrosoftAuthProvider({ children }) {
  const [msalInstance, setMsalInstance] = useState(pca);
  const [accessToken, setAccessToken] = useState(null);
  const [msAccount, setMsAccount] = useState(null);

  useEffect(() => {
    if (!msalInstance && import.meta.env.VITE_MICROSOFT_CLIENT_ID) {
      try {
        const newPca = new PublicClientApplication(msalConfig);
        setMsalInstance(newPca);
      } catch (err) {
        console.error('Lazy MSAL init failed:', err);
      }
    }
  }, [msalInstance]);

  const loginMicrosoft = async () => {
    if (!msalInstance) {
      alert('Por favor, configure o VITE_MICROSOFT_CLIENT_ID no arquivo .env para ativar a integração com o OneDrive.');
      return null;
    }

    try {
      const loginRequest = {
        scopes: ['User.Read', 'Files.Read', 'Files.Read.All']
      };
      const response = await msalInstance.loginPopup(loginRequest);
      setMsAccount(response.account);
      setAccessToken(response.accessToken);
      return response.accessToken;
    } catch (error) {
      console.error('Microsoft login failed:', error);
      return null;
    }
  };

  const getMicrosoftToken = async () => {
    if (!msalInstance) return null;
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
      console.warn('Acquire token silent failed, trying popup...', error);
      return loginMicrosoft();
    }
  };

  const logoutMicrosoft = async () => {
    if (!msalInstance) return;
    try {
      await msalInstance.logoutPopup();
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
    isConfigured: !!msalInstance
  };

  return (
    <MicrosoftAuthContext.Provider value={value}>
      {msalInstance ? (
        <MsalProvider instance={msalInstance}>
          {children}
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
