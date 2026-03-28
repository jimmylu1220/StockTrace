@echo off
echo Starting StockTrace Backend (Go)...
cd /d "%~dp0backend"
go run main.go
pause
