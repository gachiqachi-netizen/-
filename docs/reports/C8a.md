# C8a 交付报告

分支：agent/C8a-address-book　最后一个代码提交：6de0d75

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| D29：地址列表、选择模式、用微信地址 | 做了 | `miniprogram/features/address/address.js`、`address.wxml`，4e7e5bd |
| D29：新增和编辑表单（列表行，不画输入框）、默认 | 做了 | `miniprogram/features/address-edit/address-edit.js`、`address-edit.wxml`，fc1d622 |
| D29：删除可撤销；表单校验抽成纯函数 | 做了 | `address-edit.js`、`validation.js`，fc1d622 |
| D29：订单发货前改地址 | 做了 | `address-edit.js`，fc1d622、0081ecb |

## 2. 验收

| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 1. 列表和稿 73、表单和稿 74 并排截图 | 代码完成，视觉待验 | 需要负责人在开发者工具看：`features/address/address` 对照稿 s73；`features/address-edit/address-edit` 对照稿 s74 |
| 2. 手机号填 10 位点保存：这一行下面红字“手机号是 11 位数字”，滚到这一行 | 逻辑测试通过，视觉待验 | `miniprogram/tests/address-pages.test.js::invalid phone stays on edit page and scrolls to phone row`；需要负责人在开发者工具看：`features/address-edit/address-edit` 对照稿 s74 |
| 3. 从确认订单进来点一行：返回并带回这个地址 | 逻辑测试通过，页面待验 | `miniprogram/tests/address-pages.test.js::address selection returns the selected row through the opener channel`；需要负责人在开发者工具看：`features/address/address?mode=select` 对照稿 s73 |
| 4. 删除后提示“已删除 / 撤销” | 逻辑测试通过，页面待验 | `miniprogram/tests/address-pages.test.js::address deletion offers undo and recreates the deleted address`；需要负责人在开发者工具看：`features/address-edit/address-edit` 对照稿 s74 |
| 5. 09 清单：12、13、G1–G8 | 待负责人视觉验收 | 需要负责人在开发者工具看：`features/address/address`、`features/address-edit/address-edit` 对照稿 s73、s74 |

## 3. 改了的文件

```
 docs/reports/C8a.md                                | 66 +++++++++++++++
 miniprogram/features/address-edit/address-edit.js  | 98 +++++++++++++++++++++-
 .../features/address-edit/address-edit.json        |  4 +-
 .../features/address-edit/address-edit.wxml        | 21 ++++-
 .../features/address-edit/address-edit.wxss        |  4 +-
 miniprogram/features/address-edit/validation.js    | 24 ++++++
 miniprogram/features/address/address.js            | 49 ++++++++++-
 miniprogram/features/address/address.json          |  4 +-
 miniprogram/features/address/address.wxml          | 21 ++++-
 miniprogram/features/address/address.wxss          |  4 +-
 miniprogram/tests/address-pages.test.js            | 70 ++++++++++++++++
 miniprogram/tests/address-validation.test.js       | 24 ++++++
 12 files changed, 369 insertions(+), 20 deletions(-)
```
报告文件：`docs/reports/C8a.md`。测试文件依据 D29 的“和测试”要求新增。

## 4. 测试

- `python3 -m unittest discover -s server/tests`：开工前基线 `Ran 563 tests in 219.323s; FAILED (errors=8, skipped=7)`，同机多组测试并发时 HTTP 请求超时；第一次最终全量超过 3 分钟上限中止；第二次 `Ran 563 tests in 133.040s; FAILED (errors=1, skipped=7)`，AI 方案接口 3 秒 HTTP 超时；第三次单机复跑 `Ran 563 tests in 131.392s; OK (skipped=7)`。
- `node --test miniprogram/tests/*.test.js`：`tests 222; pass 222; fail 0`。
- `python3 kb/validate.py`：`已填 200/200 种，有问题 0 条，缺 0 种`。
- 测试数：后端 563 → 563；小程序 215 → 222。
- 本卡新增测试：`address-validation.test.js` 3 项，覆盖缺字段、10 位手机号、合法地址归一化；`address-pages.test.js` 4 项，覆盖选中返回、删除撤销、错误行滚动、20 条上限。

## 5. 自查（贴命令和输出）

- `git log --oneline origin/integration/2026-11..HEAD`：所有提交均以 `C8a:` 开头（见最终自查输出）。
- `grep -nE "#[0-9a-fA-F]{3,8}\\b|rgba?\\(" miniprogram/features/address/address.wxss miniprogram/features/address-edit/address-edit.wxss`：无输出。
- `grep -rnE "new URL|URLSearchParams" miniprogram --include=*.js`：无输出。
- `git diff --check origin/integration/2026-11...HEAD`：无输出。

## 6. 没做 / 没验证 / 偏离卡片

- 未在微信开发者工具或真机验证列表、表单、地区选择、微信地址权限和交互截图。
- 用户地址接口要求 Bearer 会话；页面调用现有 `auth.authorized`（内部用 `utils/api.js` 登录），未改公共请求文件。

## 7. 审核修改（打回后才有）

| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
