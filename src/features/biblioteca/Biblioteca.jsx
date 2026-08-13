import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Search, Plus, Edit2, Trash2, X, ArrowLeft, RefreshCw, 
  AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Layers, Tag,
  AlertCircle, ShieldAlert, Package, Wrench, QrCode, Printer, Camera,
  ClipboardList, Calendar, UserCheck, Clock, FileText
} from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';
import BibliotecaQrScanner from './BibliotecaQrScanner';
import NovoEmprestimoModal from './NovoEmprestimoModal';
import './Biblioteca.css';

export default function Biblioteca() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { showToast } = useToast();

  const isAuthorized = userRole === 'gestao' || userRole === 'biblioteca' || userRole === 'secretaria';

  // Aba Ativa: 'acervo' | 'emprestimos'
  const [activeTab, setActiveTab] = useState('acervo');

  // ── ESTADOS DA ABA ACERVO ──
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [booksError, setBooksError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShelf, setFilterShelf] = useState('');
  const [shelves, setShelves] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);

  // Modal Cadastro / Edição de Livro
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookShelf, setBookShelf] = useState('');
  const [savingBook, setSavingBook] = useState(false);
  const [duplicateConfirmData, setDuplicateConfirmData] = useState(null);

  // Modal Gerenciamento de Exemplares
  const [selectedBookForExemplares, setSelectedBookForExemplares] = useState(null);
  const [exemplares, setExemplares] = useState([]);
  const [loadingExemplares, setLoadingExemplares] = useState(false);
  const [newExemplarCode, setNewExemplarCode] = useState('');
  const [addingExemplar, setAddingExemplar] = useState(false);
  const [selectedExemplarIds, setSelectedExemplarIds] = useState([]);

  // Modal Scanner Câmera (Sprint 3B)
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Modal QR Code Único e Impressão Lote (Sprint 3A)
  const [singleQrModalData, setSingleQrModalData] = useState(null);
  const [batchPrintModalData, setBatchPrintModalData] = useState(null);

  // ── ESTADOS DA ABA EMPRÉSTIMOS ATIVOS (Sprint 4) ──
  const [activeLoans, setActiveLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [loansSearchQuery, setLoansSearchQuery] = useState('');
  const [isNovoEmprestimoOpen, setIsNovoEmprestimoOpen] = useState(false);

  // Buscar Prateleiras Cadastradas
  const fetchShelves = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('livros').select('prateleira');
      if (error) throw error;
      if (data) {
        const uniqueShelves = [...new Set(data.map(item => item.prateleira.trim()))].sort();
        setShelves(uniqueShelves);
      }
    } catch (err) {
      console.error('Erro ao carregar prateleiras:', err);
    }
  }, []);

  // Buscar Livros do Acervo
  const fetchBooks = useCallback(async () => {
    setLoadingBooks(true);
    setBooksError(null);
    try {
      let query = supabase
        .from('livros')
        .select('id, titulo, autor, prateleira, created_at, exemplares_livros(id, status)', { count: 'exact' });

      if (searchQuery.trim()) {
        const term = `%${searchQuery.trim()}%`;
        query = query.or(`titulo.ilike.${term},autor.ilike.${term}`);
      }

      if (filterShelf) {
        query = query.eq('prateleira', filterShelf);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.order('titulo', { ascending: true }).range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      if (data) {
        const formattedBooks = data.map(book => {
          const exemplaresList = book.exemplares_livros || [];
          const totalExemplares = exemplaresList.length;
          const disponiveisCount = exemplaresList.filter(e => e.status === 'disponivel').length;
          return {
            id: book.id,
            titulo: book.titulo,
            autor: book.autor,
            prateleira: book.prateleira,
            totalExemplares,
            disponiveisCount
          };
        });

        setBooks(formattedBooks);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error('Erro ao buscar livros:', err);
      setBooksError('Não foi possível carregar o acervo de livros.');
    } finally {
      setLoadingBooks(false);
    }
  }, [searchQuery, filterShelf, page, pageSize]);

  // Buscar Empréstimos Ativos (Sprint 4)
  const fetchActiveLoans = useCallback(async () => {
    setLoadingLoans(true);
    try {
      const { data, error } = await supabase
        .from('emprestimos_livros')
        .select('id, data_retirada, data_prevista_devolucao, status, observacoes, alunos(id, nome, turma, ra), exemplares_livros(codigo_exemplar, livros(titulo, autor, prateleira))')
        .eq('status', 'ativo')
        .order('data_prevista_devolucao', { ascending: true });

      if (error) throw error;

      if (data) {
        setActiveLoans(data);
      }
    } catch (err) {
      console.error('Erro ao carregar empréstimos ativos:', err);
      showToast('Erro ao carregar os empréstimos ativos.', 'error');
    } finally {
      setLoadingLoans(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isAuthorized) {
      if (activeTab === 'acervo') {
        fetchBooks();
        fetchShelves();
      } else if (activeTab === 'emprestimos') {
        fetchActiveLoans();
      }
    }
  }, [isAuthorized, activeTab, fetchBooks, fetchShelves, fetchActiveLoans]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleShelfChange = (val) => {
    setFilterShelf(val);
    setPage(1);
  };

  const openNewBookModal = () => {
    setEditingBook(null);
    setBookTitle('');
    setBookAuthor('');
    setBookShelf('');
    setIsBookModalOpen(true);
  };

  const openEditBookModal = (book) => {
    setEditingBook(book);
    setBookTitle(book.titulo);
    setBookAuthor(book.autor);
    setBookShelf(book.prateleira);
    setIsBookModalOpen(true);
  };

  const executeSaveBook = async (confirmDuplicate = false) => {
    const cleanTitle = bookTitle.trim();
    const cleanAuthor = bookAuthor.trim();
    const cleanShelf = bookShelf.trim().toUpperCase();

    if (!cleanTitle || !cleanAuthor || !cleanShelf) {
      showToast('Por favor, preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    if (!editingBook && !confirmDuplicate) {
      try {
        const { data: existingMatches, error: matchErr } = await supabase
          .from('livros')
          .select('id, titulo, autor')
          .ilike('titulo', cleanTitle)
          .ilike('autor', cleanAuthor);

        if (!matchErr && existingMatches && existingMatches.length > 0) {
          setDuplicateConfirmData({
            title: cleanTitle,
            author: cleanAuthor,
            shelf: cleanShelf
          });
          return;
        }
      } catch (err) {
        console.error('Erro na checagem de duplicidade:', err);
      }
    }

    setSavingBook(true);
    try {
      if (editingBook) {
        const { error } = await supabase
          .from('livros')
          .update({
            titulo: cleanTitle,
            autor: cleanAuthor,
            prateleira: cleanShelf,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingBook.id);

        if (error) throw error;
        showToast('Livro atualizado com sucesso!', 'success');
      } else {
        const { error } = await supabase
          .from('livros')
          .insert([{
            titulo: cleanTitle,
            autor: cleanAuthor,
            prateleira: cleanShelf
          }]);

        if (error) throw error;
        showToast('Novo livro cadastrado no acervo!', 'success');
      }

      setIsBookModalOpen(false);
      setDuplicateConfirmData(null);
      fetchBooks();
      fetchShelves();
    } catch (err) {
      console.error('Erro ao salvar livro:', err);
      showToast('Erro ao salvar informações do livro.', 'error');
    } finally {
      setSavingBook(false);
    }
  };

  const handleDeleteBook = async (book) => {
    try {
      const { count: exemplaresCount, error: expErr } = await supabase
        .from('exemplares_livros')
        .select('id', { count: 'exact', head: true })
        .eq('livro_id', book.id);

      if (expErr) throw expErr;

      if (exemplaresCount && exemplaresCount > 0) {
        showToast(
          `Não é possível excluir "${book.titulo}" pois ele possui ${exemplaresCount} exemplar(es) físico(s) cadastrado(s). Remova os exemplares primeiro.`,
          'warning'
        );
        return;
      }

      if (!window.confirm(`Confirma a exclusão da obra "${book.titulo}" do acervo?`)) return;

      const { error } = await supabase
        .from('livros')
        .delete()
        .eq('id', book.id);

      if (error) throw error;

      showToast('Livro removido do acervo com sucesso!', 'success');
      fetchBooks();
      fetchShelves();
    } catch (err) {
      console.error('Erro ao excluir livro:', err);
      showToast('Erro ao excluir a obra.', 'error');
    }
  };

  const fetchExemplaresForBook = useCallback(async (bookId) => {
    setLoadingExemplares(true);
    setSelectedExemplarIds([]);
    try {
      const { data, error } = await supabase
        .from('exemplares_livros')
        .select('id, codigo_exemplar, status, created_at')
        .eq('livro_id', bookId)
        .order('codigo_exemplar', { ascending: true });

      if (error) throw error;
      if (data) setExemplares(data);
    } catch (err) {
      console.error('Erro ao carregar exemplares:', err);
      showToast('Erro ao carregar os exemplares.', 'error');
    } finally {
      setLoadingExemplares(false);
    }
  }, [showToast]);

  const openExemplaresModal = (book) => {
    setSelectedBookForExemplares(book);
    setNewExemplarCode('');
    fetchExemplaresForBook(book.id);
  };

  const handleAddExemplar = async (e) => {
    e.preventDefault();
    const cleanCode = newExemplarCode.trim().toUpperCase();

    if (!cleanCode) {
      showToast('Digite o código do exemplar (ex: BIB-000001).', 'warning');
      return;
    }

    setAddingExemplar(true);
    try {
      const { data: existingCode, error: checkErr } = await supabase
        .from('exemplares_livros')
        .select('id')
        .ilike('codigo_exemplar', cleanCode)
        .maybeSingle();

      if (checkErr) throw checkErr;

      if (existingCode) {
        showToast(`O código de exemplar "${cleanCode}" já está cadastrado em outro livro!`, 'error');
        setAddingExemplar(false);
        return;
      }

      const { error: insertErr } = await supabase
        .from('exemplares_livros')
        .insert([{
          livro_id: selectedBookForExemplares.id,
          codigo_exemplar: cleanCode,
          status: 'disponivel'
        }]);

      if (insertErr) throw insertErr;

      showToast(`Exemplar ${cleanCode} adicionado com sucesso!`, 'success');
      setNewExemplarCode('');
      fetchExemplaresForBook(selectedBookForExemplares.id);
      fetchBooks();
    } catch (err) {
      console.error('Erro ao adicionar exemplar:', err);
      showToast('Erro ao cadastrar exemplar.', 'error');
    } finally {
      setAddingExemplar(false);
    }
  };

  const handleChangeExemplarStatus = async (exemplarId, newStatus) => {
    try {
      const { error } = await supabase
        .from('exemplares_livros')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', exemplarId);

      if (error) {
        showToast(error.message || 'Erro ao alterar status do exemplar.', 'error');
        return;
      }

      showToast('Status do exemplar atualizado!', 'success');
      fetchExemplaresForBook(selectedBookForExemplares.id);
      fetchBooks();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      showToast('Não foi possível alterar o status.', 'error');
    }
  };

  const handleDeleteExemplar = async (exemplar) => {
    if (exemplar.status === 'emprestado') {
      showToast('Não é possível excluir um exemplar atualmente emprestado.', 'warning');
      return;
    }

    if (!window.confirm(`Confirma a remoção do exemplar ${exemplar.codigo_exemplar}?`)) return;

    try {
      const { error } = await supabase
        .from('exemplares_livros')
        .delete()
        .eq('id', exemplar.id);

      if (error) throw error;

      showToast('Exemplar removido!', 'success');
      fetchExemplaresForBook(selectedBookForExemplares.id);
      fetchBooks();
    } catch (err) {
      console.error('Erro ao excluir exemplar:', err);
      showToast('Erro ao remover o exemplar.', 'error');
    }
  };

  const handleOpenSingleQr = async (exemplar) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(exemplar.codigo_exemplar, {
        width: 300,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' }
      });

      setSingleQrModalData({
        exemplar,
        livro: selectedBookForExemplares,
        qrDataUrl
      });
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
      showToast('Erro ao gerar imagem do QR Code.', 'error');
    }
  };

  const toggleSelectExemplar = (id) => {
    setSelectedExemplarIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllExemplares = () => {
    if (selectedExemplarIds.length === exemplares.length) {
      setSelectedExemplarIds([]);
    } else {
      setSelectedExemplarIds(exemplares.map(exp => exp.id));
    }
  };

  const handleOpenBatchPrint = async () => {
    if (selectedExemplarIds.length === 0) {
      showToast('Selecione ao menos um exemplar para impressão em lote.', 'warning');
      return;
    }

    try {
      const selectedExemplaresList = exemplares.filter(exp => selectedExemplarIds.includes(exp.id));
      
      const batchItems = await Promise.all(
        selectedExemplaresList.map(async (exp) => {
          const qrDataUrl = await QRCode.toDataURL(exp.codigo_exemplar, {
            width: 200,
            margin: 2,
            color: { dark: '#0f172a', light: '#ffffff' }
          });
          return {
            exemplar: exp,
            livro: selectedBookForExemplares,
            qrDataUrl
          };
        })
      );

      setBatchPrintModalData(batchItems);
    } catch (err) {
      console.error('Erro ao preparar lote de QR Codes:', err);
      showToast('Erro ao gerar lote para impressão.', 'error');
    }
  };

  const triggerPrintWindow = () => {
    window.print();
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'disponivel':
        return <span className="status-badge disponivel"><CheckCircle size={12} /> Disponível</span>;
      case 'emprestado':
        return <span className="status-badge emprestado"><Package size={12} /> Emprestado</span>;
      case 'manutencao':
        return <span className="status-badge manutencao"><Wrench size={12} /> Em manutenção</span>;
      case 'extraviado':
        return <span className="status-badge extraviado"><AlertTriangle size={12} /> Extraviado</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  // Filtrar empréstimos ativos para a lista de visualização administrativa
  const filteredActiveLoans = activeLoans.filter(loan => {
    if (!loansSearchQuery.trim()) return true;
    const term = loansSearchQuery.toLowerCase().trim();
    const studentName = loan.alunos?.nome?.toLowerCase() || '';
    const bookTitle = loan.exemplares_livros?.livros?.titulo?.toLowerCase() || '';
    const code = loan.exemplares_livros?.codigo_exemplar?.toLowerCase() || '';
    return studentName.includes(term) || bookTitle.includes(term) || code.includes(term);
  });

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  if (!isAuthorized) {
    return (
      <div className="biblioteca-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <ShieldAlert size={48} color="#DC2626" style={{ marginBottom: '1rem' }} />
        <h2>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Apenas os perfis de Gestão, Biblioteca e Secretaria possuem permissão para gerenciar o acervo bibliográfico.
        </p>
        <button className="btn-primary" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="biblioteca-container">
      {/* Cabeçalho */}
      <div className="biblioteca-header">
        <div className="biblioteca-title-section">
          <button className="btn-back-home" onClick={() => navigate('/')} title="Voltar ao início">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2>
              <BookOpen size={28} color="var(--color-primary)" /> Gerenciamento da Biblioteca
            </h2>
            <p>Cadastre obras, gerencie exemplares e realize empréstimos de livros para estudantes.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Botão NOVO EMPRÉSTIMO (Sprint 4) */}
          <button className="btn-primary" onClick={() => setIsNovoEmprestimoOpen(true)} style={{ background: '#2563EB' }}>
            <Plus size={18} /> Novo Empréstimo
          </button>
          <button className="btn-secondary" onClick={() => setIsScannerOpen(true)}>
            <Camera size={18} /> Escanear QR / Exemplar
          </button>
          {activeTab === 'acervo' && (
            <button className="btn-primary" onClick={openNewBookModal}>
              <Plus size={18} /> Cadastrar Livro
            </button>
          )}
        </div>
      </div>

      {/* Navegação por Abas */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('acervo')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'acervo' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'acervo' ? 'var(--color-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <BookOpen size={18} /> Acervo & Obras
        </button>

        <button 
          onClick={() => setActiveTab('emprestimos')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'emprestimos' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'emprestimos' ? 'var(--color-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ClipboardList size={18} /> Empréstimos Ativos ({activeLoans.length})
        </button>
      </div>

      {/* ── ABA 1: ACERVO & OBRAS ── */}
      {activeTab === 'acervo' && (
        <div className="biblioteca-panel">
          <div className="biblioteca-controls">
            <div className="search-box">
              <Search className="search-icon" size={18} />
              <input 
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Pesquisar por título ou autor..."
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => handleSearchChange('')}>
                  <X size={16} />
                </button>
              )}
            </div>

            <select 
              className="filter-select"
              value={filterShelf}
              onChange={e => handleShelfChange(e.target.value)}
            >
              <option value="">Todas as Prateleiras</option>
              {shelves.map(shelf => (
                <option key={shelf} value={shelf}>Prateleira: {shelf}</option>
              ))}
            </select>
          </div>

          {loadingBooks ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="spin-animation" style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }} />
              <p>Carregando livros do acervo...</p>
            </div>
          ) : booksError ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-danger)' }}>
              <AlertTriangle size={32} style={{ marginBottom: '0.5rem' }} />
              <p>{booksError}</p>
              <button className="btn-secondary" onClick={fetchBooks} style={{ marginTop: '0.5rem' }}>
                <RefreshCw size={14} /> Tentar Novamente
              </button>
            </div>
          ) : books.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <BookOpen size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ fontWeight: 600, fontSize: '1rem' }}>Nenhum livro encontrado.</p>
              <p style={{ fontSize: '0.85rem' }}>
                {searchQuery || filterShelf ? 'Tente ajustar os filtros de busca.' : 'Clique no botão acima para cadastrar a primeira obra do acervo.'}
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="biblioteca-table">
                  <thead>
                    <tr>
                      <th>Livro / Título</th>
                      <th>Autor(a)</th>
                      <th>Prateleira</th>
                      <th>Exemplares</th>
                      <th>Disponíveis</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map(book => (
                      <tr key={book.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {book.titulo}
                        </td>
                        <td>{book.autor}</td>
                        <td>
                          <span className="shelf-badge">
                            <Tag size={12} /> {book.prateleira}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {book.totalExemplares} unidade(s)
                        </td>
                        <td>
                          <span style={{ 
                            fontWeight: 700, 
                            color: book.disponiveisCount > 0 ? 'var(--color-success)' : 'var(--color-danger)' 
                          }}>
                            {book.disponiveisCount} disponível(eis)
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                            <button 
                              className="btn-action-icon"
                              onClick={() => openExemplaresModal(book)}
                              title="Gerenciar Exemplares & QR Codes"
                            >
                              <Layers size={16} />
                            </button>
                            <button 
                              className="btn-action-icon"
                              onClick={() => openEditBookModal(book)}
                              title="Editar Dados Bibliográficos"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className="btn-action-icon danger"
                              onClick={() => handleDeleteBook(book)}
                              title="Excluir Obra"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              <div className="pagination-container">
                <span className="pagination-info">
                  Exibindo <strong>{books.length}</strong> de <strong>{totalCount}</strong> obra(s)
                </span>

                <div className="pagination-buttons">
                  <button 
                    className="btn-pagination"
                    disabled={page <= 1}
                    onClick={() => setPage(prev => prev - 1)}
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 0.5rem' }}>
                    Página {page} de {totalPages}
                  </span>
                  <button 
                    className="btn-pagination"
                    disabled={page >= totalPages}
                    onClick={() => setPage(prev => prev + 1)}
                  >
                    Próxima <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ABA 2: EMPRÉSTIMOS ATIVOS (Sprint 4) ── */}
      {activeTab === 'emprestimos' && (
        <div className="biblioteca-panel">
          <div className="biblioteca-controls">
            <div className="search-box">
              <Search className="search-icon" size={18} />
              <input 
                type="text"
                value={loansSearchQuery}
                onChange={e => setLoansSearchQuery(e.target.value)}
                placeholder="Pesquisar por aluno, livro ou código de exemplar..."
              />
              {loansSearchQuery && (
                <button className="clear-search-btn" onClick={() => setLoansSearchQuery('')}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {loadingLoans ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="spin-animation" style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }} />
              <p>Carregando empréstimos ativos...</p>
            </div>
          ) : filteredActiveLoans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <ClipboardList size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ fontWeight: 600, fontSize: '1rem' }}>Nenhum empréstimo ativo registrado.</p>
              <p style={{ fontSize: '0.85rem' }}>
                Clique no botão "Novo Empréstimo" acima para registrar a primeira retirada.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="biblioteca-table">
                <thead>
                  <tr>
                    <th>Estudante (Aluno)</th>
                    <th>Turma</th>
                    <th>Livro / Obra</th>
                    <th>Código Exemplar</th>
                    <th>Retirada</th>
                    <th>Devolução Prevista</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActiveLoans.map(loan => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isOverdue = loan.data_prevista_devolucao < todayStr;
                    return (
                      <tr key={loan.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {loan.alunos?.nome || 'N/A'}
                        </td>
                        <td>{loan.alunos?.turma || 'N/A'}</td>
                        <td>
                          <strong>{loan.exemplares_livros?.livros?.titulo}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                            {loan.exemplares_livros?.livros?.autor}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--color-primary)' }}>
                            {loan.exemplares_livros?.codigo_exemplar}
                          </span>
                        </td>
                        <td>{new Date(loan.data_retirada).toLocaleDateString('pt-BR')}</td>
                        <td>
                          <strong style={{ color: isOverdue ? '#DC2626' : 'inherit' }}>
                            {new Date(loan.data_prevista_devolucao + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </strong>
                        </td>
                        <td>
                          {isOverdue ? (
                            <span className="status-badge extraviado">
                              <Clock size={12} /> Atrasado
                            </span>
                          ) : (
                            <span className="status-badge emprestado">
                              <CheckCircle size={12} /> Em dia (Ativo)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: CADASTRAR / EDITAR LIVRO ── */}
      {isBookModalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setIsBookModalOpen(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <BookOpen size={20} color="var(--color-primary)" />
                {editingBook ? 'Editar Dados da Obra' : 'Cadastrar Nova Obra Bibliográfica'}
              </h3>
              <button className="btn-action-icon" onClick={() => setIsBookModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); executeSaveBook(false); }}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nome do Livro (Título) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input 
                    type="text"
                    value={bookTitle}
                    onChange={e => setBookTitle(e.target.value)}
                    placeholder="Ex: O Pequeno Príncipe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Nome do(a) Autor(a) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input 
                    type="text"
                    value={bookAuthor}
                    onChange={e => setBookAuthor(e.target.value)}
                    placeholder="Ex: Antoine de Saint-Exupéry"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Prateleira / Localização <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input 
                    type="text"
                    value={bookShelf}
                    onChange={e => setBookShelf(e.target.value)}
                    placeholder="Ex: A1, Estante 2 - Prateleira B"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsBookModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={savingBook}>
                  {savingBook ? 'Salvando...' : (editingBook ? 'Salvar Alterações' : 'Cadastrar Livro')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRMAÇÃO DE DUPLICIDADE LEGÍTIMA ── */}
      {duplicateConfirmData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header" style={{ background: '#FFFBEB' }}>
              <h3 style={{ color: '#D97706' }}>
                <AlertCircle size={20} /> Obra Semelhante Encontrada
              </h3>
            </div>
            <div className="modal-body" style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Já existe uma obra cadastrada no acervo com título e autor semelhantes:
              </p>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                <strong>Título:</strong> {duplicateConfirmData.title}<br />
                <strong>Autor:</strong> {duplicateConfirmData.author}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Se esta for uma nova edição, volume ou tradução distinta, você pode confirmar o cadastro normalmente.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDuplicateConfirmData(null)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={() => executeSaveBook(true)}>
                Cadastrar Assim Mesmo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: GERENCIAMENTO DE EXEMPLARES E SELEÇÃO EM LOTE PARA IMPRESSÃO ── */}
      {selectedBookForExemplares && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelectedBookForExemplares(null); }}>
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div>
                <h3>
                  <Layers size={20} color="var(--color-primary)" /> Exemplares Físicos & Etiquetas QR
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Obra: <strong>{selectedBookForExemplares.titulo}</strong> — {selectedBookForExemplares.autor}
                </p>
              </div>
              <button className="btn-action-icon" onClick={() => setSelectedBookForExemplares(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleAddExemplar} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Código do Exemplar (Etiqueta / QR Code) <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input 
                    type="text"
                    value={newExemplarCode}
                    onChange={e => setNewExemplarCode(e.target.value)}
                    placeholder="Ex: BIB-000001"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.9rem',
                      textTransform: 'uppercase'
                    }}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={addingExemplar} style={{ padding: '0.65rem 1rem' }}>
                  <Plus size={16} /> {addingExemplar ? 'Adicionando...' : 'Adicionar'}
                </button>
              </form>

              {exemplares.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '0.6rem 0.85rem', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  border: '1px solid var(--border-light)'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={selectedExemplarIds.length === exemplares.length && exemplares.length > 0}
                      onChange={toggleSelectAllExemplares}
                    />
                    Selecionar Todos ({selectedExemplarIds.length}/{exemplares.length})
                  </label>

                  <button 
                    className="btn-secondary" 
                    onClick={handleOpenBatchPrint}
                    disabled={selectedExemplarIds.length === 0}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                  >
                    <Printer size={14} /> Imprimir Selecionados ({selectedExemplarIds.length})
                  </button>
                </div>
              )}

              {loadingExemplares ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  <RefreshCw size={20} className="spin-animation" /> Carregando exemplares...
                </div>
              ) : exemplares.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  Nenhum exemplar físico cadastrado para esta obra. Digite um código acima para adicionar a primeira unidade.
                </div>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {exemplares.map(exp => (
                    <div key={exp.id} className="exemplar-card-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input 
                          type="checkbox"
                          checked={selectedExemplarIds.includes(exp.id)}
                          onChange={() => toggleSelectExemplar(exp.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <div>
                          <div className="exemplar-code">{exp.codigo_exemplar}</div>
                          <div style={{ marginTop: '0.25rem' }}>
                            {renderStatusBadge(exp.status)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          className="btn-action-icon"
                          onClick={() => handleOpenSingleQr(exp)}
                          title="Gerar / Visualizar QR Code do Exemplar"
                        >
                          <QrCode size={16} color="var(--color-primary)" />
                        </button>

                        <select
                          className="filter-select"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                          value={exp.status}
                          onChange={e => handleChangeExemplarStatus(exp.id, e.target.value)}
                          disabled={exp.status === 'emprestado'}
                        >
                          <option value="disponivel">Disponível</option>
                          <option value="manutencao">Em manutenção</option>
                          <option value="extraviado">Extraviado</option>
                          {exp.status === 'emprestado' && <option value="emprestado">Emprestado</option>}
                        </select>

                        <button 
                          className="btn-action-icon danger" 
                          onClick={() => handleDeleteExemplar(exp)}
                          title="Remover Exemplar"
                          disabled={exp.status === 'emprestado'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedBookForExemplares(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: VISUALIZAR E IMPRIMIR QR CODE INDIVIDUAL ── */}
      {singleQrModalData && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSingleQrModalData(null); }}>
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>
                <QrCode size={20} color="var(--color-primary)" /> Etiqueta QR Code
              </h3>
              <button className="btn-action-icon" onClick={() => setSingleQrModalData(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body printable-area">
              <div className="qr-label-single">
                <img src={singleQrModalData.qrDataUrl} alt={`QR ${singleQrModalData.exemplar.codigo_exemplar}`} />
                <div className="qr-code-text">{singleQrModalData.exemplar.codigo_exemplar}</div>
                <div className="qr-book-title">{singleQrModalData.livro.titulo}</div>
                <div className="qr-book-meta">{singleQrModalData.livro.autor} • Prateleira {singleQrModalData.livro.prateleira}</div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSingleQrModalData(null)}>
                Fechar
              </button>
              <button className="btn-primary" onClick={triggerPrintWindow}>
                <Printer size={16} /> Imprimir Etiqueta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: IMPRESSÃO EM LOTE DE ETIQUETAS QR CODE ── */}
      {batchPrintModalData && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setBatchPrintModalData(null); }}>
          <div className="modal-content" style={{ maxWidth: '820px' }}>
            <div className="modal-header">
              <div>
                <h3>
                  <Printer size={20} color="var(--color-primary)" /> Impressão de Etiquetas em Lote
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Total de etiquetas selecionadas: <strong>{batchPrintModalData.length}</strong>
                </p>
              </div>
              <button className="btn-action-icon" onClick={() => setBatchPrintModalData(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body printable-area">
              <div className="qr-batch-grid qr-batch-grid-print">
                {batchPrintModalData.map(item => (
                  <div key={item.exemplar.id} className="qr-label-card qr-label-card-print">
                    <img src={item.qrDataUrl} alt={`QR ${item.exemplar.codigo_exemplar}`} />
                    <div className="qr-code-text qr-code-text-print">{item.exemplar.codigo_exemplar}</div>
                    <div className="qr-book-title qr-book-title-print">{item.livro.titulo}</div>
                    <div className="qr-book-meta qr-book-meta-print">Prateleira {item.livro.prateleira}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setBatchPrintModalData(null)}>
                Fechar
              </button>
              <button className="btn-primary" onClick={triggerPrintWindow}>
                <Printer size={16} /> Imprimir {batchPrintModalData.length} Etiqueta(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SCANNER DE CÂMERA / LEITURA QR ── */}
      <BibliotecaQrScanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

      {/* ── MODAL NOVO EMPRÉSTIMO PARA ESTUDANTE (Sprint 4) ── */}
      <NovoEmprestimoModal 
        isOpen={isNovoEmprestimoOpen}
        onClose={() => setIsNovoEmprestimoOpen(false)}
        onSuccess={() => {
          fetchBooks();
          if (activeTab === 'emprestimos') fetchActiveLoans();
        }}
      />
    </div>
  );
}
