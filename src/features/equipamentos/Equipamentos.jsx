import React, { useState, useEffect, useMemo } from 'react';
import { Wrench, Search, Plus, Edit2, Trash2, Users, FolderOpen, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';
import './Equipamentos.css';

// Cor azul padrão adotada para os modais e cards de salas
const ROOM_COLOR_DEFAULT = '#2B70C9';

export default function Equipamentos() {
  const navigate = useNavigate();
  const { userRole, userName } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('salas'); // 'salas' | 'dispositivos'
  const [loading, setLoading] = useState(true);

  // Dados do banco
  const [salas, setSalas] = useState([]);
  const [dispositivos, setDispositivos] = useState([]);

  // Termos de busca e filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondicao, setFilterCondicao] = useState('');
  const [filterSala, setFilterSala] = useState('');

  // Modais de Criação / Edição de Sala
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null); // null = criar, objeto = editar
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('');

  // Modais de Criação / Edição de Dispositivo
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null); // null = criar, objeto = editar
  const [deviceTipo, setDeviceTipo] = useState('');
  const [deviceNumEscola, setDeviceNumEscola] = useState('');
  const [deviceNumSerie, setDeviceNumSerie] = useState('');
  const [deviceSalaId, setDeviceSalaId] = useState('');
  const [deviceCondicao, setDeviceCondicao] = useState('Funcional');
  const [deviceObs, setDeviceObs] = useState('');

  // Modal de Detalhes da Sala (Floating)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Carregar dados iniciais
  const fetchData = async () => {
    setLoading(true);
    try {
      const [salasRes, dispRes] = await Promise.all([
        supabase.from('salas').select('*').order('nome'),
        supabase.from('dispositivos').select('*').order('tipo')
      ]);

      if (salasRes.error) throw salasRes.error;
      if (dispRes.error) throw dispRes.error;

      setSalas(salasRes.data || []);
      setDispositivos(dispRes.data || []);

      // Se a sala selecionada foi atualizada, atualizar a referência na UI
      if (selectedRoom) {
        const updatedSelected = salasRes.data.find(s => s.id === selectedRoom.id);
        if (updatedSelected) {
          setSelectedRoom(updatedSelected);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados de equipamentos:', err);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Contagem dinâmica de dispositivos por sala
  const deviceCounts = useMemo(() => {
    const counts = {};
    dispositivos.forEach(d => {
      if (d.sala_id) {
        counts[d.sala_id] = (counts[d.sala_id] || 0) + 1;
      }
    });
    return counts;
  }, [dispositivos]);

  // Filtragem de salas para a exibição na grade
  const filteredSalas = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return salas;
    return salas.filter(s => 
      s.nome.toLowerCase().includes(query) || 
      (s.descricao && s.descricao.toLowerCase().includes(query))
    );
  }, [salas, searchQuery]);

  // Mapeamento id_sala -> nome_sala para exibição simples
  const roomNameMap = useMemo(() => {
    const map = {};
    salas.forEach(s => {
      map[s.id] = s.nome;
    });
    return map;
  }, [salas]);

  // Filtragem de todos os dispositivos para exibição na tabela
  const filteredDispositivos = useMemo(() => {
    let result = dispositivos;

    const query = searchQuery.toLowerCase().trim();
    if (query) {
      result = result.filter(d => 
        d.tipo.toLowerCase().includes(query) ||
        (d.numero_escola && d.numero_escola.toLowerCase().includes(query)) ||
        (d.numero_serie && d.numero_serie.toLowerCase().includes(query)) ||
        (d.observacoes && d.observacoes.toLowerCase().includes(query))
      );
    }

    if (filterCondicao) {
      result = result.filter(d => d.condicao === filterCondicao);
    }

    if (filterSala) {
      result = result.filter(d => d.sala_id === filterSala);
    }

    return result;
  }, [dispositivos, searchQuery, filterCondicao, filterSala]);

  // Dispositivos pertencentes apenas à sala selecionada
  const selectedRoomDevices = useMemo(() => {
    if (!selectedRoom) return [];
    return dispositivos
      .filter(d => d.sala_id === selectedRoom.id)
      .sort((a, b) => a.tipo.localeCompare(b.tipo));
  }, [dispositivos, selectedRoom]);



  // ── AÇÕES DE SALAS (CRUD) ──

  const openCreateRoomModal = () => {
    setEditingRoom(null);
    setRoomName('');
    setRoomDesc('');
    setRoomCapacity('');
    setIsRoomModalOpen(true);
  };

  const openEditRoomModal = (e, sala) => {
    e.stopPropagation();
    setEditingRoom(sala);
    setRoomName(sala.nome);
    setRoomDesc(sala.descricao || '');
    setRoomCapacity(sala.capacidade || '');
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      showToast('O nome da sala é obrigatório', 'error');
      return;
    }

    const payload = {
      nome: roomName.trim(),
      descricao: roomDesc.trim() || null,
      capacidade: roomCapacity ? parseInt(roomCapacity, 10) : null
    };

    try {
      if (editingRoom) {
        // Atualizar
        const { error } = await supabase.from('salas').update(payload).eq('id', editingRoom.id);
        if (error) throw error;
        showToast('Sala updated com sucesso!');
      } else {
        // Criar
        const { error } = await supabase.from('salas').insert([payload]);
        if (error) throw error;
        showToast('Sala criada com sucesso!');
      }
      setIsRoomModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar sala', 'error');
    }
  };

  const handleDeleteRoom = async (e, salaId) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir esta sala? Os dispositivos nela alocados ficarão sem sala vinculada.')) return;

    try {
      const { error } = await supabase.from('salas').delete().eq('id', salaId);
      if (error) throw error;
      showToast('Sala excluída com sucesso!');
      if (selectedRoom?.id === salaId) {
        setIsDetailsModalOpen(false);
      }
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir sala', 'error');
    }
  };

  // ── AÇÕES DE DISPOSITIVOS (CRUD) ──

  const openCreateDeviceModal = () => {
    setEditingDevice(null);
    setDeviceTipo('');
    setDeviceNumEscola('');
    setDeviceNumSerie('');
    setDeviceSalaId(selectedRoom ? selectedRoom.id : '');
    setDeviceCondicao('Funcional');
    setDeviceObs('');
    setIsDeviceModalOpen(true);
  };

  const openEditDeviceModal = (device) => {
    setEditingDevice(device);
    setDeviceTipo(device.tipo);
    setDeviceNumEscola(device.numero_escola || '');
    setDeviceNumSerie(device.numero_serie || '');
    setDeviceSalaId(device.sala_id || '');
    setDeviceCondicao(device.condicao);
    setDeviceObs(device.observacoes || '');
    setIsDeviceModalOpen(true);
  };

  const handleSaveDevice = async (e) => {
    e.preventDefault();
    if (!deviceTipo.trim()) {
      showToast('O tipo do dispositivo é obrigatório', 'error');
      return;
    }

    const payload = {
      tipo: deviceTipo.trim(),
      numero_escola: deviceNumEscola.trim() || null,
      numero_serie: deviceNumSerie.trim() || null,
      sala_id: deviceSalaId || null,
      condicao: deviceCondicao,
      observacoes: deviceObs.trim() || null
    };

    try {
      if (editingDevice) {
        // Atualizar
        const { error } = await supabase.from('dispositivos').update(payload).eq('id', editingDevice.id);
        if (error) throw error;
        showToast('Equipamento atualizado com sucesso!');
      } else {
        // Criar
        const { error } = await supabase.from('dispositivos').insert([payload]);
        if (error) throw error;
        showToast('Equipamento adicionado com sucesso!');
      }
      setIsDeviceModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar equipamento', 'error');
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm('Deseja realmente remover este equipamento?')) return;

    try {
      const { error } = await supabase.from('dispositivos').delete().eq('id', deviceId);
      if (error) throw error;
      showToast('Equipamento removido com sucesso!');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover equipamento', 'error');
    }
  };



  // Helper para renderizar badges de condição
  const renderCondicaoBadge = (condicao) => {
    let className = 'condicao-badge ';
    if (condicao === 'Funcional') className += 'condicao-funcional';
    else if (condicao === 'Em manutenção') className += 'condicao-manutencao';
    else if (condicao === 'Danificado') className += 'condicao-danificado';
    else if (condicao === 'Garantia solicitada') className += 'condicao-garantia';
    else className += 'condicao-danificado-sem-garantia';

    return <span className={className}>{condicao}</span>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Carregando equipamentos...</div>
      </div>
    );
  }

  return (
    <div className="equipamentos-container">
      {/* Header Geral do Painel */}
      <div className="equipamentos-header">
        <div className="equipamentos-title-section">
          <button className="btn-back-home" onClick={() => navigate('/')} title="Voltar ao início">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Wrench size={28} color="var(--color-primary)" /> Controle de Equipamentos
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, marginTop: '0.25rem' }}>
              Gerencie as salas de informática, laboratórios e equipamentos de nossa escola.
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar principal (Salas vs Tabela Completa) */}
      <div className="tab-container">
        <button 
          onClick={() => { setActiveTab('salas'); setSearchQuery(''); }}
          className={`tab-button ${activeTab === 'salas' ? 'active' : ''}`}
        >
          Salas e Locais
        </button>
        <button 
          onClick={() => { setActiveTab('dispositivos'); setSearchQuery(''); }}
          className={`tab-button ${activeTab === 'dispositivos' ? 'active' : ''}`}
        >
          Todos os Dispositivos
        </button>
      </div>

      {/* Barra de pesquisa e botão nova sala na página principal */}
      {activeTab === 'salas' && (
        <div className="search-bar-row">
          <div className="search-input-wrapper">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar salas por nome..."
              className="search-input"
            />
            <Search className="search-icon" size={18} />
          </div>

          <div className="action-buttons-group">
            <button className="btn btn-primary" onClick={openCreateRoomModal}>
              <Plus size={16} /> Nova Sala
            </button>
          </div>
        </div>
      )}

      {/* ── TAB SALAS E LOCAIS (Grade de Cards) ── */}
      {activeTab === 'salas' && (
        filteredSalas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
            <FolderOpen size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-muted)' }}>Nenhuma sala encontrada</p>
          </div>
        ) : (
          <div className="salas-grid">
            {filteredSalas.map(sala => {
              const roomColor = ROOM_COLOR_DEFAULT;
              return (
                <div 
                  key={sala.id} 
                  className="sala-card"
                  onClick={() => { setSelectedRoom(sala); setDetailsTab('devices'); setIsDetailsModalOpen(true); }}
                  style={{ 
                    cursor: 'pointer',
                    borderTop: `5px solid ${roomColor}`
                  }}
                >
                  <div>
                    <div className="sala-card-header">
                      <h3 className="sala-card-title">{sala.nome}</h3>
                      <div className="card-actions-icons">
                        <button className="btn-icon" onClick={(e) => openEditRoomModal(e, sala)} title="Editar Sala">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-icon delete" onClick={(e) => handleDeleteRoom(e, sala.id)} title="Excluir Sala">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="sala-card-info">
                      <div className="sala-card-info-item">
                        <Wrench size={14} />
                        <span>{deviceCounts[sala.id] || 0} dispositivos cadastrados</span>
                      </div>
                    </div>
                  </div>

                  <div className="sala-card-footer">
                    <button className="btn-card-details" style={{ backgroundColor: `${roomColor}15`, color: roomColor }}>
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── TAB TODOS OS DISPOSITIVOS (Tabela Geral) ── */}
      {activeTab === 'dispositivos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Painel de Filtros para Dispositivos */}
          <div className="search-bar-row">
            <div className="search-input-wrapper">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar dispositivos por patrimônio, tipo ou série..."
                className="search-input"
              />
              <Search className="search-icon" size={18} />
            </div>

            <div className="action-buttons-group">
              <button className="btn btn-primary" onClick={openCreateDeviceModal}>
                <Plus size={16} /> Novo Dispositivo
              </button>
            </div>
          </div>

          <div className="controls-panel" style={{ margin: 0, padding: '1rem' }}>
            <div className="filters-group" style={{ gap: '0.75rem' }}>
              <select 
                value={filterCondicao}
                onChange={(e) => setFilterCondicao(e.target.value)}
                className="select-filter"
              >
                <option value="">Todas as condições</option>
                <option value="Funcional">Funcional</option>
                <option value="Em manutenção">Em manutenção</option>
                <option value="Danificado">Danificado</option>
                <option value="Garantia solicitada">Garantia solicitada</option>
                <option value="Danificado sem garantia">Danificado sem garantia</option>
              </select>

              <select 
                value={filterSala}
                onChange={(e) => setFilterSala(e.target.value)}
                className="select-filter"
              >
                <option value="">Todas as salas</option>
                {salas.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabela de Dispositivos */}
          {filteredDispositivos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
              <Wrench size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-muted)' }}>Nenhum equipamento encontrado</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="equipamentos-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Nº Patrimônio (Escola)</th>
                    <th>Nº Série</th>
                    <th>Local / Sala</th>
                    <th>Condição</th>
                    <th style={{ textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDispositivos.map(device => (
                    <tr key={device.id}>
                      <td style={{ fontWeight: 600 }}>{device.tipo}</td>
                      <td>{device.numero_escola || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Não definido</span>}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{device.numero_serie || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Não definido</span>}</td>
                      <td>{roomNameMap[device.sala_id] || <span style={{ color: 'var(--color-danger)', fontStyle: 'italic', fontWeight: 500 }}>Sem Sala</span>}</td>
                      <td>{renderCondicaoBadge(device.condicao)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button className="btn-icon" onClick={() => openEditDeviceModal(device)} title="Editar Equipamento">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDeleteDevice(device.id)} title="Remover Equipamento">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL FLUTUANTE: DETALHES COMPLETOS DA SALA (Estilo Turmas) ── */}
      {isDetailsModalOpen && selectedRoom && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', border: 'none', overflow: 'hidden' }}>
            
            {/* Cabeçalho do Modal Colorido usando a cor azul padrão dos modais */}
            <div style={{ 
              background: '#2B70C9',
              padding: '1.5rem 2rem',
              color: '#ffffff',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wrench size={22} color="#ffffff" /> {selectedRoom.nome}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsDetailsModalOpen(false)}
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

            {/* Conteúdo do Modal */}
            <div className="modal-body-scroll" style={{ background: 'var(--bg-secondary)', padding: '1.5rem' }}>
              
              {selectedRoomDevices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <Wrench size={32} style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Nenhum dispositivo cadastrado nesta sala.</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={openCreateDeviceModal}
                    style={{ marginTop: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  >
                    <Plus size={14} /> Vincular Equipamento
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={openCreateDeviceModal}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      <Plus size={14} /> Vincular Equipamento
                    </button>
                  </div>
                  {selectedRoomDevices.map((device, index) => (
                    <div 
                      key={device.id}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '0.75rem 1.25rem', 
                        background: '#ffffff', 
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 800, color: '#2B70C9', fontSize: '0.85rem', minWidth: '24px' }}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{device.tipo}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Patrimônio: {device.numero_escola || 'N/D'} • Série: {device.numero_serie || 'N/D'}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {renderCondicaoBadge(device.condicao)}
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="btn-icon" onClick={() => openEditDeviceModal(device)} title="Editar Equipamento">
                            <Edit2 size={12} />
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDeleteDevice(device.id)} title="Remover Equipamento">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="modal-footer-actions" style={{ background: '#ffffff', padding: '1rem 2rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsDetailsModalOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CRIAR / EDITAR SALA ── */}
      {isRoomModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {editingRoom ? 'Editar Sala / Local' : 'Cadastrar Nova Sala'}
              </h3>
              <button className="btn-icon" onClick={() => setIsRoomModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveRoom}>
              <div className="modal-body-scroll">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-input-group">
                    <label>Nome da Sala / Local <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input 
                      type="text" 
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="Ex: Sala 05, Auditório, Sala de Leitura"
                      className="form-text-input"
                      required
                    />
                  </div>
                  
                  <div className="form-input-group">
                    <label>Capacidade (Alunos)</label>
                    <input 
                      type="number" 
                      value={roomCapacity}
                      onChange={(e) => setRoomCapacity(e.target.value)}
                      placeholder="Ex: 35"
                      className="form-text-input"
                      min="1"
                    />
                  </div>

                  <div className="form-input-group">
                    <label>Descrição</label>
                    <textarea 
                      value={roomDesc}
                      onChange={(e) => setRoomDesc(e.target.value)}
                      placeholder="Breve descrição da utilidade ou particularidade deste local..."
                      className="form-textarea-input"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRoomModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRoom ? 'Salvar Alterações' : 'Criar Sala'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CRIAR / EDITAR DISPOSITIVO ── */}
      {isDeviceModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {editingDevice ? 'Editar Equipamento' : 'Adicionar Novo Equipamento'}
              </h3>
              <button className="btn-icon" onClick={() => setIsDeviceModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveDevice}>
              <div className="modal-body-scroll">
                <div className="form-grid">
                  <div className="form-input-group form-group-full">
                    <label>Tipo do Equipamento <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input 
                      type="text"
                      value={deviceTipo}
                      onChange={(e) => setDeviceTipo(e.target.value)}
                      placeholder="Ex: Notebook Positivo, Projetor Epson, TV LG 43"
                      className="form-text-input"
                      required
                    />
                  </div>

                  <div className="form-input-group">
                    <label>Nº Patrimônio (Escola)</label>
                    <input 
                      type="text"
                      value={deviceNumEscola}
                      onChange={(e) => setDeviceNumEscola(e.target.value)}
                      placeholder="Ex: 10, 34"
                      className="form-text-input"
                    />
                  </div>

                  <div className="form-input-group">
                    <label>Nº Série Fabricante</label>
                    <input 
                      type="text"
                      value={deviceNumSerie}
                      onChange={(e) => setDeviceNumSerie(e.target.value)}
                      placeholder="Ex: 4AB59WH20"
                      className="form-text-input"
                    />
                  </div>

                  <div className="form-input-group">
                    <label>Local / Sala Vinculada</label>
                    <select
                      value={deviceSalaId}
                      onChange={(e) => setDeviceSalaId(e.target.value)}
                      className="form-select-input"
                    >
                      <option value="">Sem sala vinculada</option>
                      {salas.map(s => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-input-group">
                    <label>Condição de Funcionamento</label>
                    <select
                      value={deviceCondicao}
                      onChange={(e) => setDeviceCondicao(e.target.value)}
                      className="form-select-input"
                    >
                      <option value="Funcional">Funcional</option>
                      <option value="Em manutenção">Em manutenção</option>
                      <option value="Danificado">Danificado</option>
                      <option value="Garantia solicitada">Garantia solicitada</option>
                      <option value="Danificado sem garantia">Danificado sem garantia</option>
                    </select>
                  </div>

                  <div className="form-input-group form-group-full">
                    <label>Observações</label>
                    <textarea 
                      value={deviceObs}
                      onChange={(e) => setDeviceObs(e.target.value)}
                      placeholder="Observações de reparos, especificações ou detalhes físicos..."
                      className="form-textarea-input"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsDeviceModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDevice ? 'Salvar Alterações' : 'Salvar Equipamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
