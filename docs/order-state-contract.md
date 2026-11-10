# 订单状态与操作协作契约

## 数据流

`后台状态 → API 事实状态与允许动作 → 小程序展示映射 → 用户按钮 → API 再校验并原子流转`

## 后端职责

1. 持久化 `orderStatus`、`paymentStatus`、`fulfillmentStatus`、`afterSaleStatus`、`logisticsStatus` 五组状态码。
2. 列表和详情接口同时输出规范化 `state`，每组包含稳定 `code` 与服务端标签 `label`。
3. 按当前订单数据计算 `allowedActions`；支付未开放时绝不返回 `pay_order`。
4. 用户动作接口必须再次验证订单归属、当前状态和跨状态约束，成功后原子写入状态与历史。
5. 保留旧字段用于兼容，但新页面不得再依赖旧的单一中文 `status` 做逻辑判断。

## 小程序职责

1. 只依据 `state` 生成主状态、辅助说明、色调和五组状态摘要。
2. 只渲染 `allowedActions` 中存在的按钮；未知动作忽略，不猜测权限。
3. 服务端动作统一提交动作码，提交期间禁用按钮，成功后重新读取订单。
4. `reorder` 与 `view_logistics` 可在本地执行；订单状态变更必须请求服务端。
5. 旧订单没有新契约时只做兼容展示，不开放破坏性动作。

## 用户动作接口

- 地址：`POST /api/my/orders/{订单号}/actions`
- 请求体：`{"action":"cancel_order"}`
- 规范动作码：`cancel_order`、`confirm_receipt`、`reorder`、`view_logistics`。
- `cancel_order`、`confirm_receipt` 由服务端校验并改变状态；`reorder`、`view_logistics` 是客户端导航动作，不提交状态变更。
- 服务端暂时兼容旧的 `/actions/{action}` 地址，但小程序和新增调用只使用请求体协议。

## 当前边界

- 当前没有真实支付，因此不展示“去支付”，也不接受客户端推进支付状态。
- 后台的 `allowedTransitions` 面向运营人员；C 端的 `allowedActions` 面向订单所有者，两者不可混用。
- 金额继续以整数分存储和计算，状态契约不改变报价与退款规则。

