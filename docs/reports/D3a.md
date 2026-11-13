# D3a 交付报告

分支：`agent/D3a-admin-login`　最后一个代码提交：`fe6795e`（报告提交见分支 HEAD）

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 账号 + 密码两个空框 | 做了 | `admin-web/src/pages/login.tsx` 登录表单；`admin-web/src/App.tsx` 未登录时挂载该页 |
| 错了下面一行红字“账号或密码不对”，不说是哪个错 | 做了 | `login.tsx` 的登录失败分支；429 单独显示锁定时间 |
| 后端返回 `mustChangePassword` 时进改密码页（两次输入，至少 8 位） | 做了 | `server/app.py` 的 `admin_login` 返回值；`login.tsx` 的改密码表单 |
| 改完才能进后台 | 做了 | `login.tsx` 在 PUT `/api/admin/accounts/me/password` 成功后才调用 `onAuthenticated` |
| 初始化会话进入“创建第一个负责人” | 做了 | `login.tsx` 的 bootstrap 分流和 POST `/api/admin/accounts/bootstrap`；创建后退出初始化会话并回到账号登录 |

## 2. 验收

| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| A01：两个空框、无默认口令、错误信息不区分账号密码 | 构建通过，视觉待验 | `cd admin-web && npm run build`：`tsc --noEmit && vite build`、`✓ built in 1.89s`；需要负责人看：`/admin/`，对照稿 A01 |
| 初始化会话只得到 bootstrap=true、mustChangePassword=false、user=null | 通过 | `server/tests/test_admin_accounts.py::test_bootstrap_login_response_has_only_bootstrap_fields` |
| 临时密码登录必须改密，返回用户名字和角色，无密码哈希 | 通过 | `server/tests/test_admin_accounts.py::test_temporary_login_response_requires_password_change` |
| 普通账号登录可进后台，返回用户名字和角色，无密码哈希 | 通过 | `server/tests/test_admin_accounts.py::test_normal_login_response_can_enter_admin` |
| 初始化负责人、改密和登录三条前端路径 | 代码及构建通过，浏览器待验 | `login.tsx` 分流和两个表单；需要负责人看：`/admin/`，对照稿 A01 |

## 3. 改了的文件

`git diff --stat origin/integration/2026-11...HEAD`：

```text
 admin-web/src/App.tsx               |  28 +--------
 admin-web/src/pages/login.tsx       | 110 ++++++++++++++++++++++++++++++++++++
 docs/reports/D3a.md                 |  65 +++++++++++++++++++++
 server/app.py                       |   2 +-
 server/tests/test_admin_accounts.py |  32 +++++++++++
 5 files changed, 210 insertions(+), 27 deletions(-)
```

## 4. 测试

- `python3 -m unittest discover -s server/tests 2>&1 | tail -15`：`Ran 558 tests in 127.538s`；`OK (skipped=7)`。
- `node --test miniprogram/tests/*.test.js 2>&1 | tail -15`：`tests 168`；`pass 168`；`fail 0`。
- `python3 kb/validate.py 2>&1 | tail -15`：`已填 200/200 种，有问题 0 条，缺 0 种`。
- `cd admin-web && npm run build 2>&1 | tail -15`：`tsc --noEmit && vite build`；`✓ built in 1.89s`。
- 测试数：后端开工前 555 → 现在 558；小程序开工前 168 → 现在 168。
- 新测试：`test_bootstrap_login_response_has_only_bootstrap_fields` 验证初始化响应；`test_temporary_login_response_requires_password_change` 验证临时密码响应；`test_normal_login_response_can_enter_admin` 验证普通登录响应。三条都检查无 `passwordHash`。
- 原有测试未改。

## 5. 自查（贴命令和输出）

- `git merge origin/integration/2026-11`：`Already up to date.`。
- `git log --oneline origin/integration/2026-11..HEAD`：`fe6795e D3a: 审核 1 接入初始化负责人和改密分流`、`88f5996 D3a: 审核 1 返回三类后台登录状态并覆盖测试`、`066e9c9 D3a: 记录接口阻塞与全量测试`、`663bb34 D3a: 接入账号密码登录和首次改密页面`、`f9fdb55 D3a: 开工`。
- `git diff --check origin/integration/2026-11...HEAD`：无输出。
- 只改卡片允许的 `admin-web/src/App.tsx`、`admin-web/src/pages/login.tsx` 和本报告，以及负责人本轮许可的两份后端文件；未改尺寸规则、金额契约或依赖。
- `server/static/admin/shadcn-admin.*` 只用于本地构建验证，随后 `git restore`，未提交。

## 6. 没做 / 没验证 / 偏离卡片

- 经负责人同意，额外改了 `server/app.py` **仅 `admin_login` 最后一行返回值**；`server/tests/test_admin_accounts.py` **只新增三条测试**，未改原有测试。
- 未在浏览器人工对照 A01 验证登录、初始化和改密三种界面；构建通过不等于视觉验收。需负责人打开 `/admin/` 对照稿 A01。

## 7. 审核修改（打回后才有）

| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
| 1 | 登录响应补 `mustChangePassword`、`bootstrap`、精简 `user`；新增三种响应的后端测试；前端完成初始化负责人和改密分流。 | `88f5996`、`fe6795e` |
