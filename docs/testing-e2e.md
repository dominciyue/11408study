# 端到端测试（Playwright）

## 安装

在 `frontend/`：

```bash
npm install
npx playwright install chromium
```

## 运行

需要先启动服务（建议用 docker compose 一键启动）：

```bash
docker compose up -d --build
```

然后在 `frontend/` 运行：

```bash
npm run test:e2e
```

## 已覆盖（当前）

- 未登录访问 `/` → 跳转到 `/login`
- 走注册流程 → 进入 `/dashboard`

> 后续会继续补：上传资料→导入向导→提取→导入图谱、专项练习→提交→错题本等关键链路。

