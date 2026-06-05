import React from 'react';

export default function ClassFilterPanel({
  selectedSerie,
  setSelectedSerie,
  selectedTurmaSigla,
  setSelectedTurmaSigla,
  sortedSeriesList,
  availableTurmaSiglas
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-[14px] p-6 shadow-sm">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-[0.85rem] font-bold text-gray-500">Série / Ano</label>
          <select 
            value={selectedSerie} 
            onChange={e => { setSelectedSerie(e.target.value); setSelectedTurmaSigla(''); }}
            className="select-filter w-full p-[0.65rem_1rem]"
          >
            <option value="">Selecione...</option>
            {sortedSeriesList.map(serie => (
              <option key={serie} value={serie}>{serie}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[0.85rem] font-bold text-gray-500">Turma</label>
          <select 
            value={selectedTurmaSigla} 
            onChange={e => setSelectedTurmaSigla(e.target.value)}
            disabled={!selectedSerie}
            className={`select-filter w-full p-[0.65rem_1rem] ${selectedSerie ? 'opacity-100' : 'opacity-60'}`}
          >
            <option value="">Selecione...</option>
            {availableTurmaSiglas.map(sigla => (
              <option key={sigla} value={sigla}>{sigla}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
