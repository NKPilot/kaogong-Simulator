.PHONY: dev stop status dev-backend dev-frontend clean

ROOT := $(CURDIR)
PID_DIR := $(ROOT)/.pids
LOG_DIR := $(ROOT)/logs
FRONTEND_PID := $(PID_DIR)/frontend.pid
BACKEND_PID := $(PID_DIR)/backend.pid
BACKEND_LOG := $(LOG_DIR)/backend.log
FRONTEND_LOG := $(LOG_DIR)/frontend.log

FRONTEND_PORT := 5173
BACKEND_PORT := 8000

# Load .env variables for shell commands (uses absolute path since recipes cd)
ENV_PATH := $(ROOT)/backend/.env
ENV_EXPORT := $(if $(wildcard $(ENV_PATH)),export $$(grep -v '^#' $(ENV_PATH) | xargs) && ,)

$(PID_DIR) $(LOG_DIR):
	@mkdir -p $@

# ── start both ──────────────────────────────────────────────
dev: $(PID_DIR) $(LOG_DIR)
	@echo "Starting backend on :$(BACKEND_PORT) ..."
	@cd backend && $(ENV_EXPORT) uv run uvicorn app.main:app --host 127.0.0.1 --port $(BACKEND_PORT) >> $(BACKEND_LOG) 2>&1 & echo $$! > $(BACKEND_PID)
	@echo "Starting frontend on :$(FRONTEND_PORT) ..."
	@cd frontend && npm run dev >> $(FRONTEND_LOG) 2>&1 & echo $$! > $(FRONTEND_PID)
	@sleep 2
	@$(MAKE) --no-print-directory status

dev-backend: $(PID_DIR) $(LOG_DIR)
	@echo "Starting backend on :$(BACKEND_PORT) ..."
	@cd backend && $(ENV_EXPORT) uv run uvicorn app.main:app --host 127.0.0.1 --port $(BACKEND_PORT) >> $(BACKEND_LOG) 2>&1 & echo $$! > $(BACKEND_PID)
	@sleep 1
	@echo "Backend → http://127.0.0.1:$(BACKEND_PORT)"

dev-frontend: $(PID_DIR) $(LOG_DIR)
	@echo "Starting frontend on :$(FRONTEND_PORT) ..."
	@cd frontend && npm run dev >> $(FRONTEND_LOG) 2>&1 & echo $$! > $(FRONTEND_PID)
	@sleep 1
	@echo "Frontend → http://127.0.0.1:$(FRONTEND_PORT)"

# ── stop ────────────────────────────────────────────────────
stop:
	@test -f $(FRONTEND_PID) && (kill $$(cat $(FRONTEND_PID)) 2>/dev/null && rm $(FRONTEND_PID) && echo "Frontend stopped") || true
	@test -f $(BACKEND_PID) && (kill $$(cat $(BACKEND_PID)) 2>/dev/null && rm $(BACKEND_PID) && echo "Backend stopped") || true
	@rmdir $(PID_DIR) 2>/dev/null; true

# ── status ──────────────────────────────────────────────────
status:
	@test -f $(FRONTEND_PID) && echo "Frontend running → http://127.0.0.1:$(FRONTEND_PORT)  (pid $$(cat $(FRONTEND_PID)))" || echo "Frontend not running"
	@test -f $(BACKEND_PID) && echo "Backend  running → http://127.0.0.1:$(BACKEND_PORT)  (pid $$(cat $(BACKEND_PID)))" || echo "Backend not running"

# ── logs ────────────────────────────────────────────────────
logs-backend:
	@tail -f $(BACKEND_LOG)

logs-frontend:
	@tail -f $(FRONTEND_LOG)

# ── clean ───────────────────────────────────────────────────
clean: stop
	@rm -rf $(PID_DIR)
