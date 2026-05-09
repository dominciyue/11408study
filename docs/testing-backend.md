# 后端测试（Docker/Testcontainers）

## 目标

- 不依赖本机 Maven：使用 **Maven Wrapper** 下载并运行 Maven
- 使用 **Testcontainers** 启动 PostgreSQL（以及可选 Redis 容器），跑 Flyway 迁移后执行集成测试
- 覆盖关键链路（先从导入链路开始）

## 已落地内容

- Maven Wrapper（仅用于测试/CI）
  - `backend/.mvn/wrapper/maven-wrapper.properties`
  - `backend/.mvn/wrapper/maven-wrapper.jar`（从 Maven Central 下载）
- Testcontainers + 集成测试基类
  - `backend/src/test/java/com/study11408/testsupport/AbstractIntegrationTest.java`
- 导入接口集成测试（Mock AI）
  - `backend/src/test/java/com/study11408/ImportControllerIT.java`

## 本机运行（Windows）

在 `backend/` 目录运行：

```bash
java "-Dmaven.multiModuleProjectDirectory=<你的backend绝对路径>" ^
  -classpath .\.mvn\wrapper\maven-wrapper.jar ^
  org.apache.maven.wrapper.MavenWrapperMain -q test -U
```

说明：
- 会自动下载 Maven 发行版到 `~/.m2/wrapper/dists/`
- Testcontainers 需要 Docker Desktop 正常运行

## 下一步建议扩展的测试点

- Auth：注册/登录/鉴权过滤器
- Knowledge：创建节点/边、图谱查询
- Notes：CRUD 权限校验（只能操作自己的笔记）
- Quiz：提交答案→生成错题→错题查询

