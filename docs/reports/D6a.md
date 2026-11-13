# D6a 交付报告（待负责人确认 DELETE 错误码）

分支：`agent/D6a-products`　最后一个代码提交：`e974d27`（报告提交见分支 HEAD）

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 列表按品种分组（展开是各尺寸） | 做了 | `admin-web/src/pages/products.tsx` 请求 `/api/admin/beads?group=1`，按类型和筛选条件显示品种与尺寸 |
| 库存四档状态，“快没了”“缺货”红字 | 做了 | `products.tsx` 的库存列和编辑抽屉 |
| 编辑抽屉：单价写元存分、关联知识库下拉、寓意只读 | 做了 | `products.tsx` 的编辑表单；用 `yuanToFen`，从 `/api/admin/kb` 取知识库列表和寓意 |
| 把握低时显示指定提示 | 做了 | `products.tsx` 的只读寓意区域 |
| 批量调价先预览改前改后，确认后执行 | 做了 | `products.tsx` 调用 `/api/admin/beads/reprice` 的 `preview:true/false` 两步 |
| 被模板或订单用过的商品删除由后端拦，抽屉里显示原因 | 后端引用校验完成；接口错误码未完成 | `server/commerce.py::delete_product` 统计模板和订单引用并抛 `ValueError`；接口当前返回 500；前端删除按钮仍禁用 |

## 2. 验收

| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| A10 商品类型分栏、按品种展开尺寸、四档库存状态 | 代码和构建通过，视觉待验 | `cd admin-web && npm run build`：`tsc --noEmit && vite build`、`✓ built in 1.60s`；需要负责人看：`/admin/` 商品页，对照稿 A10 |
| A11 编辑抽屉单价、知识库、寓意只读 | 代码和构建通过，视觉待验 | `products.tsx` 编辑抽屉；需要负责人看：`/admin/` 商品页，对照稿 A11 |
| 批量调价先预览再确认 | 代码和构建通过，交互待验 | `products.tsx` 预览和执行两个调用；需要负责人看：`/admin/` 商品页，对照稿 A10 |
| 使用中的商品不能删除并显示原因 | 未通过 | `test_product_delete_guard.py` 的模板/订单 HTTP 用例期望 400，实际 500；商品均保留；见第 6 节 |

## 3. 改了的文件

`git diff --stat origin/integration/2026-11...HEAD`（报告提交后）：

```text
 admin-web/src/pages/products.tsx          | 88 ++++++++++++++++++++++++++-----
 docs/reports/D6a.md                       | 65 +++++++++++++++++++++++
 server/commerce.py                        | 13 +++++
 server/tests/test_product_delete_guard.py | 75 ++++++++++++++++++++++++++
 4 files changed, 228 insertions(+), 13 deletions(-)
```

## 4. 测试

- 修改前 `python3 -m unittest discover -s server/tests 2>&1 | tail -15`：`Ran 558 tests in 143.262s`、`OK (skipped=7)`。本轮因针对性 HTTP 测试失败，尚未再跑全量。
- `node --test miniprogram/tests/*.test.js 2>&1 | tail -15`：`tests 205`、`pass 205`、`fail 0`。
- `python3 kb/validate.py 2>&1 | tail -15`：`已填 200/200 种，有问题 0 条，缺 0 种`。
- `cd admin-web && npm run build 2>&1 | tail -15`：`tsc --noEmit && vite build`、`✓ built in 1.60s`。
- `python3 -m unittest discover -s server/tests -p test_product_delete_guard.py 2>&1 | tail -15`：`Ran 3 tests in 3.500s`；`FAILED (failures=2)`；两条引用用例均为 `AssertionError: 500 != 400`，无引用删除与操作记录用例通过。
- 测试数：后端开工前 558 → 新增 3 条（当前 1 通过、2 因错误码失败）；小程序开工前 205 → 现在 205。
- 新测试：`test_template_reference_returns_400_and_keeps_product` 模板引用；`test_order_beads_or_items_reference_returns_400_and_keeps_product` 订单两种快照引用；`test_unreferenced_product_deletes_and_writes_audit` 无引用删除及操作记录。

## 5. 自查（贴命令和输出）

- `git log --oneline origin/integration/2026-11..HEAD`：`e974d27 D6a: 审核 1 商品删除引用校验与接口测试`、`340427d D6a: 暂停缺少引用校验的删除动作`、`4886a9b D6a: 商品分组列表与编辑抽屉`、`ae61f9b D6a: 开工`。
- `git diff --check origin/integration/2026-11...HEAD`：无输出。
- 范围：改 `admin-web/src/pages/products.tsx`、本报告，以及负责人本轮许可的 `server/commerce.py::delete_product` 和新测试；未改其他后端函数、尺寸规则、金额契约或依赖。
- 本地打包文件经 `git restore` 恢复，未提交 `server/static/admin/shadcn-admin.*`。

## 6. 没做 / 没验证 / 偏离卡片

- 经负责人同意，改了 `server/commerce.py` 的 `delete_product`，新增 `server/tests/test_product_delete_guard.py`，其他后端函数未改。
- **新阻塞**：商品引用校验已抛 `ValueError`，但 `server/app.py` 的 DELETE 处理只捕获 `KeyError`，其余异常统一返回 500；两条 HTTP 测试证明应为 400、实际为 500。按负责人第 3 条要求停下，不改 `app.py`。前端删除按钮继续禁用，尚未启用二次确认和后端原因展示。
- 未在浏览器人工对照 A10/A11 验证，未提供截图；需要负责人在后台商品页验收。
- 商品页权限按钮的精细隐藏需等 D3c 的权限可用；后端对无权限请求仍会拒绝。

## 7. 审核修改（打回后才有）

| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
| 1 | 按负责人授权补商品删除引用校验与三条 HTTP 测试；发现接口返回 500，按指示暂停。 | `e974d27` |
