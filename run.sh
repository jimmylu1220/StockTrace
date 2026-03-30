#!/usr/bin/env bash
# StockTrace container runner
# Usage: ./run.sh [up|down|restart|logs|status]

set -euo pipefail

CMD="${1:-up}"

case "$CMD" in
  up)
    echo "Building and starting StockTrace..."
    docker compose up --build -d
    echo ""
    echo "StockTrace is running at http://localhost:3000"
    echo "Use './run.sh logs' to view logs, './run.sh down' to stop."
    ;;
  down)
    echo "Stopping StockTrace..."
    docker compose down
    ;;
  restart)
    echo "Restarting StockTrace..."
    docker compose down
    docker compose up --build -d
    echo "StockTrace restarted at http://localhost:3000"
    ;;
  logs)
    docker compose logs -f
    ;;
  logs:backend)
    docker compose logs -f backend
    ;;
  logs:frontend)
    docker compose logs -f frontend
    ;;
  status)
    docker compose ps
    ;;
  *)
    echo "Usage: ./run.sh [up|down|restart|logs|logs:backend|logs:frontend|status]"
    exit 1
    ;;
esac
