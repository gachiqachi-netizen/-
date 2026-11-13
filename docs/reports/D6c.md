# D6c 交付报告

分支：agent/D6c-pricing-settings　最后一个实现提交：0e572df

## 1. 步骤
| 卡上的步骤（照抄编号和第一句） | 做了 / 没做 | 在哪（文件:行，或提交 hash） |
|---|---|---|
| 手工费：开关“收 / 不收”；收的时候填金额（元，存分）。 | 做了 | `admin-web/src/pages/products/pricingSettings.tsx`，8b58fb2 |
| 运费：开关“收 / 不收”；收的时候填运费金额，和“满多少包邮”（可以选“不包邮”）。 | 做了 | `admin-web/src/pages/products/pricingSettings.tsx`，8b58fb2、0e572df |
| 底部写一句“只影响之后的下单，已经下的订单不变”；保存前二次确认，列出改前和改后；保存后显示“谁、什么时候改的”。 | 做了 | `admin-web/src/pages/products/pricingSettings.tsx`，8b58fb2 |
| 接口：GET / PUT /api/admin/pricing-settings；金额输入只能是非负数、最多两位小数。 | 做了 | `admin-web/src/pages/products/pricingSettings.tsx`，8b58fb2 |
| 商品页只加入口按钮“手工费和运费”和挂载抽屉。 | 做了 | `admin-web/src/pages/products.tsx`，8b58fb2 |

## 2. 验收
| 卡上的验收项（照抄） | 结果 | 证据 |
|---|---|---|
| 手工费和运费开关、金额输入、包邮门槛。 | 构建通过；待浏览器验收 | `cd admin-web && npm run build` 成功；需要负责人看：`/admin/` 的“珠子与配件 → 手工费和运费”，对照稿 A10 的编辑抽屉。 |
| 保存前显示改前与改后，二次确认。 | 构建通过；待浏览器验收 | `pricingSettings.tsx` 的“核对改前改后”“确认并保存”；需要负责人看：同上，对照稿 A10。 |
| 保存后显示修改人和时间；仅影响后续订单。 | 构建通过；待接口联调 | `GET/PUT /api/admin/pricing-settings`；需要负责人看：同上，对照稿 A10。 |
| 金额最多两位小数，以整数分提交。 | 代码实现；后端接口测试通过 | `test_pricing_settings.py` 6 个通过；`pricingSettings.tsx::parseForm`。 |

## 3. 改了的文件
```
 admin-web/src/pages/products.tsx                 |  5 +-
 admin-web/src/pages/products/pricingSettings.tsx | 82 ++++++++++++++++++++++++
 2 files changed, 86 insertions(+), 1 deletion(-)
```

## 4. 测试
测试数：后端开工前 563 个 → 现在发现数 563 个（全量超过 3 分钟中止）；小程序开工前 215 个 → 现在 215 个。
本卡没有新增测试文件（页面卡仅可改商品页和子目录）。

`cd admin-web && npm run build 2>&1 | tail -15`：`tsc --noEmit && vite build`、1614 个模块、`✓ built in 4.61s`。
`python3 -m unittest discover -s server/tests -p 'test_pricing_settings.py' 2>&1 | tail -15`：`Ran 6 tests in 7.344s`、`OK`。
`node --test miniprogram/tests/ar-model-cache.test.js 2>&1 | tail -15`：`tests 9`、`pass 9`、`fail 0`。
`python3 kb/validate.py 2>&1 | tail -15`：`已填 200/200 种，有问题 0 条，缺 0 种`。
三条全量：
```
python3 -m unittest discover -s server/tests -v 2>&1 | tail -15
3 分钟上限中止；最后运行到 test_production_workbench.ProductionWorkbenchHandlerTest.test_handler_template_expand_work_order_and_quality_gate

node --test miniprogram/tests/*.test.js 2>&1 | tail -15
ℹ tests 215
ℹ pass 215
ℹ fail 0

python3 kb/validate.py 2>&1 | tail -15
已填 200/200 种，有问题 0 条，缺 0 种
```

## 5. 自查（贴命令和输出）
`git log --oneline origin/integration/2026-11..HEAD`：3 条提交均以 `D6c:` 开头。
`git diff --stat origin/integration/2026-11...HEAD`：实现仅 2 个允许文件；本报告另加。
`git diff --check`：无输出。
`cd admin-web && npm run build 2>&1 | tail -15`：`✓ built in 4.61s`；生成的 `server/static/admin/shadcn-admin.*` 已恢复，未提交。

## 6. 没做 / 没验证 / 偏离卡片
未在浏览器对照 A10 检查，无截图。开工前后端全量在并发运行下超过 3 分钟已中止；小程序全量前两次在 `ar-model-cache.test.js::slow download with continuing progress is not cut off by initial deadline` 计时用例失败，单独运行该文件 9/9 通过，第三次全量 215/215 通过。后端全量重跑同样在 3 分钟上限终止，最后运行到 `test_production_workbench.ProductionWorkbenchHandlerTest.test_handler_template_expand_work_order_and_quality_gate`；相关计价接口 6/6 通过。未改卡外测试。

## 7. 审核修改（打回后才有）
无。
