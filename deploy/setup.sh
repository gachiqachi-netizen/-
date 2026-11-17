#!/usr/bin/env bash
set -euo pipefail

if [[ ${DRY_RUN:-0} != 1 && $EUID -ne 0 ]]; then
  echo '请使用 sudo bash deploy/setup.sh' >&2
  exit 1
fi
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
DEPLOY="$ROOT/deploy"
if [[ ${DRY_RUN:-0} == 1 ]]; then
  [[ -n ${SETUP_OUTPUT_DIR:-} ]] || { echo 'DRY_RUN 需要 SETUP_OUTPUT_DIR' >&2; exit 1; }
  DEPLOY=$SETUP_OUTPUT_DIR
  mkdir -p "$DEPLOY"
  NGINX_CONF="$DEPLOY/chuan.conf"
else
  NGINX_CONF=/etc/nginx/conf.d/chuan.conf
fi
ENV_FILE="$DEPLOY/app.env"
step=准备
trap 'echo "失败：$step（第 $LINENO 行）" >&2' ERR

install_packages() {
  step=安装软件
  if [[ ${DRY_RUN:-0} == 1 ]]; then echo '安装软件：跳过（DRY_RUN）'; return; fi
  # shellcheck disable=SC1091
  source /etc/os-release
  case "${ID:-}" in
    ubuntu|debian)
      if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
        apt-get update
        apt-get install -y ca-certificates curl
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL "https://download.docker.com/linux/$ID/gpg" -o /etc/apt/keyrings/docker.asc
        chmod a+r /etc/apt/keyrings/docker.asc
        cat > /etc/apt/sources.list.d/docker.sources <<REPO
Types: deb
URIs: https://download.docker.com/linux/$ID
Suites: ${UBUNTU_CODENAME:-$VERSION_CODENAME}
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
REPO
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      fi
      command -v nginx >/dev/null || apt-get install -y nginx
      ;;
    opencloudos|centos|tencentos)
      local pkg=dnf
      command -v dnf >/dev/null || pkg=yum
      if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
        "$pkg" install -y "$pkg"-plugins-core
        "$pkg" config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        "$pkg" install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin --nobest
      fi
      command -v nginx >/dev/null || "$pkg" install -y nginx
      ;;
    *) echo '不支持此系统，请照 docs/deploy.md 第 2 节手动安装。' >&2; exit 1 ;;
  esac
  systemctl enable --now docker nginx
  echo '安装软件：完成'
}

ask() {
  local label=$1 name=$2 hidden=${3:-0} value
  while true; do
    if [[ $hidden == 1 ]]; then read -r -s -p "${label}：" value; echo; else read -r -p "${label}：" value; fi
    [[ -n $value && $value != *$'\n'* && $value != *$'\r'* ]] || { echo '不能为空'; continue; }
    case "$name" in
      domain) [[ $value =~ ^[A-Za-z0-9.-]+$ && $value == *.* && $value != -* && $value != *..* ]] || { echo '请输入不带协议的域名'; continue; } ;;
      api_key) [[ ${#value} == 32 ]] || { echo 'APIv3 密钥必须为 32 位'; continue; } ;;
      merchant_pem|platform_pem|cert|cert_key) [[ -f $value && -r $value ]] || { echo '文件不存在或不可读'; continue; } ;;
      *) [[ $value != *'='* && $value != *' '* && $value != *'<'* && $value != *'>'* ]] || { echo '格式不对'; continue; } ;;
    esac
    printf -v "$name" '%s' "$value"
    return
  done
}

random_hex() { openssl rand -hex 32; }
install_packages
step=建立目录
mkdir -p "$DEPLOY/secrets" "$DEPLOY/data/app"
chmod 700 "$DEPLOY/secrets"
if [[ ${DRY_RUN:-0} != 1 ]]; then chown -R 10001:10001 "$DEPLOY/secrets" "$DEPLOY/data/app"; fi
echo '目录：完成'

create_env=1
if [[ -f $ENV_FILE ]]; then
  read -r -p 'app.env 已存在，覆盖 / 保留？[默认保留]：' answer
  if [[ $answer != 覆盖 ]]; then create_env=0; else cp -p "$ENV_FILE" "$ENV_FILE.bak.$(date +%Y%m%d%H%M%S)"; fi
fi
if (( create_env )); then
  step=生成配置
  ask 'API 域名' domain
  ask '商户号' mchid
  ask '小程序 AppID' appid
  ask '小程序 AppSecret' appsecret 1
  ask 'APIv3 密钥' api_key 1
  ask '商户证书序列号' serial
  ask '微信支付公钥 ID' public_id
  ask '商户私钥 pem 的服务器路径' merchant_pem
  ask '微信支付公钥 pem 的服务器路径' platform_pem
  ask 'Nginx 证书路径' cert
  ask 'Nginx 证书私钥路径' cert_key
  cp "$merchant_pem" "$DEPLOY/secrets/merchant_private.pem"
  cp "$platform_pem" "$DEPLOY/secrets/wechatpay_public.pem"
  chmod 600 "$DEPLOY/secrets/merchant_private.pem" "$DEPLOY/secrets/wechatpay_public.pem"
  if [[ ${DRY_RUN:-0} != 1 ]]; then chown 10001:10001 "$DEPLOY/secrets/merchant_private.pem" "$DEPLOY/secrets/wechatpay_public.pem"; fi
  admin_token=$(random_hex); phone_salt=$(random_hex); media_secret=$(random_hex); db_password=$(random_hex)
  export domain mchid appid appsecret api_key serial public_id admin_token phone_salt media_secret db_password
  python3 - "$ROOT/deploy/app.env.example" "$ENV_FILE" <<'PY'
import os, pathlib, sys
source = pathlib.Path(sys.argv[1]).read_text()
values = {
    'ENV': 'production', 'POSTGRES_USER': 'chuan', 'POSTGRES_PASSWORD': os.environ['db_password'],
    'POSTGRES_DB': 'chuan', 'DATABASE_URL': f"postgresql://chuan:{os.environ['db_password']}@postgres:5432/chuan",
    'ADMIN_TOKEN': os.environ['admin_token'], 'WECHAT_APP_ID': os.environ['appid'],
    'WECHAT_APP_SECRET': os.environ['appsecret'], 'WXPAY_MCHID': os.environ['mchid'],
    'WXPAY_APPID': os.environ['appid'], 'WXPAY_API_V3_KEY': os.environ['api_key'],
    'WXPAY_CERT_SERIAL': os.environ['serial'], 'WXPAY_PLATFORM_PUBLIC_KEY_ID': os.environ['public_id'],
    'WXPAY_NOTIFY_URL': f"https://{os.environ['domain']}/api/payments/notify",
    'PUBLIC_BASE_URL': f"https://{os.environ['domain']}", 'MEDIA_LINK_SECRET': os.environ['media_secret'],
    'PHONE_SALT': os.environ['phone_salt'], 'PAYMENT_PROVIDER': 'wechat',
}
lines = []
for line in source.splitlines():
    if line and not line.startswith('#') and '=' in line:
        key = line.split('=', 1)[0]
        if key in values:
            line = key + '=' + values[key]
    lines.append(line)
pathlib.Path(sys.argv[2]).write_text('\n'.join(lines) + '\n')
PY
  chmod 600 "$ENV_FILE"
  step=生成Nginx配置
  export cert cert_key
  python3 - "$ROOT/deploy/nginx.conf.example" "$NGINX_CONF" <<'PY'
import os, pathlib, sys
text = pathlib.Path(sys.argv[1]).read_text()
text = text.replace('<API域名>', os.environ['domain'])
text = text.replace('/etc/nginx/certs/<证书文件>.crt', os.environ['cert'])
text = text.replace('/etc/nginx/certs/<证书私钥文件>.key', os.environ['cert_key'])
pathlib.Path(sys.argv[2]).write_text(text)
PY
  echo 'app.env 与 Nginx 配置：完成'
else
  echo 'app.env：保留；跳过问答和配置生成'
fi
if [[ ${DRY_RUN:-0} == 1 ]]; then echo '容器与自检：跳过（DRY_RUN）'; exit 0; fi
step=验证Nginx
nginx -t
systemctl reload nginx
echo 'Nginx：完成'
step=启动容器
(cd "$ROOT/deploy" && docker compose --env-file app.env up -d --build)
echo '容器：完成'
step=部署自检
(cd "$ROOT/deploy" && docker compose --env-file app.env exec -T app python tools/check_deploy.py)
echo '部署自检：全部通过'
step=公网回调自检
(cd "$ROOT/deploy" && docker compose --env-file app.env exec -T app python tools/check_deploy.py --ping)
echo '--ping：HTTP 400，通过'
echo 'ADMIN_TOKEN 已写入 app.env，用 sudo grep ADMIN_TOKEN deploy/app.env 自己查看。'
echo '下一步：小程序后台添加 request 合法域名；真机 0.01 元付款并退款。'
