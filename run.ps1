# StockTrace container runner (PowerShell)
# Usage: .\run.ps1 [up|down|restart|logs|logs:backend|logs:frontend|status]

param(
    [string]$Command = "up"
)

switch ($Command) {
    "up" {
        Write-Host "Building and starting StockTrace..." -ForegroundColor Cyan
        docker compose up --build -d
        Write-Host ""
        Write-Host "StockTrace is running at http://localhost:8080" -ForegroundColor Green
        Write-Host "Use '.\run.ps1 logs' to view logs, '.\run.ps1 down' to stop."
    }
    "down" {
        Write-Host "Stopping StockTrace..." -ForegroundColor Yellow
        docker compose down
    }
    "restart" {
        Write-Host "Restarting StockTrace..." -ForegroundColor Cyan
        docker compose down
        docker compose up --build -d
        Write-Host "StockTrace restarted at http://localhost:8080" -ForegroundColor Green
    }
    "logs" {
        docker compose logs -f
    }
    "logs:backend" {
        docker compose logs -f backend
    }
    "logs:frontend" {
        docker compose logs -f frontend
    }
    "status" {
        docker compose ps
    }
    default {
        Write-Host "Usage: .\run.ps1 [up|down|restart|logs|logs:backend|logs:frontend|status]" -ForegroundColor Red
        exit 1
    }
}
