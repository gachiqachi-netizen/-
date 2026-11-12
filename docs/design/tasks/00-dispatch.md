# 派活总表（第一波，2026-11-13）

> 配合 [15-dev-plan.md](../15-dev-plan.md) 用。这里是**能直接派的任务卡**：每张卡一个执行会话（一个 Codex 或 Kimi 会话只做一张卡），照卡做完就停。
> 卡片在同目录：[backend-wave1.md](backend-wave1.md)（A 开头）、[miniprogram-wave1.md](miniprogram-wave1.md)（C 开头）、[admin-wave1.md](admin-wave1.md)（D 开头）。
> 第二波以后的卡（登录、权限、工作台、各页面、评价……）在第一波快做完时再写，免得写早了和代码对不上。

## 1. 怎么派

1. **一张卡开一个新会话**，把卡片最后的“提示词”整段粘给执行 agent。
2. **同一批里的卡可以同时派**（开几个会话同时跑）。它们改的文件互不重叠（第 3 节），不会互相覆盖。
3. **下一批要等上一批里它依赖的卡合并以后才能派**。每张卡写了“开工前必须已合并”。
4. 执行 agent 做完会开 PR 到 `integration/2026-11`；我来审，负责人合并。**执行 agent 不要自己合并，也不要开始下一张卡。**
5. 卡片里有“停下来问”的情况，碰到就停，不要猜。

## 2. 批次

| 批次 | 可以同时派的卡 | 开工前必须已合并 | 预计 |
|---|---|---|---|
| **第 0 步**（负责人） | 推送 `review/admin-workbench-fixes` 和 `design/ui-revamp`；建 `integration/2026-11`（命令见第 4 节） | — | 半小时 |
| **第 1 批**（10 路并行） | A1 字段契约 · A4a 确认收货和自动完成 · C0a 变量和全局样式 · C0b 图标 · C0c 字标 · C0d 显示函数 · C0e 珠子图 · C0j 模板排珠改用工作台尺寸规则 · D0 后台工程 · A0 审核（我来做） | 第 0 步 | 1–2 天 |
| **第 2 批**（5 路并行） | A2 订单展示状态 · A4b 用户订单：单个订单和改地址 · C0f 基础样式和小控件 · C0h 手串图 · D1 后台字段对齐（前半：换契约） | A2 等 A1；A4b 等 A4a；C0f 等 C0a；C0h 等 C0e；D1 等 A1、D0 | 2–3 天 |
| **第 3 批**（5 路并行） | A4c 后台：改地址、内部备注、取消原因、去掉手动确认 · A5a 售后类型和用户申请 · C0g 弹层、底栏、浮动提示 · C0i AI 输入区 · D2 后台框架和样式 | A4c 等 A4b、A2；A5a 等 A4b；C0g、C0i 等 C0f；D2 等 D1 | 2–3 天 |
| **第 4 批**（4 路并行） | A5b 模拟退款 · C0z 组件注册和临时页收口 · C2 订单状态改读后端 · D1b 后台字段对齐（后半：订单显示 opsStatus） | A5b 等 A5a；C0z 等 C0a–C0j 全部；C2 等 A2、C0z；D1b 等 A2、D2 | 1–2 天 |

第 4 批合完 = 15 号文档的 M0 和 M1 的前半段。到时候写第二波的卡。

**等负责人确认后再写卡的**：
- **改手围重串怎么重排珠子**（A5 的后半）、**制作中退款扣多少**（E2）。

### 为什么这样分

- **后端**：A1（新文件）和 A4a（改确认收货）互不相干，先同时做。A2 要用 A1 的契约，排第二批；它只读契约、不改契约文件。A4a、A4b、A5a 都要往同一个函数 `order_allowed_actions` 里加动作，所以三张卡前后排开（第 1、2、3 批各一张）。A4c 要复用 A4b 写的改地址函数，排第三批；它和 A5a 改的是同一批文件里的不同函数，git 能自动合并。A5b 要用 A5a 的新售后类型，排第四批。
- **导出的契约文件**（`contract.js`、`contract.ts`）是脚本生成的。两张卡都重新导出、合并时冲突的话，不用手改：合并后重跑 `python3 tools/export_contract.py` 再提交。
- **小程序**：`app.json` 是所有组件都要注册的地方，多张卡同时改它一定冲突。所以第一到第三批的组件卡**都不改 `app.json`**（C0a 只改颜色那几行），只在自己的临时页里用 `usingComponents` 引用组件；第四批 C0z 一张卡统一注册。**临时页已经提前建好**：`miniprogram/kit/` 分包里 7 个空壳页（icons、wordmark、bead、basic、bracelet、layer、composer），已在 `app.json` 注册，非开发版打开会自动退回；每张卡只填自己那一页。`app.wxss` 只有 C0a 和 C0f 两张卡改，前后排开。
- **后台**：D0 先把工程补齐（能打包）；D1 换契约要等 A1；D2 改框架和样式会大面积动页面，排在 D1 之后，避免同时改同一批文件。

## 3. 每张卡能改的文件（不在表里的文件一律不碰）

| 卡 | 只能改这些 |
|---|---|
| A1 | 新建 `server/contract.py`、`tools/export_contract.py`、`server/tests/test_contract.py`、`miniprogram/utils/contract.js`、`admin-web/src/contract.ts`；改 `server/app.py`（只加一个 GET 路由）、`docs/order-state-contract.md` |
| A4a | `server/commerce.py`（`customer_order_action`、新函数 `auto_complete_delivered`）、`server/user_api.py`（`order_allowed_actions`）、新建 `server/jobs.py`、新建 `server/tests/test_order_receipt.py` |
| A2 | 新建 `server/order_view.py`、`server/tests/test_order_view.py`；改 `server/user_api.py`（`public_order`）、`server/commerce.py`（`order_detail`、`list_orders`）。**不改** `contract.py`（状态词表在 A1 里已经定好；缺了就停下来问） |
| A4b | `server/commerce.py`（新函数 `change_order_address`）、`server/user_api.py`（`order_allowed_actions`、`INTERNAL_ORDER_FIELDS`、新函数）、`server/app.py`（两个用户路由）、新建 `server/tests/test_order_address.py`、`server/contract.py`（只在 `ACTIONS` 加一行）和两个导出文件 |
| A5a | `server/status.py`（`AFTER_SALE_TYPES`）、`server/commerce.py`（售后相关函数）、`server/user_api.py`、`server/app.py`（一个用户路由）、新建 `server/migrations/m007_after_sale_types.py`、新建 `server/tests/test_after_sale_customer.py`、`server/contract.py` 和两个导出文件 |
| A4c | `server/commerce.py`（`allowed_order_transitions`、`transition_order_status`、新函数 `add_internal_note`、`customer_order_action` 的取消分支）、`server/user_api.py`（`INTERNAL_ORDER_FIELDS`）、`server/app.py`（后台路由）、新建 `server/tests/test_order_admin_ops.py`、`server/contract.py` 和两个导出文件 |
| A5b | `server/payments.py`（`handle_refund`）、`server/commerce.py`（`_after_sale_target`、`transition_after_sale`）、新建 `server/tests/test_mock_refund.py` |
| C0a | 新建 `miniprogram/styles/tokens.wxss`、`miniprogram/utils/theme.js`、`miniprogram/tests/theme-tokens.test.js`；改 `miniprogram/app.wxss`、`miniprogram/app.json`（只改 `window` 和 `tabBar` 的颜色，不加组件） |
| C0b | 新建 `miniprogram/assets/icons/*`、`miniprogram/assets/tab/*`、`miniprogram/tests/icons.test.js`；填 `miniprogram/kit/icons/*`（临时页，空壳已建好） |
| C0c | 新建 `miniprogram/assets/brand/*`、`miniprogram/components/wordmark/*`、`miniprogram/kit/wordmark/*`（临时页，空壳已建好） |
| C0d | 新建 `miniprogram/utils/meaning.js`、`money.js`、`fit-text.js`、对应 3 个测试、`tools/check-copy.py` |
| C0j | `miniprogram/utils/template.js`、新建 `miniprogram/tests/size-rule-shared.test.js` |
| C0e | 新建 `miniprogram/utils/bead-image.js`、`bead-paint.js`、`miniprogram/components/bead/*`、对应测试、`miniprogram/kit/bead/*`（临时页，空壳已建好） |
| C0f | 新建 `miniprogram/styles/components.wxss`、`miniprogram/components/state/*`、`miniprogram/tests/ui-basic.test.js`、`miniprogram/kit/basic/*`（临时页，空壳已建好）；改 `miniprogram/app.wxss`（只加一行 `@import`） |
| C0h | 新建 `miniprogram/components/{bracelet,cell,design-row}/*`、`miniprogram/kit/bracelet/*`（临时页，空壳已建好）；改 `miniprogram/components/bracelet-thumb/*`、`miniprogram/utils/thumb-cache.js` |
| C0g | 新建 `miniprogram/components/{sheet,bar,toast}/*`、`miniprogram/utils/toast.js`、`miniprogram/tests/toast.test.js`、`miniprogram/kit/layer/*`（临时页，空壳已建好）；改 `miniprogram/components/privacy-popup/*`、`miniprogram/utils/privacy.js` |
| C0i | 新建 `miniprogram/components/composer/*`、`miniprogram/kit/composer/*`（临时页，空壳已建好） |
| C0z | `miniprogram/app.json`（把各卡的组件注册成全局组件、tabBar 换成 C0b 的图标） |
| C2 | `miniprogram/utils/order-state.js`、`miniprogram/tests/order-state.test.js`、`miniprogram/features/order-detail/*`（只改读状态的那几行） |
| D0 | `admin-web/package.json`、新建 `admin-web/package-lock.json`、`admin-web/index.html`、`admin-web/tsconfig.json`、`admin-web/README.md`、`admin-web/vite.config.ts`；重新生成 `server/static/admin/shadcn-admin.*`；改 `server/static/admin.html` |
| D1 | `admin-web/src/api.ts`、`admin-web/src/components/*.tsx`（只改读写字段和文字来源，不改样式）；重新生成打包文件 |
| D2 | `admin-web/src/App.tsx`、新建 `admin-web/src/layout/*`、`admin-web/src/styles.css`、`admin-web/src/components/*.tsx`（样式和结构）；重新生成打包文件 |
| D1b | `admin-web/src/components/OrdersView.tsx`、`OverviewAndProducts.tsx`；重新生成打包文件 |

**打包文件 `server/static/admin/shadcn-admin.*` 会被 D0、D1、D2、D1b 都改到**，所以这四张卡是串行的（D0 → D1 → D2 → D1b），不会同时做。

## 4. git 规矩（每张卡都一样）

负责人第 0 步只做一次：

```bash
git fetch origin
git checkout -b integration/2026-11 origin/review/admin-workbench-fixes
git merge --no-ff origin/design/ui-revamp -m "合并设计文档"
git push -u origin integration/2026-11
```

执行 agent 每张卡：

```bash
git fetch origin
git checkout -b agent/<卡号>-<英文简述> origin/integration/2026-11
# 每做完卡片里的一步就提交一次，提交说明以卡号开头，例如 "A1: 新建 contract.py"
git push -u origin agent/<卡号>-<英文简述>
# 在 GitHub 上开 PR：base 选 integration/2026-11
```

- 不往 `main`、`integration/2026-11` 直接提交。
- 开工前检查依赖的卡是否已经在 `integration/2026-11` 里：`git log origin/integration/2026-11 --oneline | grep "<依赖卡号>:"`。没有就停下来说“依赖的 X 还没合并”。
- 合并 PR 时有冲突：执行 agent 不要自己解决，在 PR 里说明冲突的文件，等我处理。

## 5. 每张卡的交付（PR 描述照这个写）

```
卡号：
做了什么（逐条对应卡片的步骤）：
改了哪些文件（应该和卡片“只能改这些”一致；多改了的写原因）：
三条测试的结果（贴最后几行输出）：
  python3 -m unittest discover -s server/tests
  node --test miniprogram/tests/*.test.js
  python3 kb/validate.py
截图（前端卡必须有，和稿子并排）：
没做或没验证的：
偏离卡片的地方和原因：
```

- 本机有代理时，后端测试先 `unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy` 再跑，否则 6 个旧 HTTP 测试会因代理报错（和代码无关）。
- 前端卡没在微信开发者工具里看过的，写“未在开发者工具验证”，不写“已通过”。
