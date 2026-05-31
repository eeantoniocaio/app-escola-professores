import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Calendar, MapPin, Mail, Phone, Clipboard, RefreshCw, AlertTriangle, LogOut, FileText, Printer, Share2 } from 'lucide-react';
import { useGoogleAuth } from '../../app/providers/GoogleAuthProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import useFrequenciaAluno from '../../hooks/useFrequenciaAluno';
import FrequenciaAlunoCard from './FrequenciaAlunoCard';
import { findPhotoInMap } from '../../services/photoService';

// Função determinística de Hash para geração de dados cadastrais consistentes
const getSeed = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const randomFromSeed = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const getMockStudentDetails = (aluno) => {
  const seed = getSeed(aluno.nome);
  
  // R.A. (Registro do Aluno)
  const ra = String(100000000 + (seed % 900000000));
  
  // CPF e RG mockados
  const rg = `${String(10 + (seed % 89)).padStart(2, '0')}.${String(100 + (seed % 900)).padStart(3, '0')}.${String(100 + (seed % 899)).padStart(3, '0')}-${seed % 10}`;
  const cpf = `${String(100 + (seed % 900)).padStart(3, '0')}.${String(100 + ((seed + 2) % 900)).padStart(3, '0')}.${String(100 + ((seed + 4) % 900)).padStart(3, '0')}-${String(seed % 99).padStart(2, '0')}`;

  // Idade e nascimento baseados na série
  let age = 11;
  const tNome = aluno.turma.toLowerCase();
  if (tNome.startsWith('7')) age = 12;
  else if (tNome.startsWith('8')) age = 13;
  else if (tNome.startsWith('9')) age = 14;
  else if (tNome.startsWith('1')) age = 15;
  else if (tNome.startsWith('2')) age = 16;
  else if (tNome.startsWith('3')) age = 17;
  
  const birthYear = new Date().getFullYear() - age;
  const birthMonth = 1 + (seed % 12);
  const birthDay = 1 + (seed % 28);
  const birthDateStr = `${String(birthDay).padStart(2, '0')}/${String(birthMonth).padStart(2, '0')}/${birthYear}`;
  
  // Nomes de responsáveis mockados
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes'];
  const parentFirstNames = ['Maria', 'Ana', 'Carlos', 'José', 'João', 'Marcos', 'Sandra', 'Regina', 'Sônia', 'Antônio'];
  const parentName = `${parentFirstNames[seed % parentFirstNames.length]} ${lastNames[(seed + 3) % lastNames.length]} ${aluno.nome.split(' ').pop()}`;
  
  const phone = `(11) 9${10000000 + (seed % 90000000)}`;
  const email = `${aluno.nome.toLowerCase().split(' ').join('.')}@escola.sp.gov.br`;
  
  // Endereço mockado
  const streetNames = ['Av. Paulista', 'Rua das Flores', 'Alameda Santos', 'Rua Augusta', 'Av. Consolação', 'Rua Bahia', 'Av. Tiradentes'];
  const address = `${streetNames[seed % streetNames.length]}, ${10 + (seed % 990)} - Jardim América, São Paulo - SP`;

  const genders = ['Masculino', 'Feminino'];
  const gender = genders[seed % genders.length];
  
  // Boletim Escolar mockado
  const subjects = [
    'Língua Portuguesa',
    'Matemática',
    'Ciências da Natureza',
    'História',
    'Geografia',
    'Arte',
    'Educação Física',
    'Língua Inglesa'
  ];
  
  let currentSeed = seed;
  const boletim = subjects.map(subject => {
    const b1 = parseFloat((5.5 + randomFromSeed(currentSeed++) * 4.5).toFixed(1));
    const b2 = parseFloat((5.5 + randomFromSeed(currentSeed++) * 4.5).toFixed(1));
    const b3 = parseFloat((5.5 + randomFromSeed(currentSeed++) * 4.5).toFixed(1));
    const b4 = parseFloat((5.5 + randomFromSeed(currentSeed++) * 4.5).toFixed(1));
    const media = parseFloat(((b1 + b2 + b3 + b4) / 4).toFixed(1));
    const status = media >= 6.0 ? 'Aprovado' : 'Em Recuperação';
    return { subject, b1, b2, b3, b4, media, status };
  });

  return {
    ra,
    rg,
    cpf,
    birthDate: birthDateStr,
    parentName,
    phone,
    email,
    address,
    gender,
    boletim
  };
};

export default function FichaAlunoModal({ aluno, isOpen, onClose, photosMap }) {
  const { loginGoogle, logoutGoogle, accessToken, googleAccount, isConfigured } = useGoogleAuth();
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('cadastro'); // 'cadastro' | 'boletim' | 'frequencia'
  
  // Auto-autenticação para frequência ao selecionar a aba correspondente
  useEffect(() => {
    if (isOpen && activeTab === 'frequencia' && isConfigured && !accessToken) {
      loginGoogle();
    }
  }, [isOpen, activeTab, isConfigured, accessToken, loginGoogle]);

  const {
    loading: freqLoading,
    error: freqError,
    files,
    selectedFileId,
    selectedFileName,
    worksheets,
    selectedSheetName,
    attendanceData,
    isSearchingFiles,
    fetchExcelFiles,
    handleSelectFile,
    handleResetFile,
    handleSheetChange,
    handleRefresh: handleFreqRefresh
  } = useFrequenciaAluno(aluno, isOpen);

  if (!isOpen) return null;

  const photoUrl = findPhotoInMap(aluno.nome, photosMap);
  const details = getMockStudentDetails(aluno);

  let raDisplay = '---';
  let birthDateDisplay = '---';
  let ageDisplay = '---';

  if (freqLoading) {
    raDisplay = 'Carregando R.A...';
    birthDateDisplay = 'Carregando...';
    ageDisplay = 'Carregando...';
  } else if (attendanceData) {
    raDisplay = attendanceData.ra || 'Não informado na planilha';
    birthDateDisplay = attendanceData.birthDate || 'Não informado na planilha';
    ageDisplay = attendanceData.age || 'Não informado na planilha';
  } else if (!isConfigured) {
    raDisplay = 'N/D (Sheets não config.)';
    birthDateDisplay = 'N/D (Sheets não config.)';
    ageDisplay = 'N/D (Sheets não config.)';
  } else if (!accessToken) {
    raDisplay = 'N/D (Pendente de Login)';
    birthDateDisplay = 'N/D (Pendente de Login)';
    ageDisplay = 'N/D (Pendente de Login)';
  } else if (freqError) {
    raDisplay = 'Não encontrado no Sheets';
    birthDateDisplay = 'Não encontrado no Sheets';
    ageDisplay = 'Não encontrado no Sheets';
  }

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareText = `Ficha do Aluno: ${aluno.nome}\nTurma: ${aluno.turma}\nR.A.: ${raDisplay}\nNascimento: ${birthDateDisplay}\nIdade: ${ageDisplay}\nResponsável: ${details.parentName}\nTelefone: ${details.phone}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ficha do Aluno - ${aluno.nome}`,
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Dados da Ficha copiados para a área de transferência!');
      } catch (err) {
        alert('Não foi possível compartilhar ou copiar os dados.');
      }
    }
  };

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden', border: 'none' }}>
        
        {/* Cabeçalho do Prontuário */}
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          padding: '1.5rem 2rem',
          color: '#ffffff',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              {/* Foto Ampliada */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid #ffffff',
                boxShadow: 'var(--shadow-md)',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {photoUrl ? (
                  <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={32} color="#d97706" />
                )}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
                  {aluno.nome}
                </h3>
                <p style={{ margin: '0.2rem 0 0', opacity: 0.9, fontSize: '0.88rem', fontWeight: 500 }}>
                  Turma: {aluno.turma} • R.A: {raDisplay}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              style={{ 
                background: 'rgba(255, 255, 255, 0.2)', 
                border: 'none', 
                borderRadius: '50%', 
                width: '32px', 
                height: '32px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#ffffff', 
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra de Abas */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--bg-secondary)',
          padding: '0 2rem'
        }}>
          <button 
            onClick={() => setActiveTab('cadastro')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '3px solid transparent',
              padding: '1rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: activeTab === 'cadastro' ? '#d97706' : 'var(--text-muted)',
              borderBottomColor: activeTab === 'cadastro' ? '#d97706' : 'transparent',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            Ficha Cadastral
          </button>
          <button 
            onClick={() => setActiveTab('boletim')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '3px solid transparent',
              padding: '1rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: activeTab === 'boletim' ? '#d97706' : 'var(--text-muted)',
              borderBottomColor: activeTab === 'boletim' ? '#d97706' : 'transparent',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            Boletim Escolar
          </button>
          <button 
            onClick={() => setActiveTab('frequencia')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '3px solid transparent',
              padding: '1rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: activeTab === 'frequencia' ? '#d97706' : 'var(--text-muted)',
              borderBottomColor: activeTab === 'frequencia' ? '#d97706' : 'transparent',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            Frequência
          </button>
        </div>

        {/* Corpo do Modal (com Scroll) */}
        <div style={{
          padding: '2rem',
          overflowY: 'auto',
          flex: 1,
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          
          {/* TAB 1: FICHA CADASTRAL */}
          {activeTab === 'cadastro' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
              
              {/* Seção Dados Pessoais */}
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h4 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontSize: '1rem', fontWeight: 700 }}>
                  <User size={18} /> Dados Pessoais
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Nome Completo</label>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>{aluno.nome}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Data de Nascimento</label>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} color="var(--text-light)" /> {birthDateDisplay}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Idade</label>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>{ageDisplay}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>R.A. (Registro do Aluno)</label>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>{raDisplay}</div>
                  </div>
                </div>
              </div>

              {/* Seção Contato & Endereço */}
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h4 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontSize: '1rem', fontWeight: 700 }}>
                  <Phone size={18} /> Dados de Contato & Responsáveis
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Responsável Legal</label>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>{details.parentName}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Telefone do Responsável</label>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={14} color="var(--text-light)" /> {details.phone}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>E-mail para Recados</label>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', wordBreak: 'break-all' }}>
                      <Mail size={14} color="var(--text-light)" style={{ flexShrink: 0 }} /> {details.email}
                    </div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Endereço Residencial</label>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                      <MapPin size={14} color="var(--text-light)" style={{ marginTop: '0.15rem', flexShrink: 0 }} /> {details.address}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: BOLETIM ESCOLAR */}
          {activeTab === 'boletim' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontSize: '1rem', fontWeight: 700 }}>
                    <Clipboard size={18} /> Histórico de Notas (Boletim)
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ano Letivo: {new Date().getFullYear()}</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Componente Curricular</th>
                        <th style={{ padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>1º Bim</th>
                        <th style={{ padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>2º Bim</th>
                        <th style={{ padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>3º Bim</th>
                        <th style={{ padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>4º Bim</th>
                        <th style={{ padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>Média</th>
                        <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.boletim.map((bp, index) => (
                        <tr key={index} style={{ borderBottom: index === details.boletim.length - 1 ? 'none' : '1px solid var(--border-light)' }}>
                          <td style={{ padding: '1rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{bp.subject}</td>
                          <td style={{ padding: '1rem 1rem', fontSize: '0.9rem', textAlign: 'center', color: bp.b1 < 6 ? 'var(--color-danger)' : 'var(--text-main)' }}>{bp.b1}</td>
                          <td style={{ padding: '1rem 1rem', fontSize: '0.9rem', textAlign: 'center', color: bp.b2 < 6 ? 'var(--color-danger)' : 'var(--text-main)' }}>{bp.b2}</td>
                          <td style={{ padding: '1rem 1rem', fontSize: '0.9rem', textAlign: 'center', color: bp.b3 < 6 ? 'var(--color-danger)' : 'var(--text-main)' }}>{bp.b3}</td>
                          <td style={{ padding: '1rem 1rem', fontSize: '0.9rem', textAlign: 'center', color: bp.b4 < 6 ? 'var(--color-danger)' : 'var(--text-main)' }}>{bp.b4}</td>
                          <td style={{ padding: '1rem 1rem', fontSize: '0.95rem', fontWeight: 800, textAlign: 'center', color: bp.media < 6 ? 'var(--color-danger)' : 'var(--color-success)' }}>{bp.media}</td>
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: bp.status === 'Aprovado' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                              color: bp.status === 'Aprovado' ? 'var(--color-success)' : 'var(--color-danger)'
                            }}>
                              {bp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FREQUÊNCIA */}
          {activeTab === 'frequencia' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
              
              {/* Estado A: Sem Client ID do Google */}
              {!isConfigured ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-warning)', color: 'var(--color-warning)' }}>
                  <AlertTriangle size={32} style={{ marginBottom: '0.75rem' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>Google Client ID não configurado</div>
                  <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-main)', lineHeight: 1.4 }}>
                    Insira o Client ID do seu aplicativo do Google no arquivo <strong>.env</strong> para ativar a busca automática de presença diretamente do Google Sheets.
                  </p>
                </div>
              ) : !accessToken ? (
                /* Estado B: Desconectado */
                <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" style={{ height: '36px' }} />
                    <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Sheets</span>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>Conectar ao Google Sheets</h4>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: 1.4 }}>
                      Visualize o espelho real de frequência bimestral sincronizado diretamente de suas planilhas de chamadas no Google Drive.
                    </p>
                  </div>
                  <button 
                    className="btn" 
                    onClick={loginGoogle} 
                    style={{ 
                      padding: '0.75rem 1.5rem', 
                      fontWeight: 700,
                      backgroundColor: '#ffffff',
                      border: '1px solid #dadce0',
                      color: '#3c4043',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      boxShadow: '0 1px 3px rgba(60,64,67, 0.3), 0 4px 8px 3px rgba(60,64,67, 0.15)',
                      cursor: 'pointer',
                      borderRadius: '24px',
                      fontSize: '0.9rem',
                      transition: 'background-color 0.2s, box-shadow 0.2s, transform 0.2s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f8f9fa'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="" style={{ height: '18px' }} />
                    Conectar Conta Google
                  </button>
                </div>
              ) : (
                /* Estado C: Conectado. Mostrar planilha selecionada e card */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {googleAccount?.picture && (
                        <img src={googleAccount.picture} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                      )}
                      Conectado como: <strong>{googleAccount?.name || googleAccount?.email}</strong>
                    </span>
                    <button onClick={logoutGoogle} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                      <LogOut size={14} /> Desconectar
                    </button>
                  </div>

                  {!selectedFileId ? (
                    /* Selecionar Planilha */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#ffffff', border: '1px solid var(--border-light)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                      <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>Selecione a Planilha de Frequência</h4>
                      {isSearchingFiles ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>Buscando planilhas no Drive...</div>
                      ) : files.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                          Nenhuma planilha Sheets encontrada no seu Drive.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                          {files.map(file => (
                            <button
                              key={file.id}
                              onClick={() => handleSelectFile(file)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.55rem 0.75rem',
                                border: 'none',
                                background: 'transparent',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                width: '100%',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={16} color="var(--color-primary)" /> {file.name}
                              </span>
                              <ChevronRight size={16} color="var(--text-light)" />
                            </button>
                          ))}
                        </div>
                      )}
                      <button onClick={fetchExcelFiles} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', alignSelf: 'flex-start', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <RefreshCw size={12} /> Atualizar lista de planilhas
                      </button>
                    </div>
                  ) : (
                    /* Mostrar Dados da Planilha */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem', maxWidth: '60%' }}>
                          <FileText size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFileName}</span>
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn" 
                            onClick={handleFreqRefresh} 
                            disabled={freqLoading}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', margin: 0, background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <RefreshCw size={12} className={freqLoading ? 'spin-animation' : ''} />
                            <span>Atualizar</span>
                          </button>
                          <button className="btn" onClick={handleResetFile} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', margin: 0, background: 'var(--bg-secondary)' }}>
                            Mudar Planilha
                          </button>
                        </div>
                      </div>

                      {freqLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Buscando notas e presença...</div>
                      ) : freqError ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}>
                          <AlertTriangle size={24} style={{ marginBottom: '0.5rem' }} />
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{freqError}</div>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                            Verifique se o aluno está matriculado e seu nome bate exatamente com a planilha de chamada.
                          </p>
                        </div>
                      ) : attendanceData ? (
                        <FrequenciaAlunoCard data={attendanceData} />
                      ) : null}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Rodapé da Ficha */}
        <div style={{
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border-light)',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {(userRole === 'secretaria' || userRole === 'gestao') && (
              <>
                <button 
                  className="btn btn-primary" 
                  onClick={handlePrint}
                  style={{ 
                    margin: 0, 
                    padding: '0.55rem 1.25rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    background: '#d97706',
                    borderColor: '#d97706',
                    color: '#ffffff'
                  }}
                >
                  <Printer size={16} />
                  <span>Imprimir</span>
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleShare}
                  style={{ 
                    margin: 0, 
                    padding: '0.55rem 1.25rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-main)'
                  }}
                >
                  <Share2 size={16} />
                  <span>Compartilhar</span>
                </button>
              </>
            )}
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ margin: 0, padding: '0.55rem 1.25rem' }}>
            Fechar Prontuário
          </button>
        </div>

      </div>

      {/* Área exclusiva para impressão (A4) */}
      <div className="print-report-only">
        {/* Cabeçalho Oficial */}
        <div style={{
          borderBottom: '2px solid #000000',
          paddingBottom: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '18pt', fontWeight: 'bold', textTransform: 'uppercase' }}>E.E. ANTÔNIO CAIO</h1>
            <p style={{ margin: '0.2rem 0 0', fontSize: '11pt', color: '#555555', fontWeight: 600 }}>
              Ficha de Prontuário e Histórico Escolar
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '10pt', color: '#555555' }}>
            Emissão: {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>

        {/* Dados Principais do Aluno e Foto */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
          {photoUrl && (
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '2px solid #000000',
              flexShrink: 0
            }}>
              <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '11pt' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <strong>Nome Completo:</strong> {aluno.nome}
            </div>
            <div>
              <strong>Turma:</strong> {aluno.turma}
            </div>
            <div>
              <strong>R.A. (Registro do Aluno):</strong> {raDisplay}
            </div>
            <div>
              <strong>Data de Nascimento:</strong> {birthDateDisplay}
            </div>
            <div>
              <strong>Idade:</strong> {ageDisplay}
            </div>
          </div>
        </div>

        {/* Dados de Contato e Responsáveis */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid #000000', paddingBottom: '0.25rem', marginBottom: '0.75rem', fontSize: '12pt', fontWeight: 'bold' }}>
            Dados de Contato & Responsáveis
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', fontSize: '10.5pt' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <strong>Responsável Legal:</strong> {details.parentName}
            </div>
            <div>
              <strong>Telefone:</strong> {details.phone}
            </div>
            <div>
              <strong>E-mail:</strong> {details.email}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <strong>Endereço:</strong> {details.address}
            </div>
          </div>
        </div>

        {/* Boletim Escolar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid #000000', paddingBottom: '0.25rem', marginBottom: '0.75rem', fontSize: '12pt', fontWeight: 'bold' }}>
            Boletim Escolar
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2', borderBottom: '1.5px solid #000000' }}>
                <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'left' }}>Componente Curricular</th>
                <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>1º Bim</th>
                <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>2º Bim</th>
                <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>3º Bim</th>
                <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>4º Bim</th>
                <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>Média</th>
                <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>Situação</th>
              </tr>
            </thead>
            <tbody>
              {details.boletim.map((bp, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #000000' }}>
                  <td style={{ border: '1px solid #000000', padding: '6px', fontWeight: 'bold' }}>{bp.subject}</td>
                  <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{bp.b1}</td>
                  <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{bp.b2}</td>
                  <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{bp.b3}</td>
                  <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{bp.b4}</td>
                  <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{bp.media}</td>
                  <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{bp.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Frequência */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ borderBottom: '1px solid #000000', paddingBottom: '0.25rem', marginBottom: '0.75rem', fontSize: '12pt', fontWeight: 'bold' }}>
            Frequência e Assiduidade
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', fontSize: '10pt', textAlign: 'center' }}>
            <div style={{ border: '1px solid #000000', padding: '8px', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8pt', textTransform: 'uppercase', marginBottom: '4px' }}>1º Bimestre</div>
              <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{attendanceData ? attendanceData.frequencia1Bimestre : '---'}</div>
            </div>
            <div style={{ border: '1px solid #000000', padding: '8px', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8pt', textTransform: 'uppercase', marginBottom: '4px' }}>2º Bimestre</div>
              <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{attendanceData ? attendanceData.frequencia2Bimestre : '---'}</div>
            </div>
            <div style={{ border: '1px solid #000000', padding: '8px', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8pt', textTransform: 'uppercase', marginBottom: '4px' }}>3º Bimestre</div>
              <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{attendanceData ? attendanceData.frequencia3Bimestre : '---'}</div>
            </div>
            <div style={{ border: '1px solid #000000', padding: '8px', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8pt', textTransform: 'uppercase', marginBottom: '4px' }}>4º Bimestre</div>
              <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{attendanceData ? attendanceData.frequencia4Bimestre : '---'}</div>
            </div>
            <div style={{ border: '1px solid #000000', padding: '8px', borderRadius: '4px', backgroundColor: '#f2f2f2' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8pt', textTransform: 'uppercase', marginBottom: '4px' }}>Freq. Final</div>
              <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{attendanceData ? attendanceData.frequenciaFinal : '---'}</div>
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '10.5pt', textAlign: 'right' }}>
            <strong>Total de Faltas no Ano:</strong> {attendanceData ? attendanceData.totalFaltas : 0} falta(s)
          </div>
        </div>

        {/* Assinaturas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '4rem', fontSize: '10pt', textAlign: 'center' }}>
          <div>
            <div style={{ borderTop: '1px solid #000000', width: '200px', margin: '0 auto', paddingTop: '4px' }}>
              Secretaria Escolar
            </div>
          </div>
          <div>
            <div style={{ borderTop: '1px solid #000000', width: '200px', margin: '0 auto', paddingTop: '4px' }}>
              Direção de Escola
            </div>
          </div>
        </div>

        {/* Estilos CSS embutidos */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media screen {
            .print-report-only {
              display: none !important;
            }
          }
          @media print {
            #root {
              display: none !important;
            }
            .modal-overlay {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              background: transparent !important;
              display: block !important;
              overflow: visible !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .modal-content {
              box-shadow: none !important;
              border: none !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              max-height: none !important;
              height: auto !important;
              background: white !important;
            }
            .modal-content > *:not(.print-report-only) {
              display: none !important;
            }
            .print-report-only {
              display: block !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              padding: 15mm !important;
              box-sizing: border-box !important;
            }
          }
        ` }} />
      </div>
    </div>,
    document.body
  );
}
