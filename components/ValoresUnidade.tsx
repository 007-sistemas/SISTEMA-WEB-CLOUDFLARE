import React, { useState, useEffect } from 'react';
import { TurnoPadrao, TurnoUnidade, Hospital } from '../types';
import { StorageService } from '../services/storage';
import { apiGet, apiPost, apiDelete } from '../services/api';
import { Plus, Copy, Edit2, Trash2, Save, X } from 'lucide-react';

interface ValoresUnidadeProps {
  hospitalId: string;
}

export const ValoresUnidade: React.FC<ValoresUnidadeProps> = ({ hospitalId }) => {
  const [turnosPadroes, setTurnosPadroes] = useState<TurnoPadrao[]>([]);
  const [valores, setValores] = useState<TurnoUnidade[]>([]);
  const [form, setForm] = useState({
    turnoPadraoId: '',
    categoriaProfissional: '',
    valorHora: '',
    toleranciaAntes: 0,
    toleranciaDepois: 0
  });
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [categorias, setCategorias] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const turnos = await apiGet<TurnoPadrao[]>('turnos');
        setTurnosPadroes(turnos);
      } catch {
        setTurnosPadroes([]);
      }
      try {
        const profs = await apiGet<string[]>('professions');
        setCategorias(profs);
      } catch {
        setCategorias([]);
      }
      await carregarValores();
    })();
  }, [hospitalId]);

  const carregarValores = async () => {
    try {
      const todos = await apiGet<TurnoUnidade[]>(`valores?hospitalId=${hospitalId}`);
      setValores(todos);
    } catch {
      setValores([]);
    }
  };

  const limparForm = () => {
    setForm({ turnoPadraoId: '', categoriaProfissional: '', valorHora: '', toleranciaAntes: 0, toleranciaDepois: 0 });
    setEditandoId(null);
  };

  const salvar = async () => {
    if (!form.turnoPadraoId || !form.categoriaProfissional || !form.valorHora) return;
    const payload = {
      id: editandoId || undefined,
      hospital_id: hospitalId,
      turno_padrao_id: form.turnoPadraoId,
      categoria_profissional: form.categoriaProfissional,
      valor_hora: Number(form.valorHora),
      tolerancia_antes: form.toleranciaAntes,
      tolerancia_depois: form.toleranciaDepois
    };
    await apiPost('valores', payload);
    await carregarValores();
    limparForm();
  };

  const editar = (id: string) => {
    const v = valores.find(val => val.id === id);
    if (v) {
      setForm({
        turnoPadraoId: v.turnoPadraoId,
        categoriaProfissional: v.categoriaProfissional,
        valorHora: String(v.valorHora),
        toleranciaAntes: v.toleranciaAntes || 0,
        toleranciaDepois: v.toleranciaDepois || 0
      });
      setEditandoId(id);
    }
  };

  const remover = async (id: string) => {
    await apiDelete('valores', { id });
    await carregarValores();
    limparForm();
  };

  // Clonagem (simples: clona todos os valores de outro hospital)
  const clonarDe = async (origemId: string) => {
    const origem = await apiGet<TurnoUnidade[]>(`valores?hospitalId=${origemId}`);
    for (const v of origem) {
      await apiPost('valores', {
        hospital_id: hospitalId,
        turno_padrao_id: v.turnoPadraoId,
        categoria_profissional: v.categoriaProfissional,
        valor_hora: v.valorHora,
        tolerancia_antes: v.toleranciaAntes,
        tolerancia_depois: v.toleranciaDepois
      });
    }
    await carregarValores();
  };

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Valores por Turno</h2>
      <form className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6" onSubmit={e => { e.preventDefault(); salvar(); }}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Turno *</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.turnoPadraoId} onChange={e => setForm(f => ({ ...f, turnoPadraoId: e.target.value }))} required>
            <option value="">Selecione</option>
            {turnosPadroes.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.categoriaProfissional} onChange={e => setForm(f => ({ ...f, categoriaProfissional: e.target.value }))} required>
            <option value="">Selecione</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor Hora *</label>
          <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.valorHora} onChange={e => setForm(f => ({ ...f, valorHora: e.target.value }))} required min="0" step="0.01" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tolerância Entrada (min)</label>
          <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.toleranciaAntes} onChange={e => setForm(f => ({ ...f, toleranciaAntes: Number(e.target.value) }))} min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tolerância Saída (min)</label>
          <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.toleranciaDepois} onChange={e => setForm(f => ({ ...f, toleranciaDepois: Number(e.target.value) }))} min="0" />
        </div>
        <div className="md:col-span-5 flex gap-2 mt-2">
          <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition">{editandoId ? 'Salvar' : 'Adicionar'}</button>
          {editandoId && <button type="button" className="px-4 py-2 text-gray-500 hover:text-gray-700" onClick={limparForm}>Cancelar</button>}
        </div>
      </form>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm mt-4">
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              <th className="px-4 py-2 text-left">Turno</th>
              <th className="px-4 py-2 text-left">Categoria</th>
              <th className="px-4 py-2 text-left">Valor Hora</th>
              <th className="px-4 py-2 text-left">Tolerância Entrada</th>
              <th className="px-4 py-2 text-left">Tolerância Saída</th>
              <th className="px-4 py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {valores.map(v => (
              <tr key={v.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{turnosPadroes.find(t => t.id === v.turnoPadraoId)?.nome || '-'}</td>
                <td className="px-4 py-2">{v.categoriaProfissional}</td>
                <td className="px-4 py-2">R$ {v.valorHora.toFixed(2)}</td>
                <td className="px-4 py-2">{v.toleranciaAntes} min</td>
                <td className="px-4 py-2">{v.toleranciaDepois} min</td>
                <td className="px-4 py-2 text-center">
                  <button onClick={() => editar(v.id)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Edit2 size={16} /></button>
                  <button onClick={() => remover(v.id)} className="ml-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {valores.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-6">Nenhum valor cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
      {/* Clonagem */}
      <div className="pt-6 flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Clonar valores de outra unidade:</label>
        <select className="ml-2 px-3 py-2 border border-gray-300 rounded-lg" onChange={e => e.target.value && clonarDe(e.target.value)} defaultValue="">
          <option value="">Selecione a unidade</option>
          {StorageService.getHospitais().filter(h => h.id !== hospitalId).map(h => (
            <option key={h.id} value={h.id}>{h.nome}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
