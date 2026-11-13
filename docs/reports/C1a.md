# C1a 交付报告

分支：agent/C1a-login-page　最后一个代码提交：4fc2794

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 两个手机号按钮都用微信 `getPhoneNumber` | 做了 | `miniprogram/pages/login/login.wxml` |
| 拿到 `e.detail.code` 调 `POST /api/auth/phone` | 做了 | `miniprogram/pages/login/login.js::onPhone`、`miniprogram/utils/auth.js::bindPhone` |
| 协议默认不勾，未勾时升起 `c-sheet` | 做了 | `miniprogram/pages/login/login.wxml`、`.js` |
| `auth.goLogin(next)` 保存继续动作，成功自动执行 | 做了函数；旧调用方尚未接入 | `miniprogram/utils/auth.js` |
| 拒绝手机号时显示灰字，不弹窗 | 做了 | `miniprogram/pages/login/login.js::onPhone` |
| 逛、自己串等不触发登录 | 本卡未改这些入口 | 需要负责人在开发者工具看 |
| develop 版使用 `dev-` 假 code | 做了 | `miniprogram/pages/login/login.js::onPhone` |

## 2. 验收

| 05 D11 验收项 | 结果 | 证据 |
|---|---|---|
| 1. 从首页到提交才进登录，成功后自动完成订单 | 未完成完整链路 | 旧 `pages/order/order.js::goLogin` 不传 `next`；需改卡外文件 |
| 2. 未勾协议弹层，点同意并继续拉起手机号弹窗 | 代码与自动测试通过；视觉待看 | `miniprogram/tests/login-page.test.js::unchecked phone action opens agreement sheet`；需要负责人看：`pages/login/login`，对照稿 s78 |
| 3. 拒绝时文案、暂不登录返回且内容仍在 | 拒绝与返回逻辑已做；真机待看 | `miniprogram/tests/login-page.test.js::denial stays on page and shows retry text`；需要负责人看：`pages/login/login`，对照稿 s77 |
| 4. `grep` 限制“登录”文案位置 | 未通过全仓检查 | 旧订单及订单列表页面仍有“去登录”等文案，不在本卡范围 |
| 5. 断网提交时显示指定错误 | 未完成 | 错误位置在旧 `pages/order/order.js`，不在本卡范围 |

## 3. 改了的文件

当前 `git diff --stat origin/integration/2026-11...HEAD`：

```
 miniprogram/pages/login/login.js     | 53 +++++++++++++++++++------
 miniprogram/pages/login/login.json   |  8 +++-
 miniprogram/pages/login/login.wxml   | 39 ++++++++++++++----
 miniprogram/pages/login/login.wxss   | 21 ++++++++--
 miniprogram/tests/auth.test.js       | 10 ++++-
 miniprogram/tests/login-page.test.js | 77 ++++++++++++++++++++++++++++++++++++
 miniprogram/utils/auth.js            | 30 +++++++++++++-
 7 files changed, 213 insertions(+), 25 deletions(-)
```

## 4. 测试

- `python3 -m unittest discover -s server/tests 2>&1 | tail -15`：`Ran 531 tests in 72.981s`；`OK (skipped=7)`。
- `node --test miniprogram/tests/*.test.js 2>&1 | tail -15`：`tests 151`；`pass 151`；`fail 0`。
- `python3 kb/validate.py 2>&1 | tail -15`：`已填 200/200 种，有问题 0 条，缺 0 种`。
- 测试数：后端开工前 531 → 现在 531；小程序 146 → 151。
- 新测试：`login-page.test.js` 5 个，覆盖两个微信按钮、默认未勾与弹层、拒绝、成功继续动作、develop 假 code；`auth.test.js` 追加 `goLogin(next)` 参数传递与不安全地址拒绝断言。未改旧测试期望。

## 5. 自查（贴命令和输出）

`git diff --check origin/integration/2026-11...HEAD`：无输出。`grep -nE '#[0-9a-fA-F]{3,8}\\b|rgba?\\(' miniprogram/pages/login/login.wxss`：无输出。`grep -rnE 'new URL|URLSearchParams' miniprogram --include='*.js'`：无输出。

`git log --oneline origin/integration/2026-11..HEAD`：`4fc2794 C1a: 手机号登录页与协议弹层`；`d68701f C1a: 手机号绑定与登录后续动作`；`7579daa C1a: 开工`。

## 6. 没做 / 没验证 / 偏离卡片

D11 验收 1、4、5 依赖卡外旧页面，本卡未改。未在微信开发者工具或真机验证；需要负责人看 `pages/login/login`，对照稿 s77–s79。未截图。

## 7. 审核修改（打回后才有）

无。
