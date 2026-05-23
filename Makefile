.PHONY: dev stop status dev-frontend dev-backend clean

PID_DIR := .pids
FRONTEND_PID := $(PID_DIR)/frontend.pid
BACKEND_PID := $(PID_DIR)/backend.pid

FRONTEND_PORT := 5173
BACKEND_PORT := 8000

$(PID_DIR):
	@mkdir -p $(PID_DIR)

# ── start both ──────────────────────────────────────────────
dev: $(PID_DIR)
	@echo "Starting backend on :$(BACKEND_PORT) ..."
	@cd backend && uv run uvicorn app.main:app --host 127.0.0.1 --port $(BACKEND_PORT) &> /dev/null & echo $$! > ../$(BACKEND_PID)
	@echo "Starting frontend on :$(FRONTEND_PORT) ..."
	@cd frontend && npm run dev &> /dev/null & echo $$! > ../$(FRONTEND_PID)
	@sleep 1
	@$(MAKE) --no-print-directory status

dev-backend: $(PID_DIR)
	@echo "Starting backend on :$(BACKEND_PORT) ..."
	@cd backend && uv run uvicorn app.main:app --host 127.0.0.1 --port $(BACKEND_PORT) &> /dev/null & echo $$! > ../$(BACKEND_PID)
	@sleep 1
	@echo "Backend → http://127.0.0.1:$(BACKEND_PORT)"

dev-frontend: $(PID_DIR)
	@echo "Starting frontend on :$(FRONTEND_PORT) ..."
	@cd frontend && npm run dev &> /dev/null & echo $$! > ../$(FRONTEND_PID)
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

# ── clean ───────────────────────────────────────────────────
clean: stop
	@rm -rf $(PID_DIR)
