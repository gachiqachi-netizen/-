# A8c 交付报告

分支：agent/A8c-mask　最后一个实现提交：0949a93

## 1. 步骤
| 卡上的步骤（照抄编号和第一句） | 做了 / 没做 | 在哪（文件:行，或提交 hash） |
|---|---|---|
| 没有 `view_full_contact` 权限时手机号变 `138****8000`、地址只保留到区县加 `***` | 做了 | `server/accounts.py` 的 `mask_order`，027c64f |
| 没有 `view_cost` 时去掉 `costFen` | 做了 | `server/accounts.py` 的 `mask_order`，027c64f |
| `POST /api/admin/orders/{no}/reveal` 返回全号并写操作记录 | 做了 | `server/routes/admin_reveal.py`，66ce395；后台路由统一记录写操作 |
| 测试：运营、做单师傅拿不到全号；客服调 reveal 能拿到并留下记录 | 做了 | `server/tests/test_admin_masking.py`，0949a93 |

## 2. 验收
| 卡上的验收项（照抄） | 结果 | 证据 |
|---|---|---|
| 运营、做单师傅拿不到全号 | 通过 | `test_admin_masking.py::MaskTests::test_operator_and_maker_see_masked_contact_and_no_cost` |
| 客服调 reveal 能拿到并留下记录 | 通过 | `test_admin_masking.py::RevealHTTPTests::test_service_reveal_returns_full_contact_and_audits` |
| 四个后台订单和工单返回点都打码 | 通过 | `test_admin_masking.py::MaskTests::test_four_commerce_return_paths_apply_mask` |
| 客服可看完整联系信息但看不到成本，负责人可看全部 | 通过 | `test_admin_masking.py::MaskTests::test_service_sees_contact_but_not_cost_and_owner_sees_all` |

## 3. 改了的文件
```
 docs/reports/A8c.md               |  72 ++++++++++++++++++
 server/accounts.py                 |  30 ++++++++
 server/commerce.py                 |  12 ++-
 server/routes/admin_reveal.py      |  13 ++++
 server/tests/test_admin_masking.py | 147 +++++++++++++++++++++++++++++++++++++
 5 files changed, 270 insertions(+), 4 deletions(-)
```

## 4. 测试
测试数：后端开工前 420 个（当次 1 个 error）→ 现在 424 个通过（跳过 7 个）；小程序开工前 146 个 → 现在 146 个。开工前后端的 1 个 error 在最终全量中未重现。

```
python3 -m unittest discover -s server/tests -p test_admin_masking.py
Ran 4 tests in 0.643s
OK

python3 -m unittest discover -s server/tests
Ran 424 tests in 58.131s
OK (skipped=7)

node --test miniprogram/tests/*.test.js
ℹ tests 146
ℹ pass 146
ℹ fail 0

python3 kb/validate.py
已填 200/200 种，有问题 0 条，缺 0 种
```
新加测试：`test_operator_and_maker_see_masked_contact_and_no_cost` 验证运营和做单师傅的联系信息与成本打码；`test_service_sees_contact_but_not_cost_and_owner_sees_all` 验证客服和负责人的权限差异；`test_four_commerce_return_paths_apply_mask` 验证四个返回点及原始数据不变；`test_service_reveal_returns_full_contact_and_audits` 验证登录、权限、显示全号和操作记录。

## 5. 自查（贴命令和输出）
```
git log --oneline origin/integration/2026-11..HEAD
0949a93 A8c: 覆盖角色打码与查看审计
66ce395 A8c: 增加完整联系方式查看接口
44e81c6 A8c: 在四个后台返回点应用打码
027c64f A8c: 实现按权限打码订单副本
8864c8c A8c: 开工

git diff --check origin/integration/2026-11...HEAD
（无输出）
```
新增接口：`POST /api/admin/orders/{no}/reveal`，需要后台 `view_full_contact` 权限；返回 `person`、`phone`、`addr`，并通过后台写操作审计记录方法和路径。不涉及金额计算；`costFen` 单位为分，未获 `view_cost` 权限时从返回值移除。

## 6. 没做 / 没验证 / 偏离卡片
无。

## 7. 审核修改（打回后才有）
| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
