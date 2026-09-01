#!/usr/bin/env bash
# Agento AI CLI Installer script by WebCore Studio
set -e

echo "Installing Agento AI CLI (@webcorestudio/agento-cli)..."
if command -v npm &> /dev/null; then
  npm install -g @webcorestudio/agento-cli
  echo "✅ Agento AI CLI successfully installed! Run 'agento help' or 'agento status' to get started."
else
  echo "Error: Node.js and npm are required to run Agento AI CLI."
  exit 1
fi
