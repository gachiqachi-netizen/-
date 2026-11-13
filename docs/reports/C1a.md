# C1a 交付报告

分支：agent/C1a-login-page　最后一个代码提交：05791f0

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 两个手机号按钮都用微信 `getPhoneNumber` | 做了 | `miniprogram/pages/login/login.wxml` |
| 拿到 `e.detail.code` 调 `POST /api/auth/phone` | 做了 | `miniprogram/pages/login/login.js::onPhone`、`miniprogram/utils/auth.js::bindPhone` |
| 协议默认不勾，未勾时升起 `c-sheet` | 做了 | `miniprogram/pages/login/login.wxml`、`.js` |
| `auth.goLogin(next)` 保存继续动作，成功自动执行 | 做了并补两种继续动作测试；旧调用方由 C7a 接入 | `miniprogram/utils/auth.js` |
| 拒绝手机号时显示灰字，不弹窗 | 做了 | `miniprogram/pages/login/login.js::onPhone` |
| 逛、自己串等不触发登录 | 本卡未改这些入口 | 需要负责人在开发者工具看 |
| develop 版使用 `dev-` 假 code | 做了 | `miniprogram/pages/login/login.js::onPhone` |

## 2. 验收

| 05 D11 验收项 | 本卡结果 | 证据 / 后续 |
|---|---|---|
| 1. 清缓存到提交才进登录；允许后自动提交订单 | 本卡完成登录页及 `submitOrder` 自动执行；整条下单链路等 C7a 接入 | `miniprogram/tests/auth.test.js` 验证 `next` 进入页面参数；`miniprogram/tests/login-page.test.js::submitOrder next runs the previous page submit after returning`；需要负责人在开发者工具看：`pages/login/login`，对照稿 s77 |
| 2. 未勾协议弹层；同意并继续一次拉起微信弹窗 | 本卡完成页面和两处微信手机号按钮；原生弹窗待实机看 | `login-page.test.js::both consent paths use the WeChat phone button and page starts unchecked`、`unchecked phone action opens agreement sheet`；需要负责人在开发者工具看：`pages/login/login`，对照稿 s78–s79 |
| 3. 拒绝提示；暂不登录返回且订单内容保留 | 本卡完成拒绝提示和返回；订单内容保持等 C7a 验证 | `login-page.test.js::denial stays on page and shows retry text`；需要负责人在开发者工具看：`pages/login/login`，对照稿 s77 |
| 4. `grep` 限制“登录”文案位置 | 本卡登录页文案已按稿；全仓旧入口文案等各页面卡清理 | `grep -rn '登录' miniprogram --include='*.wxml' --include='*.js'` 仍有旧 `pages/order`、`features/orders` 等；需要负责人在开发者工具看：`pages/login/login`，对照稿 s77 |
| 5. 断网提交时指定红字提示 | 等 C7a 新确认订单页接入 | 本卡不改下单页；需要负责人在开发者工具看：C7a 的确认订单页，对照稿 s45–s50 |

## 3. 改了的文件

`git diff --stat origin/integration/2026-11...HEAD`：

```
 docs/reports/C1a.md                  | 65 +++++++++++++++++++++
 miniprogram/pages/login/login.js     |  53 ++++++++++++++----
 miniprogram/pages/login/login.json   |   8 ++-
 miniprogram/pages/login/login.wxml   |  39 +++++++++++---
 miniprogram/pages/login/login.wxss   |  21 ++++++--
 miniprogram/tests/auth.test.js       |  10 +++-
 miniprogram/tests/login-page.test.js | 102 +++++++++++++++++++++++++++++++++++
 miniprogram/utils/auth.js            |  30 ++++++++++-
 8 files changed, 303 insertions(+), 25 deletions(-)
```

## 4. 测试

- `python3 -m unittest discover -s server/tests 2>&1 | tail -15`：`Ran 531 tests in 81.317s`；`OK (skipped=7)`。
- `node --test miniprogram/tests/*.test.js 2>&1 | tail -15`：`tests 153`；`pass 153`；`fail 0`。
- `python3 kb/validate.py 2>&1 | tail -15`：`已填 200/200 种，有问题 0 条，缺 0 种`。
- 测试数：后端开工前 531 → 现在 531；小程序 146 → 153。
- 新测试：`login-page.test.js` 7 个，覆盖两个微信按钮、协议弹层、拒绝提示、自动提交、自动跳转、成功绑定、develop 假 code；`auth.test.js` 追加 `goLogin(next)` 入页面参数及不安全目标拒绝断言。未改旧测试期望。

## 5. 自查（贴命令和输出）

`git diff --check origin/integration/2026-11...HEAD`：无输出。`grep -nE '#[0-9a-fA-F]{3,8}\\b|rgba?\\(' miniprogram/pages/login/login.wxss`：无输出。`grep -rnE 'new URL|URLSearchParams' miniprogram --include='*.js'`：无输出。

`git log --oneline origin/integration/2026-11..HEAD`：`05791f0 C1a: 审核 1 验证两种继续动作和拒绝提示`；`4fc2794 C1a: 手机号登录页与协议弹层`；`d68701f C1a: 手机号绑定与登录后续动作`；`7579daa C1a: 开工`。

## 6. 没做 / 没验证 / 偏离卡片

旧下单页的 `goLogin` 没有传 `next`，由 C7a 接入；经负责人同意不在本卡修改。旧页面的“登录”文案及下单断网提示同样留给页面卡。未在微信开发者工具或真机验证原生手机号弹窗及页面布局；需要负责人看 `pages/login/login`，对照稿 s77–s79。

## 7. 审核修改（打回后才有）

| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
| 1 | 按 B 范围补 submitOrder、navigate、拒绝授权的 node 测试；明确 C7a 接入边界 | 05791f0 |
