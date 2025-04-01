module.exports = {
  apps: [{
    name: 'game-rank-spider',
    script: 'dist/index.js',
    watch: false,
    instances: 1,
    autorestart: true,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    out_file: 'logs/pm2-out.log',
    error_file: 'logs/pm2-error.log'
  }]
}; 