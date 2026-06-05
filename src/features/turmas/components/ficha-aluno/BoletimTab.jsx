import React from 'react'
import { Clipboard } from 'lucide-react'

export default function BoletimTab({ details }) {
  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white border border-gray-200 rounded-[14px] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h4 className="m-0 flex items-center gap-2 text-amber-600 text-base font-bold">
            <Clipboard size={18} /> Histórico de Notas (Boletim)
          </h4>
          <span className="text-[0.8rem] text-gray-500 font-semibold">Ano Letivo: {new Date().getFullYear()}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[600px]">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="py-3.5 px-5 text-[0.8rem] font-bold text-gray-500 uppercase">Componente Curricular</th>
                <th className="py-3.5 px-4 text-[0.8rem] font-bold text-gray-500 text-center">1º Bim</th>
                <th className="py-3.5 px-4 text-[0.8rem] font-bold text-gray-500 text-center">2º Bim</th>
                <th className="py-3.5 px-4 text-[0.8rem] font-bold text-gray-500 text-center">3º Bim</th>
                <th className="py-3.5 px-4 text-[0.8rem] font-bold text-gray-500 text-center">4º Bim</th>
                <th className="py-3.5 px-4 text-[0.8rem] font-bold text-gray-500 text-center">Média</th>
                <th className="py-3.5 px-5 text-[0.8rem] font-bold text-gray-500 text-center">Situação</th>
              </tr>
            </thead>
            <tbody>
              {details.boletim.map((bp, index) => (
                <tr key={index} className={index === details.boletim.length - 1 ? '' : 'border-b border-gray-200'}>
                  <td className="p-4 px-5 text-[0.9rem] font-semibold text-gray-900">{bp.subject}</td>
                  <td className={`p-4 px-4 text-[0.9rem] text-center ${bp.b1 < 6 ? 'text-red-600' : 'text-gray-900'}`}>{bp.b1}</td>
                  <td className={`p-4 px-4 text-[0.9rem] text-center ${bp.b2 < 6 ? 'text-red-600' : 'text-gray-900'}`}>{bp.b2}</td>
                  <td className={`p-4 px-4 text-[0.9rem] text-center ${bp.b3 < 6 ? 'text-red-600' : 'text-gray-900'}`}>{bp.b3}</td>
                  <td className={`p-4 px-4 text-[0.9rem] text-center ${bp.b4 < 6 ? 'text-red-600' : 'text-gray-900'}`}>{bp.b4}</td>
                  <td className={`p-4 px-4 text-[0.95rem] font-extrabold text-center ${bp.media < 6 ? 'text-red-600' : 'text-green-600'}`}>{bp.media}</td>
                  <td className="p-4 px-5 text-center">
                    <span className={`inline-block py-1 px-2.5 rounded-[12px] text-[0.75rem] font-bold ${bp.status === 'Aprovado' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {bp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
