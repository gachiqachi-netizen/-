# D1b 交付报告

分支：agent/D1b-admin-order-detail　最后一个提交：f099de3

## 1. 步骤
| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 1. 抽屉第一块“状态”：大字 opsStatus.label（danger 红字）+ 支付/物流/售后三组小字 | 做了 | admin-web/src/components/OrdersView.tsx 抽屉“状态”卡：大字取 CONTRACT.opsStatus[code]（红字仅 danger），小字 labelOf('paymentStatus'/'logisticsStatus'/'afterSaleStatus') 全部来自契约；下面一行“工序：…（师傅）”照 A07 |
| 2. “下一步能做的事”：按钮来自 allowedTransitions，动作对照表在组件顶部常量 | 做了 | TRANSITION_ACTION_LABELS 常量（OrdersView.tsx 顶部）：cancelled→取消订单（footer 左边+二次确认）、producing→开始制作、ready_to_ship→改成待发货、shipped→发货（弹快递公司+单号）、in_transit→改成运输中、delivered→标记已签收、exception→标记物流异常；未列出的用“改成+CONTRACT.statusLabels 目标状态中文” |
| 3. 后端拒绝时按钮下面一行灰字原样显示原因，不弹窗 | 做了 | transError state：triggerTransition/cancelOrder 失败时把 err.message 渲染在按钮下方灰字；不再弹 toast。实测后端拒绝文案“质检关口不通过，不得进入待发货”可原样显示 |
| 4. 手串、金额、收货、记录四块照 A07；记录区标“只给后台看”；模拟付款红字 | 做了 | 手串块（56 缩略图+名称+颗数/长度/手围/来源+用料+客户备注）；金额块（珠子 goodsFen/运费 shipFen（0 显示包邮）/实付 totalFen，均分转元；paymentChannel==='mock' 红字“模拟付款”）；收货块（收货人/手机号/地址+复制）；记录块标“只给后台看”，取 createdAt+statusHistory 按时间倒序 |
| 5. 去掉“五维状态机流转控制”整块 | 做了 | 原状态流转控制区整块删除，功能由“下一步能做的事”替代；工单与质检两块功能原样保留（footer“去工单”平滑滚动到它们） |
| 6. npm run build，提交 | 做了 | 提交 f099de3 含重新打包的 shadcn-admin.js/css |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 制作中、没质检的订单：和 A07 并排截图，“改成待发货”点了以后下面出现后端给的原因 | 逻辑做了，未截图 | 需要负责人在浏览器看：订单列表打开一笔“制作中”订单的抽屉，对照稿 A07。实现：制作中订单恒显示“改成待发货”按钮（allowedTransitions 里后端不给 ready_to_ship），点击后后端拒绝、按钮下方灰字显示后端原因。已用 mock 后端实测拒绝流程：transition_order_status(producing→ready_to_ship) 抛“质检关口不通过，不得进入待发货”，该文案即按钮下显示的内容 |
| 已发货订单出现“标记已签收” | 逻辑做了，未截图 | 同上，需要负责人看。实测已发货订单 allowedTransitions.logisticsStatus 含 delivered，按钮文案按对照表显示“标记已签收” |
| 接口字段实测 | 做了 | mock 后端实测（DATA_DIR 临时目录）：/api/admin/orders 与 /api/admin/orders/<no> 返回 opsStatus{code,label,danger}、allowedTransitions、goodsFen/shipFen/totalFen、person/phone/addr、statusHistory、paymentChannel=mock，抽屉各块字段全部对上 |

## 3. 改了的文件
```
 admin-web/src/components/OrdersView.tsx | 抽屉部分重写（列表部分未动）
 server/static/admin/shadcn-admin.js / .css | 重新生成
 docs/reports/D1b.md                      | 本报告
```

## 4. 测试
```
python3 -m unittest discover -s server/tests  → Ran 316 tests, OK (skipped=7)
node --test miniprogram/tests/*.test.js        → tests 138 / pass 138 / fail 0
python3 kb/validate.py                         → 已填 200/200 种，有问题 0 条，缺 0 种
```
测试数：后端 开工前 316 个 → 现在 316 个；小程序 138 → 138（没变少）。
这张卡新加的测试：无（纯前端卡；tsc --noEmit 与 vite build 通过；接口字段用 mock 后端手工验证，见第 2 节）。

## 5. 自查
- git log --oneline origin/integration/2026-11..HEAD：
```
f099de3 D1b: 金额改读分字段，制作中补改成待发货按钮（后端拒绝显原因）
c1b398f D1b: 订单详情抽屉改读后端状态（稿 A07）
4eda3d2 D1b: 开工
```
- cd admin-web && npm run build 最后几行：
```
✓ 1602 modules transformed.
../server/static/admin/shadcn-admin.css   44.61 kB │ gzip: 9.99 kB
../server/static/admin/shadcn-admin.js   277.08 kB │ gzip: 84.67 kB
✓ built in 959ms
```
- 状态词只从契约取：状态块、动作按钮 fallback、记录区全部走 CONTRACT/labelOf，无手写对照。
- 金额：显示用后端分字段转元，前端不做价格计算（材料小计未加总，避免与 pricing.quote 不一致）。
- 抽屉里无字段名/代码名文字（designSnapshot、workOrder、qualityGate 等只作属性名出现）。

## 6. 没做 / 没验证 / 偏离卡片
1. 两项截图验收未在浏览器验证（无法完成登录后的无头截图），写“需要负责人看”；接口行为已用 mock 后端实测（第 2 节）。
2. 偏离一处：卡上写“按钮来自 detail.allowedTransitions”，但实测后端对制作中订单不给 ready_to_ship（即使质检做完也不给，必须先进 producing→质检通过才出现待发货流转），而验收又要求制作中订单能点“改成待发货”看到后端原因。所以实现为：allowedTransitions 之外，制作中订单额外显示“改成待发货”按钮，点击走真实后端、失败原样显示原因。未列的其他流转没有自行添加。
3. 顺带发现（未改，不在本卡范围）：D2 合并的订单列表“实付”列读的是 o.total/o.price，而订单实际字段是 totalFen，现在列表实付会显示 ¥0.00；缩略图珠子没有颜色字段（快照无 color/hi）显示灰色。建议负责人在审 D1b 或后续卡时一并处理。
4. “去工单”按钮滚动到抽屉内工单/质检区块（做单页在第二波才做）。
