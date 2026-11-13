# D3a 交付报告（待负责人确认接口）

分支：`agent/D3a-admin-login`　最后一个代码提交：`663bb34`（报告提交见分支 HEAD）

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 账号 + 密码两个空框 | 做了 | `admin-web/src/pages/login.tsx:55` |
| 错了下面一行红字“账号或密码不对”，不说是哪个错 | 做了 | `admin-web/src/pages/login.tsx:31`、`:65` |
| 后端返回 `mustChangePassword` 时进改密码页（两次输入，至少 8 位） | 页面和请求已做，接口未打通 | `admin-web/src/pages/login.tsx:27`、`:37`、`:50`；当前 `POST /api/admin/session` 仅返回 `{ok:true}`，见第 6 节 |
| 改完才能进后台 | 前端条件流已做，当前接口无法触发 | `admin-web/src/pages/login.tsx:46`；需后端返回标志后联调 |

## 2. 验收

| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| A01：两个空框、无默认口令、错误信息不区分账号密码 | 代码及构建通过，视觉未验证 | `cd admin-web && npm run build`：`tsc --noEmit && vite build`、`✓ built in 2.88s`；需要负责人看：`/admin/`，对照稿 A01 |
| 首次改密需两次输入且至少 8 位 | 代码完成，接口未打通 | `login.tsx:37`、`:58`；需要负责人看：`/admin/`，对照稿 A01；缺登录响应标志，无法进入改密页联调 |
| 改密成功才能进入后台 | 未端到端验证 | `login.tsx:46`；后端响应差异见第 6 节 |

## 3. 改了的文件

`git diff --stat origin/integration/2026-11...HEAD`（含本报告）：

```text
 admin-web/src/App.tsx         | 28 ++--------------
 admin-web/src/pages/login.tsx | 74 +++++++++++++++++++++++++++++++++++++++++++
 docs/reports/D3a.md           | 59 ++++++++++++++++++++++++++++++++++
 3 files changed, 135 insertions(+), 26 deletions(-)
```

## 4. 测试

- `python3 -m unittest discover -s server/tests 2>&1 | tail -15`：`Ran 555 tests in 131.556s`；`OK (skipped=7)`。
- `node --test miniprogram/tests/*.test.js 2>&1 | tail -15`：`tests 168`；`pass 168`；`fail 0`。
- `python3 kb/validate.py 2>&1 | tail -15`：`已填 200/200 种，有问题 0 条，缺 0 种`。
- `cd admin-web && npm run build 2>&1 | tail -15`：`tsc --noEmit && vite build`；`✓ built in 2.88s`。
- 测试数：后端开工前 555 → 现在 555；小程序开工前 168 → 现在 168。
- 本卡未新增自动化测试：可改范围限定为登录页和 App 登录页挂载段，需负责人许可测试文件后补交互测试。

## 5. 自查（贴命令和输出）

- `git log --oneline origin/integration/2026-11..HEAD`：`663bb34 D3a: 接入账号密码登录和首次改密页面`、`f9fdb55 D3a: 开工`。
- `git diff --check origin/integration/2026-11...HEAD`：无输出。
- 范围：只改 `admin-web/src/App.tsx` 登录页显示段、新建 `admin-web/src/pages/login.tsx` 和本报告。
- 打包文件经 `git restore` 恢复，未提交 `server/static/admin/shadcn-admin.*`。

## 6. 没做 / 没验证 / 偏离卡片

- **阻塞**：卡片写“后端返回 `mustChangePassword` 时进改密码页”；当前 `server/app.py:294` 的登录响应只有 `{ok: True}`，首次登录和普通登录对前端不可区分。后端又在 `server/app.py:242` 对首次改密账号拒绝其他后台接口，因此前端登录后无法进入改密页。修改后端超出本卡“只能改”，需负责人决定是否授权调整登录响应，或指定已有接口。
- 未在浏览器人工验收 A01，也未联调首次改密。构建通过仅证明类型和打包成功。
- 尚未完成 D3a，等待接口口径确认后继续；本报告为停下来问时的进度记录。

## 7. 审核修改（打回后才有）

| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
| 无 | 无 | 无 |
