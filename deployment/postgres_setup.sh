#!/usr/bin/env bash
# Malaika Nest — PostgreSQL Setup Script
# Usage: sudo bash postgres_setup.sh [dbname] [dbuser] [dbpassword]
# Example: sudo bash postgres_setup.sh malaika_production malaika_user 'S3cureP@ssw0rd!'
set -euo pipefail

DB_NAME=${1:-malaika_production}
DB_USER=${2:-malaika_user}
DB_PASS=${3:?Error: DB password is required. Pass it as the 3rd argument.}

echo "Setting up PostgreSQL for Malaika Nest..."
echo "  Database: $DB_NAME"
echo "  User:     $DB_USER"

sudo -u postgres psql <<EOF
-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
  ELSE
    ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';
  END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER ENCODING ''UTF8'' LC_COLLATE ''en_US.UTF-8'' LC_CTYPE ''en_US.UTF-8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Set timezone for the database
ALTER DATABASE $DB_NAME SET timezone TO 'Africa/Nairobi';

-- Allow user to create schemas (needed for migrations)
ALTER USER $DB_USER CREATEDB;
EOF

echo ""
echo "PostgreSQL setup complete!"
echo "Update /var/www/malaikanest/backend/.env.production with:"
echo "  DB_NAME=$DB_NAME"
echo "  DB_USER=$DB_USER"
echo "  DB_PASSWORD=<your-password>"
echo "  DB_HOST=localhost"
echo "  DB_PORT=5432"
