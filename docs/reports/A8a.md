# A8a 交付报告（暂停）

分支：agent/A8a-admin-accounts　最后一个实现提交：2512ce2

## 1. 步骤
| 卡上的步骤（照抄编号和第一句） | 做了 / 没做 | 在哪（文件:行，或提交 hash） |
|---|---|---|
| 1. 三张表（迁移里建） | 做了 | `server/migrations/m009_admin_accounts.py`，9bc794a |
| 2. 密码：`hashlib.scrypt(...)` | 已编码，当前环境不可执行 | `server/accounts.py`，9bc794a |
| 3. 登录 `POST /api/admin/session` | 已编码，受步骤 2 阻塞 | `server/app.py`，82cbbdc |
| 4. `admin_ok()` 改成查 `admin_sessions` | 做了 | `server/app.py`，82cbbdc |
| 5. 账号接口 | 已编码，受步骤 2 阻塞 | `server/routes/admin_accounts.py`，8a046d1 |
| 6. 测试：14 第 5 节 B41、B42 的验收逐条一个用例 | 已编写，未通过 | `server/tests/test_admin_accounts.py`，2512ce2 |

## 2. 验收
| 卡上的验收项（照抄） | 结果 | 证据 |
|---|---|---|
| B41：账号表、角色表、权限点；密码 scrypt 哈希；首次登录改密码；停用即失效；最后一个负责人不能停用或降级 | 阻塞 | `python3 -m unittest discover -s server/tests -p test_admin_accounts.py`：`hashlib.scrypt` 不存在，6 项中 5 失败、1 错误 |
| B42：登录改为账号 + 密码；会话进数据库；`ADMIN_TOKEN` 只能在没有任何账号时用来创建第一个负责人 | 阻塞 | 同上，创建负责人时报 500 |

## 3. 改了的文件
```
 server/accounts.py                       | 115 ++++++++++++++++++++++++++
 server/app.py                            |  38 ++++++---
 server/migrations/m009_admin_accounts.py |  23 ++++++
 server/routes/admin_accounts.py          | 108 +++++++++++++++++++++++++
 server/tests/test_admin_accounts.py      | 134 +++++++++++++++++++++++++++++++
 5 files changed, 406 insertions(+), 12 deletions(-)
```

## 4. 测试
开工前：后端 356 个、小程序 146 个。当前新增 6 个后端用例；定向测试 `Ran 6 tests in 3.694s; FAILED (failures=5, errors=1)`。其中直接错误为 `AttributeError: module 'hashlib' has no attribute 'scrypt'`。三条全量检查尚未执行，待阻塞解决后运行。

新加测试：`test_default_roles_and_password_scrypt` 检查角色及密码；`test_bootstrap_token_only_creates_first_owner` 检查初始化令牌边界；`test_session_persists_and_disabled_user_loses_access` 检查持久会话及停用；`test_temporary_password_forces_change` 检查首次改密码；`test_last_active_owner_cannot_disable_or_demote` 检查负责人保护；`test_five_failed_logins_lock_for_ten_minutes` 检查登录锁定。

## 5. 自查（贴命令和输出）
```
git log --oneline origin/integration/2026-11..HEAD
2512ce2 A8a: 增加账号与登录验收测试
8a046d1 A8a: 增加账号管理接口
82cbbdc A8a: 接入数据库后台会话
9bc794a A8a: 建账号角色表与密码会话逻辑
2e554ca A8a: 开工
```
新增或改动接口：`POST /api/admin/session`，公开，返回 `ok` 和会话 cookie；`DELETE /api/admin/session`，cookie，返回 `ok`；`POST /api/admin/accounts/bootstrap`，初始化会话，返回 `user`；`GET /api/admin/accounts`，后台账号，返回 `users`、`roles`；`POST /api/admin/accounts`，负责人，返回 `user`、`temporaryPassword`；`PUT /api/admin/accounts/{id}`，负责人，返回 `user`；`POST /api/admin/accounts/{id}/disable`，负责人，返回 `user`；`POST /api/admin/accounts/{id}/reset-password`，负责人，返回 `temporaryPassword`；`PUT /api/admin/accounts/me/password`，后台账号，返回 `ok`。不涉及金额。

## 6. 没做 / 没验证 / 偏离卡片
当前 `/usr/bin/python3` 是 3.9.6，`hasattr(hashlib, "scrypt")` 为 `False`。卡片指定的 `hashlib.scrypt` 无法在此环境执行，已停下来问；正式验收及三条全量检查未完成。

## 7. 审核修改（打回后才有）
| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
