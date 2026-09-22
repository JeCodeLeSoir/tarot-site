@echo off
cd /d "%~dp0"
python -u "%~dp0serveur-local.py"
if errorlevel 1 pause
