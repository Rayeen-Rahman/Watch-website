// PM2 Ecosystem Config — Watch Store
// Usage:
//   Development:  pm2 start ecosystem.config.cjs
//   Production:   pm2 start ecosystem.config.cjs --env production
//   Save process: pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: 'watch-store',
      script: './backend/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
