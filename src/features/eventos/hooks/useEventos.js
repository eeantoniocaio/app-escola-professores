import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared/services/supabase';
import { useToast } from '../../../app/providers/ToastProvider';

export function useEventos() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('eventos').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro eventos:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = async (newEvent) => {
    const { data, error } = await supabase.from('eventos').insert([newEvent]).select();
    if (error) {
      showToast('Erro ao salvar evento', 'error');
      return false;
    } else if (data) {
      setEvents(prev => [data[0], ...prev]);
      showToast('Evento pedagógico registrado com sucesso!');
      return true;
    }
  };

  const updateEvent = async (updatedEvent) => {
    const { id, created_at, ...updateData } = updatedEvent;
    const { data, error } = await supabase.from('eventos').update(updateData).eq('id', id).select();
    if (error) {
      showToast('Erro ao atualizar evento', 'error');
      return false;
    } else if (data) {
      setEvents(prev => prev.map(e => e.id === id ? data[0] : e));
      showToast('Evento pedagógico atualizado com sucesso!');
      return true;
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Tem certeza de que deseja excluir este evento?')) return false;
    const { error } = await supabase.from('eventos').delete().eq('id', id);
    if (error) {
      showToast('Erro ao excluir evento', 'error');
      return false;
    } else {
      setEvents(prev => prev.filter(e => e.id !== id));
      showToast('Evento pedagógico excluído com sucesso.', 'info');
      return true;
    }
  };

  const toggleEventFinalizado = async (id) => {
    const event = events.find(e => e.id === id);
    if (!event) return false;
    const nextState = !event.finalizado;
    const { data, error } = await supabase.from('eventos').update({ finalizado: nextState }).eq('id', id).select();
    if (error) {
      showToast('Erro ao atualizar status', 'error');
      return false;
    } else if (data) {
      setEvents(prev => prev.map(e => e.id === id ? data[0] : e));
      showToast(nextState ? 'Evento finalizado com sucesso!' : 'Evento reaberto com sucesso!', nextState ? 'success' : 'info');
      return true;
    }
  };

  return { events, loading, addEvent, updateEvent, deleteEvent, toggleEventFinalizado, refreshEvents: fetchEvents };
}
