// Script para resetar a tabela solicitacoes_liberacao via console do browser
// Execute este código no console do navegador (F12 -> Console)

(async function resetarTabelaSolicitacoes() {
  console.log('🔄 Iniciando reset da tabela solicitacoes_liberacao...');
  
  try {
    const response = await fetch('/api/reset-solicitacoes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Status da resposta:', response.status);
    
    const text = await response.text();
    console.log('📄 Resposta (texto):', text);
    
    let result;
    try {
      result = JSON.parse(text);
      console.log('✅ Resposta (JSON):', result);
    } catch (e) {
      console.log('⚠️ Resposta não é JSON válido');
      result = { rawText: text };
    }
    
    if (response.ok) {
      console.log('✅ Tabela resetada com sucesso!');
      console.log('🔄 Agora teste solicitar liberação novamente');
      return result;
    } else {
      console.error('❌ Erro ao resetar tabela:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    console.log('💡 Possíveis causas:');
    console.log('  1. Deploy do Cloudflare ainda não completou');
    console.log('  2. Endpoint não está disponível');
    console.log('  3. Erro de rede');
    return null;
  }
})();
