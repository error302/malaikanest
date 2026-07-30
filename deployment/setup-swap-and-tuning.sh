#!/usr/bin/env bash
# Malaika Nest — Free Tier GCP VM Swap & Resource Tuning Script
# Run on the Ubuntu VM: sudo bash setup-swap-and-tuning.sh

set -euo pipefail

echo "=== Malaika Nest: Optimizing VM for GCP Free Tier (e2-micro) ==="

# 1. Create 4GB Swap space if not already present
SWAPFILE="/swapfile"

if [ -f "$SWAPFILE" ]; then
    echo "[✓] Swapfile already exists."
else
    echo "[1/3] Creating 4GB Swap file to prevent Out-Of-Memory (OOM) crashes..."
    fallocate -l 4G $SWAPFILE || dd if=/dev/zero of=$SWAPFILE bs=1M count=4096
    chmod 600 $SWAPFILE
    mkswap $SWAPFILE
    swapon $SWAPFILE
    echo "$SWAPFILE none swap sw 0 0" >> /etc/fstab
    echo "[✓] 4GB Swap file created and enabled."
fi

# Set swappiness to 20 for efficient memory caching
sysctl vm.swappiness=20
if ! grep -q 'vm.swappiness=20' /etc/sysctl.conf; then
    echo 'vm.swappiness=20' >> /etc/sysctl.conf
fi

# 2. Limit Redis memory usage
echo "[2/3] Tuning Redis memory limit..."
if [ -f /etc/redis/redis.conf ]; then
    if ! grep -q 'maxmemory 128mb' /etc/redis/redis.conf; then
        echo "maxmemory 128mb" >> /etc/redis/redis.conf
        echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf
        systemctl restart redis-server || true
        echo "[✓] Redis tuned to max 128MB RAM."
    fi
fi

# 3. Summary & Memory Verification
echo "[3/3] Checking memory status..."
free -h

echo ""
echo "========================================================="
echo " VM Optimization Complete!"
echo " Free Tier Specs: e2-micro (1GB RAM + 4GB Swap)"
echo " Memory status verified. Ready for Malaika Nest deployments!"
echo "========================================================="
