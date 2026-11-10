"""运行环境（dev / experience / prod）的单一来源定义。

所有运行分支的开关都应从这里读取，避免多处重复判断导致回退路径不一致。

环境推导优先级：
1. ENV 显式指定（dev / experience / prod，兼容 development / production / local 别名）
2. DATABASE_URL 存在 → prod
3. ALLOW_PUBLIC_BIND=1 → experience
4. 其余 → dev
"""
import os

ENV_DEV = "dev"
ENV_EXPERIENCE = "experience"
ENV_PROD = "prod"

_ENV_ALIASES = {
    "development": ENV_DEV,
    "local": ENV_DEV,
    "production": ENV_PROD,
}


def _explicit_env():
    value = (os.environ.get("ENV") or "").strip().lower()
    value = _ENV_ALIASES.get(value, value)
    return value if value in (ENV_DEV, ENV_EXPERIENCE, ENV_PROD) else None


def env_name():
    explicit = _explicit_env()
    if explicit:
        return explicit
    if os.environ.get("DATABASE_URL"):
        return ENV_PROD
    if os.environ.get("ALLOW_PUBLIC_BIND") == "1":
        return ENV_EXPERIENCE
    return ENV_DEV


def is_dev():
    return env_name() == ENV_DEV


def is_experience():
    return env_name() == ENV_EXPERIENCE


def is_prod():
    return env_name() == ENV_PROD


def demo_orders_allowed():
    """演示下单只在本地 dev 环境开放；experience/prod 即使设置 DEMO_ORDERS 也强制关闭。"""
    return is_dev() and os.environ.get("DEMO_ORDERS") == "1"


def require_admin_token():
    """非本地环境必须设置 ADMIN_TOKEN，否则启动即失败（避免空口令后台）。"""
    if env_name() in (ENV_PROD, ENV_EXPERIENCE) and not os.environ.get("ADMIN_TOKEN"):
        raise SystemExit("生产/线上体验环境必须设置 ADMIN_TOKEN，不能以空口令启动")


def ensure_dev_login_local():
    """开发测试登录只签 dev: 前缀的本地账号，绝不能出现在生产数据库上。"""
    if os.environ.get("DEV_LOGIN") == "1" and os.environ.get("DATABASE_URL"):
        raise SystemExit("DEV_LOGIN=1 只能用于本地开发，不能和 DATABASE_URL 同时设置")


def validate_startup():
    """启动即做的快速失败校验；错误信息只描述问题，不暴露密钥、数据库地址或堆栈。"""
    ensure_dev_login_local()
    require_admin_token()
    if env_name() == ENV_PROD:
        if os.environ.get("DEV_LOGIN") == "1":
            raise SystemExit("生产环境禁止启用 DEV_LOGIN")
        if os.environ.get("DEMO_ORDERS") == "1":
            raise SystemExit("生产环境禁止启用演示下单 DEMO_ORDERS")
