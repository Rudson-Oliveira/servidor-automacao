import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('Criando tabelas desktop_agents...');

await connection.execute(`
CREATE TABLE IF NOT EXISTS desktop_agents (
  id int AUTO_INCREMENT NOT NULL,
  user_id int NOT NULL,
  token varchar(64) NOT NULL,
  device_name varchar(255),
  platform varchar(50),
  version varchar(50),
  status enum('connected','disconnected','offline','online') NOT NULL DEFAULT 'offline',
  last_ping timestamp NULL,
  ip_address varchar(45),
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT desktop_agents_id PRIMARY KEY(id),
  CONSTRAINT desktop_agents_token_unique UNIQUE(token)
);
`);

console.log('Criando índices desktop_agents...');
await connection.execute(`CREATE INDEX IF NOT EXISTS user_id_idx ON desktop_agents (user_id);`);
await connection.execute(`CREATE INDEX IF NOT EXISTS status_idx ON desktop_agents (status);`);
await connection.execute(`CREATE INDEX IF NOT EXISTS token_idx ON desktop_agents (token);`);

console.log('Criando tabela desktop_commands...');
await connection.execute(`
CREATE TABLE IF NOT EXISTS desktop_commands (
  id int AUTO_INCREMENT NOT NULL,
  agent_id int NOT NULL,
  user_id int NOT NULL,
  command_type varchar(50) NOT NULL,
  command_data text,
  status enum('pending','sent','executing','completed','failed') NOT NULL DEFAULT 'pending',
  result text,
  error_message text,
  sent_at timestamp NULL,
  completed_at timestamp NULL,
  execution_time_ms int,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT desktop_commands_id PRIMARY KEY(id)
);
`);

console.log('Criando índices desktop_commands...');
await connection.execute(`CREATE INDEX IF NOT EXISTS agent_id_idx ON desktop_commands (agent_id);`);
await connection.execute(`CREATE INDEX IF NOT EXISTS cmd_user_id_idx ON desktop_commands (user_id);`);
await connection.execute(`CREATE INDEX IF NOT EXISTS cmd_status_idx ON desktop_commands (status);`);
await connection.execute(`CREATE INDEX IF NOT EXISTS command_type_idx ON desktop_commands (command_type);`);

console.log('Criando tabela desktop_screenshots...');
await connection.execute(`
CREATE TABLE IF NOT EXISTS desktop_screenshots (
  id int AUTO_INCREMENT NOT NULL,
  agent_id int NOT NULL,
  user_id int NOT NULL,
  image_url text NOT NULL,
  image_key varchar(500) NOT NULL,
  width int,
  height int,
  file_size int,
  format varchar(20) DEFAULT 'png',
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT desktop_screenshots_id PRIMARY KEY(id)
);
`);

console.log('Criando índices desktop_screenshots...');
await connection.execute(`CREATE INDEX IF NOT EXISTS ss_agent_id_idx ON desktop_screenshots (agent_id);`);
await connection.execute(`CREATE INDEX IF NOT EXISTS ss_user_id_idx ON desktop_screenshots (user_id);`);

console.log('Criando tabela desktop_logs...');
await connection.execute(`
CREATE TABLE IF NOT EXISTS desktop_logs (
  id int AUTO_INCREMENT NOT NULL,
  command_id int,
  agent_id int NOT NULL,
  user_id int NOT NULL,
  level enum('debug','info','warning','error') NOT NULL DEFAULT 'info',
  message text NOT NULL,
  metadata text,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT desktop_logs_id PRIMARY KEY(id)
);
`);

console.log('Criando índices desktop_logs...');
await connection.execute(`CREATE INDEX IF NOT EXISTS log_command_id_idx ON desktop_logs (command_id);`);
await connection.execute(`CREATE INDEX IF NOT EXISTS log_agent_id_idx ON desktop_logs (agent_id);`);
await connection.execute(`CREATE INDEX IF NOT EXISTS log_user_id_idx ON desktop_logs (user_id);`);
await connection.execute(`CREATE INDEX IF NOT EXISTS level_idx ON desktop_logs (level);`);

console.log('✅ Todas as tabelas criadas com sucesso!');

await connection.end();
