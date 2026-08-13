import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Filter, Tag, CheckCircle, MinusCircle, 
  RefreshCw, ChevronLeft, ChevronRight, Share2, Sparkles
} from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import './BibliotecaConsulta.css';

export default function BibliotecaConsulta() {
  // Configurar título da página pública
  useEffect(() => {
    document.title = 'Biblioteca Escolar — Consulta ao Acervo';
  }, []);

  // ── ESTADOS DA CONSULTA PÚBLICA ──
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Filtros & Busca
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterShelf, setFilterShelf] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('todos'); // 'todos' | 'disponiveis' | 'indisponiveis'
  const [shelves, setShelves] = useState([]);

  // Paginação
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [totalCount, setTotalCount] = useState(0);

  // Debounce na digitação da busca (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1); // Resetar para a primeira página ao buscar
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let isMounted = true;
    const loadShelves = async () => {
      try {
        // Tentar RPC dedicada pública buscar_prateleiras_biblioteca
        let { data, error: err } = await supabase
          .rpc('buscar_prateleiras_biblioteca');

        // Fallback de retrocompatibilidade para RPC anterior ou VIEW
        if (err) {
          const { data: catData, error: catErr } = await supabase
            .rpc('buscar_prateleiras_catalogo');

          if (!catErr && catData) {
            data = catData;
            err = null;
          }
        }

        if (err) {
          // Fallback final via VIEW caso as RPCs não estejam implantadas
          const { data: viewData } = await supabase
            .from('vw_livros_catalogo')
            .select('prateleira');
          if (viewData && isMounted) {
            const uniqueShelves = [...new Set(viewData.map(item => item.prateleira?.trim()).filter(Boolean))].sort();
            setShelves(uniqueShelves);
          }
        } else if (data && isMounted) {
          const list = data.map(item => item.prateleira?.trim()).filter(Boolean);
          setShelves(list);
        }
      } catch (err) {
        console.error('Erro ao buscar prateleiras via RPC:', err);
      }
    };

    loadShelves();
    return () => { isMounted = false; };
  }, [reloadKey]);

  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from('vw_livros_catalogo')
          .select('titulo, autor, prateleira, disponivel', { count: 'exact' });

        if (debouncedSearch) {
          const term = `%${debouncedSearch}%`;
          query = query.or(`titulo.ilike.${term},autor.ilike.${term}`);
        }

        if (filterShelf) {
          query = query.eq('prateleira', filterShelf);
        }

        if (filterAvailability === 'disponiveis') {
          query = query.eq('disponivel', true);
        } else if (filterAvailability === 'indisponiveis') {
          query = query.eq('disponivel', false);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.order('titulo', { ascending: true }).range(from, to);

        const { data, count, error: queryErr } = await query;
        if (queryErr) throw queryErr;

        if (isMounted) {
          setBooks(data || []);
          setTotalCount(count || 0);
        }
      } catch (err) {
        console.error('Erro ao consultar catálogo público:', err);
        if (isMounted) {
          setError('Não foi possível carregar o acervo da biblioteca no momento.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCatalog();
    return () => { isMounted = false; };
  }, [debouncedSearch, filterShelf, filterAvailability, page, pageSize, reloadKey]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Link de consulta do acervo copiado com sucesso!');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="public-catalog-wrapper">
      {/* Cabeçalho Público */}
      <header className="public-catalog-header">
        <div className="public-catalog-header-content">
          <div className="public-catalog-brand">
            <div className="brand-icon-wrapper">
              <BookOpen size={32} />
            </div>
            <div>
              <h1 className="public-catalog-title">Biblioteca Escolar</h1>
              <p className="public-catalog-subtitle">Consulte o acervo de livros da escola em tempo real</p>
            </div>
          </div>

          <button className="public-share-btn" onClick={handleShare} title="Copiar link desta página">
            <Share2 size={16} /> Compartilhar Link
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="public-catalog-container">
        {/* Painel de Filtros e Busca */}
        <section className="public-controls-card">
          <div className="public-search-box">
            <Search size={20} className="search-icon" />
            <input 
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Pesquisar livro por título ou nome do autor..."
            />
            {searchInput && (
              <button className="clear-btn" onClick={() => setSearchInput('')}>
                ×
              </button>
            )}
          </div>

          <div className="public-filters-row">
            {/* Filtro por Prateleira */}
            <div className="filter-group">
              <label><Filter size={14} /> Prateleira:</label>
              <select 
                value={filterShelf}
                onChange={(e) => { setFilterShelf(e.target.value); setPage(1); }}
              >
                <option value="">Todas as Prateleiras</option>
                {shelves.map(shelf => (
                  <option key={shelf} value={shelf}>{shelf}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Disponibilidade */}
            <div className="filter-group">
              <label><Sparkles size={14} /> Disponibilidade:</label>
              <select 
                value={filterAvailability}
                onChange={(e) => { setFilterAvailability(e.target.value); setPage(1); }}
              >
                <option value="todos">Todos os Livros</option>
                <option value="disponiveis">Somente Disponíveis</option>
                <option value="indisponiveis">Somente Indisponíveis</option>
              </select>
            </div>
          </div>
        </section>

        {/* Lista de Resultados */}
        {loading ? (
          <div className="public-state-box">
            <RefreshCw size={36} className="spin-animation" style={{ color: 'var(--color-primary, #2563EB)' }} />
            <p style={{ fontWeight: 600, marginTop: '1rem' }}>Consultando acervo público...</p>
          </div>
        ) : error ? (
          <div className="public-state-box error-box">
            <p>{error}</p>
            <button className="public-reload-btn" onClick={() => setReloadKey(k => k + 1)}>
              <RefreshCw size={16} /> Tentar Novamente
            </button>
          </div>
        ) : books.length === 0 ? (
          <div className="public-state-box empty-box">
            <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Nenhum livro encontrado.</p>
            <p style={{ fontSize: '0.9rem', color: '#64748B' }}>
              {searchInput || filterShelf || filterAvailability !== 'todos'
                ? 'Tente ajustar os termos de busca ou os filtros aplicados.'
                : 'Não há livros cadastrados no catálogo no momento.'}
            </p>
          </div>
        ) : (
          <>
            <div className="public-results-meta">
              Exibindo <strong>{books.length}</strong> de <strong>{totalCount}</strong> obra(s) localizada(s)
            </div>

            <div className="public-books-grid">
              {books.map((book, index) => (
                <article key={`${book.titulo}-${index}`} className="public-book-card">
                  <div className="book-card-header">
                    <span className={`availability-badge ${book.disponivel ? 'disponivel' : 'indisponivel'}`}>
                      {book.disponivel ? (
                        <>
                          <CheckCircle size={14} /> Disponível
                        </>
                      ) : (
                        <>
                          <MinusCircle size={14} /> Indisponível
                        </>
                      )}
                    </span>

                    {book.prateleira && (
                      <span className="shelf-pill" title="Localização na prateleira">
                        <Tag size={12} /> {book.prateleira}
                      </span>
                    )}
                  </div>

                  <div className="book-card-body">
                    <h3 className="book-title">{book.titulo}</h3>
                    <p className="book-author">por {book.autor}</p>
                  </div>
                </article>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="public-pagination">
                <button 
                  className="page-btn" 
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <span className="page-info">
                  Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                </span>
                <button 
                  className="page-btn" 
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Próxima <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Rodapé Público */}
      <footer className="public-catalog-footer">
        <p>Biblioteca Escolar — Consulta de Acervo Público</p>
      </footer>
    </div>
  );
}
