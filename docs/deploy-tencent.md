# 腾讯云部署手册(11408study)

本文档把"买完服务器 → 上线"的所有手动操作写下来,假设你是第一次上腾讯云。
与之配套的代码改动都在分支 `feature/public-deploy-hardening` 上,合并到 main 后即可参照本文部署。

## 0. 前置准备(本地)

- 一个能 SSH 的本地终端
- 已经 fork / 拉好仓库到本地,准备好 `.env`(参照 `.env.example`)
- 一张已开通银联/微信支付的银行卡(腾讯云、域名都要)

## 1. 买服务器与域名

### 1.1 注册 + 实名

1. 打开 https://cloud.tencent.com,微信扫码注册
2. 控制台首页右上角"实名认证" → 个人(身份证 + 人脸)
3. 等 5-10 分钟通过

### 1.2 买轻量应用服务器

1. 顶栏搜"轻量应用服务器"(注意不是"云服务器 CVM")
2. 选 **广州** 或 **上海** 地域(同地域备案/续费方便)
3. 套餐:**2 核 4G 5Mbps / 80G SSD**(月付或 3 年付都行,3 年付便宜很多)
4. 镜像:**应用镜像 → Docker 20+**(已预装 docker 和 docker-compose),或纯系统 **Ubuntu 22.04 LTS** 自己装
5. 提交订单,等 1-2 分钟实例 Running

### 1.3 买域名(DNSPod)

1. 顶栏搜"域名注册"
2. 搜你想要的名字(`xxx408.com` / `xxxstudy.cn` 等),挑一个加入清单结账
3. 填**域名所有者**信息(姓名/身份证),提交"实名认证"(同账号实名过就快)

### 1.4 提交 ICP 备案(关键,2-3 周)

1. 控制台 → 备案管理 → 开始备案
2. 选轻量服务器和域名,系统自动关联
3. 上传:身份证正反面 + 手持身份证照片 + 域名证书(自动生成)
4. 等初审 1-3 工作日,初审过后再由通信管理局审,合计 2-3 周

> 备案前**不能用域名打开 80/443**;但可以先用 **服务器公网 IP 直连**(浏览器拦截 HTTPS 但 HTTP 可)做内部测试。

## 2. 服务器初始化

### 2.1 SSH 登录

控制台"轻量应用服务器"页面 → 实例 → 登录(网页 SSH)或"密钥/密码"标签获取 root 密码后:

```bash
ssh root@<公网IP>
```

### 2.2 安全基线

```bash
# 升级系统
apt update && apt upgrade -y

# 创建普通用户(避免 root 直接跑业务)
useradd -m -s /bin/bash deploy && usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys

# 改 SSH 端口(可选)+ 禁用密码登录
sed -i 's/^#Port 22/Port 22022/' /etc/ssh/sshd_config
sed -i 's/^PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

### 2.3 防火墙(轻量应用服务器**用网页"防火墙"而不是 ufw**)

腾讯云控制台 → 实例 → 防火墙 → 添加规则:

| 协议 | 端口 | 来源 | 备注 |
|---|---|---|---|
| TCP | 22022 | 你的家庭 IP/0.0.0.0/0 | SSH(改端口后) |
| TCP | 80 | 0.0.0.0/0 | HTTP(Certbot 验证 + 跳转) |
| TCP | 443 | 0.0.0.0/0 | HTTPS |

**不要**对外开 5432 / 6379 / 9000 / 9001 / 3000 / 8080 / 13000 等。`docker-compose.prod.yml` 已经把这些端口从 host 暴露中去掉,只剩 nginx 的 80/443 — 你只要别开放火墙就够安全。

### 2.4 装 docker compose(如果镜像没预装)

```bash
curl -fsSL https://get.docker.com | bash
systemctl enable --now docker
apt install -y docker-compose-plugin
docker compose version  # 应输出 v2.x (≥ 2.21 即可)
```

> Compose v2.21+ 支持 `!reset` 标签;`docker-compose.prod.yml` 用 YAML 多文档语法(`---` 分隔)清掉 base 文件里 nginx 的 18081 端口再重新挂 80/443。版本太老会报错,升级即可。

## 3. 部署项目

### 3.1 拉代码 + 配 env

```bash
su - deploy
git clone https://github.com/<you>/11408study.git
cd 11408study
cp .env.example .env

# 生成强密码
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '=+/')" >> .env.local
echo "MINIO_ROOT_PASSWORD=$(openssl rand -base64 24 | tr -d '=+/')" >> .env.local
echo "APP_JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')" >> .env.local
echo "GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d '=+/')" >> .env.local

# 手动编辑 .env,把 .env.local 里的值填进去,再删除 .env.local
nano .env
rm .env.local
```

> 后端 prod profile 强制要求 `APP_JWT_SECRET` / `APP_CORS_ALLOWED_ORIGINS` / `TURNSTILE_SECRET_KEY` / `MAIL_FROM` 通过 env 注入,缺一个会在容器启动时直接 fail-fast,这是正常的安全设计。

### 3.2 拿 QQ SMTP 授权码

1. 打开 https://mail.qq.com → 顶栏"设置" → "账户"
2. 下拉"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV 服务"
3. 开启"IMAP/SMTP 服务",按短信验证后**得到 16 位授权码**
4. 填入 `.env` 的 `MAIL_PASSWORD`(注意不是 QQ 登录密码)、`MAIL_USERNAME`(完整 QQ 邮箱)、`MAIL_FROM`(同 username)

### 3.3 注册 Cloudflare Turnstile

1. 打开 https://dash.cloudflare.com,注册账号
2. 左侧菜单 → Turnstile → Add site
3. Domain 填你的备案域名(没下来可以先填 widget test domain,或干脆用 Cloudflare 提供的测试 sitekey `1x00000000000000000000AA` always-pass)
4. Widget Mode 选 **Managed**(自动判断,体验最好)
5. 拿到 **Site Key** 和 **Secret Key**,分别填到 `.env` 的 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 和 `TURNSTILE_SECRET_KEY`

### 3.4 第一次启动(用 IP 而非域名,测试用)

备案下来前先用公网 IP 跑 HTTP-only 验证。本仓库的 `nginx.prod.conf` 默认引用 `/etc/letsencrypt/live/your-domain.com/fullchain.pem`,证书还没签时 nginx 起不来 — 这是有意为之的鸡和蛋(见 3.5)。

临时绕过办法:把 `nginx/nginx.prod.conf` 里 443 server 块整体**注释掉**(从 `server { listen 443 ssl;` 到对应的 `}`),并把 80 server 块里 `return 301` 那一行改成直接 proxy 到 frontend:

```nginx
# 临时:80 直接服务(没证书时用)
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    location /api/ { proxy_pass http://java_backend; }
    location /ai/  { proxy_pass http://ai_service/; }
}
```

启动:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose ps
docker compose logs -f --tail=50 backend
```

浏览器开 `http://<公网IP>` 应看到登录页。用 Turnstile 测试 sitekey 走一遍注册流程验证全链路。

### 3.5 备案下来后切 HTTPS

#### 3.5.1 DNS 解析

控制台 → 域名 → DNSPod 解析 → 添加记录:

| 类型 | 主机记录 | 解析线路 | 记录值 |
|---|---|---|---|
| A | @ | 默认 | <公网IP> |
| A | www | 默认 | <公网IP> |

等 DNS 生效(通常 5-30 分钟,`dig your-domain.com` 看到 IP 即可)。

#### 3.5.2 用 Certbot 签证书(webroot 模式)

仍在 80-only 临时配置下,让 nginx 暴露 `/.well-known/acme-challenge/` 路径:

```bash
sudo apt install -y certbot

# webroot 目录已经在仓库里(nginx/webroot),需要让 nginx 容器能写、certbot 能读
sudo certbot certonly \
  --webroot -w ~/11408study/nginx/webroot \
  -d your-domain.com -d www.your-domain.com \
  --email you@example.com --agree-tos --no-eff-email

# 证书生成到 /etc/letsencrypt/live/your-domain.com/
# 同步到仓库目录(docker-compose.prod.yml 把它挂到 nginx 容器):
sudo cp -rL /etc/letsencrypt ~/11408study/nginx/letsencrypt
sudo chown -R deploy:deploy ~/11408study/nginx/letsencrypt
rm -rf ~/11408study/nginx/certs
mv ~/11408study/nginx/letsencrypt ~/11408study/nginx/certs
```

> `nginx/.gitignore` 已经把 `certs/*` 排除(但保留 `.gitkeep`),证书不会被 git 跟踪。

#### 3.5.3 nginx 切完整 prod 配置

把 `nginx/nginx.prod.conf` 里所有 `your-domain.com` 全局替换成你的真实域名;**恢复** 3.4 临时注释掉的 443 server 块和 80→443 跳转。然后:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart nginx
curl -I https://your-domain.com  # 期待 200 + Strict-Transport-Security 头
```

#### 3.5.4 证书自动续签

```bash
sudo crontab -e
# 加一行(每天凌晨 3 点续签 + 同步到容器目录 + reload nginx)
0 3 * * * certbot renew --quiet && rsync -aL --delete /etc/letsencrypt/ /home/deploy/11408study/nginx/certs/ && docker exec $(docker ps -qf name=nginx) nginx -s reload
```

### 3.6 数据库初次 seed

Flyway 启动时自动跑 V1-V15,无需手动:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend curl -s http://localhost:8080/api/actuator/health
# 期待 {"status":"UP"}

# 看 Flyway 实际应用了哪些版本
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
  psql -U "${POSTGRES_USER:-study11408}" -d "${POSTGRES_DB:-study11408}" \
  -c "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"
```

测试注册流程:打开 https://your-domain.com/register → 填邮箱 → 发验证码 → 收件箱拿到 6 位码 → 通过 Turnstile → 注册成功。

## 4. 上线后必做的事

- [ ] 用 https://www.ssllabs.com/ssltest/ 测 SSL 评级(目标 A 以上)
- [ ] 用 https://securityheaders.com/ 测安全头(目标 A 以上)
- [ ] 加入云监控告警(腾讯云控制台 → 云监控 → 告警策略,CPU/内存/磁盘 > 80% 报警到微信)
- [ ] `scripts/backup-*.sh` 加到 crontab(参考 `scripts/` 目录)
- [ ] 把 `.env` 抄一份保存到密码管理器(1Password/Bitwarden),服务器一旦炸了好恢复
- [ ] 攻防自测:连续 6 次输错密码,期待第 7 次收到 429(LoginAttemptService 锁 15 分钟)
- [ ] 注册时把邮箱码故意输 5 次错,期待第 6 次"验证码错误或已过期"并强制重新发码

## 5. 常见踩坑

| 症状 | 排查 |
|---|---|
| 启动报 `Could not resolve placeholder 'APP_JWT_SECRET'` | `.env` 没复制 / docker compose 没读到 → 确认 `.env` 在 compose 同级目录 |
| 启动报 `app.jwt.secret 解码后必须 ≥ 32 字节` | secret 长度不够 → `openssl rand -base64 64 \| tr -d '\n'` 重新生成 |
| 启动报 `app.jwt.secret 不是合法的 Base64 字符串` | 误把 hex 串放进去了 → 改用 `openssl rand -base64 ...`,**不是** `openssl rand -hex` |
| 邮件没收到 | 检查 QQ 邮箱授权码;`docker compose logs backend \| grep -i mail`;垃圾邮件文件夹 |
| `send-email-code` 返回 200 但没邮件 | **正常**:已注册邮箱静默成功(防枚举),换没注册的邮箱再试 |
| Turnstile 显示但前端拿不到 token | 看浏览器 console:sitekey 错 / 域名不匹配,临时改用 `1x00000000000000000000AA` 验证 |
| nginx 启动崩 `ssl_certificate not found` | 第一次部署没签证书就引用了 — 见 3.4 临时配置 |
| 备案没下来但想公网访问 | 不能用域名,只能用 IP 直连 HTTP(443 + 域名腾讯云会拦) |
| 登录 429 太多次 | Redis `KEYS 'login:fail:*'` 看锁,`DEL` 清掉 |
| compose 报 `unknown tag !reset` | docker-compose-plugin 版本 < 2.21,`apt upgrade` 一下 |

## 6. 回滚

```bash
# 想停整套但保留数据:
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop

# 想完全删容器但保留 volume(库不掉):
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# 想连库一起清(危险!):
# docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
```

回滚到上一版镜像:
```bash
git pull
git checkout <上一个版本的 tag 或 commit>
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
