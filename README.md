# 考公面试模拟器 (Civil Service Exam Interview Simulator)

面向公务员考试备考的面试模拟器，使用真实江苏省考面试真题，通过数字人考官朗读题目、考生语音作答、限时答题、AI 评分的流程，提供接近真实考场的模拟面试体验。

## 前置条件

| 工具 | 版本要求 | 安装方式 |
|------|----------|----------|
| **uv** (Python 包管理器) | 最新版 | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| **Node.js** | >= 18 | [nodejs.org](https://nodejs.org/) 或 `nvm` |
| **ffmpeg** | 任意版本 | `sudo apt install ffmpeg` (Linux) / `brew install ffmpeg` (macOS) |

ffmpeg 用于评分时将 WebM 录音转换为 WAV 格式。如果未安装，评分功能将不可用，但不影响题库浏览和面试流程。

## 快速开始

```bash
# 1. 一键初始化（检查环境 + 安装依赖 + 创建 .env）
./init.sh

# 2. 编辑 backend/.env，填入你的 API Key
#    DASHSCOPE_API_KEY 用于 TTS 语音合成和 AI 评分（必填）
#    MINIMAX_API_KEY 用于备选 TTS 引擎（可选）

# 3. 启动开发服务
make dev

# 4. 浏览器打开 http://localhost:5173
```

## API Key 获取

| Key | 用途 | 获取地址 |
|-----|------|----------|
| `DASHSCOPE_API_KEY` | TTS 语音合成 + AI 评分（必填） | [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com/apiKey) |
| `MINIMAX_API_KEY` | 备选 TTS 引擎（可选） | [platform.minimax.io](https://platform.minimax.io/user-center/basic-information/interface-key) |

## Makefile 命令

| 命令 | 作用 |
|------|------|
| `make dev` | 启动前端 + 后端 |
| `make stop` | 停止所有服务 |
| `make status` | 查看服务状态 |
| `make dev-frontend` | 只启动前端 (:5173) |
| `make dev-backend` | 只启动后端 (:8000) |
| `make logs-backend` | 查看后端日志 |
| `make logs-frontend` | 查看前端日志 |

## 项目结构

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口
│   │   ├── routers/             # API 路由
│   │   │   ├── health.py        # 健康检查
│   │   │   ├── questions.py     # 题库接口
│   │   │   ├── guidance.py      # 引导语
│   │   │   ├── tts.py           # TTS 合成 (DashScope)
│   │   │   ├── minimax_tts.py   # TTS 合成 (MiniMax)
│   │   │   ├── asr.py           # 语音识别
│   │   │   ├── recording.py     # 录音上传
│   │   │   ├── scoring.py       # 评分 + 参考答案
│   │   │   └── history.py       # 历史记录
│   │   ├── services/            # 业务逻辑
│   │   └── models/              # Pydantic 数据模型
│   ├── data/
│   │   └── questions.json       # 16 道江苏省考面试真题
│   └── tests/
├── frontend/
│   └── src/
│       ├── pages/               # 6 个页面
│       │   ├── QuestionBank/    # 题库浏览与选题
│       │   ├── ExamRoom/        # 虚拟考场
│       │   ├── QuestionInterview/ # 逐题面试
│       │   ├── ScoringResults/  # 评分结果
│       │   ├── History/         # 练习历史
│       │   └── TestRecording/   # 录音测试
│       ├── store/               # Zustand 状态管理
│       ├── api/                 # API 调用模块
│       └── types/               # TypeScript 类型定义
├── init.sh                      # 环境初始化脚本
├── Makefile
└── docs/
```

## 技术栈

- **后端**：FastAPI + uv + DashScope SDK (TTS/ASR/LLM)
- **前端**：React 19 + Vite 8 + TypeScript + Ant Design 5 + Zustand
- **AI**：阿里云 DashScope (CosyVoice TTS, Paraformer ASR, Qwen-Max 评分)
