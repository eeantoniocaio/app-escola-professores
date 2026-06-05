import React from 'react';
import { FileText, Calendar, Clipboard, Camera, Users } from 'lucide-react';
import { findPhotoInMap } from '@/services/photoService';

export default function StudentActionButtons({
  aluno,
  userRole,
  isConfigured,
  accessToken,
  loginGoogle,
  showToast,
  photosMap,
  onOpenFicha,
  onOpenFrequencia,
  onOpenCarometro
}) {
  const photoUrl = findPhotoInMap(aluno.nome, photosMap);

  return (
    <div className="flex gap-2 items-center">
      <button 
        onClick={() => onOpenFicha(aluno)}
        title="Ficha do Aluno"
        className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-amber-500 bg-amber-100 text-amber-600 cursor-pointer transition-all duration-200 hover:bg-amber-200 hover:border-amber-700 hover:text-amber-700"
      >
        <FileText size={16} />
      </button>

      {userRole !== 'tecnico' && (
        <button 
          onClick={() => {
            onOpenFrequencia(aluno);
            if (isConfigured && !accessToken) {
              loginGoogle();
            }
          }}
          title="Frequência"
          className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-500 cursor-pointer transition-all duration-200 hover:bg-emerald-100 hover:border-emerald-600 hover:text-emerald-600"
        >
          <Calendar size={16} />
        </button>
      )}

      {userRole !== 'tecnico' && (
        <button 
          onClick={() => showToast('Em desenvolvimento.', 'info')}
          title="Notas"
          className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-blue-500 bg-blue-50 text-blue-500 cursor-pointer transition-all duration-200 hover:bg-blue-100 hover:border-blue-600 hover:text-blue-600"
        >
          <Clipboard size={16} />
        </button>
      )}

      <button 
        onClick={() => {
          onOpenCarometro(aluno);
          if (isConfigured && !accessToken) {
            loginGoogle();
          }
        }}
        title="Carômetro"
        className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-violet-500 bg-violet-50 text-violet-500 cursor-pointer transition-all duration-200 hover:bg-violet-100 hover:border-violet-600 hover:text-violet-600"
      >
        {photoUrl ? <Camera size={16} /> : <Users size={16} />}
      </button>
    </div>
  );
}
