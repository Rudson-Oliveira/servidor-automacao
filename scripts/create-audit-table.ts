import { getDb } from '../server/db';

async function createAuditTable() {
  const db = await getDb();
  if (!db) {
    console.log('❌ Erro: Banco de dados não disponível');
    return;
  }
  
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        endpoint VARCHAR(255) NOT NULL,
        input TEXT,
        output TEXT,
        validation_score INT NOT NULL,
        is_hallucination ENUM('0', '1') DEFAULT '0' NOT NULL,
        real_data_verified ENUM('0', '1') DEFAULT '0' NOT NULL,
        discrepancies TEXT,
        execution_time_ms INT NOT NULL
      )
    `);
    
    console.log('✅ Tabela audit_logs criada com sucesso!');
    
    // Verificar se tabela foi criada
    const result: any = await db.execute('SHOW TABLES LIKE "audit_logs"');
    if (result && result.length > 0) {
      console.log('✅ Tabela confirmada no banco de dados');
    }
  } catch (error: any) {
    console.error('❌ Erro ao criar tabela:', error.message);
  }
}

createAuditTable().catch(console.error);
