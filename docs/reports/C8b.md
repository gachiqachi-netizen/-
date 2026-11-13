# C8b 我的订单 交付报告

- **分支**：`agent/C8b-my-orders`（从 `origin/integration/2026-11` 切出，基线含 C1p、C2）
- **卡片**：`docs/design/tasks/miniprogram-wave2.md` C8b；依据 04 第 13 节 + 稿 60–62，**布局以 04 第 0.2 节为准**（电商卡片版式）
- **只能改**：`features/orders/*`（已遵守；测试另加 `miniprogram/tests/orders-group.test.js`）

## 做了什么

`features/orders/` 四个文件 + `group.js`（纯函数分栏逻辑，node 可测）：

1. **五个分栏**：全部 / 待支付 / 制作中 / 待收货 / 售后，按 `customerStatus.code` 归类（`group.js`，有单测）：待收货 = 运输中 + 已签收（含 logistics_issue）；制作中 = 制作中/待发货/处理中；售后 = 售后处理中/已完成/未通过 + 退款三个 code；已完成、已取消只出现在"全部"。分栏条数显示在 tab 上。
2. **每单一张卡片**（0.2 版式）：顶行订单编号 + 状态（右上，attention/danger 按 tone 变色）；中间商品行 = bracelet-thumb 缩略图 + 名字（加粗）+ 寓意关键词（`utils/meaning.keywords`，最多 2 个，没有不显示）+ 规格（N 颗 · 手围 Xcm）；右下"实付 ¥78"；按钮靠右。
3. **行尾主按钮**：来自 `customerStatus.primaryAction`（文案用 `utils/contract.actions`）。**确认收货**原地执行（弹窗确认 → POST `/my/orders/{no}/actions/confirm_receipt` → 用返回的订单重装配这一行，计数同步更新，toast 反馈）；其余动作先进订单详情页处理（与 `order-detail` 现有 runAction 一致）。
4. **售后分栏**：状态写 `customerStatus.label`（售后处理中/售后已完成/退款中…——后端目前没有给用户端查售后单详情的 GET 接口，写不了"退货退款 · 请寄回手串"这种售后单内状态，见"没做"）；点行进 `features/after-sale/detail`（C9b 的壳）；`afterSaleStatus === 'returning'` 的行尾加"填写单号"→ `features/after-sale/return`（C9b 的壳）。
5. **反馈**：切分栏列表淡入（不整页刷新）；下拉刷新；首次加载骨架行；加载失败错误卡（重试，未登录给"去登录"）；整体空"还没有订单／串好一条，下单后会出现在这里／去串一条"（switchTab 去 diy），分栏空"这里没有订单"。
6. **onShow 每次刷新**：从详情/售后页返回时列表是最新的。

## 没做 / 等别的卡

- **入口**：`pages/mine/mine.js` 里现在还是内联订单列表，"我的订单"页的入口（mine 页加一行）不在 `features/orders/*` 范围，留给 C10a/C11a 或单独小卡。页面本身已注册（C1p 注册进 features 分包），可直接 `wx.navigateTo({url:'/features/orders/orders'})`。
- **售后单精确状态**（"退货退款 · 请寄回手串"）：需要用户端 GET 售后单接口，后端现在只有 POST 申请。建议并到 C9b（售后详情卡）一起做，后端加一个 `GET /api/my/orders/{no}/after-sales`。
- **去支付**：待支付行的主按钮是"去支付"，点击进订单详情；支付动作在 C7b（付款和订单详情）里做。
- 未在微信开发者工具/真机上验证（本卡为小程序页面，本地只跑了 node 测试和语法检查）——按守则，不说"已通过真机"。

## 验证

- 小程序 `node --test miniprogram/tests/*.test.js`：**146 pass / 0 fail**（新增 orders-group 5 个用例；基线 141）。
- `node --check` 页面 js 通过；`orders.json` / `app.json` JSON 合法。
- 后端 `Ran 346 tests OK (skipped=7)`（未改后端，回归确认）；`kb/validate.py` 200/200 问题 0。
