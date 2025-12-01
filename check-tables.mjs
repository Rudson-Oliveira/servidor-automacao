import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [tables] = await connection.execute(`
  SELECT TABLE_NAME 
  FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = 'test' 
  AND TABLE_NAME LIKE 'desktop%'
`);

console.log('Tabelas desktop encontradas:');
console.log(JSON.stringify(tables, null, 2));

// Ver estrutura da tabela desktop_agents
const [columns] = await connection.execute(`
  SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = 'test' 
  AND TABLE_NAME = 'desktop_agents'
  ORDER BY ORDINAL_POSITION
`);

console.log('\nEstrutura da tabela desktop_agents:');
console.log(JSON.stringify(columns, null, 2));

await connection.end();
