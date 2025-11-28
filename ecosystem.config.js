module.exports = {
  apps: [{
    name: 'servidor-automacao',
    script: 'server/_core/index.ts',
    interpreter: 'tsx',
    instances: 1,
    exec_mode: 'fork',
    
    // Auto-restart configuration
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    
    // Memory management
    max_memory_restart: '500M',
    
    // Logs
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    
    // Watch and reload (desabilitado em produção)
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git'],
    
    // Exponential backoff restart delay
    exp_backoff_restart_delay: 100,
    
    // Health check
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Cron restart (opcional - reinicia todo dia às 3h da manhã)
    cron_restart: '0 3 * * *',
  }]
};
