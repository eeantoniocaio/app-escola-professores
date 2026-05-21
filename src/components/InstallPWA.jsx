import React, { useState, useEffect } from 'react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Check if it's already installed or if the user dismissed it recently
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const dismissed = localStorage.getItem('pwa_banner_dismissed') === 'true';

    if (isInstalled || dismissed) return;

    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify the user they can add to home screen
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setShowInstallBanner(false);
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_banner_dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!showInstallBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#1e293b',
      color: '#fff',
      padding: '1rem 1.5rem',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      zIndex: 9999,
      maxWidth: '90%',
      width: '400px',
      animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ fontSize: '1.5rem' }}>📱</div>
        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4', flex: 1 }}>
          A direção da escola orienta que instale o app em seu computador ou celular. Irá funcionar melhor.
        </p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
        <button 
          onClick={handleDismiss}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer', padding: '0.5rem', fontWeight: 600 }}
        >
          Agora não
        </button>
        <button 
          onClick={handleInstallClick}
          style={{ background: '#3b82f6', border: 'none', color: '#fff', fontSize: '0.85rem', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, boxShadow: '0 2px 4px rgba(59,130,246,0.3)' }}
        >
          Instalar App
        </button>
      </div>
    </div>
  );
}
