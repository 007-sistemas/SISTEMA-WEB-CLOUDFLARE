import { Upload, Download, CheckCircle, AlertTriangle, X } from 'lucide-react';
import * as XLSX from 'xlsx';

import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete, apiPut } from '../services/api';
import { Edit2, Trash2, Save, X } from 'lucide-react';
interface Setor { id: string; nome: string; }

const SETORES_KEY = 'biohealth_setores';

// Fallback localStorage functions
const getSetoresLocal = (): Setor[] => {
  const data = localStorage.getItem(SETORES_KEY);
  if (!data) return [];
  // Convert old format (id: number) to new format (id: string)
  const parsed = JSON.parse(data);
  return parsed.map((s: any) => ({ id: String(s.id), nome: s.nome }));
};

const saveSetorLocal = (setor: Setor) => {
  const setores = getSetoresLocal();
  setores.push(setor);
  localStorage.setItem(SETORES_KEY, JSON.stringify(setores));
};

export const SetoresView: React.FC = () => {
    // Importação de setores
    const [showImportModal, setShowImportModal] = useState(false);
    const [csvPreview, setCsvPreview] = useState<any>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<any>(null);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [searchNome, setSearchNome] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [useLocal, setUseLocal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNome, setEditingNome] = useState('');
  // Removido statusSetores
  const [vinculos, setVinculos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSetores();
    // Carrega status e vínculos dos setores
    // TODO: Buscar status real do setor e se possui vínculo
    // Exemplo: setStatusSetores({ '1': 'ATIVO', '2': 'INATIVO' })
    // Exemplo: setVinculos({ '1': true, '2': false })
    // Pode ser implementado via API ou StorageService
  }, []);

  const loadSetores = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Setor[]>('setores');
      const normalized = data.map((s) => ({ ...s, id: String(s.id) }));
      setSetores(normalized);
      setUseLocal(false);
      // Buscar status e vínculos reais
      const pontos = await apiGet<any[]>('pontos');
      const setoresVinculados = new Set(pontos.map(p => String(p.setorId)).filter(Boolean));
      const vinculosReal: Record<string, boolean> = {};
      normalized.forEach(s => {
        vinculosReal[s.id] = setoresVinculados.has(s.id);
      });
      setVinculos(vinculosReal);
    } catch (err) {
      console.warn('API indisponível, usando localStorage:', err);
      setSetores(getSetoresLocal());
      setUseLocal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSetor = async () => {
    if (!novoNome.trim()) return;
    // Impede duplicidade
    if (setores.some(s => s.nome.toLowerCase() === novoNome.trim().toLowerCase())) {
      alert('Já existe um setor com esse nome!');
      return;
    }
    try {
      setLoading(true);
      if (useLocal) {
        // Fallback: usar localStorage com ID numérico (string)
        const maxId = Math.max(0, ...setores.map(s => Number(s.id) || 0));
        const novoSetor: Setor = { id: String(maxId + 1), nome: novoNome.trim() };
        saveSetorLocal(novoSetor);
        setSetores(getSetoresLocal());
      } else {
        // API: POST só com o nome, backend gera o ID
        const novoSetor = await apiPost<any>('setores', { nome: novoNome.trim() });
        setSetores([...setores, { ...novoSetor, id: String(novoSetor.id) }]);
        // Atualiza statusSetores para refletir o status retornado pela API
        // status removido
      }
      setNovoNome('');
    } catch (err) {
      console.error('Erro ao criar setor:', err);
      alert('Erro ao criar setor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setor: Setor) => {
    setEditingId(setor.id);
    setEditingNome(setor.nome);
  };

  const handleSaveEdit = async (setorId: string) => {
    if (!editingNome.trim()) return;
    try {
      setLoading(true);
      if (!useLocal) {
        // Atualizar via API
        try {
          await apiPut('setores', { id: setorId, nome: editingNome.trim() });
          await loadSetores();
        } catch (apiErr) {
          console.warn('API falhou, atualizando localmente:', apiErr);
          const updated = setores.map(s => s.id === setorId ? { ...s, nome: editingNome.trim() } : s);
          setSetores(updated);
          localStorage.setItem(SETORES_KEY, JSON.stringify(updated));
          setUseLocal(true);
        }
      } else {
        // Atualizar localmente
        const updated = setores.map(s => s.id === setorId ? { ...s, nome: editingNome.trim() } : s);
        setSetores(updated);
        localStorage.setItem(SETORES_KEY, JSON.stringify(updated));
      }
      setEditingId(null);
      setEditingNome('');
    } catch (err) {
      console.error('Erro ao editar setor:', err);
      alert('Erro ao editar setor');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingNome('');
  };

  const handleDelete = async (setorId: string) => {
    if (!confirm('Tem certeza que deseja excluir este setor?')) return;
    try {
      setLoading(true);
      if (!useLocal) {
        // Deletar via API
        try {
          await apiDelete('setores', { id: setorId });
          await loadSetores();
        } catch (apiErr) {
          console.warn('API falhou, deletando localmente:', apiErr);
          const updated = setores.filter(s => s.id !== setorId);
          setSetores(updated);
          localStorage.setItem(SETORES_KEY, JSON.stringify(updated));
          setUseLocal(true);
        }
      } else {
        // Deletar localmente
        const updated = setores.filter(s => s.id !== setorId);
        setSetores(updated);
        localStorage.setItem(SETORES_KEY, JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Erro ao excluir setor:', err);
      alert('Erro ao excluir setor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Setores</h2>
      <div className="flex gap-2 mb-6">
        <button
          className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          onClick={() => {
            // Baixar modelo CSV
            const csv = 'setores\n';
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'setores_modelo.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="h-4 w-4" />
          <span>Modelo Planilha</span>
        </button>
        <button
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          onClick={() => setShowImportModal(true)}
        >
          <Upload className="h-4 w-4" />
          <span>Importar Planilha</span>
        </button>
      </div>
            {/* Modal de Importação de Setores */}
            {showImportModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl animate-fade-in mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <Upload className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-bold text-gray-800">Importar Setores via Planilha</h3>
                    </div>
                    <button 
                      onClick={() => {
                        setShowImportModal(false);
                        setCsvPreview(null);
                        setImportResult(null);
                      }} 
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  {!csvPreview && !importResult ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">Selecione uma planilha com os nomes dos setores a importar.</p>
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 bg-blue-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-100 transition-colors">
                        <input 
                          type="file"
                          accept=".csv,.xlsx,.xls,.xlsm"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            let rows: string[] = [];
                            if (file.name.endsWith('.csv')) {
                              const text = await file.text();
                              rows = text.trim().split('\n').slice(1).map(l => l.trim()).filter(Boolean);
                            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.xlsm')) {
                              const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
                              const sheet = workbook.Sheets[workbook.SheetNames[0]];
                              rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(1).map((r: any) => r[0]).filter(Boolean);
                            } else {
                              alert('Formato de arquivo não suportado. Use CSV ou Excel (xlsx, xls, xlsm)');
                              return;
                            }
                            // Validação: setores já existentes
                            const erros: any[] = [];
                            const sucesso: string[] = [];
                            rows.forEach((nome, idx) => {
                              if (!nome.trim()) return;
                              if (setores.some(s => s.nome.toLowerCase() === nome.trim().toLowerCase())) {
                                erros.push({ row: idx + 2, campo: 'setor', erro: 'Setor já existe no sistema', valor: nome });
                              } else {
                                sucesso.push(nome.trim());
                              }
                            });
                            setCsvPreview({ sucesso, erros });
                            setImportResult(null);
                          }}
                          className="hidden"
                          id="setoresFileInput"
                        />
                        <label htmlFor="setoresFileInput" className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-blue-500" />
                          <span className="text-sm font-medium text-blue-600">Clique para selecionar arquivo</span>
                          <span className="text-xs text-gray-500">Excel (xlsx, xls, xlsm) ou CSV</span>
                        </label>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Coluna obrigatória:</p>
                        <p className="text-xs text-gray-600 font-mono mb-3">setores</p>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p><span className="font-semibold">Exemplo:</span></p>
                          <p className="font-mono">AMBULATORIO</p>
                        </div>
                      </div>
                    </div>
                  ) : importResult?.success ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-green-700">Importação concluída!</p>
                          <p className="text-sm text-green-600">{importResult.count} setor(es) importado(s) com sucesso.</p>
                          {importResult.errors > 0 && (
                            <p className="text-sm text-orange-600">{importResult.errors} linha(s) continha erro(s) e foi(ram) ignorada(s).</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : importResult?.error ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                        <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-red-700">Erro na importação</p>
                          <p className="text-sm text-red-600">{importResult.error}</p>
                        </div>
                      </div>
                    </div>
                  ) : csvPreview ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <p className="text-sm text-gray-600">Linhas válidas</p>
                          <p className="text-2xl font-bold text-green-600">{csvPreview.sucesso.length}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                          <p className="text-sm text-gray-600">Linhas com erro</p>
                          <p className="text-2xl font-bold text-orange-600">{csvPreview.erros.length}</p>
                        </div>
                      </div>
                      {csvPreview.sucesso.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-700 text-sm">Setores a importar:</h4>
                          <div className="bg-green-50 rounded-lg overflow-x-auto max-h-40 border border-green-200">
                            <table className="w-full text-xs text-gray-600">
                              <thead className="bg-green-100 text-green-800 sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 text-left">Nome</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-green-100">
                                {csvPreview.sucesso.slice(0, 10).map((nome: string, i: number) => (
                                  <tr key={i}>
                                    <td className="px-3 py-2">{nome}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {csvPreview.sucesso.length > 10 && (
                              <div className="px-3 py-2 bg-green-50 text-xs text-gray-600 text-center">
                                ... e mais {csvPreview.sucesso.length - 10} registro(s)
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {csvPreview.erros.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-700 text-sm">Erros encontrados:</h4>
                          <div className="bg-orange-50 rounded-lg overflow-x-auto max-h-40 border border-orange-200">
                            <table className="w-full text-xs text-gray-600">
                              <thead className="bg-orange-100 text-orange-800 sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 text-left">Linha</th>
                                  <th className="px-3 py-2 text-left">Campo</th>
                                  <th className="px-3 py-2 text-left">Erro</th>
                                  <th className="px-3 py-2 text-left">Valor</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-orange-100">
                                {csvPreview.erros.slice(0, 10).map((e: any, i: number) => (
                                  <tr key={i}>
                                    <td className="px-3 py-2">{e.row}</td>
                                    <td className="px-3 py-2">{e.campo}</td>
                                    <td className="px-3 py-2">{e.erro}</td>
                                    <td className="px-3 py-2">{e.valor}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {csvPreview.erros.length > 10 && (
                              <div className="px-3 py-2 bg-orange-50 text-xs text-gray-600 text-center">
                                ... e mais {csvPreview.erros.length - 10} erro(s)
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setCsvPreview(null);
                            document.getElementById('setoresFileInput')?.click();
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Selecionar outro arquivo
                        </button>
                        <button
                          onClick={async () => {
                            setIsImporting(true);
                            try {
                              // Criação dos setores
                              let count = 0;
                              for (const nome of csvPreview.sucesso) {
                                if (useLocal) {
                                  const maxId = Math.max(0, ...setores.map(s => Number(s.id) || 0));
                                  const novoSetor: Setor = { id: String(maxId + 1), nome };
                                  saveSetorLocal(novoSetor);
                                } else {
                                  await apiPost<any>('setores', { nome });
                                }
                                count++;
                              }
                              setImportResult({ success: true, count, errors: csvPreview.erros.length });
                              await loadSetores();
                              setTimeout(() => {
                                setCsvPreview(null);
                                setShowImportModal(false);
                                setImportResult(null);
                              }, 2000);
                            } catch (err) {
                              setImportResult({ success: false, error: 'Erro ao importar setores' });
                            } finally {
                              setIsImporting(false);
                            }
                          }}
                          disabled={isImporting || csvPreview.sucesso.length === 0}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isImporting ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Importando...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Importar {csvPreview.sucesso.length} setor(es)
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
      {useLocal && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          ⚠️ API indisponível. Usando armazenamento local (dados não persistem no Turso).
        </div>
      )}
      <div className="flex gap-2 mb-6">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Pesquisar ou adicionar setor"
          value={novoNome}
          onChange={e => setNovoNome(e.target.value)}
          disabled={loading}
        />
        <button
          className="bg-green-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
          onClick={handleAddSetor}
          disabled={loading || !novoNome.trim() || setores.some(s => s.nome.toLowerCase() === novoNome.trim().toLowerCase())}
        >
          {loading ? 'Salvando...' : 'Novo Setor'}
        </button>
      </div>
      {loading && setores.length === 0 ? (
        <p className="text-gray-500 text-center">Carregando setores...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {setores
            .filter(s => !novoNome || s.nome.toLowerCase().includes(novoNome.toLowerCase()))
            .map((setor) => (
              <div key={setor.id} className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative">
                {editingId === setor.id ? (
                  <>
                    <input
                      className="border border-primary-300 rounded px-3 py-1 w-full mb-2 focus:ring-2 focus:ring-primary-500 outline-none text-center"
                      value={editingNome}
                      onChange={e => setEditingNome(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEdit(setor.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleSaveEdit(setor.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Salvar"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Cancelar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-gray-800 mb-2 w-full break-words text-center" style={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}>{setor.nome}</span>
                    <div className="flex gap-2 mt-auto justify-center items-center">
                      {!vinculos[setor.id] && (
                        <>
                          <button
                            onClick={() => handleEdit(setor)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                            disabled={loading}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(setor.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
                {vinculos[setor.id] && (
                  <span className="text-xs text-gray-500 mt-2">Setor vinculado a registros</span>
                )}
              </div>
            ))}
          {setores.length === 0 && !loading && (
            <div className="text-gray-400 text-center py-6 col-span-full">Nenhum setor cadastrado</div>
          )}
        </div>
      )}
    </div>
  );
};
