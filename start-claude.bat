@echo off
title Claude Code - AgentRouter (OrderAgentAPP)
echo ======================================================
echo    Claude Code Launcher with AgentRouter Configuration
echo ======================================================
echo.

:: Set AgentRouter API Key and Base URL
set "ANTHROPIC_API_KEY=sk-OwqwBk1fF42Sis2y8MhL8M30UQzpf6Xmqcv9ImazmfrKFkw3"
set "ANTHROPIC_AUTH_TOKEN="
set "ANTHROPIC_BASE_URL=https://agentrouter.org"
set "ANTHROPIC_MODEL=glm-5.3"

echo Starting Claude Code via AgentRouter...
echo Base URL: %ANTHROPIC_BASE_URL%
echo Model:    %ANTHROPIC_MODEL%
echo.
echo ======================================================
claude --effort low
echo.
pause
