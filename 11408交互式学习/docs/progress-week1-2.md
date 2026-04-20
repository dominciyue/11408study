# 11408 交互式考研学习平台 — 前两周工作总结

## 项目整体状态

已完成**第一周**和**第二周**的全部开发任务，项目共创建了 **137 个源文件**，分布在三端架构中。前端已通过 `next build` 零错误编译验证。

---

## 第一周完成内容：三端项目脚手架 + 数据库 + 认证

### Java 后端（Spring Boot） — 64 个文件

| 模块 | 文件数 | 说明 |
|---|---|---|
| 实体层 (entity) | 11 | User, Subject, Topic, KnowledgeNode, KnowledgeEdge, Material, StudyProgress, QuizQuestion, WrongAnswer, Note, StudySession |
| 仓库层 (repository) | 11 | 全部 JPA Repository，含自定义查询（分页、筛选、全文搜索） |
| 服务层 (service) | 10 | AuthService, KnowledgeGraphService, StudyPathService(拓扑排序), SpacedRepetitionService(SM-2算法), QuizService, MaterialService, StatsService, AiClientService 等 |
| 控制器层 (controller) | 8 | Auth, Subject, Topic, Knowledge, Study, Quiz, Material, Stats |
| DTO | 12 | ApiResponse(统一响应), AuthResponse, GraphDataDTO 等 |
| 安全 (security) | 3 | JWT Token 生成/验证、认证过滤器、UserDetailsService |
| 配置 (config) | 5 | SecurityConfig, CorsConfig, RedisConfig, MinioConfig, WebConfig |
| 异常处理 | 2 | BusinessException + GlobalExceptionHandler |
| 数据库迁移 | 2 | V1\_\_init.sql(建表+种子学科数据) + V2\_\_seed(408知识点) |
| 配置文件 | 3 | application.yml / application-dev.yml / application-prod.yml |
| Dockerfile | 1 | 多阶段 Maven 构建 |

### Python AI 微服务（FastAPI） — 17 个文件

| 模块 | 说明 |
|---|---|
| `app/main.py` | FastAPI 入口，含健康检查和 CORS |
| `app/models/` | Pydantic 数据模型（knowledge, pdf, quiz） |
| `app/routers/` | 5 个 API 路由（知识提取、出题、关系推荐、内容增强、PDF解析） |
| `app/services/` | LLM 服务封装（支持 OpenAI/Claude）、PDF 解析、知识处理 |
| `Dockerfile` | Python 3.11 + uvicorn |

### React 前端（Next.js） — 40+ 个源文件

| 模块 | 说明 |
|---|---|
| UI 组件 (`components/ui/`) | 14 个 shadcn/ui 风格组件（Button, Card, Dialog, Badge, Progress 等） |
| 布局组件 | Sidebar（学科导航+折叠）、Header（搜索+用户菜单）、AppLayout |
| 页面 | 登录/注册、仪表盘、学科总览、知识图谱、学习模式、测验、资料库、笔记 |
| 工具库 | Axios API 封装（JWT 拦截器）、auth token 管理、cn 工具函数 |
| 状态管理 | 3 个 Zustand Store（auth, graph, study） |
| TypeScript 类型 | 完整的类型定义文件，与后端 DTO 对齐 |

### 基础设施

| 文件 | 说明 |
|---|---|
| `docker-compose.dev.yml` | PostgreSQL 15 + Redis 7 + MinIO（本地开发环境） |
| `nginx/nginx.conf` | 反向代理配置（`/api/**` → Spring Boot, `/ai/**` → FastAPI） |
| `.gitignore` | 全局忽略规则 |

---

## 第二周完成内容：知识图谱核心引擎 + 种子数据

### 后端 — 知识图谱 API

`KnowledgeController` 提供完整的 RESTful API：

- 节点 CRUD（分页、筛选、搜索）
- 边 CRUD（创建/删除关系）
- `GET /knowledge/graph/{subjectId}` — 获取学科完整图谱
- `GET /knowledge/graph/focus/{nodeId}?depth=2` — BFS 算法获取焦点子图
- `GET /knowledge/search?q=keyword` — 全文搜索

### 408 种子数据（V2\_\_seed\_408\_knowledge.sql）

**74 个核心知识点**，覆盖 408 四大子学科：

- 数据结构：30 个（线性表、栈/队列、树、图、排序、查找）
- 计算机组成原理：13 个（数据表示、存储系统、CPU、总线）
- 操作系统：13 个（进程、内存、文件、I/O）
- 计算机网络：18 个（体系结构、各层协议）

**60+ 条知识关系边**，含四种关系类型：

- `PREREQUISITE` — 前置依赖（如：二叉树 → 二叉树遍历）
- `RELATED` — 相关知识（如：TCP ↔ UDP）
- `EXTENDS` — 深入拓展（如：BST → AVL）
- `CROSS_SUBJECT` — 跨学科关联（如：图的遍历 ↔ 路由算法、Cache ↔ 虚拟内存）

### 前端 — React Flow 知识图谱页面

**自定义组件：**

- `KnowledgeNode` — 自定义节点：按学科着色、难度指示器(绿/黄/红)、掌握度进度条
- `NodeDetailPanel` — 节点详情面板：知识点内容展示、关联节点列表（可跳转）、掌握度显示
- `GraphToolbar` — 图谱工具栏：搜索框、学科筛选按钮、缩放控件、节点/边计数

**交互功能：**

- 点击节点展开右侧详情面板
- 聚焦模式（选中节点高亮、其余淡化）
- 点击关联节点可直接跳转
- MiniMap 小地图导航
- 四种边类型的颜色和线型区分
- 底部图例说明

---

## 架构总览

```
11408交互式学习/
├── frontend/                React Next.js 16 + Tailwind v4 + shadcn/ui + React Flow
├── backend/                 Java Spring Boot 3.x + JPA + JWT + Flyway
├── ai-service/              Python FastAPI + LangChain + OpenAI/Claude SDK
├── nginx/                   反向代理配置
├── docker-compose.dev.yml   本地开发环境
└── .gitignore
```

### 技术栈明细

| 层面 | 选型 |
|---|---|
| 前端框架 | Next.js 16 (App Router, TypeScript) |
| UI 组件 | shadcn/ui 风格 + Tailwind CSS v4 |
| 知识图谱 | React Flow (@xyflow/react) |
| 状态管理 | Zustand |
| HTTP 请求 | Axios（JWT 拦截器） |
| Java 后端 | Spring Boot 3.x + Java 17 |
| 认证授权 | Spring Security + JWT (jjwt 0.12.3) |
| ORM | Spring Data JPA + Hibernate |
| 数据库迁移 | Flyway |
| API 文档 | SpringDoc (Swagger UI) |
| Python 服务 | FastAPI + Uvicorn |
| AI 集成 | OpenAI SDK + Anthropic SDK + LangChain |
| PDF 解析 | PyMuPDF (fitz) |
| 数据库 | PostgreSQL 15 |
| 缓存 | Redis 7 |
| 对象存储 | MinIO |
| 容器化 | Docker + Docker Compose |
| 反向代理 | Nginx |

---

## 剩余四周计划

| 周次 | 核心任务 | 状态 |
|---|---|---|
| 第三周 | 学习路径引擎、SM-2 间隔重复、学习模式页面、Recharts 仪表盘 | 待开始 |
| 第四周 | Python AI 微服务联调（PDF解析+知识提取+推荐）、资料导入、笔记 | 待开始 |
| 第五周 | 智能出题引擎、测验交互、错题本、高级图谱功能 | 待开始 |
| 第六周 | Docker 生产部署、PWA/Capacitor/Electron 跨平台、安全审查 | 待开始 |
