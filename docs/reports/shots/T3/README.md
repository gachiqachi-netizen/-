# T3 交付报告

分支：`agent/T3-all-states-shots`

## 1. 步骤

1. 从最新 `origin/integration/2026-11` 建立独立目录和分支，推送开工占位。
2. 给 18 个页面登记可见状态；通过截图脚本准备正常与空数据库、拦截接口 500、退出登录和延迟网络。
3. 在 390×844 微信开发者工具模拟器逐页截图、核对路径和页面状态，输出 80 张 PNG。

## 2. 验收：页面 × 状态

图片可点击查看原尺寸。空格说明页面没有独立的该状态。

| 页面 | 正常 | 空 | 出错 | 没登录 | 加载中 |
|---|---|---|---|---|---|
| 首页 (`home`) | <a href="home-normal.png"><img src="home-normal.png" width="78" alt="首页：正常"></a> | <a href="home-empty.png"><img src="home-empty.png" width="78" alt="首页：空"></a> | <a href="home-error.png"><img src="home-error.png" width="78" alt="首页：出错"></a> | 公开页，无独立未登录态 | <a href="home-loading.png"><img src="home-loading.png" width="78" alt="首页：加载中"></a> |
| 工作台 (`workbench`) | <a href="workbench-normal.png"><img src="workbench-normal.png" width="78" alt="工作台：正常"></a> | <a href="workbench-empty.png"><img src="workbench-empty.png" width="78" alt="工作台：空"></a> | <a href="workbench-error.png"><img src="workbench-error.png" width="78" alt="工作台：出错"></a> | 公开页，无独立未登录态 | <a href="workbench-loading.png"><img src="workbench-loading.png" width="78" alt="工作台：加载中"></a> |
| 手串详情 (`bracelet-detail`) | <a href="bracelet-detail-normal.png"><img src="bracelet-detail-normal.png" width="78" alt="手串详情：正常"></a> | <a href="bracelet-detail-empty.png"><img src="bracelet-detail-empty.png" width="78" alt="手串详情：空"></a> | <a href="bracelet-detail-error.png"><img src="bracelet-detail-error.png" width="78" alt="手串详情：出错"></a> | 公开页，无独立未登录态 | <a href="bracelet-detail-loading.png"><img src="bracelet-detail-loading.png" width="78" alt="手串详情：加载中"></a> |
| AI 配 (`ai-match`) | <a href="ai-match-normal.png"><img src="ai-match-normal.png" width="78" alt="AI 配：正常"></a> | <a href="ai-match-empty.png"><img src="ai-match-empty.png" width="78" alt="AI 配：空"></a> | <a href="ai-match-error.png"><img src="ai-match-error.png" width="78" alt="AI 配：出错"></a> | <a href="ai-match-logged-out.png"><img src="ai-match-logged-out.png" width="78" alt="AI 配：没登录"></a> | <a href="ai-match-loading.png"><img src="ai-match-loading.png" width="78" alt="AI 配：加载中"></a> |
| 确认订单 (`order-confirm`) | <a href="order-confirm-normal.png"><img src="order-confirm-normal.png" width="78" alt="确认订单：正常"></a> | <a href="order-confirm-empty.png"><img src="order-confirm-empty.png" width="78" alt="确认订单：空"></a> | <a href="order-confirm-error.png"><img src="order-confirm-error.png" width="78" alt="确认订单：出错"></a> | <a href="order-confirm-logged-out.png"><img src="order-confirm-logged-out.png" width="78" alt="确认订单：没登录"></a> | <a href="order-confirm-loading.png"><img src="order-confirm-loading.png" width="78" alt="确认订单：加载中"></a> |
| 下单成功 (`order-success`) | <a href="order-success-normal.png"><img src="order-success-normal.png" width="78" alt="下单成功：正常"></a> | <a href="order-success-empty.png"><img src="order-success-empty.png" width="78" alt="下单成功：空"></a> | <a href="order-success-error.png"><img src="order-success-error.png" width="78" alt="下单成功：出错"></a> | <a href="order-success-logged-out.png"><img src="order-success-logged-out.png" width="78" alt="下单成功：没登录"></a> | <a href="order-success-loading.png"><img src="order-success-loading.png" width="78" alt="下单成功：加载中"></a> |
| 待支付订单详情 (`order-detail-pending`) | <a href="order-detail-pending-normal.png"><img src="order-detail-pending-normal.png" width="78" alt="待支付订单详情：正常"></a> | <a href="order-detail-pending-empty.png"><img src="order-detail-pending-empty.png" width="78" alt="待支付订单详情：空"></a> | <a href="order-detail-pending-error.png"><img src="order-detail-pending-error.png" width="78" alt="待支付订单详情：出错"></a> | <a href="order-detail-pending-logged-out.png"><img src="order-detail-pending-logged-out.png" width="78" alt="待支付订单详情：没登录"></a> | <a href="order-detail-pending-loading.png"><img src="order-detail-pending-loading.png" width="78" alt="待支付订单详情：加载中"></a> |
| 运输中订单详情 (`order-detail-transit`) | <a href="order-detail-transit-normal.png"><img src="order-detail-transit-normal.png" width="78" alt="运输中订单详情：正常"></a> | <a href="order-detail-transit-empty.png"><img src="order-detail-transit-empty.png" width="78" alt="运输中订单详情：空"></a> | <a href="order-detail-transit-error.png"><img src="order-detail-transit-error.png" width="78" alt="运输中订单详情：出错"></a> | <a href="order-detail-transit-logged-out.png"><img src="order-detail-transit-logged-out.png" width="78" alt="运输中订单详情：没登录"></a> | <a href="order-detail-transit-loading.png"><img src="order-detail-transit-loading.png" width="78" alt="运输中订单详情：加载中"></a> |
| 售后中订单详情 (`order-detail-after-sale`) | <a href="order-detail-after-sale-normal.png"><img src="order-detail-after-sale-normal.png" width="78" alt="售后中订单详情：正常"></a> | <a href="order-detail-after-sale-empty.png"><img src="order-detail-after-sale-empty.png" width="78" alt="售后中订单详情：空"></a> | <a href="order-detail-after-sale-error.png"><img src="order-detail-after-sale-error.png" width="78" alt="售后中订单详情：出错"></a> | <a href="order-detail-after-sale-logged-out.png"><img src="order-detail-after-sale-logged-out.png" width="78" alt="售后中订单详情：没登录"></a> | <a href="order-detail-after-sale-loading.png"><img src="order-detail-after-sale-loading.png" width="78" alt="售后中订单详情：加载中"></a> |
| 我的订单 (`my-orders`) | <a href="my-orders-normal.png"><img src="my-orders-normal.png" width="78" alt="我的订单：正常"></a> | <a href="my-orders-empty.png"><img src="my-orders-empty.png" width="78" alt="我的订单：空"></a> | <a href="my-orders-error.png"><img src="my-orders-error.png" width="78" alt="我的订单：出错"></a> | <a href="my-orders-logged-out.png"><img src="my-orders-logged-out.png" width="78" alt="我的订单：没登录"></a> | <a href="my-orders-loading.png"><img src="my-orders-loading.png" width="78" alt="我的订单：加载中"></a> |
| 我的 (`mine`) | <a href="mine-normal.png"><img src="mine-normal.png" width="78" alt="我的：正常"></a> | <a href="mine-empty.png"><img src="mine-empty.png" width="78" alt="我的：空"></a> | <a href="mine-error.png"><img src="mine-error.png" width="78" alt="我的：出错"></a> | <a href="mine-logged-out.png"><img src="mine-logged-out.png" width="78" alt="我的：没登录"></a> | 慢网下仍显示原内容，无独立加载画面 |
| 写评价 (`write-review`) | <a href="write-review-normal.png"><img src="write-review-normal.png" width="78" alt="写评价：正常"></a> | <a href="write-review-empty.png"><img src="write-review-empty.png" width="78" alt="写评价：空"></a> | <a href="write-review-error.png"><img src="write-review-error.png" width="78" alt="写评价：出错"></a> | <a href="write-review-logged-out.png"><img src="write-review-logged-out.png" width="78" alt="写评价：没登录"></a> | <a href="write-review-loading.png"><img src="write-review-loading.png" width="78" alt="写评价：加载中"></a> |
| 选择售后类型 (`after-sale-type`) | <a href="after-sale-type-normal.png"><img src="after-sale-type-normal.png" width="78" alt="选择售后类型：正常"></a> | <a href="after-sale-type-empty.png"><img src="after-sale-type-empty.png" width="78" alt="选择售后类型：空"></a> | <a href="after-sale-type-error.png"><img src="after-sale-type-error.png" width="78" alt="选择售后类型：出错"></a> | <a href="after-sale-type-logged-out.png"><img src="after-sale-type-logged-out.png" width="78" alt="选择售后类型：没登录"></a> | <a href="after-sale-type-loading.png"><img src="after-sale-type-loading.png" width="78" alt="选择售后类型：加载中"></a> |
| 申请售后 (`after-sale-apply`) | <a href="after-sale-apply-normal.png"><img src="after-sale-apply-normal.png" width="78" alt="申请售后：正常"></a> | <a href="after-sale-apply-empty.png"><img src="after-sale-apply-empty.png" width="78" alt="申请售后：空"></a> | <a href="after-sale-apply-error.png"><img src="after-sale-apply-error.png" width="78" alt="申请售后：出错"></a> | <a href="after-sale-apply-logged-out.png"><img src="after-sale-apply-logged-out.png" width="78" alt="申请售后：没登录"></a> | <a href="after-sale-apply-loading.png"><img src="after-sale-apply-loading.png" width="78" alt="申请售后：加载中"></a> |
| 售后详情 (`after-sale-detail`) | <a href="after-sale-detail-normal.png"><img src="after-sale-detail-normal.png" width="78" alt="售后详情：正常"></a> | <a href="after-sale-detail-empty.png"><img src="after-sale-detail-empty.png" width="78" alt="售后详情：空"></a> | <a href="after-sale-detail-error.png"><img src="after-sale-detail-error.png" width="78" alt="售后详情：出错"></a> | <a href="after-sale-detail-logged-out.png"><img src="after-sale-detail-logged-out.png" width="78" alt="售后详情：没登录"></a> | <a href="after-sale-detail-loading.png"><img src="after-sale-detail-loading.png" width="78" alt="售后详情：加载中"></a> |
| 好友落地页 (`friend-landing`) | <a href="friend-landing-normal.png"><img src="friend-landing-normal.png" width="78" alt="好友落地页：正常"></a> | <a href="friend-landing-empty.png"><img src="friend-landing-empty.png" width="78" alt="好友落地页：空"></a> | <a href="friend-landing-error.png"><img src="friend-landing-error.png" width="78" alt="好友落地页：出错"></a> | 公开页，无独立未登录态 | <a href="friend-landing-loading.png"><img src="friend-landing-loading.png" width="78" alt="好友落地页：加载中"></a> |
| 分享海报 (`share-poster`) | <a href="share-poster-normal.png"><img src="share-poster-normal.png" width="78" alt="分享海报：正常"></a> | <a href="share-poster-empty.png"><img src="share-poster-empty.png" width="78" alt="分享海报：空"></a> | <a href="share-poster-error.png"><img src="share-poster-error.png" width="78" alt="分享海报：出错"></a> | 公开页，无独立未登录态 | <a href="share-poster-loading.png"><img src="share-poster-loading.png" width="78" alt="分享海报：加载中"></a> |
| 编辑地址 (`address-edit`) | <a href="address-edit-normal.png"><img src="address-edit-normal.png" width="78" alt="编辑地址：正常"></a> | 新增表单无独立状态 | 新增表单无独立状态 | 新增表单无独立状态 | 新增表单无独立状态 |

截图覆盖：18 页、80 个有效状态；`result.json` 记录每张图的页面、状态、路径、是否成功和警告，80 项均成功。每张 PNG 小于 300 KB。

### 截图发现

- 确认订单缺少作品时显示“没找到要下单的手串”；表格保留原貌，供后续 U16 对照。
- 一些售后、评价、分享相关页面在无数据或接口错误时几乎空白；部分订单详情在未登录时显示“没找到这笔订单”。
- 工作台接口错误时保留本地手串，但珠子列表为空；“我的”接口错误时展示兜底文字“没连上，下拉再试”。
- 新增地址页初始就是空表单，未发现独立的空、错误、未登录、加载中画面。

## 3. 变更范围

只改 `tools/shoot/pages.json`、`tools/shoot/shoot.js`、`tools/shoot/states.js`、`tools/shoot/README.md`，新增本目录的截图、结果和报告；未改页面代码。

## 4. 测试

- `python3 -m unittest discover -s server/tests`：631 个测试通过，7 个跳过。
- `node --test miniprogram/tests/*.test.js`：297 个通过，0 个失败。
- `python3 kb/validate.py`：200/200，0 个问题。
- `python3 tools/check-ui.py`：44 个历史问题，0 个新增。
- `node --check tools/shoot/states.js`、`node --check tools/shoot/shoot.js`、`python3 -m json.tool tools/shoot/pages.json`：通过。

## 5. 自查

- 开工和功能提交均以 `T3:` 开头；图片和报告交付提交也使用该前缀。
- 截图路径、张数和 `result.json` 对齐；所有截图状态 `ok=true`。
- 截图服务使用临时数据库，不修改仓库数据；没有新增依赖。

## 6. 没做 / 没验证 / 偏离卡片

- 未改页面中发现的空白、错误态样式；本卡范围仅为截图，交给后续页面卡修复。
- 报告放在 `docs/reports/shots/T3/README.md`，因为本次明确限定只能新增 `docs/reports/shots/T3/`。

## 7. 审核修改

无。
