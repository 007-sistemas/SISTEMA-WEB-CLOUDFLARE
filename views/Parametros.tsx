import React, { useState, useEffect } from 'react';
import { ParametrosSistema, Feriado, TurnoPadrao } from '../types';
import { ParametrosService } from '../services/parametros';
import { apiGet, apiPost, apiDelete } from '../services/api';
import { 
  Settings, 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle, 
  Building2,
  LayoutDashboard,
  Users,
  Shield,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  AlertCircle,
  Edit2,
  X
} from 'lucide-react';

type AbaAtiva = 'empresa' | 'calendario' | 'relatorios' | 'ponto' | 'justificativas' | 'dashboard' | 'categorias' | 'validacoes' | 'turnos';

type DadosCnpjBrasilApi = {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
};

const limparCnpj = (valor: string): string => valor.replace(/\D/g, '').slice(0, 14);

const formatarCnpj = (valor: string): string => {
  const digits = limparCnpj(valor);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

export const Parametros: React.FC = () => {
  const [parametros, setParametros] = useState<ParametrosSistema>(ParametrosService.getParametros());
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('empresa');
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState<{ tipo: 'success' | 'error', mensagem: string } | null>(null);
  const [novoFeriado, setNovoFeriado] = useState<Feriado>({ data: '', nome: '', tipo: 'nacional' });
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [ultimoCnpjConsultado, setUltimoCnpjConsultado] = useState('');

  // Estado para Turnos
  const [turnosPadroes, setTurnosPadroes] = useState<TurnoPadrao[]>([]);
  const [formPadrao, setFormPadrao] = useState({
    nome: '',
    horarioInicio: '',
    horarioFim: '',
    toleranciaAntes: 0,
    toleranciaDepois: 0
  });
  const [editandoPadraoId, setEditandoPadraoId] = useState<string | null>(null);

  useEffect(() => {
    // Carregar parâmetros do backend ao montar
    const loadParametros = async () => {
      try {
        const remote = await ParametrosService.loadParametrosFromRemote();
        setParametros(remote);
        setErroCarregamento(false);
      } catch (error) {
        console.warn('Erro ao carregar do backend, usando localStorage:', error);
        setErroCarregamento(true);
        // Continue usando os parâmetros já carregados do localStorage
      }
    };
    
    // Carregar turnos
    const loadTurnos = async () => {
      try {
        const padroes = await apiGet<TurnoPadrao[]>('turnos');
        setTurnosPadroes(padroes);
      } catch {
        setTurnosPadroes([]);
      }
    };

    loadParametros();
    loadTurnos();
  }, []);

  const buscarDadosEmpresaPorCnpj = async (cnpjEntrada?: string) => {
    const cnpj = limparCnpj(cnpjEntrada ?? parametros.empresa.cnpj);
    if (cnpj.length !== 14 || cnpj === ultimoCnpjConsultado) return;

    setBuscandoCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!response.ok) {
        throw new Error(`Falha ao consultar CNPJ (${response.status})`);
      }

      const data = await response.json() as DadosCnpjBrasilApi;
      setParametros(prev => ({
        ...prev,
        empresa: {
          ...prev.empresa,
          cnpj,
          razaoSocial: data.razao_social || prev.empresa.razaoSocial,
          nomeFantasia: data.nome_fantasia || prev.empresa.nomeFantasia
        }
      }));
      setUltimoCnpjConsultado(cnpj);
      mostrarToast('success', 'Dados da empresa preenchidos automaticamente pelo CNPJ.');
    } catch (error) {
      console.warn('Erro ao buscar CNPJ na BrasilAPI:', error);
      mostrarToast('error', 'Não foi possível consultar o CNPJ automaticamente.');
    } finally {
      setBuscandoCnpj(false);
    }
  };

  useEffect(() => {
    const cnpj = limparCnpj(parametros.empresa.cnpj);
    if (cnpj.length !== 14 || cnpj === ultimoCnpjConsultado) return;

    const timer = setTimeout(() => {
      buscarDadosEmpresaPorCnpj(cnpj);
    }, 700);

    return () => clearTimeout(timer);
  }, [parametros.empresa.cnpj, ultimoCnpjConsultado]);

  const mostrarToast = (tipo: 'success' | 'error', mensagem: string) => {
    setToast({ tipo, mensagem });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUploadLogoEmpresa = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      mostrarToast('error', 'Selecione um arquivo de imagem válido.');
      return;
    }

    const tamanhoMaximo = 2 * 1024 * 1024;
    if (file.size > tamanhoMaximo) {
      mostrarToast('error', 'A imagem deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = typeof reader.result === 'string' ? reader.result : '';
      if (!base64) {
        mostrarToast('error', 'Não foi possível processar a imagem.');
        return;
      }

      setParametros(prev => ({
        ...prev,
        empresa: {
          ...prev.empresa,
          logoEmpresa: base64
        }
      }));
      mostrarToast('success', 'Logo da empresa anexada com sucesso.');
    };

    reader.onerror = () => {
      mostrarToast('error', 'Erro ao ler a imagem selecionada.');
    };

    reader.readAsDataURL(file);
    event.currentTarget.value = '';
  };

  const removerLogoEmpresa = () => {
    setParametros(prev => ({
      ...prev,
      empresa: {
        ...prev.empresa,
        logoEmpresa: ''
      }
    }));
    mostrarToast('success', 'Logo da empresa removida.');
  };

  const salvarParametros = async () => {
    setSalvando(true);
    try {
      // Salvar localmente
      ParametrosService.saveParametros(parametros);
      
      // Sincronizar com backend
      await ParametrosService.syncParametrosToRemote(parametros);
      
      mostrarToast('success', 'Parâmetros salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar parâmetros:', error);
      mostrarToast('error', 'Erro ao salvar parâmetros. Verifique a conexão.');
    } finally {
      setSalvando(false);
    }
  };

  const resetarPadrao = () => {
    if (confirm('Tem certeza que deseja resetar todos os parâmetros para o padrão de fábrica? Esta ação não pode ser desfeita.')) {
      ParametrosService.resetParametrosPadrao();
      setParametros(ParametrosService.getParametros());
      mostrarToast('success', 'Parâmetros resetados para o padrão!');
    }
  };

  const adicionarFeriado = () => {
    if (!novoFeriado.data || !novoFeriado.nome) {
      mostrarToast('error', 'Preencha data e nome do feriado');
      return;
    }
    
    setParametros({
      ...parametros,
      calendario: {
        ...parametros.calendario,
        listaFeriados: [...parametros.calendario.listaFeriados, novoFeriado].sort((a, b) => a.data.localeCompare(b.data))
      }
    });
    
    setNovoFeriado({ data: '', nome: '', tipo: 'nacional' });
    mostrarToast('success', 'Feriado adicionado!');
  };

  const removerFeriado = (index: number) => {
    setParametros({
      ...parametros,
      calendario: {
        ...parametros.calendario,
        listaFeriados: parametros.calendario.listaFeriados.filter((_, i) => i !== index)
      }
    });
  };

  // Funções para Turnos
  const salvarTurnoPadrao = async () => {
    if (!formPadrao.nome || !formPadrao.horarioInicio || !formPadrao.horarioFim) {
      mostrarToast('error', 'Preencha todos os campos obrigatórios');
      return;
    }
    const payload = {
      id: editandoPadraoId || undefined,
      nome: formPadrao.nome,
      horario_inicio: formPadrao.horarioInicio,
      horario_fim: formPadrao.horarioFim,
      tolerancia_antes: formPadrao.toleranciaAntes,
      tolerancia_depois: formPadrao.toleranciaDepois
    };
    try {
      await apiPost('turnos', payload);
      const padroes = await apiGet<TurnoPadrao[]>('turnos');
      setTurnosPadroes(padroes);
      mostrarToast('success', editandoPadraoId ? 'Turno padrão atualizado com sucesso!' : 'Turno padrão criado com sucesso!');
      setEditandoPadraoId(null);
      limparFormPadrao();
    } catch (e: any) {
      mostrarToast('error', e?.message || 'Erro ao salvar turno padrão');
    }
  };

  const editarTurnoPadrao = (turno: TurnoPadrao) => {
    setFormPadrao({
      nome: turno.nome,
      horarioInicio: turno.horarioInicio,
      horarioFim: turno.horarioFim,
      toleranciaAntes: turno.toleranciaAntes,
      toleranciaDepois: turno.toleranciaDepois
    });
    setEditandoPadraoId(turno.id);
  };

  const excluirTurnoPadrao = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este turno?')) return;
    try {
      await apiDelete('turnos', { id });
      const padroes = await apiGet<TurnoPadrao[]>('turnos');
      setTurnosPadroes(padroes);
      mostrarToast('success', 'Turno padrão removido!');
      limparFormPadrao();
    } catch (e: any) {
      mostrarToast('error', 'Erro ao deletar turno');
    }
  };

  const limparFormPadrao = () => {
    setFormPadrao({
      nome: '',
      horarioInicio: '',
      horarioFim: '',
      toleranciaAntes: 0,
      toleranciaDepois: 0
    });
    setEditandoPadraoId(null);
  };

  const abas = [
    { id: 'empresa', label: 'Empresa', icon: Building2 },
    { id: 'calendario', label: 'Calendário', icon: Calendar },
    { id: 'turnos', label: 'Turnos Padrões', icon: Clock },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
    { id: 'ponto', label: 'Controle de Ponto', icon: Clock },
    { id: 'justificativas', label: 'Justificativas', icon: CheckCircle },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'categorias', label: 'Categorias', icon: Users },
    { id: 'validacoes', label: 'Validações', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.tipo === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.tipo === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {toast.mensagem}
        </div>
      )}

      {/* Aviso de backend não disponível */}
      {erroCarregamento && (
        <div className="fixed top-20 right-4 z-40 px-4 py-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg shadow-lg flex items-center gap-2 max-w-md">
          <AlertCircle size={20} />
          <div className="text-sm">
            <strong>Modo Offline:</strong> Backend não disponível. Usando configuração local. Crie a tabela no Turso para habilitar sincronização.
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Parâmetros do Sistema</h1>
              <p className="text-gray-500">Configure o sistema de acordo com suas necessidades</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetarPadrao}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              <RotateCcw size={20} />
              Resetar Padrão
            </button>
            <button
              onClick={salvarParametros}
              disabled={salvando}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              <Save size={20} />
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-thin">
            {abas.map((aba) => {
              const Icon = aba.icon;
              return (
                <button
                  key={aba.id}
                  onClick={() => setAbaAtiva(aba.id as AbaAtiva)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${
                    abaAtiva === aba.id
                      ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {aba.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* ABA: CALENDÁRIO */}
            {abaAtiva === 'calendario' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Configurações de Calendário</h3>

                  {/* Formatos */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block font-medium text-gray-800 mb-2">Formato de Data</label>
                      <select
                        value={parametros.calendario.formatoData}
                        onChange={(e) => setParametros({
                          ...parametros,
                          calendario: { ...parametros.calendario, formatoData: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (06/03/2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (03/06/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2026-03-06)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-gray-800 mb-2">Formato de Hora</label>
                      <select
                        value={parametros.calendario.formatoHora}
                        onChange={(e) => setParametros({
                          ...parametros,
                          calendario: { ...parametros.calendario, formatoHora: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="24h">24 horas (19:00)</option>
                        <option value="12h">12 horas (07:00 PM)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Lista de Feriados */}
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Feriados Cadastrados ({parametros.calendario.listaFeriados.length})</h4>
                  
                  {/* Adicionar Novo Feriado */}
                  <div className="grid grid-cols-12 gap-2 mb-4">
                    <input
                      type="date"
                      value={novoFeriado.data}
                      onChange={(e) => setNovoFeriado({ ...novoFeriado, data: e.target.value })}
                      className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Nome do feriado"
                      value={novoFeriado.nome}
                      onChange={(e) => setNovoFeriado({ ...novoFeriado, nome: e.target.value })}
                      className="col-span-5 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <select
                      value={novoFeriado.tipo}
                      onChange={(e) => setNovoFeriado({ ...novoFeriado, tipo: e.target.value as any })}
                      className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="nacional">Nacional</option>
                      <option value="estadual">Estadual</option>
                      <option value="municipal">Municipal</option>
                    </select>
                    <button
                      onClick={adicionarFeriado}
                      className="col-span-1 flex items-center justify-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  {/* Tabela de Feriados */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parametros.calendario.listaFeriados.map((feriado, index) => (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{new Date(feriado.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-3 text-sm font-medium">{feriado.nome}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                feriado.tipo === 'nacional' ? 'bg-blue-100 text-blue-700' :
                                feriado.tipo === 'estadual' ? 'bg-green-100 text-green-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {feriado.tipo.charAt(0).toUpperCase() + feriado.tipo.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => removerFeriado(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Eye className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h5 className="font-medium text-blue-900 mb-2">Preview de Sufixos de Turno</h5>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p>• <strong>Segunda-feira:</strong> M (turno definido em Turnos Padrões)</p>
                        <p>• <strong>Sábado:</strong> M{parametros.calendario.considerarFinaisDeSemana ? ` ${parametros.nomenclatura.sufixoFDS}` : ''}</p>
                        <p>• <strong>Feriado (Natal):</strong> N{parametros.calendario.considerarFeriados ? ` ${parametros.nomenclatura.sufixoFeriado}` : ''}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA: EMPRESA */}
            {abaAtiva === 'empresa' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Dados da Empresa</h3>
                  <p className="text-gray-600 mb-6">Esses dados serão usados no cabeçalho do relatório de produção</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-gray-800 mb-2">CNPJ</label>
                      <input
                        type="text"
                        value={formatarCnpj(parametros.empresa.cnpj)}
                        onChange={(e) => setParametros({
                          ...parametros,
                          empresa: { ...parametros.empresa, cnpj: limparCnpj(e.target.value) }
                        })}
                        onBlur={() => buscarDadosEmpresaPorCnpj()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-800 mb-2">Razão Social</label>
                      <input
                        type="text"
                        value={parametros.empresa.razaoSocial}
                        onChange={(e) => setParametros({
                          ...parametros,
                          empresa: { ...parametros.empresa, razaoSocial: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Razão Social da empresa"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block font-medium text-gray-800 mb-2">Nome Fantasia</label>
                    <input
                      type="text"
                      value={parametros.empresa.nomeFantasia}
                      onChange={(e) => setParametros({
                        ...parametros,
                        empresa: { ...parametros.empresa, nomeFantasia: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Nome Fantasia"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block font-medium text-gray-800 mb-2">Logo da Empresa (relatórios)</label>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition cursor-pointer text-sm">
                        Anexar Logo
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleUploadLogoEmpresa}
                          className="hidden"
                        />
                      </label>
                      {parametros.empresa.logoEmpresa && (
                        <button
                          type="button"
                          onClick={removerLogoEmpresa}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                        >
                          Remover Logo
                        </button>
                      )}
                      <span className="text-xs text-gray-500">PNG/JPG/WEBP até 2MB</span>
                    </div>

                    {parametros.empresa.logoEmpresa && (
                      <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-white">
                        <p className="text-xs text-gray-500 mb-2">Preview da logo:</p>
                        <img
                          src={parametros.empresa.logoEmpresa}
                          alt="Logo da empresa"
                          className="h-16 object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-blue-900">
                        {buscandoCnpj ? 'Consultando CNPJ na BrasilAPI...' : 'Ao digitar o CNPJ completo, o sistema tenta preencher Razão Social e Nome Fantasia automaticamente.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => buscarDadosEmpresaPorCnpj()}
                        disabled={buscandoCnpj || limparCnpj(parametros.empresa.cnpj).length !== 14}
                        className="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      >
                        {buscandoCnpj ? 'Buscando...' : 'Buscar CNPJ'}
                      </button>
                    </div>

                    <div className="mt-4 text-sm text-blue-800 space-y-1">
                      <p><strong>Preview do cabeçalho:</strong></p>
                      <p>{parametros.empresa.razaoSocial || 'Razão Social não informada'}</p>
                      <p><strong>CNPJ:</strong> {formatarCnpj(parametros.empresa.cnpj) || 'Não informado'}</p>
                      <p>{parametros.empresa.nomeFantasia || 'Nome Fantasia não informado'}</p>
                      <p>{parametros.empresa.logoEmpresa ? 'Logo da empresa configurada.' : 'Logo da empresa não configurada.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA: TURNOS PADRÕES */}
            {abaAtiva === 'turnos' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Turnos Padrões</h3>
                  <p className="text-gray-600 mb-6">Cadastre turnos que podem ser reutilizados nas unidades</p>
                
                  {/* Formulário */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                      <input
                        type="text"
                        value={formPadrao.nome}
                        onChange={e => setFormPadrao({ ...formPadrao, nome: e.target.value })}
                        placeholder="Ex: MT, T, N"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Horário Início *</label>
                      <input
                        type="time"
                        value={formPadrao.horarioInicio}
                        onChange={e => setFormPadrao({ ...formPadrao, horarioInicio: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Horário Fim *</label>
                      <input
                        type="time"
                        value={formPadrao.horarioFim}
                        onChange={e => setFormPadrao({ ...formPadrao, horarioFim: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tolerância Antes (min)</label>
                      <input
                        type="number"
                        value={formPadrao.toleranciaAntes}
                        onChange={e => setFormPadrao({ ...formPadrao, toleranciaAntes: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tolerância Depois (min)</label>
                      <input
                        type="number"
                        value={formPadrao.toleranciaDepois}
                        onChange={e => setFormPadrao({ ...formPadrao, toleranciaDepois: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={salvarTurnoPadrao}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                      <Save size={20} />
                      {editandoPadraoId ? 'Atualizar' : 'Salvar'}
                    </button>
                    {editandoPadraoId && (
                      <button
                        onClick={limparFormPadrao}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                      >
                        <X size={20} />
                        Cancelar
                      </button>
                    )}
                  </div>

                  {/* Tabela */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-primary-700 text-white">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Nome</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Horário Início</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Horário Fim</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Tolerância Antes</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Tolerância Depois</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {turnosPadroes.length > 0 ? (
                            turnosPadroes.map((turno) => (
                              <tr key={turno.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium">{turno.nome}</td>
                                <td className="px-4 py-3 text-sm">{turno.horarioInicio}</td>
                                <td className="px-4 py-3 text-sm">{turno.horarioFim}</td>
                                <td className="px-4 py-3 text-sm">{turno.toleranciaAntes} min</td>
                                <td className="px-4 py-3 text-sm">{turno.toleranciaDepois} min</td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => editarTurnoPadrao(turno)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      onClick={() => excluirTurnoPadrao(turno.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                Nenhum turno padrão cadastrado
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Sufixos de Turnos */}
                  <div className="pt-8 border-t border-gray-200">
                    <h4 className="text-lg font-bold text-gray-800 mb-6">Sufixos de Turnos</h4>
                    <p className="text-gray-600 mb-6">Configure sufixos a adicionar aos nomes dos turnos em finais de semana e feriados</p>

                    {/* Checkboxes */}
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="font-medium text-gray-800">Considerar Finais de Semana</label>
                          <p className="text-sm text-gray-600">Ativa sufixo em sábados e domingos</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={parametros.calendario.considerarFinaisDeSemana}
                          onChange={(e) => setParametros({
                            ...parametros,
                            calendario: { ...parametros.calendario, considerarFinaisDeSemana: e.target.checked }
                          })}
                          className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="font-medium text-gray-800">Considerar Feriados</label>
                          <p className="text-sm text-gray-600">Ativa sufixo em feriados cadastrados</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={parametros.calendario.considerarFeriados}
                          onChange={(e) => setParametros({
                            ...parametros,
                            calendario: { ...parametros.calendario, considerarFeriados: e.target.checked }
                          })}
                          className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    {/* Inputs de Sufixos */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block font-medium text-gray-800 mb-2">Sufixo de Final de Semana</label>
                        <input
                          type="text"
                          value={parametros.nomenclatura.sufixoFDS}
                          onChange={(e) => setParametros({
                            ...parametros,
                            nomenclatura: { ...parametros.nomenclatura, sufixoFDS: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ex: FDS, FS, WEEKEND"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-800 mb-2">Sufixo de Feriado</label>
                        <input
                          type="text"
                          value={parametros.nomenclatura.sufixoFeriado}
                          onChange={(e) => setParametros({
                            ...parametros,
                            nomenclatura: { ...parametros.nomenclatura, sufixoFeriado: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ex: F, FER, FERIADO"
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-2">Preview:</p>
                      <div className="flex gap-4 text-sm text-blue-800">
                        <span>M</span>
                        {parametros.calendario.considerarFinaisDeSemana && <span>M{parametros.nomenclatura.sufixoFDS}</span>}
                        {parametros.calendario.considerarFeriados && <span>N{parametros.nomenclatura.sufixoFeriado}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA: RELATÓRIOS (simplificada por enquanto) */}
            {abaAtiva === 'relatorios' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Configurações de Relatórios</h3>
                  <p className="text-gray-600 mb-6">Em breve: personalização de campos, cores, logo e preview em tempo real</p>
                  <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <FileText className="mx-auto text-gray-400 mb-2" size={48} />
                    <p className="text-gray-600">Funcionalidade em desenvolvimento - Fase 2</p>
                  </div>
                </div>
              </div>
            )}

            {/* Demais abas (placeholders) */}
            {['ponto', 'justificativas', 'dashboard', 'categorias', 'validacoes'].includes(abaAtiva) && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    {abas.find(a => a.id === abaAtiva)?.label}
                  </h3>
                  <p className="text-gray-600 mb-6">Funcionalidade em desenvolvimento - Fase 2 e 3</p>
                  <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    {React.createElement(abas.find(a => a.id === abaAtiva)!.icon, { 
                      className: "mx-auto text-gray-400 mb-2", 
                      size: 48 
                    })}
                    <p className="text-gray-600">Em breve</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
