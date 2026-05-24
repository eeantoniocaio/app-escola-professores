import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared/services/supabase';
import { useToast } from '../../../app/providers/ToastProvider';

export function useRegistros() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchRegistros = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('registros').select('*').order('created_at', { ascending: false });
    if (error) console.error('Erro registros:', error);
    else setRecords(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRegistros(); }, [fetchRegistros]);

  const addRecord = async (newRecord) => {
    const { data, error } = await supabase.from('registros').insert([newRecord]).select();
    if (error) {
      showToast('Erro ao salvar evidência', 'error');
      return false;
    } else if (data) {
      setRecords(prev => [data[0], ...prev]);
      showToast('Evidência docente submetida com sucesso!');
      return true;
    }
  };

  const updateRecord = async (updatedRecord) => {
    const { id, created_at, ...updateData } = updatedRecord;
    const { data, error } = await supabase.from('registros').update(updateData).eq('id', id).select();
    if (error) {
      showToast('Erro ao atualizar evidência', 'error');
      return false;
    } else if (data) {
      setRecords(prev => prev.map(r => r.id === id ? data[0] : r));
      showToast('Avaliação pedagógica salva com sucesso!');
      return true;
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Tem certeza de que deseja excluir este registro de evidência?')) return false;
    const { error } = await supabase.from('registros').delete().eq('id', id);
    if (error) {
      showToast('Erro ao excluir registro', 'error');
      return false;
    } else {
      setRecords(prev => prev.filter(r => r.id !== id));
      showToast('Registro de evidência excluído com sucesso.', 'info');
      return true;
    }
  };

  return { records, loading, addRecord, updateRecord, deleteRecord, refreshRecords: fetchRegistros };
}
