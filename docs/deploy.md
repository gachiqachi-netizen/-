# 腾讯云 CVM 部署串个珠后端与微信支付

## 微信发货信息录入（B-15）

小程序后台「订单管理 → 发货信息录入」已由负责人截图确认可见。当前业务只用顺丰快递，一单一包裹；发货模式按统一发货上报。服务器需保留现有 `WECHAT_APP_ID`、`WECHAT_APP_SECRET` 与微信支付环境变量，发货接口不新增密钥。`PAYMENT_PROVIDER=wechat` 且订单由微信支付时，后台发货后自动调用[微信官方发货信息录入接口](https://developers.weixin.qq.com/miniprogram/dev/server/API/order_shipping/api_uploadshippinginfo.html) `POST /wxa/sec/order/upload_shipping_info`。请求使用 `order_key`（商户号与支付商户单号）、`logistics_type=1`、`delivery_mode=1`、`shipping_list`（运单号、从[微信运力 ID 列表](https://developers.weixin.qq.com/miniprogram/dev/server/API/weixin-express/express-msg/api_get_delivery_list.html)实时取得的编码、商品描述和收件电话的前三位加四颗星加后四位）、`upload_time`、`payer.openid`。完整电话不进入微信发货请求或同步日志。

微信接口失败不撤销发货；订单 `wxShipping.status=failed` 并带 `reason`。`carrier` 表示公司名未匹配微信运力列表，后台提示修改名称后重新保存物流且不显示重试按钮；`payment` 表示支付单未确认，`api` 表示接口或网络失败，后台显示重试按钮并调用 `PUT /api/admin/orders/<no>/wx-shipping/retry`。已成功同步且运单号未变时不会重复上报。`server/wechat_token.py` 提供内容安全与发货接口共用的 access_token 缓存，不增加凭据。上线前用一笔真实小额订单验证微信小程序后台能看到运单，且用户能收到发货提醒。真实验证由负责人执行。

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

## 4. 服务器：一键部署

先逐项完成 [部署前清单](../deploy/CHECKLIST.md)，在仓库根目录运行：

```bash
sudo bash deploy/setup.sh
```

脚本会检查系统、安装 Docker/Compose/Nginx、建立数据目录、逐项询问配置，生成 `deploy/app.env` 与 Nginx 配置，启动容器并运行离线自检和公网 `--ping`。AppSecret 与 APIv3 密钥输入不回显；所有凭据只保留在服务器。已有 `app.env` 默认保留，选择覆盖时会先备份。若部署失败，按脚本给出的步骤名排查，修正后可重复执行；不会删除数据卷。完成时 `--ping` 应返回 HTTP 400，证明公网回调可达且拒绝无签名请求。

## 5. 手动配置备用

无法使用脚本时，在仓库根目录执行：

```bash
mkdir -p deploy/secrets deploy/data/app
sudo chown -R 10001:10001 deploy/secrets deploy/data/app
sudo chmod 700 deploy/secrets
cp deploy/app.env.example deploy/app.env
chmod 600 deploy/app.env
```

把商户私钥与微信支付公钥放入 `deploy/secrets/`，分别命名为 `merchant_private.pem`、`wechatpay_public.pem`，属主设为 `10001:10001`，权限设为 `600`。在服务器上填写 `app.env`，使 PostgreSQL 变量与 `DATABASE_URL` 一致、`WECHAT_APP_ID` 与 `WXPAY_APPID` 一致，通知地址为 `https://<API域名>/api/payments/notify`。随机生成 `ADMIN_TOKEN`、`PHONE_SALT`、`MEDIA_LINK_SECRET`；不要把配置或密钥贴到聊天或提交到 Git。

## 6. 手动启动与验证备用

把 Nginx 格式证书与私钥放到 `/etc/nginx/certs/`，依据 `deploy/nginx.conf.example` 写 `/etc/nginx/conf.d/chuan.conf`，替换域名和两个证书路径。然后：

```bash
sudo nginx -t
sudo systemctl reload nginx
cd deploy
sudo docker compose --env-file app.env up -d --build
sudo docker compose --env-file app.env exec app python tools/check_deploy.py
sudo docker compose --env-file app.env exec app python tools/check_deploy.py --ping
```

离线自检各项必须通过，`--ping` 必须得到 HTTP 400。失败时检查域名解析、安全组、证书及 8800 本地监听；不要展示 `app.env` 或密钥。把不含凭据的自检输出截图交审核。

### 首次导入初始数据

更新代码后，先在服务器的 `deploy/` 目录执行 `sudo docker compose --env-file app.env up -d`，让新增的只读脚本挂载生效。服务可用后，再预览珠子、模板、宣传位和草稿条款的缺失数量：

```bash
sudo docker compose --env-file app.env up -d
```

```bash
sudo docker compose --env-file app.env exec app python tools/load_seed.py
```

核对每张表的“将新增 / 已存在跳过”数量后，再明确执行写入：

```bash
sudo docker compose --env-file app.env exec app python tools/load_seed.py --apply
```

只需补某些表时加 `--only beads,templates`（可选 `beads,templates,banners,terms`）。命令只按 ID 补缺，不删除、不覆盖已有记录，可重复运行；条款保持草稿状态。模板封面需负责人之后在后台上传，前台没有封面时使用生成图。导入之后在后台修改价格、封面、上下架状态，不要用此命令覆盖人工修改。

### 导入 2026 年 11 月首页模板

先确认新珠子已在后台导入并上架。在服务器的 `deploy/` 目录更新代码后，执行 `sudo docker compose --env-file app.env up -d`，使脚本和数据文件的只读挂载生效。先预览 6 个模板及珠子校验结果：

```bash
sudo docker compose --env-file app.env exec app python tools/load_templates.py /app/deploy-data/templates-2026-11.json
```

全部显示“将新增”或“已存在跳过”，且没有“珠子缺失或不可用”后，再执行：

```bash
sudo docker compose --env-file app.env exec app python tools/load_templates.py /app/deploy-data/templates-2026-11.json --apply
```

命令只按模板 ID 补缺，不覆盖后台已修改的模板；任一待导入模板引用的珠子不存在、未上架或类型不符时，整批不写。旧的 t1–t6 由负责人在后台下架；模板封面也由负责人上传。

## 7. 微信后台：域名和支付通知

### 以后打开图片机审

评价图片默认由负责人在后台人工审核。需要启用微信异步图片机审时，先生成独立随机的 `WECHAT_MSG_TOKEN`，填入服务器 `deploy/app.env`，并设置 `IMAGE_SEC_CHECK=on`。随后在小程序后台 **开发管理 → 开发设置 → 消息推送** 填写 URL `https://<API域名>/api/wechat/media-check`，Token 与 `WECHAT_MSG_TOKEN` 相同，数据格式选 JSON，模式选明文。保存时服务端会校验签名并原样返回 `echostr`。改完环境变量后重建应用容器；菜单名称以实际后台为准。

在 **微信公众平台 → 小程序后台 → 开发管理 → 服务器域名**，把 `https://<API域名>` 加入 **request 合法域名**（菜单以实际后台为准）。**商户平台不需要单独填支付回调地址**：本项目用 APIv3，下单和退款请求都由服务器带上 `app.env` 里的 `WXPAY_NOTIFY_URL`（`https://<API域名>/api/payments/notify`），只要它正确且 `--ping` 返回 400 即可。商户平台只需在 **产品中心 → AppID 账号管理** 核对小程序 AppID 已关联。

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

### 给新珠子补颜色

本机工具 `tools/bead_colors.py` 从正式商品接口读取没有颜色的珠子，下载小图取中心主色；白底空图、下载失败或金属珠使用名称或金属色表。需要重新生成和核对时，在本机安装 `Pillow`，运行 `python3 tools/bead_colors.py`；它生成 `deploy/data-files/bead-colors-2026-11.json` 和供目测的拼图。先审核 JSON 和拼图，再把数据文件随代码部署。

服务器更新代码后，在 `deploy/` 目录重建应用容器，让脚本的只读挂载生效。先预览，只补数据库中现有珠子的缺失 `c` 字段：

```bash
sudo docker compose --env-file app.env up -d
sudo docker compose --env-file app.env exec app python tools/patch_beads.py /app/deploy-data/bead-colors-2026-11.json
sudo docker compose --env-file app.env exec app python tools/patch_beads.py /app/deploy-data/bead-colors-2026-11.json --apply
```

命令会列出不存在的 ID、已有字段跳过数和补入数；不会覆盖已有颜色，也可重复运行。`patch_beads.py` 只接受 `c`、`kb` 两种待补字段，预览默认不写入。
