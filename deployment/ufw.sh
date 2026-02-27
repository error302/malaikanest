#!/bin/bash
# Basic UFW setup for Ubuntu 22.04
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 8000/tcp # optional for local dev
ufw --force enable
