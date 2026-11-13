# A8a 交付报告（待旧测试范围确认）

分支：agent/A8a-admin-accounts　最后一个实现提交：f1967e5

## 1. 步骤
| 卡上的步骤（照抄编号和第一句） | 做了 / 没做 | 在哪（文件:行，或提交 hash） |
|---|---|---|
| 1. 三张表（迁移里建） | 做了 | `server/migrations/m009_admin_accounts.py`，9bc794a |
| 2. 密码：负责人改为 `hashlib.pbkdf2_hmac(...)` | 做了 | `server/accounts.py`，f1967e5 |
| 3. 登录 `POST /api/admin/session` | 做了 | `server/app.py`，82cbbdc |
| 4. `admin_ok()` 改成查 `admin_sessions` | 做了 | `server/app.py`，82cbbdc |
| 5. 账号接口 | 做了 | `server/routes/admin_accounts.py`，8a046d1 |
| 6. 测试：14 第 5 节 B41、B42 的验收逐条一个用例 | 卡内定向测试通过，旧全量测试待更新 | `server/tests/test_admin_accounts.py`，f1967e5 |

## 2. 验收
| 卡上的验收项（照抄） | 结果 | 证据 |
|---|---|---|
| B41：账号表、角色表、权限点；密码哈希；首次登录改密码；停用即失效；最后一个负责人不能停用或降级 | 卡内通过 | `python3 -m unittest discover -s server/tests -p test_admin_accounts.py`：Ran 7 tests，OK |
| B42：登录改为账号 + 密码；会话进数据库；`ADMIN_TOKEN` 只能在没有任何账号时用来创建第一个负责人 | 卡内通过 | `test_admin_accounts.py::AdminAccountsTests::test_bootstrap_token_only_creates_first_owner` |

## 3. 改了的文件
```
 docs/reports/A8a.md                      |  71 +++++++++++++++
 server/accounts.py                       | 121 ++++++++++++++++++++++++++
 server/app.py                            |  38 ++++++---
 server/migrations/m009_admin_accounts.py |  23 ++++++
 server/routes/admin_accounts.py          | 108 +++++++++++++++++++++++++
 server/tests/test_admin_accounts.py      | 145 +++++++++++++++++++++++++++++++
 6 files changed, 494 insertions(+), 12 deletions(-)
```

## 4. 测试
开工前：后端 356 个、小程序 146 个。当前后端 363 个，小程序 146 个。卡内定向测试 `Ran 7 tests in 4.092s; OK`。

```
python3 -m unittest discover -s server/tests
Ran 363 tests in 32.395s
FAILED (failures=18, errors=1, skipped=7)

node --test miniprogram/tests/*.test.js
ℹ tests 146
ℹ pass 146
ℹ fail 0

python3 kb/validate.py
已填 200/200 种，有问题 0 条，缺 0 种
```
后端旧测试仍以 `X-Admin-Token` 当作已登录管理员，并把迁移数量写死；更新这些测试会越过 A8a 的“只能改”范围。小程序首次全量运行有一项计时测试失败，重跑通过。

新加测试：`test_default_pbkdf2_iterations` 检查默认迭代次数；`test_default_roles_and_password_pbkdf2` 检查角色及密码格式；`test_bootstrap_token_only_creates_first_owner` 检查初始化令牌边界；`test_session_persists_and_disabled_user_loses_access` 检查持久会话及停用；`test_temporary_password_forces_change` 检查首次改密码；`test_last_active_owner_cannot_disable_or_demote` 检查负责人保护；`test_five_failed_logins_lock_for_ten_minutes` 检查登录锁定。

## 5. 自查（贴命令和输出）
```
git log --oneline origin/integration/2026-11..HEAD
f1967e5 A8a: 审核 1 改用带版本迭代的 PBKDF2 密码
e7e9cab A8a: 记录密码哈希环境阻塞
2512ce2 A8a: 增加账号与登录验收测试
8a046d1 A8a: 增加账号管理接口
82cbbdc A8a: 接入数据库后台会话
9bc794a A8a: 建账号角色表与密码会话逻辑
2e554ca A8a: 开工
```
新增或改动接口：`POST /api/admin/session`，公开，返回 `ok` 和会话 cookie；`DELETE /api/admin/session`，cookie，返回 `ok`；`POST /api/admin/accounts/bootstrap`，初始化会话，返回 `user`；`GET /api/admin/accounts`，后台账号，返回 `users`、`roles`；`POST /api/admin/accounts`，负责人，返回 `user`、`temporaryPassword`；`PUT /api/admin/accounts/{id}`，负责人，返回 `user`；`POST /api/admin/accounts/{id}/disable`，负责人，返回 `user`；`POST /api/admin/accounts/{id}/reset-password`，负责人，返回 `temporaryPassword`；`PUT /api/admin/accounts/me/password`，后台账号，返回 `ok`。不涉及金额。

## 6. 没做 / 没验证 / 偏离卡片
卡上写的 scrypt 在 macOS 自带的 Python 3.9（LibreSSL）里没有，经负责人同意改成 `pbkdf2_sha256`。后端全量测试仍有 18 失败、1 错误：旧测试依赖 A8a 已取消的后台令牌登录，或写死新增迁移之前的版本/表数量。它们不在 A8a 允许文件范围，待负责人确认后修改。小程序和知识库全量通过。

## 7. 审核修改（打回后才有）
| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
| 1 | 按负责人新规定改用 PBKDF2，保存迭代次数并验证格式；新测试覆盖 600000 默认值 | f1967e5 |
