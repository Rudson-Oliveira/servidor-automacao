import { getDb } from '../server/db';
import { apiKeys } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function cleanDuplicateKeys() {
  const db = await getDb();
  if (!db) {
    console.log('❌ Erro: Banco de dados não disponível');
    return;
  }
  
  // Listar todas as API keys
  const keys = await db.select().from(apiKeys);
  console.log('📋 API Keys encontradas:', keys.length);
  
  // Encontrar duplicatas (mesmo nome)
  const nomes = keys.map(k => k.nome);
  const duplicatas = nomes.filter((nome, index) => nomes.indexOf(nome) !== index);
  
  if (duplicatas.length > 0) {
    console.log('⚠️  Duplicatas encontradas:', duplicatas);
    
    // Manter apenas a primeira key de cada nome, remover as outras
    for (const nome of [...new Set(duplicatas)]) {
      const keysComNome = keys.filter(k => k.nome === nome);
      console.log(`Encontradas ${keysComNome.length} keys com nome: ${nome}`);
      
      // Manter a primeira, remover as outras
      for (let i = 1; i < keysComNome.length; i++) {
        const keyParaRemover = keysComNome[i];
        if (keyParaRemover && keyParaRemover.id) {
          await db.delete(apiKeys).where(eq(apiKeys.id, keyParaRemover.id));
          console.log('✅ Removida API key duplicada ID:', keyParaRemover.id);
        }
      }
    }
  } else {
    console.log('✅ Nenhuma duplicata encontrada');
  }
  
  // Listar keys finais
  const keysFinal = await db.select().from(apiKeys);
  console.log('\n📋 API Keys após limpeza:', keysFinal.length);
  keysFinal.forEach(k => console.log(`  - ${k.nome} (ID: ${k.id}, Ativa: ${k.ativa})`));
}

cleanDuplicateKeys().catch(console.error);
