import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { StorageService } from '../services/storage';
import type { SolicitacaoLiberacao } from '../types';

export const SolicitacoesLiberacao: React.FC = () => {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoLiberacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<'pendente' | 'aprovado' | 'rejeitado' | 'todos'>('pendente');
  const [modalResposta, setModalResposta] = useState<{
    show: boolean;
    solicitacao: SolicitacaoLiberacao | null;
    tipo: 'aprovado' | 'rejeitado';
  }>({ show: false, solicitacao: null, tipo: 'aprovado' });
  const [observacao, setObservacao] = useState('');
  const [processando, setProcessando] = useState(false);

  const session = StorageService.getSession();
  const managerName = session?.user?.nome || 'Gestor';

  useEffect(() => {
    carregarSolicitacoes();
  }, [filtroStatus]);

  const carregarSolicitacoes = async () => {
    setLoading(true);
    try {
      const filters = filtroStatus !== 'todos' ? { status: filtroStatus } : undefined;
      const result = await StorageService.getSolicitacoesLiberacao(filters);
      setSolicitacoes(result);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalResposta = (solicitacao: SolicitacaoLiberacao, tipo: 'aprovado' | 'rejeitado') => {
    setModalResposta({ show: true, solicitacao, tipo });
    setObservacao('');
  };

  const fecharModal = () => {
    setModalResposta({ show: false, solicitacao: null, tipo: 'aprovado' });
    setObservacao('');
  };

  const confirmarResposta = async () => {
    if (!modalResposta.solicitacao) return;

    setProcessando(true);
    try {
      await StorageService.responderSolicitacaoLiberacao({
        id: modalResposta.solicitacao.id,
        status: modalResposta.tipo,
        respondido_por: managerName,
        observacao: observacao.trim() || undefined
      });

      alert(`✅ Solicitação ${modalResposta.tipo === 'aprovado' ? 'aprovada' : 'rejeitada'} com sucesso!`);
      fecharModal();
      carregarSolicitacoes();
    } catch (error: any) {
      console.error('Erro ao responder solicitação:', error);
      alert(error.message || 'Erro ao processar solicitação. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            Pendente
          </span>
        );
      case 'aprovado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Aprovado
          </span>
        );
      case 'rejeitado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" />
            Rejeitado
          </span>
        );
      default:
        return null;
    }
  };

  const formatarData = (dataStr: string) => {
    try {
      const data = new Date(dataStr);
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dataStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Solicitações de Liberação</h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie solicitações de acesso a justificativas por unidade</p>
        </div>
        <button
          onClick={carregarSolicitacoes}
          disabled={loading}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Filtrar por status</label>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltroStatus('pendente')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroStatus === 'pendente'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFiltroStatus('aprovado')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroStatus === 'aprovado'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Aprovadas
          </button>
          <button
            onClick={() => setFiltroStatus('rejeitado')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroStatus === 'rejeitado'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Rejeitadas
          </button>
          <button
            onClick={() => setFiltroStatus('todos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroStatus === 'todos'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      {/* Lista de Solicitações */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm text-gray-500">Carregando solicitações...</p>
          </div>
        ) : solicitacoes.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              {filtroStatus === 'todos' 
                ? 'Nenhuma solicitação encontrada.'
                : `Nenhuma solicitação ${filtroStatus} encontrada.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cooperado</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">CPF</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Unidade</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Data Solicitação</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Resposta</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {solicitacoes.map((sol) => (
                  <tr key={sol.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{sol.cooperado_nome}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{sol.cooperado_cpf}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{sol.hospital_nome}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatarData(sol.data_solicitacao)}</td>
                    <td className="px-4 py-3">{getStatusBadge(sol.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {sol.data_resposta ? (
                        <div>
                          <div className="font-medium">{sol.respondido_por}</div>
                          <div className="text-xs text-gray-500">{formatarData(sol.data_resposta)}</div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sol.status === 'pendente' && (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => abrirModalResposta(sol, 'aprovado')}
                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                            title="Aprovar"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => abrirModalResposta(sol, 'rejeitado')}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                            title="Rejeitar"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Resposta */}
      {modalResposta.show && modalResposta.solicitacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {modalResposta.tipo === 'aprovado' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
            </h3>
            
            <div className="space-y-3 mb-6">
              <div>
                <span className="text-sm font-bold text-gray-500">Cooperado:</span>
                <p className="text-gray-900">{modalResposta.solicitacao.cooperado_nome}</p>
              </div>
              <div>
                <span className="text-sm font-bold text-gray-500">Unidade:</span>
                <p className="text-gray-900">{modalResposta.solicitacao.hospital_nome}</p>
              </div>
              <div>
                <span className="text-sm font-bold text-gray-500">Observação (opcional):</span>
                <textarea
                  className="w-full mt-1 border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Adicione uma observação sobre a resposta..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={fecharModal}
                disabled={processando}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarResposta}
                disabled={processando}
                className={`px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 ${
                  modalResposta.tipo === 'aprovado'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processando ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
