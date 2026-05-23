# 考公面试模拟器 (Civil Service Exam Interview Simulator)

面向公务员考试备考的面试模拟器，使用真实省考面试真题，提供接近真实考场的模拟面试体验。

## 技术栈

- **后端**：FastAPI + uv
- **前端**：React 19 + Vite 8 + TypeScript + Ant Design

## 快速开始

```bash
# 安装依赖
cd backend && uv sync
cd ../frontend && npm install

# 启动所有服务
cd .. && make dev
```

## Makefile 命令

| 命令 | 作用 |
|------|------|
| `make dev` | 启动前端 + 后端 |
| `make stop` | 停止所有服务 |
| `make status` | 查看服务状态 |
| `make dev-frontend` | 只启动前端 (:5173) |
| `make dev-backend` | 只启动后端 (:8000) |

## 项目结构

```
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   ├── services/
│   │   └── models/
│   └── data/
│       └── questions.json    # 面试真题数据
├── frontend/
│   └── src/
├── scripts/
├── Makefile
└── docs/
```
