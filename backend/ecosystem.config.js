module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'gunicorn',
      args: 'kenya_ecom.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120',
      cwd: '/var/www/malaikanest/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/malaikanest/backend-error.log',
      out_file: '/var/log/malaikanest/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      restart_delay: 1000,
      kill_timeout: 5000
    }
  ]
};
