#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

say()   { printf "%b\n" "$@"; }
ok()    { say "${GREEN}[OK]${NC} $1"; }
warn()  { say "${YELLOW}[WARN]${NC} $1"; }
err()   { say "${RED}[ERR]${NC} $1"; }
header(){ say "\n${GREEN}==>${NC} ${1}"; }

header "考公面试模拟器 — 环境初始化"

# ── 1. Check prerequisites ──────────────────────────────────
say "Checking prerequisites..."

failures=0

# uv
if command -v uv &>/dev/null; then
  ok "uv $(uv --version 2>/dev/null || echo 'found')"
else
  err "uv not found — install: curl -LsSf https://astral.sh/uv/install.sh | sh"
  ((failures++))
fi

# node
if command -v node &>/dev/null; then
  ok "node $(node --version)"
else
  err "node not found — install Node.js >= 18"
  ((failures++))
fi

# npm
if command -v npm &>/dev/null; then
  ok "npm $(npm --version)"
else
  err "npm not found"
  ((failures++))
fi

# ffmpeg
if command -v ffmpeg &>/dev/null; then
  ok "ffmpeg $(ffmpeg -version 2>&1 | head -1 | cut -d' ' -f3)"
else
  warn "ffmpeg not found — scoring won't work until installed"
  say "   Ubuntu/Debian: sudo apt install ffmpeg"
  say "   macOS:         brew install ffmpeg"
fi

if [ "$failures" -gt 0 ]; then
  err "$failures required tool(s) missing — install them and re-run this script"
  exit 1
fi

# ── 2. .env setup ───────────────────────────────────────────
header "Setting up .env"

ENV_FILE="$ROOT/backend/.env"
ENV_EXAMPLE="$ROOT/backend/.env.example"

if [ -f "$ENV_FILE" ]; then
  ok ".env already exists — skipping"
else
  if [ -f "$ENV_EXAMPLE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    ok ".env created from .env.example"
    warn "Edit backend/.env and fill in your DASHSCOPE_API_KEY"
  else
    warn ".env.example not found — you'll need to create backend/.env manually"
  fi
fi

# ── 3. Install backend dependencies ─────────────────────────
header "Installing backend dependencies"

cd "$ROOT/backend"
if uv sync; then
  ok "Backend dependencies installed"
else
  err "Backend dependency install failed"
  exit 1
fi

# ── 4. Install frontend dependencies ────────────────────────
header "Installing frontend dependencies"

cd "$ROOT/frontend"
if npm install; then
  ok "Frontend dependencies installed"
else
  err "Frontend dependency install failed"
  exit 1
fi

# ── 5. Done ─────────────────────────────────────────────────
cd "$ROOT"

say ""
say "=============================================="
say "  环境初始化完成！"
say "=============================================="
say ""
say "  下一步:"
say "    1. 编辑 backend/.env，填入你的 DASHSCOPE_API_KEY"
say "    2. make dev    启动开发服务"
say "    3. 浏览器打开 http://localhost:5173"
say ""
