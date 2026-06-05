import React, { useState } from 'react'
import { supabase } from '../../shared/services/supabase'

export default function Login({ setSession }) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        const allowedDomains = ['@prof.educacao.sp.gov.br', '@servidor.educacao.sp.gov.br'];
        const emailLower = email.trim().toLowerCase();
        
        const hasAllowedDomain = allowedDomains.some(domain => emailLower.endsWith(domain)) || 
                                 emailLower === 'e017590a@educacao.sp.gov.br';
        
        if (!hasAllowedDomain) {
          throw new Error('Apenas emails pré-autorizados podem realizar o cadastro.');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError
        setMessage('Cadastro realizado! Verifique seu e-mail ou faça login agora.')
        setIsSignUp(false)
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        // session is managed by onAuthStateChange in App.jsx
      }
    } catch (err) {
      let errorMsg = err.message || 'Ocorreu um erro durante a autenticação.'
      if (errorMsg === 'Email not confirmed') {
        errorMsg = 'Vá até a sua caixa de email e confirme o cadastro'
      } else if (errorMsg === 'Invalid login credentials') {
        errorMsg = 'E-mail ou senha incorretos.'
      } else if (errorMsg === 'User already registered') {
        errorMsg = 'Este e-mail já está cadastrado.'
      }
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (err) throw err
    } catch (err) {
      setError(err.message || 'Erro ao iniciar autenticação com o Google.')
      setLoading(false)
    }
  }

  return (
    <div className="login-container" style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      minHeight: '100vh', backgroundColor: 'var(--bg-color)'
    }}>
      <div className="login-box" style={{
        backgroundColor: 'white', padding: '2.5rem', borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)', maxWidth: '400px', width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--primary-color)', fontSize: '2rem' }}>
            {isSignUp ? 'Criar Conta' : 'Portal de Evidências'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            E.E. Antônio Caio
          </p>
        </div>

        {error && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
        {message && <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{message}</div>}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-color)' }}>E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-color)' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Sua senha"
                style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', 
                  background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: '1.1rem'
                }}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Aguarde...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>

        {!isSignUp && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', color: '#9ca3af' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
              <span style={{ padding: '0 0.75rem', fontSize: '0.8rem', fontWeight: '500' }}>ou</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="btn"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#f9fafb' }}
              onMouseOut={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#ffffff' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#EA4335" d="M9 3.58c1.12 0 2.12.39 2.92 1.15l2.19-2.19C12.78.89 11.02 0 9 0 5.48 0 2.52 2.02 1.13 4.96l2.82 2.18C4.6 5.16 6.6 3.58 9 3.58z"/>
                <path fill="#4285F4" d="M17.64 9.2c0-.65-.06-1.28-.16-1.89H9v3.58h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.79 2.16c1.63-1.51 2.57-3.73 2.57-6.55z"/>
                <path fill="#FBBC05" d="M3.95 10.86c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2L1.13 4.28C.41 5.72 0 7.31 0 9s.41 3.28 1.13 4.72l2.82-2.86z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.79-2.16c-.78.52-1.78.83-2.92.83-2.4 0-4.43-1.58-5.15-3.72l-2.82 2.18C2.52 15.98 5.48 18 9 18z"/>
              </svg>
              Entrar com o Google
            </button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          {isSignUp ? (
            <p>Já possui uma conta? <button onClick={() => setIsSignUp(false)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }}>Faça login</button></p>
          ) : (
            <p>Não possui uma conta? <button onClick={() => setIsSignUp(true)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }}>Cadastre-se</button></p>
          )}
        </div>
      </div>
    </div>
  )
}
