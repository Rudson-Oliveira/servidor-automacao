import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🔧 Criando tabelas desktop_agents...');

try {
  // Drop e recriar para garantir
  await connection.execute(`DROP TABLE IF EXISTS desktop_agents`);
  
  await connection.execute(`
    CREATE TABLE desktop_agents (
      id int AUTO_INCREMENT NOT NULL,
      user_id int NOT NULL,
      token varchar(64) NOT NULL,
      device_name varchar(255),
      platform varchar(50),
      version varchar(50),
      status enum('online','offline','busy','error') NOT NULL DEFAULT 'offline',
      last_ping timestamp NULL,
      ip_address varchar(45),
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY desktop_agents_token_unique (token),
      KEY user_id_idx (user_id),
      KEY status_idx (status),
      KEY token_idx (token)
    )
  `);
  console.log('✅ desktop_agents criada');

  await connection.execute(`DROP TABLE IF EXISTS desktop_commands`);
  await connection.execute(`
    CREATE TABLE desktop_commands (
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
      PRIMARY KEY (id),
      KEY agent_id_idx (agent_id),
      KEY user_id_idx (user_id),
      KEY status_idx (status),
      KEY command_type_idx (command_type)
    )
  `);
  console.log('✅ desktop_commands criada');

  await connection.execute(`DROP TABLE IF EXISTS desktop_screenshots`);
  await connection.execute(`
    CREATE TABLE desktop_screenshots (
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
      PRIMARY KEY (id),
      KEY agent_id_idx (agent_id),
      KEY user_id_idx (user_id)
    )
  `);
  console.log('✅ desktop_screenshots criada');

  await connection.execute(`DROP TABLE IF EXISTS desktop_logs`);
  await connection.execute(`
    CREATE TABLE desktop_logs (
      id int AUTO_INCREMENT NOT NULL,
      command_id int,
      agent_id int NOT NULL,
      user_id int NOT NULL,
      level enum('debug','info','warning','error') NOT NULL DEFAULT 'info',
      message text NOT NULL,
      metadata text,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY command_id_idx (command_id),
      KEY agent_id_idx (agent_id),
      KEY user_id_idx (user_id),
      KEY level_idx (level)
    )
  `);
  console.log('✅ desktop_logs criada');

  console.log('\n🎉 TODAS AS TABELAS CRIADAS COM SUCESSO!');
} catch (error) {
  console.error('❌ Erro:', error.message);
}

await connection.end();
