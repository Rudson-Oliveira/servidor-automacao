import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as fs from 'fs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const connection = await mysql.createConnection(connectionString);
const db = drizzle(connection);

// Ler e executar migration
const sql = fs.readFileSync('./drizzle/0029_cynical_prowler.sql', 'utf8');
const statements = sql.split('-->').filter(s => s.trim() && !s.trim().startsWith('statement-breakpoint'));

for (const statement of statements) {
  const cleanStatement = statement.trim();
  if (cleanStatement) {
    try {
      await connection.query(cleanStatement);
      console.log('✅ Executado:', cleanStatement.substring(0, 50) + '...');
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('⚠️  Tabela já existe, pulando...');
      } else {
        console.error('❌ Erro:', error.message);
      }
    }
  }
}

await connection.end();
console.log('✅ Migration aplicada com sucesso!');
