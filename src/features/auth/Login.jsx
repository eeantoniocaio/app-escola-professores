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
        
        const hasAllowedDomain = allowedDomains.some(domain => emailLower.endsWith(domain));
        
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
