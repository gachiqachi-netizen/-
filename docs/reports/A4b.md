# A4b 交付报告（暂停待确认）

分支：agent/A4b-order-address　最后一个代码提交：ac9a6a2

## 1. 步骤
| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 1. 单个订单 | 做了 | f65ce2f、ac9a6a2 |
| 2. 改地址的业务函数 | 做了 | 1f65d82 |
| 3. user_api | 做了 | 1cd4e1d |
| 4. app.py 的 do_POST | 做了 | 857f83f |
| 5. 契约与导出 | 做了 | 732fc04 |
| 6. 测试 | 新测试完成；全量未过 | ac9a6a2；旧测试断言冲突待确认 |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 三条测试全过 | 未达到 | 后端 Ran 246 tests，FAILED (failures=2, skipped=7)；小程序 129/129；知识库 200/200 |

## 3. 改了的文件
```
 admin-web/src/contract.ts          |   3 +-
 miniprogram/utils/contract.js      |   3 +-
 server/app.py                      |  16 +++++
 server/commerce.py                 |  32 ++++++++++
 server/contract.py                 |   1 +
 server/tests/test_order_address.py | 126 +++++++++++++++++++++++++++++++++++++
 server/user_api.py                 |  19 +++++-
 7 files changed, 197 insertions(+), 3 deletions(-)
```
契约三个文件由卡片第 5 步明确要求；两个前端文件由导出脚本生成。

## 4. 测试
开工前：后端 238 个（按新增 8 个与目前 246 个计算；开工前命令只截取末 3 行，未保留 Ran 行），小程序 129 个。现在：后端 246 个，小程序 129 个。

```
python3 -m unittest server.tests.test_order_address
Ran 8 tests in 0.557s
OK

python3 -m unittest discover -s server/tests
Ran 246 tests in 10.025s
FAILED (failures=2, skipped=7)

node --test miniprogram/tests/*.test.js
ℹ tests 129
ℹ pass 129
ℹ fail 0

python3 kb/validate.py
已填 200/200 种，有问题 0 条，缺 0 种
```
新增测试：test_own_order_detail_hides_internal_fields（本人详情及内部字段）；test_other_and_missing_order_are_404（越权与不存在）；test_login_required（未登录）；test_address_change_in_three_pre_ship_states（三种未发货状态、历史脱敏与审计）；test_shipped_and_after_sale_cannot_change（发货、售后、完成）；test_other_owner_cannot_change（越权改地址）；test_invalid_phone_is_400（手机号格式）；test_history_is_capped（历史上限）。

## 5. 自查（贴命令和输出）
`git log --oneline origin/integration/2026-11..HEAD`：所有 7 个提交均以 `A4b:` 开头。新增接口：GET `/api/my/orders/{no}` 需要用户登录，返回 `public_order`；POST `/api/my/orders/{no}/address` 需要用户登录及订单归属，返回更新后的 `public_order`。无金额改动。

## 6. 没做 / 没验证 / 偏离卡片
旧测试 `test_http.py::test_customer_order_contract_and_cancel_authorization_over_http` 与 `test_order_user_contract.py::test_public_order_has_normalized_state_and_never_advertises_pay` 断言 `allowedActions == ['cancel_order', 'reorder']`，与卡片新增 `edit_address` 冲突。两文件不在可改范围，等待负责人决定。未在微信开发者工具验证。未开 PR。

## 7. 审核修改（打回后才有）
无。
