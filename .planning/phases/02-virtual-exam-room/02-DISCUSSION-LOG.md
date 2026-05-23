# Phase 2: Virtual Exam Room - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 2-Virtual Exam Room
**Areas discussed:** 考官形象方案, 考场布局设计, TTS方案, 引导语内容

---

## 考官形象方案 (Examiner Images)

### 考官数量和图片来源

| Option | Description | Selected |
|--------|-------------|----------|
| 5 位考官，AI 生成照片 | 接近参考图效果，5 位正装考官（4男1女），用 AI 生成正式半身照 | ✓ |
| 5 位考官，占位插画 | CSS/SVG 绘制简约人物轮廓剪影 | |
| 3 位考官，占位插画 | 简化版：3 位考官（中间主考官），用简约剪影 | |
| 让我看 reference 再决定 | 先复用 image.png 中的 5 考官布局，根据实际可获得的图片资源调整 | |

**User's choice:** 5 位考官，AI 生成照片
**Notes:** 用户计划自行生成照片。当前版本先从已有图片库随机选。只需告知图片存放位置。

### 照片生成方式

| Option | Description | Selected |
|--------|-------------|----------|
| AI 工具生成后导出 | 一次性用 Midjourney/DALL-E 生成 5 张半身照，存为静态资源 | |
| API 动态生成 | 接入 DashScope 动态生成，每次不同 | |
| 先用免版权素材替代 | 用免费人像素材临时替代 | |

**User's choice (free text):** 用户自己生成图片，只需告知存放路径。当前版本从已有图片库随机选即可。

### 风格要求

| Option | Description | Selected |
|--------|-------------|----------|
| 按参考图风格 | 深色正装、中性表情、浅灰背景、半身照 | ✓ |
| 稍亲和一点 | 微笑、放松，降低压力感 | |
| 我有具体要求 | 提供年龄、性别比例、着装等细节 | |

**User's choice:** 按参考图风格

### 桌面 + 名牌

| Option | Description | Selected |
|--------|-------------|----------|
| 有名牌+桌子 | 主考官名牌（中间）、考官名牌（两侧） | ✓ |
| 只有人物 | 不展示桌子和名牌 | |
| 完全复刻参考图 | 浅灰背景 + 深色桌面 + 白色名牌在前景 | |

**User's choice:** 有名牌+桌子

### 默认行为（无用户图片时）

| Option | Description | Selected |
|--------|-------------|----------|
| 5 张占位图 | 准备 5 张固定占位图作为默认 | ✓ |
| 纯代码绘制 | CSS/SVG 画考官轮廓剪影 | |
| 图片目录随机选 | 从目录读取所有图片，每次随机 5 张 | |

**User's choice:** 5 张占位图

### 图片存放位置

| Option | Description | Selected |
|--------|-------------|----------|
| frontend/public/examiners/ | 前端 public 目录，直接 URL 访问 | ✓ |
| frontend/src/assets/examiners/ | src 目录，Vite 构建打包 | |
| backend/static/examiners/ | 后端静态文件目录 | |

**User's choice:** frontend/public/examiners/

### 桌面 + 名牌实现方式

| Option | Description | Selected |
|--------|-------------|----------|
| CSS 渲染桌面名牌 | 桌面和名牌用 CSS/HTML 渲染 | |
| 含在图片里 | 桌面和名牌合成在图片中 | ✓ |
| 单张全景图 | 生成完整考场背景大图 | |

**User's choice:** 含在图片里（用户生成的图片自带桌面和名牌）

### 名牌文字

| Option | Description | Selected |
|--------|-------------|----------|
| 和参考图一致 | 主考官 + 考官 | ✓ |
| 统一名牌 | 所有名牌显示"考官" | |
| 带姓氏名牌 | 张考官、李考官等 | |

**User's choice:** 和参考图一致（中间"主考官"，两侧"考官"）

### 图片规格

| Option | Description | Selected |
|--------|-------------|----------|
| 半身照 300x400 | 横向排列，桌面在前景 | |
| 头像照 200x200 | 头像照，显示在名牌上方 | |
| 不限规格 | CSS 统一裁剪适配 | ✓ |

**User's choice:** 不限规格

---

## 考场布局设计 (Room Layout)

### 全屏方式

| Option | Description | Selected |
|--------|-------------|----------|
| 完全全屏 | 隐藏顶栏，整个视口是考场 | |
| 保留顶栏 | 保留"江苏公务员面试模拟器"顶栏 | ✓ |
| 保留顶栏内容 | 顶栏融入考场主题 | |

**User's choice:** 保留顶栏

### 参考图复刻程度

| Option | Description | Selected |
|--------|-------------|----------|
| 完全复刻参考图 | 红底横幅 + 考官 + 桌面 + 引导语 | ✓ |
| 简化版 | 考官 + 引导语，不加横幅 | |
| 考官为主 | 考官居中，引导语浮层叠在下方 | |

**User's choice:** 完全复刻参考图

### 引导语文字位置

| Option | Description | Selected |
|--------|-------------|----------|
| 底部文字卡片 | 考官下方半透明深色卡片 | |
| 叠在画面上方 | 像字幕一样叠在考官画面上 | |
| 默认隐藏 | 可展开按钮，点击显示完整文字 | ✓ |

**User's choice:** 默认隐藏

### 进场过渡

| Option | Description | Selected |
|--------|-------------|----------|
| 有进场动画 | 淡入/缩放过渡 | ✓ |
| 直接切换 | 无动画 | |
| 加载过渡 | "正在进入考场..."加载状态 | |

**User's choice:** 有进场动画

### 引导语显示触发方式

| Option | Description | Selected |
|--------|-------------|----------|
| 可展开按钮 | 点击展开/收起 | ✓ |
| 底部文字区 | 半透明区域显示文字 | |
| 切换开关 | 显示/隐藏切换 | |

**User's choice:** 可展开按钮

### 考场宽度

| Option | Description | Selected |
|--------|-------------|----------|
| 全宽考场 | 全宽展示，考官占主要视口 | |
| 保持 960px | 和 Phase 1 内容区一致 | |
| 宽屏自适应 | 桌面端最高约 1200px | ✓ |

**User's choice:** 宽屏自适应

---

## TTS 方案 (TTS Guidance Audio)

### API 服务选择

| Option | Description | Selected |
|--------|-------------|----------|
| 阿里 DashScope TTS，自动播放 | 后端代理，页面加载自动播放 | ✓ |
| 浏览器 Web Speech API | 零成本零依赖 | |
| 先做文本展示，TTS 后续 | 先展示文字，接口预留 | |

**User's choice:** 阿里 DashScope TTS，自动播放

### 调用链路

| Option | Description | Selected |
|--------|-------------|----------|
| 后端代理 | 后端 API 调用 DashScope，返回音频 | ✓ |
| 前端直连 | 前端直接调用 DashScope API | |
| 预生成静态文件 | 后端预生成 MP3，前端直接播放 | |

**User's choice:** 后端代理

### 语音风格

| Option | Description | Selected |
|--------|-------------|----------|
| 女声播音风 | 专业播音风格 | |
| 男声正式风 | 稳重正式 | ✓ |
| 默认即可 | DashScope 默认中文女声 | |

**User's choice:** 男声正式风

### 播放控件

| Option | Description | Selected |
|--------|-------------|----------|
| 有完整控件 | 播放/暂停/重播 | ✓ |
| 仅重播按钮 | 自动播放，只有重播 | |
| 无控件 | 自动播放，不可控 | |

**User's choice:** 有完整控件

### API 设计

| Option | Description | Selected |
|--------|-------------|----------|
| 新建 TTS 端点 | POST /api/tts/synthesize | ✓ |
| 和引导语合在一起 | 一个接口返回文本+音频 | |
| 先占位后实现 | 预留结构，浏览器兜底 | |

**User's choice:** 新建 TTS 端点

### 音频格式

| Option | Description | Selected |
|--------|-------------|----------|
| MP3 文件 | 传统格式，需完整生成 | |
| 音频流 | 流式传输，更现代低延迟 | ✓ |
| base64 | PCM 数据，Web Audio API 播放 | |

**User's choice:** 音频流（用户问"哪个更现代一点"，推荐了流式）

### 降级策略

| Option | Description | Selected |
|--------|-------------|----------|
| 静默降级 | API 失败不阻塞用户 | ✓ |
| 浏览器 TTS 兜底 | Web Speech API 备选 | |
| 不降级 | 直接显示错误 | |

**User's choice:** 静默降级

---

## 引导语内容 (Guidance Content)

### 内容来源

| Option | Description | Selected |
|--------|-------------|----------|
| 前端硬编码 | 文案写在前端常量 | |
| 后端 API 返回 | /api/interview/guidance 返回 | ✓ |
| 配置文件 | 前端 src/data/guidance.json | |

**User's choice:** 后端 API 返回

### 内容定义方式

| Option | Description | Selected |
|--------|-------------|----------|
| 标准引导语 | 欢迎词 + 考试规则 + 宣布开始 | ✓ |
| 现在讨论文案 | 在讨论中敲定具体文案 | |
| 提供参考文案 | 由 Claude 提供参考，用户确认 | |

**User's choice:** 标准引导语

### API 格式

| Option | Description | Selected |
|--------|-------------|----------|
| 文本+音频一起返回 | 一个接口返回全部 | |
| 文本和音频分离 | 文本 API 和 TTS API 独立 | ✓ |
| 只返回文本 | 前端自行调 TTS | |

**User's choice:** 文本和音频分离

### 动态内容

| Option | Description | Selected |
|--------|-------------|----------|
| 动态引用选题数 | "本次面试共 N 道题" | ✓ |
| 纯静态文案 | 不引用动态数据 | |

**User's choice:** 动态引用选题数

### 接口设计

| Option | Description | Selected |
|--------|-------------|----------|
| GET + query 参数 | GET /api/interview/guidance?question_count=N | ✓ |
| POST + body | POST 含 selected_question_ids | |
| 纯前端拼接 | 文案模板放前端 | |

**User's choice:** GET + query 参数

### 文案格式

| Option | Description | Selected |
|--------|-------------|----------|
| 结构化 JSON | { title, paragraphs[] } | ✓ |
| 纯文本字符串 | 后端返回纯文本 | |
| Markdown | 前端渲染富文本 | |

**User's choice:** 结构化 JSON

---

## Claude's Discretion

- 音频流式传输的具体实现方式（chunked transfer encoding 等）
- 占位图的具体视觉风格（silhouette 颜色、大小）
- 进场动画的具体形式（fade-in, scale-up 等）
- TTS 音频缓存策略

## Deferred Ideas

None — discussion stayed within phase scope.
