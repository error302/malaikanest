#!/usr/bin/env bash
set -euo pipefail

# Usage: sudo bash postgres_setup.sh dbname dbuser dbpassword
# Example: sudo bash postgres_setup.sh kenya_ecom kenya_user S3cureP@ssw0rd

DB_NAME=${1:-kenya_ecom}
DB_USER=${2:-kenya_user}
DB_PASS=${3:-kenya_pass}

echo "Creating Postgres DB and user: $DB_NAME / $DB_USER"

sudo -u postgres psql <<EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\q
EOF

echo "Database created. Ensure you update backend/.env.production with DB credentials and restart services."
