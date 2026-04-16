import React, { useState, useMemo, useEffect } from 'react';
import useDebounced from '../hooks/useDebounced';
import { loadStorage, saveStorage } from '../utils/storage';
import { generateId } from '../utils/id';
import { Plus, Camera, Check, X, Trash2, Calculator, Target, Droplet, Settings } from 'lucide-react';
import { FOOD_DATABASE } from '../data/foods'; // si no existe, importa desde donde tengas la DB

export default function NutricionView({ activeClient, isCaptureModeGlobal, setIsCaptureModeGlobal }) {
  const safeClient = activeClient || 'Paciente Demo';

  const [allMeals, setAllMeals] = useState(() => loadStorage('nutricion_plan_v3', {}));
  const [allProfiles, setAllProfiles] = useState(() => loadStorage('nutricion_profile_v3', {}));
  const [newItem, setNewItem] = useState({ mealId: null, foodRef: null, name: '', amount: '', unit: '', kcal: '', prot: '', carb: '', fat: '', sodio: '' });
  const [showConfig, setShowConfig] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedFoodCategory, setExpandedFoodCategory] = useState(null);

  useEffect(() => saveStorage('nutricion_plan_v3', allMeals), [allMeals]);
  useEffect(() => saveStorage('nutricion_profile_v3', allProfiles), [allProfiles]);

  const meals = allMeals[safeClient] || [{ id: generateId(), name: 'Desayuno', items: [] }];
  const profile = allProfiles[safeClient] || { age: 25, weight: 70, height: 170, gender: 'M', activity: 1.2, targetKcal: 2000, targetProt: 150, targetCarb: 200, targetFat: 60, targetSodium: 2000 };

  const updateMeals = (newMeals) => setAllMeals(prev => ({ ...prev, [safeClient]: newMeals }));
  const updateProfile = (newProfile) => setAllProfiles(prev => ({ ...prev, [safeClient]: newProfile }));

  const addMeal = () => updateMeals([...meals, { id: generateId(), name: Comida , items: [] }]);
  const deleteMeal = (id) => {
    if (!confirm('¿Eliminar esta comida y todos sus ítems?')) return;
    updateMeals(meals.filter(m => m.id !== id));
  };

  const saveItem = () => {
    if (!newItem.name || !newItem.mealId) return;
    const amountNum = Number(newItem.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Cantidad inválida');
      return;
    }
    const updated = meals.map(m => {
      if (m.id === newItem.mealId) {
        const newItemObj = {
          id: generateId(),
          name: newItem.name,
          amount: amountNum,
          unit: newItem.unit || newItem.foodRef?.unit || '',
          kcal: Number(newItem.kcal) || 0,
          prot: Number(newItem.prot) || 0,
          carb: Number(newItem.carb) || 0,
          fat: Number(newItem.fat) || 0,
          sodio: Number(newItem.sodio) || 0
        };
        return { ...m, items: [...(m.items || []), newItemObj] };
      }
      return m;
    });
    updateMeals(updated);
    setNewItem({ mealId: null, foodRef: null, name: '', amount: '', unit: '', kcal: '', prot: '', carb: '', fat: '', sodio: '' });
    setExpandedFoodCategory(null);
    setShowSuggestions(false);
  };

  const deleteItem = (mealId, itemId) => {
    if (!confirm('¿Eliminar este ítem?')) return;
    updateMeals(meals.map(m => m.id === mealId ? { ...m, items: m.items.filter(i => i.id !== itemId) } : m));
  };

  const handleProfileChange = (e) => updateProfile({ ...profile, [e.target.name]: e.target.value });

  const tmb = useMemo(() => {
    const w = Number(profile.weight) || 0; const h = Number(profile.height) || 0; const a = Number(profile.age) || 0;
    if (w === 0 || h === 0 || a === 0) return 0;
    return profile.gender === 'M' ? (10 * w) + (6.25 * h) - (5 * a) + 5 : (10 * w) + (6.25 * h) - (5 * a) - 161;
  }, [profile.weight, profile.height, profile.age, profile.gender]);

  const tdee = useMemo(() => tmb * Number(profile.activity || 1), [tmb, profile.activity]);

  const autoCalculateMacros = () => {
    if (tdee === 0) return;
    const kcalObj = Math.round(tdee - 300);
    const protObj = Math.round((Number(profile.weight) || 0) * 2.2);
    const fatObj = Math.round((Number(profile.weight) || 0) * 0.8);
    const carbObj = Math.round((kcalObj - (protObj * 4) - (fatObj * 9)) / 4);
    updateProfile({ ...profile, targetKcal: kcalObj, targetProt: protObj, targetFat: fatObj, targetCarb: carbObj > 0 ? carbObj : 0, targetSodium: 2000 });
  };

  const debouncedSearch = useDebounced(newItem.name || '', 200);

  const searchResults = useMemo(() => {
    const text = (debouncedSearch || '').trim().toLowerCase();
    if (!text) return FOOD_DATABASE;
    return FOOD_DATABASE.filter(f => f.name.toLowerCase().includes(text));
  }, [debouncedSearch]);

  const groupedSuggestions = useMemo(() => {
    return searchResults.reduce((acc, food) => {
      (acc[food.category] = acc[food.category] || []).push(food);
      return acc;
    }, {});
  }, [searchResults]);

  const totals = useMemo(() => {
    return meals.reduce((acc, meal) => {
      (meal.items || []).forEach(item => {
        acc.kcal += Number(item.kcal) || 0;
        acc.prot += Number(item.prot) || 0;
        acc.carb += Number(item.carb) || 0;
        acc.fat += Number(item.fat) || 0;
        acc.sodio += Number(item.sodio) || 0;
      });
      return acc;
    }, { kcal: 0, prot: 0, carb: 0, fat: 0, sodio: 0 });
  }, [meals]);

  const getPercentage = (current, target) => {
    const c = Number(current) || 0;
    const t = Number(target) || 0;
    if (t === 0) return 0;
    const pct = (c / t) * 100;
    return pct > 100 ? 100 : Math.round(pct);
  };

  const handleSelectFood = (food) => {
    setNewItem({
      ...newItem,
      foodRef: food,
      name: food.name,
      amount: food.baseAmount,
      unit: food.unit,
      kcal: food.kcal,
      prot: food.prot,
      carb: food.carb,
      fat: food.fat,
      sodio: food.sodio
    });
    setShowSuggestions(false);
    setExpandedFoodCategory(null);
  };

  const handleAmountChange = (e) => {
    const newAmountStr = e.target.value;
    const newAmount = newAmountStr === '' ? '' : Number(newAmountStr);
    if (newItem.foodRef && newAmount !== '' && !isNaN(newAmount)) {
      const factor = newAmount / newItem.foodRef.baseAmount;
      setNewItem(prev => ({
        ...prev,
        amount: newAmount,
        kcal: Math.round(newItem.foodRef.kcal * factor),
        prot: Number((newItem.foodRef.prot * factor).toFixed(1)),
        carb: Number((newItem.foodRef.carb * factor).toFixed(1)),
        fat: Number((newItem.foodRef.fat * factor).toFixed(1)),
        sodio: Math.round(newItem.foodRef.sodio * factor)
      }));
    } else {
      setNewItem(prev => ({ ...prev, amount: newAmountStr }));
    }
  };

  return (
    <div className={max-w-4xl mx-auto animate-in fade-in }>
      <div className="flex justify-between items-center mb-6">
        {isCaptureModeGlobal ? (
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 border-b-4 border-indigo-500 pb-2 inline-block">Plan Nutricional</h1>
            <p className="text-xl font-bold text-slate-500 mt-2 uppercase">{safeClient}</p>
          </div>
        ) : (
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setIsCaptureModeGlobal(true)} className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-lg font-bold hover:bg-emerald-200 transition">
              <Camera size={18} /><span className="hidden md:inline">Capturar Dieta</span>
            </button>
          </div>
        )}
      </div>

      {/* Resumen y Config */}
      <div className={g-slate-900 rounded-3xl p-6 shadow-xl text-white mb-8 relative overflow-hidden }>
        {!isCaptureModeGlobal && (
          <button onClick={() => setShowConfig(!showConfig)} className="absolute top-6 right-6 p-2 bg-slate-800 text-slate-300 hover:text-white rounded-full transition z-10 shadow-sm" title="Configurar Metas y Paciente">
            <Settings size={20} />
          </button>
        )}
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Target size={16}/> Resumen Diario</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="col-span-2 lg:col-span-1">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Calorías</p>
            <p className="text-3xl font-black text-indigo-400">{totals.kcal} <span className="text-sm font-normal text-slate-500">/ {profile.targetKcal}</span></p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-indigo-500 h-full rounded-full transition-all" style={{width: ${getPercentage(totals.kcal, profile.targetKcal)}%}}></div></div>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Proteína</p>
            <p className="text-2xl font-bold">{totals.prot.toFixed(1)}<span className="text-xs text-slate-500 ml-1">/ {profile.targetProt}g</span></p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-blue-400 h-full rounded-full transition-all" style={{width: ${getPercentage(totals.prot, profile.targetProt)}%}}></div></div>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Carbos</p>
            <p className="text-2xl font-bold">{totals.carb.toFixed(1)}<span className="text-xs text-slate-500 ml-1">/ {profile.targetCarb}g</span></p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-emerald-400 h-full rounded-full transition-all" style={{width: ${getPercentage(totals.carb, profile.targetCarb)}%}}></div></div>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Grasas</p>
            <p className="text-2xl font-bold">{totals.fat.toFixed(1)}<span className="text-xs text-slate-500 ml-1">/ {profile.targetFat}g</span></p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-yellow-400 h-full rounded-full transition-all" style={{width: ${getPercentage(totals.fat, profile.targetFat)}%}}></div></div>
          </div>
          <div className="col-span-2 lg:col-span-1 border-t lg:border-t-0 lg:border-l border-slate-700 pt-4 lg:pt-0 lg:pl-6">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1 flex items-center gap-1"><Droplet size={12}/> Sodio</p>
            <p className="text-xl font-bold text-slate-300">{totals.sodio}<span className="text-xs text-slate-500 ml-1">/ {profile.targetSodium}mg</span></p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden"><div className={h-full rounded-full transition-all } style={{width: ${getPercentage(totals.sodio, profile.targetSodium)}%}}></div></div>
          </div>
        </div>
      </div>

      {/* Configuración */}
      {showConfig && !isCaptureModeGlobal && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><Calculator size={20} className="text-indigo-600"/> Perfil Nutricional: {safeClient}</h3>
            <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition"><X size={16}/></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Edad</label>
                  <input name=\"age\" value={profile.age} onChange={handleProfileChange} className=\"w-full px-3 py-2 border rounded-lg text-sm\" />
                </div>
                <div className=\"flex bg-slate-50 border border-slate-200 rounded-lg p-1 items-end mt-4 h-[34px]\">
                  <button onClick={() => updateProfile({...profile, gender: 'M'})} className={lex-1 text-xs font-black rounded-md h-full }>M</button>
                  <button onClick={() => updateProfile({...profile, gender: 'F'})} className={lex-1 text-xs font-black rounded-md h-full }>F</button>
                </div>
              </div>
              <div className=\"grid grid-cols-2 gap-3\">
                <div><label className=\"block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1\">Peso</label><input name=\"weight\" value={profile.weight} onChange={handleProfileChange} className=\"w-full px-3 py-2 border rounded-lg text-sm\" /></div>
                <div><label className=\"block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1\">Estatura</label><input name=\"height\" value={profile.height} onChange={handleProfileChange} className=\"w-full px-3 py-2 border rounded-lg text-sm\" /></div>
              </div>
              <div>
                <label className=\"block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1\">Factor de Actividad</label>
                <select name=\"activity\" value={profile.activity} onChange={handleProfileChange} className=\"w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold text-slate-700 shadow-sm\">
                  <option value=\"1.2\">Sedentario</option>
                  <option value=\"1.375\">Ligero</option>
                  <option value=\"1.55\">Moderado</option>
                  <option value=\"1.725\">Activo</option>
                  <option value=\"1.9\">Muy Activo</option>
                </select>
              </div>
            </div>

            <div className=\"space-y-4\">
              <div className=\"flex justify-between items-center mb-1\">
                <label className=\"block text-xs font-black text-slate-800 uppercase\">Metas Manuales</label>
                <button onClick={autoCalculateMacros} className=\"text-[10px] bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold hover:bg-indigo-200 transition\">Auto-Calcular (Déficit)</button>
              </div>
              <div className=\"grid grid-cols-2 gap-3\">
                <div><label className=\"block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1\">Kcal Obj.</label><input name=\"targetKcal\" value={profile.targetKcal} onChange={handleProfileChange} className=\"w-full px-3 py-2 border rounded-lg text-sm\" /></div>
                <div><label className=\"block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1\">Sodio Obj.</label><input name=\"targetSodium\" value={profile.targetSodium} onChange={handleProfileChange} className=\"w-full px-3 py-2 border rounded-lg text-sm\" /></div>
                <div><label className=\"block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1\">Prot. Obj.</label><input name=\"targetProt\" value={profile.targetProt} onChange={handleProfileChange} className=\"w-full px-3 py-2 border rounded-lg text-sm\" /></div>
                <div><label className=\"block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1\">Carbos Obj.</label><input name=\"targetCarb\" value={profile.targetCarb} onChange={handleProfileChange} className=\"w-full px-3 py-2 border rounded-lg text-sm\" /></div>
                <div><label className=\"block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1\">Grasas Obj.</label><input name=\"targetFat\" value={profile.targetFat} onChange={handleProfileChange} className=\"w-full px-3 py-2 border rounded-lg text-sm\" /></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de comidas y UI para agregar items */}
      <div className=\"space-y-6\">
        {meals.map(meal => {
          const mealTotals = (meal.items || []).reduce((acc, it) => ({ k: acc.k+Number(it.kcal||0), p: acc.p+Number(it.prot||0), c: acc.c+Number(it.carb||0), f: acc.f+Number(it.fat||0), s: acc.s+Number(it.sodio||0) }), {k:0,p:0,c:0,f:0,s:0});
          return (
            <div key={meal.id} className={g-white rounded-2xl border  print:break-inside-avoid}>
              <div className={${isCaptureModeGlobal ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-200'} border-b p-4 flex justify-between items-center rounded-t-2xl}>
                {isCaptureModeGlobal ? (
                  <h3 className=\"font-black text-lg text-indigo-900 w-1/2\">{meal.name}</h3>
                ) : (
                  <input type=\"text\" value={meal.name} onChange={(e) => updateMeals(meals.map(m => m.id === meal.id ? {...m, name: e.target.value} : m))} className=\"bg-transparent font-black text-lg text-slate-800 outline-none border-b-2 border-transparent focus:border-indigo-500 transition-colors w-1/2\" />
                )}
                <div className=\"flex items-center gap-3\">
                  <span className={	ext-[10px] font-bold  px-2 py-1 rounded-md}>Na: {mealTotals.s}mg</span>
                  <span className=\"text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full\">{mealTotals.k} kcal</span>
                  {!isCaptureModeGlobal && (<button onClick={() => deleteMeal(meal.id)} className=\"text-slate-400 hover:text-red-500 transition ml-2\"><Trash2 size={16}/></button>)}
                </div>
              </div>

              <div className=\"p-4\">
                {meal.items && meal.items.length > 0 && (
                  <div className=\"overflow-x-auto\">
                    <table className=\"w-full text-sm text-left text-slate-600 mb-4 min-w-[500px]\">
                      <thead className=\"text-[10px] text-slate-400 uppercase font-black border-b border-slate-100\">
                        <tr><th className=\"pb-2\">Alimento</th><th className=\"pb-2\">Kcal</th><th className=\"pb-2\">Prot</th><th className=\"pb-2\">Carb</th><th className=\"pb-2\">Grasa</th><th className=\"pb-2 text-slate-300\">Sodio</th>{!isCaptureModeGlobal && <th className=\"pb-2\"></th>}</tr>
                      </thead>
                      <tbody>
                        {meal.items.map(item => (
                          <tr key={item.id} className=\"border-b border-slate-50 last:border-0\">
                            <td className=\"py-2 font-semibold text-slate-800\">
                              {item.name} 
                              {item.amount && <span className=\"text-[10px] font-bold text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded ml-2\">{item.amount}{item.unit}</span>}
                            </td>
                            <td className=\"py-2\">{item.kcal}</td><td className=\"py-2\">{item.prot}g</td><td className=\"py-2\">{item.carb}g</td><td className=\"py-2\">{item.fat}g</td><td className=\"py-2 text-slate-400 text-xs\">{item.sodio}mg</td>
                            {!isCaptureModeGlobal && (<td className=\"py-2 text-right\"><button onClick={() => deleteItem(meal.id, item.id)} className=\"text-red-400 hover:text-red-600 p-1\"><X size={14}/></button></td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!isCaptureModeGlobal && (
                  newItem.mealId === meal.id ? (
                    <div className=\"bg-slate-50 p-3 rounded-xl flex flex-wrap gap-2 items-end border border-indigo-100 animate-in fade-in relative\">
                      <div className=\"flex-1 min-w-[140px] relative\">
                        <label className=\"text-[10px] font-bold text-slate-500\">Catálogo / Buscar Alimento</label>
                        <input autoFocus value={newItem.name} onChange={e => { setNewItem(prev => ({...prev, name: e.target.value})); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 250)} className=\"w-full text-sm p-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 font-semibold text-slate-700\" placeholder=\"Ej. Pechuga o selecciona...\" />
                        {showSuggestions && Object.keys(groupedSuggestions).length > 0 && (
                          <div className=\"absolute top-full left-0 w-full md:w-[320px] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto mt-2\">
                            {Object.keys(groupedSuggestions).map(category => {
                              const isSearching = (debouncedSearch || '').length > 0;
                              const isExpanded = isSearching || expandedFoodCategory === category;
                              return (
                                <div key={category} className=\"border-b border-slate-100 last:border-0\">
                                  <div className=\"bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-2 sticky top-0 flex justify-between items-center cursor-pointer hover:bg-slate-200 transition\" onMouseDown={(e) => { e.preventDefault(); if (!isSearching) setExpandedFoodCategory(expandedFoodCategory === category ? null : category); }}>
                                    {category}
                                  </div>
                                  {isExpanded && groupedSuggestions[category].map(food => (
                                    <div key={food.name} onMouseDown={(e) => { e.preventDefault(); handleSelectFood(food); }} className=\"p-2.5 border-b border-slate-50 hover:bg-indigo-50 cursor-pointer transition pl-4\">
                                      <span className=\"font-bold text-slate-800 text-sm block\">{food.name} <span className=\"text-indigo-400 text-xs font-normal\">({food.baseAmount}{food.unit})</span></span>
                                      <span className=\"text-[10px] font-bold text-slate-400 block mt-0.5\">{food.kcal} kcal | P: {food.prot}g | C: {food.carb}g | G: {food.fat}g</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className=\"w-20\">
                        <label className=\"text-[10px] font-bold text-indigo-500\">Cantidad</label>
                        <div className=\"relative\">
                          <input type=\"number\" value={newItem.amount} onChange={handleAmountChange} className=\"w-full text-sm p-2 pr-6 rounded-lg border border-indigo-200 focus:border-indigo-500 outline-none font-bold text-indigo-700\" placeholder=\"0\" />
                          <span className=\"absolute right-2 top-2.5 text-[9px] font-bold text-indigo-400\">{newItem.unit || '-'}</span>
                        </div>
                      </div>

                      <div className=\"w-14\"><label className=\"text-[10px] font-bold text-slate-400\">Kcal</label><input type=\"number\" value={newItem.kcal} onChange={e=>setNewItem(prev=>({...prev, kcal: e.target.value}))} className=\"w-full text-sm p-2 rounded-lg border border-slate-200 px-1 text-slate-600\" placeholder=\"0\"/></div>
                      <div className=\"w-14\"><label className=\"text-[10px] font-bold text-slate-400\">Pr(g)</label><input type=\"number\" value={newItem.prot} onChange={e=>setNewItem(prev=>({...prev, prot: e.target.value}))} className=\"w-full text-sm p-2 rounded-lg border border-slate-200 px-1 text-slate-600\" placeholder=\"0\"/></div>
                      <div className=\"w-14\"><label className=\"text-[10px] font-bold text-slate-400\">Cb(g)</label><input type=\"number\" value={newItem.carb} onChange={e=>setNewItem(prev=>({...prev, carb: e.target.value}))} className=\"w-full text-sm p-2 rounded-lg border border-slate-200 px-1 text-slate-600\" placeholder=\"0\"/></div>
                      <div className=\"w-14\"><label className=\"text-[10px] font-bold text-slate-400\">Gr(g)</label><input type=\"number\" value={newItem.fat} onChange={e=>setNewItem(prev=>({...prev, fat: e.target.value}))} className=\"w-full text-sm p-2 rounded-lg border border-slate-200 px-1 text-slate-600\" placeholder=\"0\"/></div>

                      <div className=\"flex gap-1 ml-auto\">
                        <button onClick={saveItem} className=\"bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 shadow-md\"><Check size={16}/></button>
                        <button onClick={() => { setNewItem({mealId: null, foodRef: null, name: '', amount: '', unit: '', kcal: '', prot: '', carb: '', fat: '', sodio: ''}); setExpandedFoodCategory(null); }} className=\"bg-slate-200 text-slate-600 p-2 rounded-lg hover:bg-slate-300\"><X size={16}/></button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setNewItem({mealId: meal.id, foodRef: null, name: '', amount: '', unit: '', kcal: '', prot: '', carb: '', fat: '', sodio: ''})} className=\"text-sm font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1\">
                      <Plus size={16}/> Agregar Alimento
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}

        {!isCaptureModeGlobal && (
          <button onClick={addMeal} className=\"w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2\">
            <Plus size={20} /> AÑADIR NUEVA COMIDA
          </button>
        )}
      </div>
    </div>
  );
}
