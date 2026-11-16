"""AI feature settings; credentials stay exclusively in the server environment."""
import os
from datetime import datetime, timezone

import ai_logs

PROVIDERS = {
    'zerone': ('ZERONE_AGENT_API_KEY', 'ZERONE_AGENT_URL'),
    'claude': ('ANTHROPIC_API_KEY',),
    'openai': ('AI_API_KEY', 'AI_BASE_URL'),
}
DEFAULT = {'designEnabled': True, 'photoEnabled': True, 'provider': '',
           'model': '', 'visionModel': '', 'updatedBy': '', 'updatedAt': ''}


def configured():
    result = {}
    for name, vars_ in PROVIDERS.items():
        key = os.environ.get(vars_[0], '')
        enabled = bool(key and all(os.environ.get(v) for v in vars_[1:]))
        result[name] = {'configured': enabled, 'keyLast4': key[-4:] if enabled else ''}
    return result


def current(db=None):
    db = db or ai_logs._db
    saved = db.get('settings', 'ai') if db is not None else None
    return {**DEFAULT, **(saved or {})}


def validate(data, db=None):
    if not isinstance(data, dict):
        raise ValueError('请提供 AI 设置')
    allowed = {'designEnabled', 'photoEnabled', 'provider', 'model', 'visionModel'}
    if set(data) - allowed:
        raise ValueError('AI 设置包含未知字段')
    result = {k: current(db)[k] for k in allowed}
    result.update(data)
    for key in ('designEnabled', 'photoEnabled'):
        if type(result[key]) is not bool:
            raise ValueError(key + ' 必须是布尔值')
    for key in ('provider', 'model', 'visionModel'):
        if not isinstance(result[key], str) or len(result[key]) > 100:
            raise ValueError(key + ' 不正确')
        result[key] = result[key].strip()
    if result['provider'] and not configured().get(result['provider'], {}).get('configured'):
        raise ValueError('所选服务商未配置密钥')
    return result


def save(db, data, actor):
    from commerce import audit
    saved = validate(data, db)
    saved.update(updatedBy=actor, updatedAt=datetime.now(timezone.utc).isoformat())
    db.put('settings', 'ai', saved)
    audit(db, actor, 'update_ai_settings', 'settings', 'ai',
          f"服务商 {saved['provider'] or '环境默认'}；AI 配 {'开' if saved['designEnabled'] else '关'}；拍照 {'开' if saved['photoEnabled'] else '关'}")
    return saved
