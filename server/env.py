"""运行环境（development / trial / production）的单一来源定义。

所有运行分支的开关都应从这里读取，避免多处重复判断导致回退路径不一致。

环境推导优先级：
1. ENV 显式指定（只接受 development / trial / production，非空未知值启动失败）
2. DATABASE_URL 存在 → production
3. ALLOW_PUBLIC_BIND=1 → trial
4. 其余 → development
"""
import os

ENV_DEVELOPMENT = "development"
ENV_TRIAL = "trial"
ENV_PRODUCTION = "production"

# 兼容旧命名（dev/experience/prod），供既有 is_dev/is_experience/is_prod 调用继续工作
ENV_DEV = ENV_DEVELOPMENT
ENV_EXPERIENCE = ENV_TRIAL
ENV_PROD = ENV_PRODUCTION

VALID_ENVS = (ENV_DEVELOPMENT, ENV_TRIAL, ENV_PRODUCTION)


def _explicit_env():
    value = (os.environ.get("ENV") or "").strip().lower()
    if not value:
        return None
    if value not in VALID_ENVS:
        raise ValueError("ENV 必须是 development/trial/production 之一")
    return value


def env_name():
    explicit = _explicit_env()
    if explicit:
        return explicit
    if os.environ.get("DATABASE_URL"):
        return ENV_PRODUCTION
    if os.environ.get("ALLOW_PUBLIC_BIND") == "1":
        return ENV_TRIAL
    return ENV_DEVELOPMENT


def is_dev():
    return env_name() == ENV_DEVELOPMENT


def is_experience():
    return env_name() == ENV_TRIAL


def is_prod():
    return env_name() == ENV_PRODUCTION


def demo_orders_allowed():
    """演示下单只在本地 development 环境开放；trial/production 即使设置 DEMO_ORDERS 也强制关闭。"""
    return is_dev() and os.environ.get("DEMO_ORDERS") == "1"


def ai_fallback_allowed():
    """AI 降级是否允许：显式 AI_ALLOW_FALLBACK=1 时允许；否则仅 development 环境默认允许。

    production/trial 未显式设置 AI_ALLOW_FALLBACK=1 时不允许静默降级。
    """
    if os.environ.get("AI_ALLOW_FALLBACK") == "1":
        return True
    return is_dev()


def require_admin_token():
    """非本地环境必须设置 ADMIN_TOKEN，否则启动即失败（避免空口令后台）。"""
    if env_name() in (ENV_PRODUCTION, ENV_TRIAL) and not os.environ.get("ADMIN_TOKEN"):
        raise SystemExit("生产/线上体验环境必须设置 ADMIN_TOKEN，不能以空口令启动")


def ensure_dev_login_local():
    """开发测试登录只签 dev: 前缀的本地账号，绝不能出现在生产数据库上。"""
    if os.environ.get("DEV_LOGIN") == "1" and os.environ.get("DATABASE_URL"):
        raise SystemExit("DEV_LOGIN=1 只能用于本地开发，不能和 DATABASE_URL 同时设置")


def _require_postgres(current):
    url = (os.environ.get("DATABASE_URL") or "").strip()
    if not url or not url.lower().startswith(("postgres://", "postgresql://")):
        raise SystemExit("trial/production 必须使用 PostgreSQL")


def _require_wechat_creds(current):
    if not (os.environ.get("WECHAT_APP_ID") and os.environ.get("WECHAT_APP_SECRET")):
        raise SystemExit("trial/production 必须配置微信内容安全凭证")


def validate_startup():
    """启动即做的快速失败校验；错误信息只描述问题，不暴露密钥、数据库地址或堆栈。"""
    try:
        current = env_name()
    except ValueError as e:
        raise SystemExit(str(e))
    ensure_dev_login_local()
    require_admin_token()
    if current in (ENV_TRIAL, ENV_PRODUCTION):
        _require_postgres(current)
        _require_wechat_creds(current)
    if current == ENV_PRODUCTION:
        if os.environ.get("DEV_LOGIN") == "1":
            raise SystemExit("生产环境禁止启用 DEV_LOGIN")
        if os.environ.get("DEMO_ORDERS") == "1":
            raise SystemExit("生产环境禁止启用演示下单 DEMO_ORDERS")
