import React from 'react'
import { User, Calendar, Phone, Mail, MapPin } from 'lucide-react'

export default function FichaCadastralTab({ aluno, details, birthDateDisplay, ageDisplay, raDisplay }) {
  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
      
      {/* Seção Dados Pessoais */}
      <div className="bg-white border border-gray-200 rounded-[14px] p-6 shadow-sm">
        <h4 className="m-0 mb-5 flex items-center gap-2 text-amber-600 text-base font-bold">
          <User size={18} /> Dados Pessoais
        </h4>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
          <div>
            <label className="text-[0.78rem] font-bold text-gray-400 uppercase">Nome Completo</label>
            <div className="text-[0.95rem] font-semibold text-gray-900 mt-1">{aluno.nome}</div>
          </div>
          <div>
            <label className="text-[0.78rem] font-bold text-gray-400 uppercase">Data de Nascimento</label>
            <div className="text-[0.95rem] font-semibold text-gray-900 mt-1 flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-400" /> {birthDateDisplay}
            </div>
          </div>
          <div>
            <label className="text-[0.78rem] font-bold text-gray-400 uppercase">Idade</label>
            <div className="text-[0.95rem] font-semibold text-gray-900 mt-1">{ageDisplay}</div>
          </div>
          <div>
            <label className="text-[0.78rem] font-bold text-gray-400 uppercase">R.A. (Registro do Aluno)</label>
            <div className="text-[0.95rem] font-semibold text-gray-900 mt-1">{raDisplay}</div>
          </div>
        </div>
      </div>

      {/* Seção Contato & Endereço */}
      <div className="bg-white border border-gray-200 rounded-[14px] p-6 shadow-sm">
        <h4 className="m-0 mb-5 flex items-center gap-2 text-amber-600 text-base font-bold">
          <Phone size={18} /> Dados de Contato & Responsáveis
        </h4>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
          <div className="col-span-1 sm:col-span-2">
            <label className="text-[0.78rem] font-bold text-gray-400 uppercase">Responsável Legal</label>
            <div className="text-[0.95rem] font-semibold text-gray-900 mt-1">{details.parentName}</div>
          </div>
          <div>
            <label className="text-[0.78rem] font-bold text-gray-400 uppercase">Telefone do Responsável</label>
            <div className="text-[0.95rem] text-gray-900 mt-1 flex items-center gap-1.5">
              <Phone size={14} className="text-gray-400" /> {details.phone}
            </div>
          </div>
          <div>
            <label className="text-[0.78rem] font-bold text-gray-400 uppercase">E-mail para Recados</label>
            <div className="text-[0.95rem] text-gray-900 mt-1 flex items-center gap-1.5 word-break-all">
              <Mail size={14} className="text-gray-400 shrink-0" /> {details.email}
            </div>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="text-[0.78rem] font-bold text-gray-400 uppercase">Endereço Residencial</label>
            <div className="text-[0.95rem] text-gray-900 mt-1 flex items-start gap-1.5">
              <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" /> {details.address}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
