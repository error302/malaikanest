module.exports = {
  apps: [
    {
      name: 'backend',
      script: '/var/www/backend/venv/bin/gunicorn',
      args: 'config.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120',
      cwd: '/var/www/backend',
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        DJANGO_ENV: 'prod',
        DJANGO_SETTINGS_MODULE: 'config.settings.prod',
        PYTHONPATH: '/var/www/backend',
        PATH: '/var/www/backend/venv/bin:/usr/local/bin:/usr/bin:/bin'
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