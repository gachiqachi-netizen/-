# 腾讯云 CVM 部署串个珠后端与微信支付

## 微信发货信息录入（B-15）

小程序后台「订单管理 → 发货信息录入」已由负责人截图确认可见。当前业务只用顺丰快递，一单一包裹；发货模式按统一发货上报。服务器需保留现有 `WECHAT_APP_ID`、`WECHAT_APP_SECRET` 与微信支付环境变量，发货接口不新增密钥。`PAYMENT_PROVIDER=wechat` 且订单由微信支付时，后台发货后自动调用[微信官方发货信息录入接口](https://developers.weixin.qq.com/miniprogram/dev/server/API/order_shipping/api_uploadshippinginfo.html) `POST /wxa/sec/order/upload_shipping_info`。请求使用 `order_key`（商户号与支付商户单号）、`logistics_type=1`、`delivery_mode=1`、`shipping_list`（运单号、顺丰编码 `SF`、商品描述和收件人电话）、`upload_time`、`payer.openid`。顺丰要求联系方式；仅随该请求发送，不写入同步日志。

微信接口失败不撤销发货；订单 `wxShipping.status=failed`，后台订单响应带 `wxShipping.message=微信发货信息未同步 · 重试`。在同步失败后再次提交该订单的物流信息可重试；已成功同步且运单号未变时不会重复上报。上线前用一笔真实小额订单验证微信小程序后台能看到运单，且用户能收到发货提醒。真实验证由负责人执行。

适用环境：国内同事租用的腾讯云云服务器（CVM），Linux、Docker Compose、宿主机 Nginx。以下命令由负责人或运维**在自己的服务器**执行；本仓库只提供模板，不含商户凭据。控制台名称可能调整，找不到时以实际后台为准。部署时全程不要把 `app.env`、pem、数据库备份发到聊天或提交到 Git。

## 1. 腾讯云控制台：网络、备案与证书

1. 进入 **腾讯云控制台 → 云服务器 CVM → 实例**，确认实例所在地域、操作系统和公网 IP。在实例对应的**安全组 → 入站规则**只开放业务 TCP 80、443；运维登录端口只放行受信任的运维地址。**8800 不对公网开放**，Compose 只把它绑定在宿主机 `127.0.0.1`。[腾讯云安全组说明](https://cloud.tencent.com/document/product/213/112613)
2. 进入 **域名解析控制台 → 解析记录**，为 API 域名添加指向该公网 IP 的 A 记录。中国内地 CVM 所用域名先在 **腾讯云 ICP 备案控制台**完成备案或接入备案，再对外提供服务。[腾讯云备案条件](https://cloud.tencent.com/document/faq/243/19630)
3. 进入 **腾讯云 SSL 证书控制台 → 我的证书 → 申请免费证书**，为同一个 API 域名完成验证。签发后在证书操作栏下载 **Nginx 格式**证书；记录证书文件和私钥文件名，稍后上传至服务器 `/etc/nginx/certs/`。免费证书到期前要续期并更换服务器文件。[腾讯云免费证书流程](https://cloud.tencent.com/document/api/400/6814)

## 2. 服务器：Docker、Compose 与 Nginx

在 CVM 登录后的终端执行，先用 `cat /etc/os-release` 确认系统。**Ubuntu** 用 Docker 官方 apt 仓库安装（[官方步骤](https://docs.docker.com/engine/install/ubuntu/)）：

```bash
sudo apt update
sudo apt install -y ca-certificates curl nginx
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<DOCKER_REPO
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
DOCKER_REPO
```

上述命令自动写入本机 Ubuntu 版本和架构，然后执行：

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker nginx
sudo docker compose version
```

**OpenCloudOS**（RPM 系）按 [腾讯云 CVM Docker 安装说明](https://main.qcloudimg.com/raw/document/product/pdf/213_15384_cn.pdf) 或机型适用的镜像仓库，在服务器终端执行；版本不同请先核对仓库 URL（[Docker CentOS 仓库说明](https://docs.docker.com/engine/install/centos/)）：

```bash
sudo dnf install -y dnf-plugins-core nginx
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin --nobest
sudo systemctl enable --now docker nginx
sudo docker compose version
```

若 `docker compose version` 不存在，按 [Docker Compose 插件安装说明](https://docs.docker.com/compose/install/linux/)补装；不要安装旧版独立 `docker-compose` 代替。

## 3. 微信商户平台：取材料与关联小程序

负责人在 **微信商户平台 → 账户中心 / 商户信息、API 安全**（菜单以实际后台为准）准备五类材料：①商户号；②32 字节 APIv3 密钥；③商户 API 证书**私钥文件**及证书序列号；④微信支付公钥文件及公钥 ID（若使用平台证书则改为平台证书文件）；⑤已关联的小程序 AppID。进入 **AppID 账号管理**，确认该小程序 AppID 已与商户号关联。小程序 AppID 和 AppSecret 从 **微信公众平台 → 小程序后台 → 开发管理 / 开发设置**取得。**APIv3 密钥不是 pem 文件；商户私钥不是微信支付公钥，不能互换。**

## 4. 服务器：文件、权限和环境变量

在服务器上取得本仓库的部署版本，进入仓库根目录。以下相对路径都以仓库根目录为准：

```bash
mkdir -p deploy/secrets deploy/data/app
sudo chown -R 10001:10001 deploy/data/app deploy/secrets
chmod 700 deploy/secrets
cp deploy/app.env.example deploy/app.env
chmod 600 deploy/app.env
```

用服务器上的安全上传方式，把商户私钥和微信支付公钥（或平台证书）放入 `deploy/secrets/`，文件名与 `app.env` 的容器路径对应。应用容器以 UID 10001 运行，故执行 `sudo chown 10001:10001 deploy/secrets/*.pem`、`chmod 600 deploy/secrets/*.pem`。文件不得放进 Git 仓库提交区或可公开访问的 `/data/uploads`。

只在服务器用编辑器填写 `deploy/app.env`：数据库用户名、密码、库名与 `DATABASE_URL` 对应；`WECHAT_APP_ID` 与 `WXPAY_APPID` 完全一致；支付公钥模式须同时填写公钥路径和 ID，平台证书模式则清空这两项、填写证书路径；`WXPAY_NOTIFY_URL` 必须是 `https://<API域名>/api/payments/notify`。`PAYMENT_PROVIDER=wechat`，`ENV=production`。`ADMIN_TOKEN`、`PHONE_SALT`、`MEDIA_LINK_SECRET` 各自生成独立随机值。可选项不启用时保持空值。不要在终端执行会显示整份环境变量的命令。

## 5. 服务器：启动并运行离线自检

进入 `deploy/`，先用 `--env-file app.env` 让 Compose 读取 PostgreSQL 建库变量。`app.env` 也会由 `env_file` 注入应用容器。首次启动会按程序现有机制运行数据库迁移：

```bash
cd deploy
sudo docker compose --env-file app.env up -d --build
sudo docker compose --env-file app.env exec app python tools/check_deploy.py
```

脚本逐项只打印“通过 / 缺少 / 不对”，**不打印任何值**。必须全部“通过”；负责人将这一屏输出截图给审核，不要截图 `app.env`。`--ping` 此时暂不运行，因为 Nginx 和公网 HTTPS 还没配好。若有失败，先按项目名修正环境变量或 pem 文件的可读性、格式和 `600` 权限，再重复离线自检。不要把密钥值、完整数据库地址贴进报错记录。

## 6. 服务器：Nginx 与 HTTPS 回调

把已下载的 Nginx 证书和私钥上传到服务器 `/etc/nginx/certs/`，给证书私钥设仅管理员可读权限。将 `deploy/nginx.conf.example` 复制到 `/etc/nginx/conf.d/chuan.conf`，替换 `<API域名>`、证书和私钥路径；站点反代到 `127.0.0.1:8800`，`/api/payments/notify` 也必须转发。检查并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo docker compose --env-file app.env exec app python tools/check_deploy.py --ping
```

`--ping` 向配置的公网 HTTPS 回调发一条**无签名**的空 JSON POST，预期 **HTTP 400**；这只验证 HTTPS 可达且拒绝伪造通知，不验证真实支付。若网络失败，检查域名解析、安全组、证书、Nginx 与本机 8800；若返回 200，则必须先调查回调验签逻辑，不能上线。

## 7. 微信后台：域名和支付通知

在 **微信公众平台 → 小程序后台 → 开发管理 → 服务器域名**，把 `https://<API域名>` 加入 **request 合法域名**（菜单以实际后台为准）。在 **微信商户平台 → 产品中心 / 开发配置** 配置付款与退款通知使用的 HTTPS 回调地址 `https://<API域名>/api/payments/notify`；若商户平台当前接口采用下单请求里的 `notify_url`，仍需核对该地址与 `app.env` 一致。核对商户 AppID 关联状态。

## 8. 负责人验收真实交易

由负责人在真机创建一笔 **0.01 元**测试订单并付款，再从后台发起退款。核对订单付款、退款状态以及商户平台对应记录；重试通知时订单不得重复入账或重复退款。保存审核所需的**脱敏状态截图**。执行 agent 不接触真实商户材料、不登录服务器、不做这一步。

## 9. 更新与备份

更新前在服务器进入仓库目录，备份应用数据目录和 PostgreSQL。备份文件移到受限备份存储，确认备份成功后更新；不要使用 `docker compose down -v`，它会删除数据库卷。以下命令在 `deploy/` 执行：

```bash
mkdir -p backups
sudo tar -czf backups/app-data-$(date +%Y%m%d%H%M%S).tar.gz -C data app
sudo docker compose --env-file app.env exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > backups/postgres-$(date +%Y%m%d%H%M%S).sql
cd ..
git pull
cd deploy
sudo docker compose --env-file app.env up -d --build
sudo docker compose --env-file app.env exec app python tools/check_deploy.py
```

`deploy/data/app` 和 Compose 的 `postgres_data` 卷不会因镜像重建而删除。上线后检查应用、数据库容器状态与 Nginx，必要时由负责人执行 `--ping` 复核。
