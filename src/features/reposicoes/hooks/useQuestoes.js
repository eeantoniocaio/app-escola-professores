import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared/services/supabase';
import { useToast } from '../../../app/providers/ToastProvider';

export function useQuestoes() {
  const [questoes, setQuestoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchQuestoes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('questoes_reposicao').select('*').order('created_at', { ascending: false });
    if (error) console.error('Erro questoes:', error);
    else setQuestoes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchQuestoes(); }, [fetchQuestoes]);

  const addQuestao = async (novaQuestao) => {
    const { data, error } = await supabase.from('questoes_reposicao').insert([novaQuestao]).select();
    if (error) {
      showToast('Erro ao enviar atividade', 'error');
      return false;
    } else if (data) {
      setQuestoes(prev => [data[0], ...prev]);
      showToast('Atividade de reposição enviada com sucesso!');
      return true;
    }
  };

  const updateQuestao = async (id, status, feedback) => {
    const { data, error } = await supabase.from('questoes_reposicao').update({ status, feedback }).eq('id', id).select();
    if (error) {
      showToast('Erro ao atualizar status', 'error');
      return false;
    } else if (data) {
      setQuestoes(prev => prev.map(q => q.id === id ? data[0] : q));
      showToast('Status da atividade atualizado!');
      return true;
    }
  };

  const deleteQuestao = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta atividade?')) return false;
    const { error } = await supabase.from('questoes_reposicao').delete().eq('id', id);
    if (error) {
      showToast('Erro ao excluir', 'error');
      return false;
    } else {
      setQuestoes(prev => prev.filter(q => q.id !== id));
      showToast('Atividade excluída.', 'info');
      return true;
    }
  };

  return { questoes, loading, addQuestao, updateQuestao, deleteQuestao, refreshQuestoes: fetchQuestoes };
}
