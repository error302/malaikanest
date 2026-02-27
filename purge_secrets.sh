#!/bin/bash
# Git Secret Purge Script - Removes all secrets from Git history
# Run this BEFORE pushing to any public repository

echo "============================================"
echo "  Git Secret Purge Script"
echo "============================================"
echo ""
echo "WARNING: This will rewrite Git history!"
echo "Make sure to backup your repository first."
echo ""
read -p "Type 'YES' to continue: " confirm

if [ "$confirm" != "YES" ]; then
    echo "Aborted."
    exit 1
fi

# Install BFG if not present
if ! command -v bfg &> /dev/null; then
    echo "Installing BFG Repo-Cleaner..."
    cd /tmp
    wget -q https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar -O bfg.jar
    echo '#!/bin/bash
    java -jar /tmp/bfg.jar "$@"' > /usr/local/bin/bfg
    chmod +x /usr/local/bin/bfg
fi

# Patterns to remove
BFG_PATTERNS="--delete-files '*.env*'"
BFG_PATTERNS="$BFG_PATTERNS --delete-files '*.pem'"
BFG_PATTERNS="$BFG_PATTERNS --delete-files '*.key'"
BFG_PATTERNS="$BFG_PATTERNS --delete-files 'id_rsa*'"
BFG_PATTERNS="$BFG_PATTERNS --delete-files 'secrets.txt'"
BFG_PATTERNS="$BFG_PATTERNS --delete-files 'credentials.json'"

# Passwords, API keys, tokens
BFG_PATTERNS="$BFG_PATTERNS --replace-text passwords.txt"

# Create passwords file
cat > passwords.txt << 'EOF'
==> REPLACE_WITH_YOUR_SECRET_HERE <==
==> REPLACE_WITH_SECRET_KEY <==
==> YOUR_SECRET_KEY_HERE <==
password123
admin123
postgres
your_password_here
SECRET_KEY=
DB_PASSWORD=
API_KEY=
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
CLOUDINARY_SECRET=
password:*
api_key:*
secret:*
token:*
bearer:*
EOF

echo "Running BFG Repo-Cleaner..."
bfg --no-blob-protection $BFG_PATTERNS

# Clean up reflog
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Remove passwords file
rm -f passwords.txt

echo ""
echo "============================================"
echo "  Git History Cleaned!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Force push to update remote:"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "2. Update your .env files to ensure they won't be tracked:"
echo "   echo '*.env' >> .gitignore"
echo "   echo '.env' >> .gitignore"
echo "   echo '*.pem' >> .gitignore"
echo "   git add .gitignore"
echo "   git commit -m 'Add gitignore for secrets'"
echo "   git push"
echo ""
echo "3. Rotate all credentials that may have been exposed!"
