# CI（自动构建与测试）

已新增 GitHub Actions 工作流：

- 文件：`.github/workflows/ci.yml`
- 覆盖：
  - backend：Maven Wrapper + Testcontainers 集成测试
  - frontend：`npm ci` + `npm run build`
  - ai-service：`pip install` + `pytest`

说明：
- 后端使用 Maven Wrapper 的 `maven-wrapper.jar` 在 CI 里直接下载（避免依赖本机 Maven）
- Testcontainers 需要 CI Runner 支持 Docker（GitHub Hosted Runner 默认可用）

