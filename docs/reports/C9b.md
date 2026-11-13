# C9b 交付报告

分支：agent/C9b-after-sale-detail　最后一个实现提交：23112a4（报告另有提交）

## 1. 步骤
| 卡上的步骤（照抄编号和第一句） | 做了 / 没做 | 在哪 |
|---|---|---|
| 售后详情、填写寄回单号 | 做了 | `miniprogram/features/after-sale/detail.*`、`return.*` |
| 只有“协商历史”一种进度表达 | 做了 | `detail.wxml` 的“协商历史 ›”和记录弹层 |
| 前台售后读取、撤销、寄回提交 | 做了（负责人追加授权） | `server/routes/my_after_sales.py`、`server/tests/test_my_after_sales.py` |
| 寄回地址后台配置与用户可见范围 | 做了（负责人追加授权） | `server/routes/return_address.py`、`my_after_sales.py` |
| 已退款再串一条、未通过处理说明 | 做了 | `detail-model.js::copyOrderDesign`、`detail.js::copyAgain`；未通过时只显示后端 `result` 灰字 |
| 撤销与寄回按钮文字从契约取 | 做了 | `server/contract.py`、导出的 `miniprogram/utils/contract.js` 和 `admin-web/src/contract.ts`；`detail.js` |

## 2. 验收
| 卡上的验收项（照抄） | 结果 | 证据 |
|---|---|---|
| 1. 用后台把售后单依次推到等待审核、请寄回、已退款：和稿 67、68、71 并排截图。 | 代码完成，未在开发者工具验证 | `miniprogram/tests/after-sale-detail.test.js::售后状态文字只来自契约`；需要负责人在开发者工具看：`features/after-sale/detail`，对照稿 s67、s68、s71 |
| 2. 等待审核时底部是次按钮“撤销申请”；点了升起确认弹层，确认后状态“已撤销”。截图两张。 | 代码完成，未在开发者工具验证 | `server/tests/test_my_after_sales.py::test_cancel_requested_or_reviewing_only`；需要负责人在开发者工具看：`features/after-sale/detail`，对照稿 s67 |
| 3. 请寄回时点“填写寄回单号”：稿 70；没填单号按钮是“先填单号”；提交后状态“等我们收到”。截图两张。 | 代码完成，未在开发者工具验证 | `server/tests/test_my_after_sales.py::test_return_requires_approved_return_type_and_both_fields`、`miniprogram/tests/after-sale-detail.test.js::寄回页校验后提交承运方和单号`；需要负责人在开发者工具看：`features/after-sale/return`，对照稿 s70 |
| 4. 寄回地址点“复制”有提示。截图。 | 代码完成，未在开发者工具验证 | `miniprogram/tests/after-sale-detail.test.js::寄回地址只从接口记录复制，未配置时不复制`；需要负责人在开发者工具看：`features/after-sale/return`，对照稿 s70 |
| 5. 页面上没有写死的到账天数。 | 做了 | `grep -nE '到账|[0-9]+天' miniprogram/features/after-sale/{detail,return}.{js,wxml}`：无输出 |
| 6. 09 清单：6（主按钮就是现在要做的那件事）；10；16；G1–G8。 | 代码完成，视觉待验 | `miniprogram/tests/after-sale-detail.test.js::详情页按售后编号读取本人记录并刷新`；需要负责人在开发者工具看：`features/after-sale/detail`、`features/after-sale/return`，对照稿 s67–s71 |

## 3. 改了的文件
`git diff --stat origin/integration/2026-11...HEAD`（含本报告）：
```
 admin-web/src/contract.ts                       |   4 +-
 docs/reports/C9b.md                             |  77 +++++++++++
 miniprogram/features/after-sale/detail-model.js |  39 ++++++
 miniprogram/features/after-sale/detail.js       |  39 +++++-
 miniprogram/features/after-sale/detail.json     |   4 +-
 miniprogram/features/after-sale/detail.wxml     |  15 +-
 miniprogram/features/after-sale/detail.wxss     |   4 +-
 miniprogram/features/after-sale/return.js       |  28 +++-
 miniprogram/features/after-sale/return.json     |   4 +-
 miniprogram/features/after-sale/return.wxml     |   9 +-
 miniprogram/features/after-sale/return.wxss     |   4 +-
 miniprogram/tests/after-sale-detail.test.js     | 104 ++++++++++++++
 miniprogram/utils/contract.js                   |   4 +-
 server/contract.py                              |   2 +
 server/routes/my_after_sales.py                 |  91 +++++++++++++
 server/routes/return_address.py                 |  41 ++++++
 server/tests/test_my_after_sales.py             | 174 ++++++++++++++++++++++++
 17 files changed, 623 insertions(+), 20 deletions(-)
```

## 4. 测试
```
python3 -m unittest discover -s server/tests 2>&1 | tail -15
Ran 589 tests in 118.911s
OK (skipped=7)
node --test miniprogram/tests/*.test.js 2>&1 | tail -15
ℹ tests 258
ℹ pass 258
ℹ fail 0
python3 kb/validate.py 2>&1 | tail -15
已填 200/200 种，有问题 0 条，缺 0 种
```
测试数：后端 开工前 581 → 现在 589；小程序 开工前 248 → 现在 258。没有改旧测试期望。
新增测试：
- `server/tests/test_my_after_sales.py` 的 8 个测试：用户登录要求、本人列表倒序和他人 404、详情安全字段、撤销状态限制、寄回状态及字段限制、寄回地址按状态披露、配置校验及元数据、缺权限账号 403。
- `miniprogram/tests/after-sale-detail.test.js` 的 10 个测试：契约状态文字、申请照片和联系电话、寄回动作、单号校验、页面绑定、详情读取、寄回提交、地址复制与空配置、再串一条复制订单、空珠子不跳转。

## 5. 自查（贴命令和输出）
- `git log --oneline origin/integration/2026-11..HEAD`：`a73afa6`、`23112a4`、`18d6a52`、`1260eee`、`9362a38`、`af74e2d`、`eb98ab8`、`ac4a539`、`7ae7550`、`fd55ea0`、`17fff68`、`52ca2fe`，提交说明均以 `C9b:` 开头。
- `grep -nE "#[0-9a-fA-F]{3,8}\\b|rgba?\\(" miniprogram/features/after-sale/detail.wxss miniprogram/features/after-sale/return.wxss`：无输出。
- `grep -rnE "new URL|URLSearchParams" miniprogram --include='*.js'`：无输出。
- `git diff --check origin/integration/2026-11...HEAD`：无输出。
- `git diff --name-only origin/integration/2026-11...HEAD -- server/app.py server/commerce.py`：无输出。

## 6. 没做 / 没验证 / 偏离卡片
经负责人同意，新增了 `server/routes/my_after_sales.py`、`server/tests/test_my_after_sales.py`、`server/routes/return_address.py`，并修改 `server/contract.py` 和两个自动生成的契约文件；没有改 `app.py`、`commerce.py`。寄回地址的后台填写页面没做，等后续卡；上线前负责人要在后台填好真实地址。客服入口等负责人定，未通过时只显示后端处理说明。订阅消息模板未提供，未接入退款通知。状态标题按负责人要求只用契约文字，可能与设计稿中的状态措辞不同。未在微信开发者工具验证，390px 和 320px 截图及稿 67–71 视觉比对待负责人完成。

## 7. 审核修改（打回后才有）
| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
