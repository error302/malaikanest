#!/usr/bin/env python3
"""
Sync current server IP to Brevo Authorized IPs list.

This script fetches the current public IP of the server and adds it to
Brevo's authorized IPs for SMTP relay access. Run during deployment to
ensure email delivery works from the current server IP.

Usage:
    python scripts/ops/sync_brevo_ips.py

Environment variables required:
    BREVO_API_KEY: Brevo API key with SMTP/IP management permissions
    BREVO_SMTP_IP: (optional) Explicit IP to authorize (defaults to auto-detected public IP)
"""

import os
import sys
import json
import requests
from typing import Optional, List


BREVO_API_BASE = "https://api.brevo.com/v3"
BREVO_API_KEY = os.getenv("BREVO_API_KEY")


def get_public_ip() -> str:
    """Fetch the current public IP address."""
    services = [
        "https://api.ipify.org",
        "https://ifconfig.me/ip",
        "https://icanhazip.com",
    ]
    
    for service in services:
        try:
            response = requests.get(service, timeout=5)
            if response.status_code == 200:
                ip = response.text.strip()
                # Validate IP format
                parts = ip.split('.')
                if len(parts) == 4 and all(part.isdigit() and 0 <= int(part) <= 255 for part in parts):
                    return ip
        except Exception:
            continue
    
    raise RuntimeError("Could not determine public IP from any service")


def get_brevo_authorized_ips() -> List[str]:
    """Fetch current authorized IPs from Brevo."""
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
    }
    
    response = requests.get(f"{BREVO_API_BASE}/senders/ips", headers=headers, timeout=10)
    
    if response.status_code == 200:
        data = response.json()
        return [ip["ip"] for ip in data.get("ips", [])]
    else:
        raise RuntimeError(f"Failed to fetch Brevo IPs: {response.status_code} - {response.text}")


def add_brevo_authorized_ip(ip: str) -> bool:
    """Add an IP to Brevo's authorized IPs list."""
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }
    
    payload = {"ip": ip}
    
    response = requests.post(
        f"{BREVO_API_BASE}/senders/ips",
        headers=headers,
        json=payload,
        timeout=10
    )
    
    if response.status_code in (200, 201):
        return True
    elif response.status_code == 400 and "already exists" in response.text.lower():
        print(f"IP {ip} is already authorized in Brevo")
        return True
    else:
        raise RuntimeError(f"Failed to add IP to Brevo: {response.status_code} - {response.text}")


def main():
    # Allow explicit IP override via env var
    explicit_ip = os.getenv("BREVO_SMTP_IP")
    
    if explicit_ip:
        ip = explicit_ip
        print(f"Using explicit IP from BREVO_SMTP_IP: {ip}")
    else:
        print("Detecting current public IP...")
        ip = get_public_ip()
        print(f"Detected public IP: {ip}")
    
    print("Fetching current Brevo authorized IPs...")
    try:
        authorized_ips = get_brevo_authorized_ips()
        print(f"Current authorized IPs: {authorized_ips}")
    except Exception as e:
        print(f"Warning: Could not fetch existing IPs: {e}")
        authorized_ips = []
    
    if ip in authorized_ips:
        print(f"✓ IP {ip} is already authorized in Brevo")
        return 0
    
    print(f"Adding IP {ip} to Brevo authorized IPs...")
    try:
        add_brevo_authorized_ip(ip)
        print(f"✓ Successfully added IP {ip} to Brevo authorized IPs")
        return 0
    except Exception as e:
        print(f"✗ Failed to add IP to Brevo: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())