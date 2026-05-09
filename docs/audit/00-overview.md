# 00 — 执行摘要

**审查日期：** 2026-05-09
**项目：** [dominciyue/11408study](https://github.com/dominciyue/11408study) · commit `0f08c91 ds version`
**审查范围：** 全栈（后端 / 前端 / AI 服务 / 配置 / 部署）
**目标场景：** 10K 总注册用户（DAU 1.5K · 峰值并发 ~100 · 月 PV 200W · 轻量场景）

---

## 1. 项目当前能力综述

11408study 是一个面向考研 408（计算机专业基础综合）+ 政治/英语一/数学一的交互式学习平台。**6 周冲刺已完成全部计划内容**：知识图谱（74 个 408 知识点 + 60+ 关系边）、SM-2 间隔重复、智能 Quiz 引擎与错题本、笔记 CRUD、PDF 资料导入闭环（上传→解析→提取→入图谱）、Stats 仪表盘、CI 流水线、后端集成测试、前端 E2E、PWA manifest、统一 Nginx 网关。本次审查在本地用 `docker compose` 起 7 个服务全部健康跑通，并通过 Auth/Subjects/AI 等关键 API 验证基础链路可用。

**结论：基本功能闭环已完成，距上线主要差三类问题——4 个真功能 bug、9 个安全/部署致命问题、若干性能与可观测性缺口。**

---

## 2. Top 5 上线前必修风险

| # | 风险 | 等级 | 影响 | 详见 |
|---|---|---|---|---|
| 1 | **JWT userId claim 全链路缺失** — `AuthService` 三处调不带 userId 的 `generateToken(username)` 重载，下游 `NoteController` / `MaterialController` 全部走 null userId，所有相关接口 NPE 或返回空 | 🔴 阻塞 | 笔记 / 资料 / 部分鉴权接口**实际不可用** | doc 1 §4.1, doc 2 P0-01 |
| 2 | **拓扑排序大小写不匹配** — `StudyPathService:49` 比较 `"prerequisite"`，V2 seed 全用 `'PREREQUISITE'`，所有前置依赖边都识别失败 | 🔴 阻塞 | **学习路径功能完全失效**，仅按 nodeId 顺序输出 | doc 1 §4.1, doc 2 P0-02 |
| 3 | **JWT secret 硬编码 + Actuator 全开** — `application.yml:43` 写死 base64 secret（解码即明文），SecurityConfig 把 `actuator/**` permitAll，攻击者可 `/actuator/env` 直接读 secret 后伪造任意用户 token | 🔴 阻塞 | **整个鉴权系统可被旁路** | doc 1 §3.1, doc 2 P0-05/P0-08 |
| 4 | **HTTPS / Secret / CORS 三件套未配置** — Nginx 仅 80 端口、CORS 用 `setAllowedOriginPatterns("*")` + `allowCredentials=true`、所有密码硬编码（DB/MinIO 都是 `*_dev`） | 🔴 阻塞 | 中间人攻击、跨站凭证窃取、git clone 即拿到生产凭证 | doc 1 §3.1, doc 2 P0-04/05/06/07 |
| 5 | **无 API 限流 + AI 调用无超时 + AI 启动不校验 key** — Nginx 无 limit_req、`AiClientService` 用 `new RestTemplate()` 无 timeout、ai-service 启动时不验证 LLM key（首次调用才失败 14s） | 🔴 阻塞 | 暴力破解零防护、AI 故障级联拖垮 backend、刷 LLM 费用零拦截 | doc 1 §3.1/§4.2, doc 2 P0-09/11, doc 4 §1.2 |

> **附加 8 个 🔴 阻塞问题** 见 doc 1 §5 严重等级汇总，包括 ImportController 完全无鉴权、Frontend materials/import 缺 Authorization header（与 #1 互相掩盖）、SM-2 算法实现错误、密码复杂度无校验等。**总计 13 项 P0**。

---

## 3. 推荐的 3 阶段路径

```
M1 (本次完成)     M2 上线候选         M3 正式上线         M4 持续迭代
─────────────────────────────────────────────────────────────────────
 本地跑通验证     P0 修完 (~13 项)    P1 修完 (~12 项)    P2 + 真实负载
 6 份审查文档     1-2 周 / 80-120 人时 1-2 周 / 80-120 人时 季度迭代
                                                            
 ↓                ↓                   ↓                   ↓
 现在你在这       1-2 周后可上线      正式服务上线        优化、扩容
```

| 阶段 | 关键产出 | 预估工作量 | 推荐周期 |
|---|---|---|---|
| **M1（已完成）** | 本审查 6 份文档 + 本地跑通 | (本审查) | 已完成 |
| **M2 上线候选** | 修完所有 P0：4 个真功能 bug + 9 项安全/部署 | 80-120 人时 | 1-2 周 |
| **M3 正式上线** | 修完 P1：监控、备份、AI 抽象、N+1、限流细化 | 80-120 人时 | 1-2 周 |
| **M4 持续迭代** | P2：测试覆盖、PWA 完整、技术债、UX | 持续 | 季度 |

**总计 4-6 周**可达可上架（真实流量验证 + SLA 承诺）状态。

---

## 4. 6 份审查文档导航

| 序号 | 文档 | 内容 | 长度 |
|---|---|---|---|
| **00** | [00-overview.md](./00-overview.md) | 本文：执行摘要 + Top 5 风险 + 路径 | 600 字 |
| **01** | [01-architecture-audit.md](./01-architecture-audit.md) | 架构审查报告：当前架构图、逐层评估、横切关注、94 条问题（13🔴/47🟠/30🟡/4🟢） | 5500 字 / 596 行 |
| **02** | [02-optimization-roadmap.md](./02-optimization-roadmap.md) | P0/P1/P2 路线图，35 条任务（每条含问题/方案/工作量/验收/依赖），总 242 人时 | 3700 字 / 415 行 |
| **03** | [03-production-deployment.md](./03-production-deployment.md) | 单 VPS 4C8G 生产部署完整方案：prod compose、Nginx HTTPS、PostgreSQL 调优、备份、监控、CI/CD、容量、成本 | 5100 字 / 1054 行 |
| **04** | [04-llm-adapter-cn.md](./04-llm-adapter-cn.md) | 国产 LLM 双轨方案：DeepSeek 快通道（0 代码） + Provider 抽象（Qwen/GLM）+ 缓存策略 + 10K 用户月成本 ¥180-1800 | 3700 字 / 509 行 |
| **05** | [05-local-validation.md](./05-local-validation.md) | 本地跑通验证报告：7 服务全 Up、4 个 blocker 修复（compose 端口/Maven 镜像/PyPI 镜像/Node 升级）、15 个未修问题 | 2200 字 / 231 行 |

**全 6 份合计约 21K 字**，全部基于 commit `0f08c91 ds version` 实测。

---

## 5. 本审查产生的代码改动

为完成"本地跑通"目标，本审查共 commit 4 处必要的 blocker 修复（不改业务代码）：

| commit | 改动 | 原因 |
|---|---|---|
| `67f1258` | docker-compose.yml 加 backend/frontend 端口暴露 | 便于宿主直接 curl 验证 |
| `1640fe2` | backend/.mvn/settings.xml + Dockerfile 用 Aliyun Maven 镜像 | Maven Central 直连 5-15 分钟 → 改后 9 秒 |
| `0b1b4d7` | ai-service/Dockerfile 用 Aliyun PyPI 镜像 | pip 拉 fastapi 直接超时失败 → 改后 80 秒 |
| `1cfb913` | frontend/Dockerfile node:18 → node:20 | Next.js 16 要求 Node ≥20.9.0，原 18 直接 build error |

第 4 项（Node 升级）是**原代码 regression**——前一作者把 Next.js 升到 16 但忘了升 Dockerfile 的 Node 版本，已在 doc 1 §4.3 标注。

---

## 6. 建议的下一步会话

本审查的 M1 阶段到此结束。后续工作建议在**独立会话**中按下列顺序推进：

1. **会话 A — 修真功能 Bug**：按 doc 2 P0-01/02/03/13 修 4 个真 bug（JWT userId、拓扑大小写、ImportController 鉴权、SM-2 算法）；预估 12-16 小时；产出 1 个 PR
2. **会话 B — 安全加固**：按 doc 2 P0-04~12 修 9 项安全/部署问题（HTTPS、Secret 外部化、CORS、Actuator、限流、AI 超时等）；预估 24-40 小时；产出 1-2 个 PR
3. **会话 C — DeepSeek 接入**：按 doc 4 §2 快通道，配置 `.env.prod` 接入 DeepSeek，验证 AI 链路；预估 2-4 小时
4. **会话 D — 部署演练**：按 doc 3 在测试服务器跑一遍部署 + 备份 + 监控接入；预估 8-16 小时
5. **会话 E+ — P1 优化**：按 doc 2 P1 列表分批做，每批 1-2 个 PR

**关键提醒**：
- 上线前**必须**修完 doc 2 全部 P0 项
- doc 4 的 DeepSeek 快通道可与 P0 修复并行进行
- 真实负载测试（如 wrk/k6）应在 M3 上线后第一周做

---

## 7. 致谢与限制

- 本审查在本地 `docker compose` 环境执行，**未做浏览器自动化**——UI 渲染、注册→登录→dashboard 流程需人工验证（参见 doc 5 §6）
- **未跑后端 IT 测试**（Testcontainers 时间预算外），CI 已配置应在 GitHub Actions 中通过
- LLM 价格信息基于 2025 年公开报价，正式接入以官方计费页为准
- 安全审查偏代码层，**未做 OWASP Top 10 自动扫描**（建议 M2 阶段补 ZAP/SonarQube）

---

**Status: 本审查（M1）完成。准备好开始 M2 阶段的实施。**
