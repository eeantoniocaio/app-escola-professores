import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from './AuthProvider';
import { useToast } from './ToastProvider';

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
  const [loadingData, setLoadingData] = useState(true);

  const fetchGlobalData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoadingData(false);
      return;
    }
    
    setLoadingData(true);
    try {
      const [
        profRes, tipEvtRes, tipEviRes, turmasRes, alunosRes, gestRes
      ] = await Promise.all([
        supabase.from('professores').select('nome'),
        supabase.from('tiposEvento').select('nome'),
        supabase.from('tiposEvidencia').select('nome'),
        supabase.from('turmas').select('id, nome, link').order('nome'),
        supabase.from('alunos').select('id, nome, turma').order('nome'),
        supabase.from('gestores').select('nome')
      ]);

      if (profRes.data) setProfessores(profRes.data.map(p => p.nome));
      if (tipEvtRes.data) setTiposEvento(tipEvtRes.data.map(t => t.nome));
      if (tipEviRes.data) setTiposEvidencia(tipEviRes.data.map(t => t.nome));
      if (turmasRes.data) setTurmas(turmasRes.data);
      if (alunosRes.data) setAlunos(alunosRes.data);
      if (gestRes.data) setGestores(gestRes.data.map(g => g.nome));
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

  const value = {
    professores, setProfessores,
    gestores, setGestores,
    turmas, setTurmas,
    alunos, setAlunos,
    tiposEvento, setTiposEvento,
    tiposEvidencia, setTiposEvidencia,
    loadingData,
    refreshGlobalData: fetchGlobalData
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
