import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from './AuthProvider';
import { useToast } from './ToastProvider';

const sortTurmasPedagogically = (turmasList) => {
  const getTurmaRank = (nome) => {
    const order = ['6', '7', '8', '9', '1', '2', '3'];
    const match = nome.match(/^(\d+)/);
    if (match) {
      const num = match[1];
      const index = order.indexOf(num);
      return index !== -1 ? index : 999;
    }
    return 999;
  };

  return [...turmasList].sort((a, b) => {
    const rankA = getTurmaRank(a.nome);
    const rankB = getTurmaRank(b.nome);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return a.nome.localeCompare(b.nome);
  });
};

const GlobalDataContext = createContext(null);

export function GlobalDataProvider({ children }) {
  const { session } = useAuth();
  const { showToast } = useToast();
  
  const [professores, setProfessores] = useState([]);
  const [gestores, setGestores] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [tiposEvento, setTiposEvento] = useState([]);
  const [tiposEvidencia, setTiposEvidencia] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchGlobalData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoadingData(false);
      return;
    }
    
    setLoadingData(true);
    try {
      const [
        profRes, tipEvtRes, tipEviRes, turmasRes, alunosRes, gestRes, discRes
      ] = await Promise.all([
        supabase.from('professores').select('nome'),
        supabase.from('tiposEvento').select('nome'),
        supabase.from('tiposEvidencia').select('nome'),
        supabase.from('turmas').select('id, nome, link').order('nome'),
        supabase.from('alunos').select('id, nome, turma').order('nome'),
        supabase.from('gestores').select('nome'),
        supabase.from('disciplinas').select('nome').order('nome')
      ]);

      if (profRes.data) setProfessores(profRes.data.map(p => p.nome));
      if (tipEvtRes.data) setTiposEvento(tipEvtRes.data.map(t => t.nome));
      if (tipEviRes.data) setTiposEvidencia(tipEviRes.data.map(t => t.nome));
      if (turmasRes.data) setTurmas(sortTurmasPedagogically(turmasRes.data));
      if (alunosRes.data) setAlunos(alunosRes.data);
      if (gestRes.data) setGestores(gestRes.data.map(g => g.nome));
      if (discRes.data) setDisciplinas(discRes.data.map(d => d.nome));
    } catch (error) {
      console.error('Erro geral ao buscar dados globais:', error);
      showToast('Erro ao carregar dados do banco', 'error');
    } finally {
      setLoadingData(false);
    }
  }, [session?.user?.id, showToast]);

  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  const addTipoEvento = async (nome) => {
    const { data, error } = await supabase.from('tiposEvento').insert([{ nome }]).select();
    if (error) {
      showToast('Erro ao adicionar tipo de evento', 'error');
    } else if (data) {
      setTiposEvento(prev => [...prev, data[0].nome]);
      showToast('Tipo de evento adicionado com sucesso!');
    }
  };

  const removeTipoEvento = async (nome) => {
    const { error } = await supabase.from('tiposEvento').delete().eq('nome', nome);
    if (error) {
      showToast('Erro ao remover tipo de evento', 'error');
    } else {
      setTiposEvento(prev => prev.filter(t => t !== nome));
      showToast('Tipo de evento removido com sucesso!');
    }
  };

  const addTipoEvidencia = async (nome) => {
    const { data, error } = await supabase.from('tiposEvidencia').insert([{ nome }]).select();
    if (error) {
      showToast('Erro ao adicionar tipo de evidência', 'error');
    } else if (data) {
      setTiposEvidencia(prev => [...prev, data[0].nome]);
      showToast('Tipo de evidência adicionado com sucesso!');
    }
  };

  const removeTipoEvidencia = async (nome) => {
    const { error } = await supabase.from('tiposEvidencia').delete().eq('nome', nome);
    if (error) {
      showToast('Erro ao remover tipo de evidência', 'error');
    } else {
      setTiposEvidencia(prev => prev.filter(t => t !== nome));
      showToast('Tipo de evidência removido com sucesso!');
    }
  };

  const addProfessor = async (nome) => {
    const { data, error } = await supabase.from('professores').insert([{ nome }]).select();
    if (error) {
      showToast('Erro ao adicionar professor', 'error');
    } else if (data) {
      setProfessores(prev => [...prev, data[0].nome]);
      showToast('Professor adicionado com sucesso!');
    }
  };

  const removeProfessor = async (nome) => {
    const { error } = await supabase.from('professores').delete().eq('nome', nome);
    if (error) {
      showToast('Erro ao remover professor', 'error');
    } else {
      setProfessores(prev => prev.filter(p => p !== nome));
      showToast('Professor removido com sucesso!');
    }
  };

  const importProfessores = async (nomes) => {
    const payloads = nomes.map(nome => ({ nome }));
    const { data, error } = await supabase.from('professores').insert(payloads).select();
    if (error) {
      showToast('Erro ao importar professores', 'error');
    } else if (data) {
      setProfessores(prev => [...prev, ...data.map(p => p.nome)]);
      showToast('Professores importados com sucesso!');
    }
  };

  const addGestor = async (nome) => {
    const { data, error } = await supabase.from('gestores').insert([{ nome }]).select();
    if (error) {
      showToast('Erro ao adicionar gestor', 'error');
    } else if (data) {
      setGestores(prev => [...prev, data[0].nome]);
      showToast('Gestor adicionado com sucesso!');
    }
  };

  const removeGestor = async (nome) => {
    const { error } = await supabase.from('gestores').delete().eq('nome', nome);
    if (error) {
      showToast('Erro ao remover gestor', 'error');
    } else {
      setGestores(prev => prev.filter(g => g !== nome));
      showToast('Gestor removido com sucesso!');
    }
  };

  const addTurma = async (nome) => {
    const { data, error } = await supabase.from('turmas').insert([{ nome }]).select();
    if (error) {
      showToast('Erro ao adicionar turma', 'error');
    } else if (data) {
      setTurmas(prev => sortTurmasPedagogically([...prev, data[0]]));
      showToast('Turma adicionada com sucesso!');
    }
  };

  const removeTurma = async (nome) => {
    if (!window.confirm(`Isso removerá a turma ${nome} e todos os alunos associados. Deseja continuar?`)) return;
    await supabase.from('alunos').delete().eq('turma', nome);
    const { error } = await supabase.from('turmas').delete().eq('nome', nome);
    if (error) {
      showToast('Erro ao remover turma', 'error');
    } else {
      setTurmas(prev => prev.filter(t => t.nome !== nome));
      setAlunos(prev => prev.filter(a => a.turma !== nome));
      showToast('Turma removida com sucesso!');
    }
  };

  const updateTurmaLink = async (id, link) => {
    const { data, error } = await supabase.from('turmas').update({ link }).eq('id', id).select();
    if (error) {
      showToast('Erro ao salvar link da turma', 'error');
    } else if (data) {
      setTurmas(prev => prev.map(t => t.id === id ? { ...t, link: data[0].link } : t));
      showToast('Link da turma salvo com sucesso!');
    }
  };

  const importAlunosTurma = async (turmaNome, nomes) => {
    const payloads = nomes.map(nome => ({ nome, turma: turmaNome }));
    const { data, error } = await supabase.from('alunos').insert(payloads).select();
    if (error) {
      showToast('Erro ao importar alunos', 'error');
    } else if (data) {
      setAlunos(prev => [...prev, ...data]);
      showToast('Alunos importados com sucesso!');
    }
  };

  const clearAlunosTurma = async (turmaNome) => {
    if (!window.confirm(`Deseja realmente limpar a lista de alunos da turma ${turmaNome}?`)) return;
    const { error } = await supabase.from('alunos').delete().eq('turma', turmaNome);
    if (error) {
      showToast('Erro ao limpar lista de alunos', 'error');
    } else {
      setAlunos(prev => prev.filter(a => a.turma !== turmaNome));
      showToast('Lista de alunos limpa com sucesso!');
    }
  };

  const removeAlunosPorNome = async (turmaNome, nomes) => {
    const { error } = await supabase.from('alunos').delete().eq('turma', turmaNome).in('nome', nomes);
    if (error) {
      showToast('Erro ao remover alunos', 'error');
    } else {
      setAlunos(prev => prev.filter(a => !(a.turma === turmaNome && nomes.includes(a.nome))));
      showToast('Alunos removidos com sucesso!');
    }
  };
  const addDisciplina = async (nome) => {
    const { data, error } = await supabase.from('disciplinas').insert([{ nome }]).select();
    if (error) {
      showToast('Erro ao adicionar disciplina', 'error');
    } else if (data) {
      setDisciplinas(prev => [...prev, data[0].nome].sort());
      showToast('Disciplina adicionada com sucesso!');
    }
  };

  const removeDisciplina = async (nome) => {
    const { error } = await supabase.from('disciplinas').delete().eq('nome', nome);
    if (error) {
      showToast('Erro ao remover disciplina', 'error');
    } else {
      setDisciplinas(prev => prev.filter(d => d !== nome));
      showToast('Disciplina removida com sucesso!');
    }
  };

  const importDisciplinas = async (nomes) => {
    const payloads = nomes.map(nome => ({ nome }));
    const { data, error } = await supabase.from('disciplinas').insert(payloads).select();
    if (error) {
      showToast('Erro ao importar disciplinas', 'error');
    } else if (data) {
      const addedNomes = data.map(d => d.nome);
      setDisciplinas(prev => {
        const merged = [...new Set([...prev, ...addedNomes])];
        return merged.sort();
      });
      showToast('Disciplinas importadas com sucesso!');
    }
  };

  const value = {
    professores, setProfessores,
    gestores, setGestores,
    turmas, setTurmas,
    alunos, setAlunos,
    tiposEvento, setTiposEvento,
    tiposEvidencia, setTiposEvidencia,
    disciplinas, setDisciplinas,
    loadingData,
    refreshGlobalData: fetchGlobalData,
    addTipoEvento, removeTipoEvento,
    addTipoEvidencia, removeTipoEvidencia,
    addProfessor, removeProfessor, importProfessores,
    addGestor, removeGestor,
    addTurma, removeTurma, updateTurmaLink,
    importAlunosTurma, clearAlunosTurma, removeAlunosPorNome,
    addDisciplina, removeDisciplina, importDisciplinas
  };

  return (
    <GlobalDataContext.Provider value={value}>
      {children}
    </GlobalDataContext.Provider>
  );
}

export const useGlobalData = () => {
  const context = useContext(GlobalDataContext);
  if (!context) throw new Error('useGlobalData must be used within GlobalDataProvider');
  return context;
};
