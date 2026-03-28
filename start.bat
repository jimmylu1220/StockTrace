@echo off
title StockTrace
set ROOT=%~dp0

echo [1/2] Starting backend Go port 8080...
start "StockTrace Backend" cmd /k "cd /d %ROOT%backend && go run main.go"

timeout /t 3 /nobreak >nul

echo [2/2] Starting frontend React port 5173...
start "StockTrace Frontend" cmd /k "cd /d %ROOT%frontend && npm run dev"

timeout /t 4 /nobreak >nul

echo Opening browser...
start http://localhost:5173

echo.
echo Both services started. Close cmd windows to stop.
pause
