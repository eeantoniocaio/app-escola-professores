import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared/services/supabase';
import { useToast } from '../../../app/providers/ToastProvider';
import { useAuth } from '../../../app/providers/AuthProvider';
import logger from '../../../shared/utils/logger';

export function useOcorrencias() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { userRole } = useAuth();

  const fetchOcorrencias = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('ocorrencias').select('*').order('created_at', { ascending: false });
    if (error) logger.error('Erro ocorrências:', error);
    else setOcorrencias(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOcorrencias(); }, [fetchOcorrencias]);

  // Realtime Notifications for Gestão
  useEffect(() => {
    if (userRole !== 'gestao') return;
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    const channel = supabase.channel('realtime-ocorrencias')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ocorrencias' }, (payload) => {
          setOcorrencias(prev => [payload.new, ...prev]);
          if ("Notification" in window && Notification.permission === "granted") {
            const audio = new Audio('/notification.ogg');
            audio.play().catch(err => logger.log('Audio block by browser:', err));
            new Notification('Nova Ocorrência Registrada', {
              body: `Professor(a) ${payload.new.professor} registrou uma nova ocorrência para ${payload.new.aluno}.`,
              requireInteraction: true
            });
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); }
  }, [userRole]);

  const addOcorrencia = async (novaOcorrencia) => {
    const { data, error } = await supabase.from('ocorrencias').insert([novaOcorrencia]).select();
    if (error) {
      showToast('Erro ao salvar ocorrência', 'error');
      return false;
    } else if (data) {
      setOcorrencias(prev => [data[0], ...prev]);
      showToast('Ocorrência registrada com sucesso!');
      return true;
    }
  };

  const updateOcorrencia = async (id, updatedFields) => {
    const { data, error } = await supabase.from('ocorrencias').update(updatedFields).eq('id', id).select();
    if (error) {
      showToast('Erro ao atualizar ocorrência', 'error');
      return false;
    } else if (data) {
      setOcorrencias(prev => prev.map(o => o.id === id ? data[0] : o));
      showToast('Ocorrência salva com sucesso!');
      return true;
    }
  };

  const deleteOcorrencia = async (id) => {
    if (!window.confirm('Deseja excluir esta ocorrência?')) return false;
    const { error } = await supabase.from('ocorrencias').delete().eq('id', id);
    if (error) {
      showToast('Erro ao excluir', 'error');
      return false;
    } else {
      setOcorrencias(prev => prev.filter(o => o.id !== id));
      showToast('Ocorrência excluída.', 'info');
      return true;
    }
  };

  return { ocorrencias, loading, addOcorrencia, updateOcorrencia, deleteOcorrencia, refreshOcorrencias: fetchOcorrencias };
}
