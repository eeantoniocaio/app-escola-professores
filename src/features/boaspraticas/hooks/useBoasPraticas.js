import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared/services/supabase';
import { useToast } from '../../../app/providers/ToastProvider';

export function useBoasPraticas() {
  const [praticas, setPraticas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchPraticas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('boas_praticas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar boas práticas:', error);
    } else {
      setPraticas(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPraticas();
  }, [fetchPraticas]);

  const addPratica = async (novaPratica) => {
    const { data, error } = await supabase
      .from('boas_praticas')
      .insert([novaPratica])
      .select();

    if (error) {
      showToast('Erro ao registrar boa prática', 'error');
      return false;
    } else if (data) {
      setPraticas(prev => [data[0], ...prev]);
      showToast('Boa prática registrada com sucesso!');
      return true;
    }
  };

  const updatePratica = async (id, updatedFields) => {
    const { data, error } = await supabase
      .from('boas_praticas')
      .update(updatedFields)
      .eq('id', id)
      .select();

    if (error) {
      showToast('Erro ao atualizar boa prática', 'error');
      return false;
    } else if (data) {
      setPraticas(prev => prev.map(p => p.id === id ? data[0] : p));
      showToast('Boa prática atualizada com sucesso!');
      return true;
    }
  };

  const deletePratica = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta boa prática?')) return false;
    const { error } = await supabase
      .from('boas_praticas')
      .delete()
      .eq('id', id);

    if (error) {
      showToast('Erro ao excluir', 'error');
      return false;
    } else {
      setPraticas(prev => prev.filter(p => p.id !== id));
      showToast('Boa prática excluída.', 'info');
      return true;
    }
  };

  return {
    praticas,
    loading,
    addPratica,
    updatePratica,
    deletePratica,
    refreshPraticas: fetchPraticas
  };
}
