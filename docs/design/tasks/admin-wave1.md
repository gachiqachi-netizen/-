# 后台前端任务卡 · 第一波

> 派活顺序见 [00-dispatch.md](00-dispatch.md)。**这条线的四张卡必须串行**（D0 → D1 → D2 → D1b）：它们都会重新生成同一份打包文件 `server/static/admin/shadcn-admin.*`。
> 设计依据：[12-admin.md](../12-admin.md)（规则、状态对照表、逐页）、[14-admin-roles.md](../14-admin-roles.md)、[mockups-admin.html](../mockups-admin.html)（A01–A21）。

## 所有后台卡的共同规矩

1. 需要 node 20 或以上。**每张卡结束前都要 `cd admin-web && npm run build`**，把生成的 `server/static/admin/shadcn-admin.js`、`shadcn-admin.css` 一起提交。
2. 状态代码和中文**只从 `admin-web/src/contract.ts` 取**（A1 导出，不要手改这个文件）。不在组件里写状态代码到中文的对照。
3. 界面上不出现字段名和英文代码（designSnapshot、workOrder、五维状态机……）。
4. 本地看效果：
   ```bash
   # 终端 1：后端（测试口令自己随便起一个，不要用真实口令；不要提交）
   # DATA_DIR 一定要指向临时目录，否则会改到仓库里提交着的 server/data.sqlite3
   cd server && DATA_DIR=/tmp/zyy-admin-data ADMIN_TOKEN=<自己起的测试口令> DEMO_ORDERS=1 PAYMENT_PROVIDER=mock PORT=8801 python3 app.py
   # 终端 2：后台前端开发服务
   cd admin-web && npm run dev     # 打开 http://localhost:5173/admin/
   ```
5. 要有测试订单时，在仓库根目录跑卡片末尾“造测试数据”那段脚本（只在本机跑，不提交）。
6. 截图和 `mockups-admin.html` 对应的稿号并排放进 PR。
7. 三条测试都要跑（后端测试不应受影响）。

---

## D0 后台工程补齐

- **批次**：第 1 批　**依赖**：无　**大小**：S　**分支**：`agent/D0-admin-build`

**为什么**：`admin-web/package.json` 一个依赖都没写，没有锁文件、`index.html`、`tsconfig`，现在提交进来的打包文件没法从源码重新生成。登录页还预填了 `local-dev-only` 并明文提示默认口令。

**只能改**：`admin-web/package.json`、新建 `admin-web/package-lock.json`、`admin-web/index.html`、`admin-web/tsconfig.json`、`admin-web/README.md`；改 `admin-web/vite.config.ts`、`admin-web/src/App.tsx`（只改登录那几行）；重新生成 `server/static/admin/shadcn-admin.*`。

**步骤**
1. `package.json` 写全，**版本写死，不用 `^`**：
   ```json
   {
     "name": "zhuyangyang-admin",
     "private": true,
     "version": "1.0.0",
     "type": "module",
     "scripts": { "dev": "vite", "build": "tsc --noEmit && vite build" },
     "dependencies": { "react": "19.0.0", "react-dom": "19.0.0", "lucide-react": "0.468.0" },
     "devDependencies": {
       "vite": "6.0.7", "@vitejs/plugin-react": "4.3.4",
       "tailwindcss": "4.0.0", "@tailwindcss/vite": "4.0.0",
       "typescript": "5.7.2", "@types/react": "19.0.2", "@types/react-dom": "19.0.2"
     }
   }
   ```
   `npm install` 后提交 `package-lock.json`。某个版本装不上时**不要自己升到别的大版本**，停下来报告哪个包、什么错误。
2. `tsconfig.json`：`"jsx": "react-jsx"`、`"strict": true`、`"moduleResolution": "bundler"`、`"target": "ES2020"`、`"lib": ["ES2020", "DOM"]`、`"noEmit": true`、`"include": ["src"]`。`tsc --noEmit` 报错的话，只修类型错误本身（加类型标注），**不改逻辑**；改不动的在 PR 里列出来。
3. `index.html`（开发服务用）：`<div id="root"></div>` + `<script type="module" src="/src/main.tsx"></script>`，标题“珠养养后台”。
4. `vite.config.ts`：保留现在的打包输出名（`shadcn-admin.js`、`shadcn-admin.css`、`base: '/admin/'`、输出到 `../server/static/admin`）；加 `server: { proxy: { '/api': 'http://127.0.0.1:8801' } }`。
5. 登录页（`App.tsx`）：口令输入框的初始值改成空字符串；删掉“本地开发测试环境默认口令：local-dev-only……”那一行提示。（账号密码登录是第二波 D3 的事，这里只去掉默认口令。）
6. `README.md`：写清楚四件事：装依赖 `npm ci`、本地开发 `npm run dev`（先按共同规矩第 4 条起后端）、打包 `npm run build`、打包结果会覆盖 `server/static/admin/` 下的两个文件并要一起提交。
7. `npm run build`，提交生成的文件。

**验收**
- 在一个干净的新目录里重新克隆这个分支，`cd admin-web && npm ci && npm run build` 能成功，生成的两个文件和提交的一致（`git status` 干净）。PR 里贴命令输出。
- `grep -rn "local-dev-only" admin-web/src server/static/admin` 没有结果。
- 本地打开后台能登录（截图）。

**提示词**
```
你在仓库 串个珠 里做后台前端任务卡 D0（后台工程补齐）。先读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/admin-wave1.md 的“共同规矩”和 D0 这一节，严格按步骤做，依赖版本照卡里写死，装不上就停下来报告，不要自己换大版本。只改卡里列出的文件。分支 agent/D0-admin-build，从 origin/integration/2026-11 拉。每步提交一次，提交说明以“D0:”开头。做完开 PR 后停下。
```

---

## D1 后台字段对齐（换成契约）

- **批次**：第 2 批　**依赖**：A1、D0 已合并　**大小**：M　**分支**：`agent/D1-admin-contract`

**为什么**：审核时在本地点过（12 第 7 节）：模板页颗数、价格全是 0；工单的工序保存报错；物流状态按钮不出现；保存指定场景的条款被后端拒绝。原因都是前端自己写了一套和后端不一样的代码和字段名。

**只能改**：`admin-web/src/api.ts`、`admin-web/src/components/*.tsx`（**只改读写的字段和文字的来源，不改样式和布局**）；重新生成打包文件。

**步骤**
1. `api.ts`：删掉整个 `LABELS` 对象。`labelOf(group, value)` 改成从 `CONTRACT` 取：
   - 五组状态：`CONTRACT.statusLabels[<字段名>][value]`，字段名是 `orderStatus / paymentStatus / fulfillmentStatus / logisticsStatus / afterSaleStatus`。
   - 其他：`productTypes`、`productStatuses`、`termStatuses`、`termScenarios`、`workOrderStatuses`、`qualityGateItems`。
   - 查不到时返回原值，并 `console.warn`（方便发现新的不一致）。
   - 所有调用 `labelOf('shippingStatus', …)` 的地方改成 `logisticsStatus`。
2. 逐个文件改字段（以后端为准，对照 12 第 5 节）：
   - **模板预览**（`TemplatesView.tsx`）：`beadCount` → `count`；`totalLengthMm` → `lengthMm`；`m.subtotal`（元）→ `m.subtotalFen`（分，显示时用 `fenToYuan`）；价格显示 `totalFen`（到手价，含运费）；目标长度用 `targetMm`，是否合适用 `fitOk`。
   - **工单工序**（`OrdersView.tsx`）：下拉框选项改成 `CONTRACT.workOrderSteps` 的五个中文词，`value` 就是中文词本身（后端只收中文）；删掉 `pending / picking / stringing / rechecking / qc / packed`。
   - **物流状态按钮**：取 `detail.allowedTransitions.logisticsStatus`（不是 `shippingStatus`）。
   - **履约状态筛选**：选项用 `CONTRACT.statusLabels.fulfillmentStatus` 的键（`producing`，不是 `in_production`；`delivered`，不是 `completed`）。
   - **条款场景**（`OperationsViews.tsx`）：勾选项用 `CONTRACT.termScenarios`（键：`all custom_diy template ai gift cord safety_warning`）；新建条款的默认场景改成 `[]`。
   - **商品类型**（`OverviewAndProducts.tsx`）：选项用 `CONTRACT.productTypes`（`pendant` 不是 `charm`，`packaging` 不是 `pack`）。
   - **售后状态和类型**：用 `CONTRACT.statusLabels.afterSaleStatus` 和 `CONTRACT.afterSaleTypes`。
   - 总览页“制作中”的统计：`o.fulfillmentStatus === 'producing'`。
3. `npm run build`，提交。

**验收**（本地起服务，按“造测试数据”脚本造单）
- 模板页：好运连连 15cm 显示 19 颗、162mm、到手价和后端 `/api/admin/templates` 返回的 `expandedPreview.totalFen` 一致（截图）。
- 工单：选“穿制打结”保存成功（截图）。
- 已发货的订单：详情里出现物流状态按钮（截图）。
- 新建一条“指定的订单”条款，勾“自己串的”，保存成功（截图）。
- `grep -rnE "in_production|shippingStatus|custom_bracelet|charm|stringing|refund_pending|'applied'|LABELS" admin-web/src` 只在 `contract.ts` 以外没有结果。

**提示词**
```
你在仓库 串个珠 里做后台前端任务卡 D1（后台字段对齐）。先确认 origin/integration/2026-11 里已经有 A1 和 D0 的提交。读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/admin-wave1.md 的“共同规矩”和 D1 这一节，严格按步骤做，只改字段和文字来源，不改样式和布局，不要手改 contract.ts。分支 agent/D1-admin-contract。每步提交一次，提交说明以“D1:”开头。本地截图放进 PR，做完开 PR 后停下。
```

---

## D2 后台框架和样式（外壳、公共组件、今天、订单列表）

- **批次**：第 3 批　**依赖**：D1 已合并　**大小**：L　**分支**：`agent/D2-admin-shell`

**为什么**：现在的样式是彩色统计卡片、装饰图标、11–12px 小字和代码名。改成 12 第 3 节的规则：白底黑字、左菜单、表格、右抽屉，红色只给异常。这张卡先做外壳、公共组件和两页（今天、订单列表），其余页面在第二波逐页换。

**只能改**：`admin-web/src/App.tsx`、新建 `admin-web/src/layout/*`、`admin-web/src/ui/*`、`admin-web/src/styles.css`、`admin-web/src/components/OverviewAndProducts.tsx`（只改总览部分）、`admin-web/src/components/OrdersView.tsx`（只改列表部分，不改抽屉里的工单和质检）；重新生成打包文件。

**步骤**
1. **样式变量**（`styles.css`）：照 `docs/design/mockups-admin.html` 源码里的 CSS：页面底 `#f6f6f6`、卡片 `#fff`、正文 `#111`、辅助字 `#888`、分隔线 `#ececec`、卡面 `#f4f4f4`、红 `#c62828`（只给异常）。字号：页面标题 20、正文 14、表头和辅助字 12；表格行高 52。写成 CSS 变量，组件里只用变量。
2. **公共组件**（`src/ui/`，每个一个文件）：`Button`（`primary` 黑底白字胶囊 / `secondary` 灰底 / `danger` 红字无底 / `disabled` 变淡；不可点时下面可以带一行原因）、`Tabs`（状态分栏，每项带数量）、`Table`（表头灰小字、行高 52、行可点）、`Drawer`（右侧 560 宽、头部标题加副标题、中间可滚、底栏操作右对齐、`danger` 放左边）、`Field`（标签在上、框在下、可带提示和红字错误）、`StatusText`（文字状态，`danger` 时红字，不用彩色徽章）、`EmptyState`、`ErrorState`（一句原因 + 再试一次）、`Skeleton`（行骨架）。
3. **外壳**（`src/layout/`）：左菜单宽 200（分组小标题灰色；分组和条目照 12 第 2 节；选中项浅灰底加粗；条目右侧可带待处理数）；顶栏（页面标题 + 右侧“搜订单号、手机号后 4 位”搜索框）；内容区。菜单里还没做的页面（评价、知识库、首页、文章、账号与权限）先显示但点了是“这一页在下一波做”的空状态。
4. **今天**（稿 A02）：替换原“工作台总览”。一行一件事：待制作、制作中、待质检、待发货、售后待处理、缺货和快没了——数量从现有接口（`/api/admin/orders` 按 `opsStatus` 计数，`/api/admin/after-sales`，`/api/admin/beads` 的 `stock` 字段）算；点一行跳到对应列表并选好分栏。右边“最近操作”取 `/api/admin/audit` 前 4 条。**删掉统计卡片的图标和彩色数字。**
5. **订单列表**（稿 A06）：分栏 全部 / 待支付 / 待制作 / 制作中 / 待发货 / 已发货 / 已完成 / 售后中，按 `opsStatus.code` 分；列：订单号、手串（缩略图 + 名字 + 颗数手围）、收货人（名字 + 手机号后 4 位）、实付、状态（`opsStatus.label`，`danger` 红字）、下单时间。模拟付款的订单在实付旁边红字“模拟付款”（`paymentChannel === 'mock'`）。**状态只用 `opsStatus`，不自己推算**（A2 已合并时有这个字段；没有时显示“—”并在 PR 里说明）。
6. 删掉界面上所有字段名和代码名文字（搜 `designSnapshot`、`workOrder`、`qualityGate`、`五维`、`BOM` 这些出现在 JSX 文字里的）。
7. `npm run build`，提交。

**验收**：今天页和订单列表分别和 A02、A06 并排截图；数一下截图里的颜色：只有黑、白、灰，红色只出现在异常和模拟付款上；搜 JSX 里没有上面那些代码名。

**提示词**
```
你在仓库 串个珠 里做后台前端任务卡 D2（后台框架和样式）。先确认 origin/integration/2026-11 里已经有 D1 的提交。读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/12-admin.md 第 2、3 节、docs/design/tasks/admin-wave1.md 的“共同规矩”和 D2 这一节，打开 docs/design/mockups-admin.html 看 A02、A06。严格按步骤做，只改卡里列出的文件，其他页面这张卡不改。分支 agent/D2-admin-shell。每步提交一次，提交说明以“D2:”开头。截图和稿子并排放进 PR，做完开 PR 后停下。
```

---

## D1b 订单详情改读后端状态

- **批次**：第 4 批　**依赖**：A2、D2 已合并　**大小**：M　**分支**：`agent/D1b-admin-order-detail`

**只能改**：`admin-web/src/components/OrdersView.tsx`（订单详情抽屉部分）；重新生成打包文件。

**步骤**（稿 A07）
1. 抽屉第一块“状态”：大字 `opsStatus.label`（`danger` 红字），旁边一行小字是支付、物流、售后三组的中文（`CONTRACT.statusLabels`）。
2. “下一步能做的事”：按钮来自 `detail.allowedTransitions`，**按钮文字写成动作**，对照表写在组件顶部一个常量里：`orderStatus.cancelled` → “取消订单”（放底栏左边，二次确认）；`fulfillmentStatus.producing` → “开始制作”；`fulfillmentStatus.ready_to_ship` → “改成待发货”；`fulfillmentStatus.shipped` → “发货”（弹出快递公司 + 单号）；`logisticsStatus.in_transit` → “改成运输中”；`logisticsStatus.delivered` → “标记已签收”；`logisticsStatus.exception` → “标记物流异常”。其他没列的显示 `CONTRACT.statusLabels` 里目标状态的中文，前面加“改成”。
3. 后端拒绝时（比如“还没有通过质检，不能进入待发货”），按钮下面一行灰字原样显示原因，不弹窗。
4. 手串、金额、收货、记录四块照 A07；记录区标“只给后台看”。模拟付款时实付旁红字“模拟付款”。
5. 去掉原来抽屉里“五维状态机流转控制”那一整块。
6. `npm run build`，提交。

**验收**：一笔制作中、没质检的订单：和 A07 并排截图，“改成待发货”点了以后下面出现后端给的原因；已发货订单出现“标记已签收”。

**提示词**
```
你在仓库 串个珠 里做后台前端任务卡 D1b（订单详情改读后端状态）。先确认 origin/integration/2026-11 里已经有 A2 和 D2 的提交。读 docs/design/tasks/admin-wave1.md 的“共同规矩”和 D1b 这一节，打开 docs/design/mockups-admin.html 看 A07。严格按步骤做，只改卡里列出的文件。分支 agent/D1b-admin-order-detail。每步提交一次，提交说明以“D1b:”开头。截图放进 PR，做完开 PR 后停下。
```

---

## 造测试数据（只在本机跑，不提交）

在仓库根目录、后端没启动时跑；会往**临时目录**的数据库写 3 笔模拟付款的订单（制作中、待发货、已发货各一笔）。`DATA_DIR` 要和启动后端时用的一样。这段脚本已经实际跑通过。

```bash
mkdir -p /tmp/zyy-admin-data
cd server && DATA_DIR=/tmp/zyy-admin-data PAYMENT_PROVIDER=mock python3 - <<'EOF'
import os, sys
sys.path.insert(0, '.')
import app, commerce, user_api
db = app.db
bead_map = {b['id']: b for b in db.list('beads')}
seq = ['zt8'] * 20
for i, target in enumerate(['producing', 'ready_to_ship', 'shipped']):
    sub = sum(user_api.bead_price_fen(bead_map[x]) for x in seq) + 1500
    quote = {'totalFen': sub + (0 if sub >= 9900 else 800), 'items': [{'id': 'zt8', 'unitPriceFen': user_api.bead_price_fen(bead_map['zt8']), 'mm': 8}]}
    o = user_api.make_order(db, {'requestId': 'local-demo-order-%04d' % i, 'name': '测试手串 %d' % i, 'beads': seq, 'wrist': 15,
                                 'gift': False, 'cord': 0, 'person': '测试', 'phone': '13800000000', 'addr': '测试地址 1 号',
                                 'confirmedQuote': quote}, 'local-demo-user')
    no = o['no']
    pid = user_api.start_payment(db, no, 'local-demo-user')['payment']['paymentId']
    user_api.mock_payment_notify(db, no, 'local-demo-user', pid, 'success')
    commerce.transition_order_status(db, no, 'fulfillmentStatus', 'producing')
    if target in ('ready_to_ship', 'shipped'):
        commerce.record_quality_gate(db, no, {'sequenceOk': True, 'sizeOk': True, 'materialOk': True, 'appearanceOk': True, 'inspector': '测试'})
        commerce.transition_order_status(db, no, 'fulfillmentStatus', 'ready_to_ship')
    if target == 'shipped':
        commerce.transition_order_status(db, no, 'fulfillmentStatus', 'shipped', '', {'carrierName': '顺丰速运', 'trackingNo': 'SF0000000000'})
    print(no, target)
EOF
```
（`1500` 是现在 `pricing.py` 里的手工费；A3 去掉手工费以后改成 `0`。）
