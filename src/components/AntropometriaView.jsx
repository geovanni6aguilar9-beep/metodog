import React, { useState, useEffect, useMemo } from 'react';
import { Check, Printer, X, ClipboardList, History, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { loadStorage, saveStorage } from '../utils/storage';
import { generateId } from '../utils/id';

const InputField = ({ id, label, name, value, onChange, unit = 'mm' }) => (
  <div>
    <label htmlFor={id} className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">{label}</label>
    <div className="relative">
      <input id={id} type="number" step="0.1" name={name} value={value} onChange={onChange} placeholder="0" className="w-full pl-3 pr-7 py-2 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none text-xs font-bold text-slate-700 shadow-sm" />
      <span className="absolute right-2 top-2 text-[9px] text-slate-300 font-bold">{unit}</span>
    </div>
  </div>
);

const ResultItem = ({ label, val, accent = 'slate' }) => (
  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100">
    <span className="text-slate-400 font-bold text-[10px] uppercase">{label}</span>
    <span className={ont-black text-xs text--700}>{val || '-'}</span>
  </div>
);

export default function AntropometriaView({ activeClient, isCaptureModeGlobal, setIsCaptureModeGlobal }) {
  const safeClient = activeClient || 'Paciente Demo';

  const [records, setRecords] = useState(() => loadStorage('antropo_records_v2', []));
  useEffect(() => saveStorage('antropo_records_v2', records), [records]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], gender: 'M', age: '', weight: '', height: '',
    triceps: '', subescapular: '', suprailiaco: '', pecho: '', axilarMedio: '', abdomen: '', muslo: '',
    pCintura: '', pCadera: '', pPierna: '', pPecho: '', pHombros: '', pBrazo: ''
  });

  const [activeTab, setActiveTab] = useState('pliegues');
  const [expandedCards, setExpandedCards] = useState({});

  // clientRecords memoizado
  const clientRecords = useMemo(() => {
    return (records || [])
      .filter(r => r.clientName === safeClient)
      .slice()
      .sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [records, safeClient]);

  // Suma 7 memoizada
  const sum7 = useMemo(() => {
    const fields = ['triceps','subescapular','suprailiaco','pecho','axilarMedio','abdomen','muslo'];
    return fields.reduce((s, f) => s + (Number(formData[f]) || 0), 0);
  }, [formData.triceps, formData.subescapular, formData.suprailiaco, formData.pecho, formData.axilarMedio, formData.abdomen, formData.muslo]);

  const composition = useMemo(() => {
    const age = Number(formData.age) || 0;
    const weight = Number(formData.weight) || 0;
    if (sum7 === 0 || age === 0 || weight === 0) return { bd: 0, bf: 0, fm: 0, lm: 0, sum7: sum7.toFixed(1) };
    const bd = formData.gender === 'M'
      ? 1.112 - (0.00043499 * sum7) + (0.00000055 * sum7 * sum7) - (0.00028826 * age)
      : 1.097 - (0.00046971 * sum7) + (0.00000056 * sum7 * sum7) - (0.00012828 * age);
    const bf = (495 / bd) - 450;
    const fm = weight * (bf / 100);
    const lm = weight - fm;
    return { bd: bd.toFixed(4), bf: Math.max(0, bf).toFixed(1), fm: Math.max(0, fm).toFixed(1), lm: Math.max(0, lm).toFixed(1), sum7: sum7.toFixed(1) };
  }, [sum7, formData.age, formData.weight, formData.gender]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const validateForm = () => {
    if (!formData.date) return 'Fecha requerida';
    if (!formData.age || Number(formData.age) <= 0) return 'Edad inválida';
    if (!formData.weight || Number(formData.weight) <= 0) return 'Peso inválido';
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { alert(err); return; }
    const newRecord = {
      id: generateId(),
      clientName: safeClient,
      ...formData,
      totalSum7: composition.sum7,
      densidad: composition.bd,
      grasa: composition.bf,
      masaGrasa: composition.fm,
      masaMagra: composition.lm,
      timestamp: new Date().toISOString()
    };
    setRecords(prev => [newRecord, ...prev]);
    // reset numéricos
    setFormData(prev => ({ ...prev, triceps:'', subescapular:'', suprailiaco:'', pecho:'', axilarMedio:'', abdomen:'', muslo:'', pCintura:'', pCadera:'', pPierna:'', pPecho:'', pHombros:'', pBrazo:'' }));
  };

  const deleteRecord = (id, e) => {
    e?.stopPropagation();
    if (!confirm('¿Eliminar registro? Esta acción no se puede deshacer.')) return;
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  useEffect(() => {
    if (isCaptureModeGlobal) {
      const allExpanded = {};
      clientRecords.forEach(r => { if (r.id) allExpanded[r.id] = true; });
      setExpandedCards(allExpanded);
    }
  }, [isCaptureModeGlobal, clientRecords]);

  const formatDate = (d) => {
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const displayInitial = (name) => (name && name.length) ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className={grid grid-cols-1  gap-8 animate-in fade-in max-w-5xl mx-auto p-4}>
      {isCaptureModeGlobal && (
        <div className="flex justify-between items-end border-b-4 border-indigo-500 pb-4 mb-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reporte Antropométrico</h1>
            <p className="text-lg font-bold text-slate-500 uppercase">{safeClient}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button onClick={() => window.print()} className="bg-indigo-600 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-lg hover:bg-indigo-700"><Printer size={16} /> Imprimir / PDF</button>
            <button onClick={() => setIsCaptureModeGlobal(false)} className="bg-slate-900 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-lg"><X size={16} /> Salir</button>
          </div>
        </div>
      )}

      {!isCaptureModeGlobal && (
        <div className="xl:col-span-5">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden sticky top-0">
            <div className="p-6 pb-0">
              <h2 className="font-black text-xl tracking-tight text-slate-800 mb-6 flex items-center gap-2">Nuevo Registro: {safeClient}</h2>
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="sr-only" htmlFor="date">Fecha</label>
                  <input id="date" type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm" />
                  <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1">
                    <button type="button" onClick={() => setFormData(p => ({...p, gender: 'M'}))} className={lex-1 text-sm font-black rounded-lg }>M</button>
                    <button type="button" onClick={() => setFormData(p => ({...p, gender: 'F'}))} className={lex-1 text-sm font-black rounded-lg }>F</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <InputField id="age" label="Edad" name="age" value={formData.age} onChange={handleChange} unit="a" />
                  <InputField id="weight" label="Peso" name="weight" value={formData.weight} onChange={handleChange} unit="kg" />
                  <InputField id="height" label="Estat." name="height" value={formData.height} onChange={handleChange} unit="cm" />
                </div>
              </div>

              <div className="flex bg-slate-100/50 p-1.5 rounded-xl mb-2">
                <button type="button" onClick={() => setActiveTab('pliegues')} className={lex-1 py-2 text-sm font-bold rounded-lg transition-all }>Pliegues</button>
                <button type="button" onClick={() => setActiveTab('perimetros')} className={lex-1 py-2 text-sm font-bold rounded-lg transition-all }>Perímetros</button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 pt-4">
                <div className="min-h-[260px]">
                  {activeTab === 'pliegues' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <InputField id="pecho" label="Pecho" name="pecho" value={formData.pecho} onChange={handleChange} />
                      <InputField id="axilarMedio" label="Axilar M." name="axilarMedio" value={formData.axilarMedio} onChange={handleChange} />
                      <InputField id="triceps" label="Tríceps" name="triceps" value={formData.triceps} onChange={handleChange} />
                      <InputField id="subescapular" label="Subesc." name="subescapular" value={formData.subescapular} onChange={handleChange} />
                      <InputField id="abdomen" label="Abdomen" name="abdomen" value={formData.abdomen} onChange={handleChange} />
                      <InputField id="suprailiaco" label="Suprail." name="suprailiaco" value={formData.suprailiaco} onChange={handleChange} />
                      <InputField id="muslo" label="Muslo" name="muslo" value={formData.muslo} onChange={handleChange} />
                      <div className="bg-indigo-50 p-2 rounded-xl flex flex-col justify-center border border-indigo-100 text-center">
                        <span className="text-[10px] uppercase font-black text-indigo-400">Suma 7</span>
                        <span className="text-xl font-black text-indigo-700">{composition.sum7}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <InputField id="pCintura" label="Cintura" name="pCintura" value={formData.pCintura} onChange={handleChange} unit="cm" />
                      <InputField id="pCadera" label="Cadera" name="pCadera" value={formData.pCadera} onChange={handleChange} unit="cm" />
                      <InputField id="pPierna" label="Pierna" name="pPierna" value={formData.pPierna} onChange={handleChange} unit="cm" />
                      <InputField id="pPecho" label="Pecho" name="pPecho" value={formData.pPecho} onChange={handleChange} unit="cm" />
                      <InputField id="pHombros" label="Hombros" name="pHombros" value={formData.pHombros} onChange={handleChange} unit="cm" />
                      <InputField id="pBrazo" label="Brazo" name="pBrazo" value={formData.pBrazo} onChange={handleChange} unit="cm" />
                    </div>
                  )}
                </div>

                <div className="mt-4 bg-slate-900 text-white rounded-xl p-4 border border-slate-700 grid grid-cols-4 gap-2 text-center">
                  <div><span className="block text-[9px] text-slate-400 font-bold uppercase">Densidad</span><span className="font-bold text-sm">{composition.bd || '-'}</span></div>
                  <div><span className="block text-[9px] text-pink-400 font-bold uppercase">% Grasa</span><span className="font-bold text-sm text-pink-400">{composition.bf || '-'}%</span></div>
                  <div><span className="block text-[9px] text-yellow-400 font-bold uppercase">M. Grasa</span><span className="font-bold text-sm">{composition.fm || '-'}kg</span></div>
                  <div><span className="block text-[9px] text-emerald-400 font-bold uppercase">M. Magra</span><span className="font-bold text-sm">{composition.lm || '-'}kg</span></div>
                </div>

                <button type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                  <Check size={18} /> Guardar Registro
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className={isCaptureModeGlobal ? 'xl:col-span-12' : 'xl:col-span-7'}>
        {!isCaptureModeGlobal && (
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><ClipboardList size={20} className="text-indigo-600"/> Historial ({clientRecords.length})</h3>
            <button onClick={() => setIsCaptureModeGlobal(true)} className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-bold hover:bg-emerald-200 transition">
              <Printer size={16} /> <span className="hidden sm:inline">Capturar Reporte</span>
            </button>
          </div>
        )}

        {clientRecords.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-slate-400 font-bold">No hay registros guardados para {safeClient}</div>
        ) : (
          <div className={space-y-4 }>
            {clientRecords.map(r => (
              <div key={r.id} className={g-white rounded-2xl overflow-hidden shadow-sm }>
                <div className={p-4 flex justify-between items-center } onClick={() => !isCaptureModeGlobal && setExpandedCards(p => ({...p, [r.id]: !p[r.id]}))}>
                  <div className="flex items-center gap-4">
                    <div className={h-10 w-10 rounded-xl flex items-center justify-center font-black }>
                      {displayInitial(r.clientName)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{r.clientName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{formatDate(r.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right border-r border-slate-200 pr-4 mr-1">
                      <span className="text-[10px] text-slate-400 uppercase font-black block">Peso</span>
                      <span className="font-black text-slate-700">{r.weight}kg</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-black block">% Grasa</span>
                      <span className="font-black text-indigo-600">{r.grasa}%</span>
                    </div>
                    {!isCaptureModeGlobal && (expandedCards[r.id] ? <ChevronUp size={20} className="text-slate-400 ml-2"/> : <ChevronDown size={20} className="text-slate-400 ml-2"/>)}                  </div>
                </div>

                {expandedCards[r.id] && (
                  <div className="p-5 bg-white">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 border-b pb-1">Pliegues (mm)</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <ResultItem label="Tríceps" val={r.triceps} />
                          <ResultItem label="Subesc." val={r.subescapular} />
                          <ResultItem label="Pecho" val={r.pecho} />
                          <ResultItem label="Axilar" val={r.axilarMedio} />
                          <ResultItem label="Abdom." val={r.abdomen} />
                          <ResultItem label="Supra." val={r.suprailiaco} />
                          <ResultItem label="Muslo" val={r.muslo} />
                          <div className="flex justify-between items-center p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                            <span className="font-bold text-[9px] uppercase">Suma 7</span>
                            <span className="font-black">{r.totalSum7}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 border-b pb-1">Perímetros (cm)</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <ResultItem label="Cintura" val={r.pCintura} accent="emerald" />
                          <ResultItem label="Cadera" val={r.pCadera} accent="emerald" />
                          <ResultItem label="Pierna" val={r.pPierna} accent="emerald" />
                          <ResultItem label="Brazo" val={r.pBrazo} accent="emerald" />
                          <ResultItem label="Pecho" val={r.pPecho} accent="emerald" />
                          <ResultItem label="Hombros" val={r.pHombros} accent="emerald" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div><span className="block text-[9px] uppercase font-black text-slate-400">Densidad</span><span className="font-bold text-sm text-slate-700">{r.densidad}</span></div>
                      <div><span className="block text-[9px] uppercase font-black text-slate-400">Grasa %</span><span className="font-black text-sm text-pink-500">{r.grasa}%</span></div>
                      <div><span className="block text-[9px] uppercase font-black text-slate-400">Masa Grasa</span><span className="font-bold text-sm text-slate-700">{r.masaGrasa}kg</span></div>
                      <div><span className="block text-[9px] uppercase font-black text-slate-400">Masa Magra</span><span className="font-bold text-sm text-slate-700">{r.masaMagra}kg</span></div>
                    </div>
                    {!isCaptureModeGlobal && (
                      <button onClick={(e) => deleteRecord(r.id, e)} className="mt-4 w-full text-center py-2 text-[10px] font-bold text-red-400 bg-red-50 rounded-lg hover:bg-red-100 transition"><Trash2 size={12} className="inline mr-1"/> Eliminar este registro</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
