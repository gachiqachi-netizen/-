# 15 开发总计划（2026-11-13）

> **能直接派的任务卡在 [tasks/](tasks/00-dispatch.md)**（第一波 23 张：后端 7、小程序 12、后台 4；第二波及以后 71 张：后端 28、小程序 29、后台 14；共 10 批，含每批能同时派哪些卡、文件归属、提示词模板）。
> 把 05（小程序 D1–D41、后端 B1–B25）、12（后台 AD1–AD8）、13（运营侧 B26–B40、AD9–AD14）、14（权限 B41–B46、AD15–AD18）合成一份。**以后派活以本文为准**；05、12、13、14 里的任务描述仍然是细节依据，编号对照见附录。
> 每条任务写了：做什么、怎么做（改哪些文件、函数、接口）、验收、依赖、大小（S ≤ 半天，M 1–2 天，L 3 天以上）。“谁来做”一列留给负责人填，第 6 节有建议。

## 1. 现在代码在哪

| 分支 | 内容 | 状态 |
|---|---|---|
| `main` | 11-08 交接时的版本 | 远端 |
| `codex/admin-commerce-hardening-v2` | 后台电商加固（状态机、金额分、迁移、支付真相） | 远端，**我没有完整审核过** |
| `codex/admin-production-workbench` | 生产工单、质检、条款范围、shadcn 后台 | 远端，审核结论见 12 第 7 节 |
| `review/admin-workbench-fixes` | 在上一个之上：修用户订单泄露、质检可绕过、计价和尺寸规则重复；加模拟支付；尺寸规则统一成小程序工作台那一份 | **只在本地**，225 个测试通过 |
| `design/ui-revamp` | 全部设计稿和文档（`docs/design/`）、根目录 `AGENTS.md` 的阅读顺序、小程序 `kit/` 分包的 7 个临时页空壳（给第一波组件卡截图用，`app.json` 里加了一个分包） | **只在本地** |

**合并方案**：
1. 负责人在 GitHub Desktop 推送 `review/admin-workbench-fixes` 和 `design/ui-revamp`。
2. 从 `review/admin-workbench-fixes` 拉一个 `integration/2026-11`，把 `design/ui-revamp` 合进去。两边改的文件不重叠（一边是 `server/`，一边是 `docs/design/`），不会冲突。
3. 之后所有任务都从 `integration/2026-11` 拉分支（`agent/<任务号>-<简述>`），做完提 PR 回 `integration/2026-11`。
4. 第一个里程碑（M1）验收通过后，负责人决定是否把 `integration/2026-11` 合进 `main`。

## 2. 字段对齐：怎么从根上解决

审核时发现，同一套状态现在有**三份**各写各的文字：后端 `server/status.py`、小程序 `miniprogram/utils/order-state.js`（“已送达”“履约异常”“售后已申请”……）、后台 `admin-web/src/api.ts`（代码都不一样）。逐个对照改一遍，下次加字段又会对不上。做法是：

### 2.1 规则

1. **后端是唯一来源。**所有状态代码、中文叫法、动作名、售后类型、条款场景、商品类型，都只在后端定义一次。
2. **展示状态由后端算好再给。**订单接口直接返回：
   - `customerStatus`：给用户看的一个词、一句说明、主按钮（06 第 3.1 节的规则）
   - `opsStatus`：给后台看的一个词和是否标红（12 第 4 节的规则）
   - `progress`：用户订单进度条的四步和时间
   - `allowedActions`：每个动作带代码和中文

   小程序和后台**不再自己从五组状态推算**，只负责显示。
3. **前端用的文字表由脚本从后端导出**，不手写。导出的文件提交进仓库，后端测试检查它和后端定义一致；不一致就测试失败。
4. **字段命名**：接口 JSON 用小驼峰；金额一律整数分，字段名以 `Fen` 结尾；时间一律毫秒时间戳，字段名以 `At` 结尾；状态代码一律小写英文加下划线。
5. **改接口的规矩**：只加字段，不改名、不删字段；确实要改，先加新字段、两端都切过去后再删旧的，并在 PR 里写明。

### 2.2 要建的东西

| 文件 | 内容 |
|---|---|
| `server/contract.py`（新） | 汇总所有对外的代码和中文：五组状态（每个状态给用户的叫法、给后台的叫法）、动作、售后类型、售后原因、条款场景、商品类型和状态、工序、质检项。状态机本身仍在 `status.py`，`contract.py` 引用它 |
| `server/order_view.py`（新） | `customer_status(order)`、`ops_status(order)`、`progress(order)`、`action_list(order)`：纯函数，只读订单、不写库 |
| `GET /api/meta/contract`（新，不需要登录） | 返回 `contract.py` 的内容和一个版本号 |
| `tools/export_contract.py`（新） | 生成 `miniprogram/utils/contract.js`（CommonJS，不用 `URL` 等浏览器对象）和 `admin-web/src/contract.ts` |
| `server/tests/test_contract.py`（新） | 检查两个导出文件和后端一致；检查订单接口返回里出现的每个代码在契约里都有 |

## 3. 工作线和任务

一共五条线：**A 后端地基**、**B 后端新功能**、**C 小程序改版**、**D 后台前端**、**E 负责人和数据**。

### A. 后端地基（其他线都在等它）

| # | 做什么 | 怎么做 | 验收 | 依赖 | 大小 |
|---|---|---|---|---|---|
| A0 | 审核 `codex/admin-commerce-hardening-v2` 里我还没看过的部分 | 逐个看迁移脚本 `server/migrations/`、`db_postgres.py`、`money.py`、`content_security.py` 的改动；重点：迁移能不能重复跑、Postgres 并发写、金额有没有浮点 | 出一份审核结论，问题列表带复现步骤 | 无 | M |
| A1 | 字段契约 | 按第 2.2 节建 `contract.py`、`/api/meta/contract`、导出脚本、契约测试；同步改 `docs/order-state-contract.md`：原来写的“小程序只依据 `state` 生成主状态”改成“小程序只显示后端的 `customerStatus`”，“支付未开放时绝不返回 `pay_order`”保留（模拟支付算开放） | `python3 tools/export_contract.py` 生成两个文件；改后端一个叫法不重新导出，测试失败 | 无 | M |
| A2 | 订单展示状态 | 建 `order_view.py`：`customer_status` 按 06 §3.1 的十行顺序（补上“已付款未开始做 = 制作中”），`ops_status` 按 12 §4；`progress` 四步（下单、制作、运输、签收）取状态历史里的时间；在 `user_api.public_order`、`commerce.order_detail`、`commerce.list_orders` 里挂上 | 表驱动测试：06 §3.1 每一行、12 §4 每一行各一个用例 | A1 | M |
| A3 | 计价去掉手工费（原 B1） | `pricing.py` 的 `HANDWORK_FEN` 改为 0（字段保留，值为 0，兼容旧前端）；新单价由负责人给（E1），写一个迁移 `migrations/m00x_unit_prices.py` 批量改种子和库里的单价 | `test_pricing` 改期望值；好运连连 15cm 到手价 = 珠子 + 运费；旧订单金额不变 | E1 | S |
| A4 | 订单动作补齐（原 B2、B7、B9、B28、B29、B31） | ① `customer_order_action` 的确认收货条件加上物流 `delivered`；② 新增 `commerce.auto_complete_delivered(db, now, days)`，加命令 `python3 server/jobs.py auto-complete`，由服务器定时任务每小时跑；③ 取消订单可带原因；④ 发货前改地址：用户 `POST /api/my/orders/{no}/address`、后台 `PUT /api/admin/orders/{no}/address`，记录原地址；⑤ 去掉后台手动“确认订单”（`allowed_order_transitions` 里未付款时不给 `confirmed`）；⑥ 内部备注 `PUT /api/admin/orders/{no}/note`（存 `internalNotes`，用户接口不返回）；⑦ 改运单号 | 每个动作一个测试；用户接口里搜不到 `internalNotes` | A2 | L |
| A5 | 售后补齐和模拟退款（原 B5、B6、B27、B23 的规则部分） | ① 售后类型改成五种（仅退款、退货退款、补寄配件、改手围重串、拒收后退款），`status.AFTER_SALE_TYPES`；② 用户申请 `POST /api/my/orders/{no}/after-sales`，按订单阶段只允许对应的类型；③ 退款金额后端算（有扣除时带说明）；④ 售后进入“退款中”时调 `payments.handle_refund`：模拟通道直接成功，订单支付状态 `paid → refunding → refunded`；⑤ 改手围重串：生成一张新工单，关联原订单 | 售后每种类型从申请走到完成各一个测试；模拟退款后订单是“已退款” | A2、E2 | L |
| A6 | 单个订单接口（原 B3） | `GET /api/my/orders/{no}`，只能看自己的 | 看别人的单返回 404 | A2 | S |
| A7 | 手机号登录（原 B25） | `POST /api/auth/phone`：收 `code`，服务端用 `WECHAT_APP_ID / SECRET` 调微信换手机号，绑到当前 openid 的账号；只返回打码号码；开发环境走假的换号函数（测试里替换） | 测试覆盖：绑定、同号多设备合并、微信接口失败 | E3 | M |
| A8 | 后台账号和权限（原 B41–B46） | 新表 `admin_users`、`admin_roles`、`admin_sessions`；密码 `hashlib.scrypt`；`app.py` 里把 `admin_ok()` 换成 `admin_auth(permission)`，每个后台接口声明权限点（14 §2.2）；`commerce` 里所有 `actor=ACTOR` 改为传当前账号名；敏感字段打码放在一个函数 `mask_for(order, perms)` 里 | 测试：四个默认角色 × 每个后台接口，结果和 14 §2.3 的表一致；操作记录里没有 `admin` | A1 | L |
| A9 | 目录字段（原 B16）。**2026-11-13 核对：代码里已有**（`kb.enrich` 给目录每颗珠子带 `tags`、`meaning`、`summary`、`safety`，把握低的不给），小程序 C0d 按现有字段读，不单独出卡；把握低的珠子靠 A9b 补出处 | 目录接口给每颗珠子带 `meaning.tags`、`meaning.text`、`look`、`safety`（经 `kb.public` 过滤，把握低的不给） | 目录里把握在“中”以上的珠子都有寓意 | 无 | S |
| A9b | 知识库补把握（数据，不是代码） | 在售商品里有 16 种的知识库寓意把握是“低”，用户端不显示：蜜蜡（mila）、草莓晶（caomei-jing）、红玛瑙（putong-manao）、绿玉髓（lv-yusui）、东陵玉（dongling-yu）、缠丝玛瑙（chansi）、岫玉（xiu-yu）、水草玛瑙（shuicao）等。KD2 上线后在后台逐条打开，加来源，够了把寓意的把握改成中或高，保存即生效；3 种金属隔珠隔片本来没有寓意，不用补 | 后台保存时检查通过；目录里这些珠子出现寓意 | KD2 | M |
| A10 | 订单数据清理 | 删掉旧字段的兼容写法（`status` 中文字段、`paymentAvailable`）之前，先确认小程序不再读 | 搜小程序和后台代码不再用这两个字段 | C 线完成 | S |

### B. 后端新功能

| # | 做什么 | 怎么做 | 验收 | 依赖 | 大小 |
|---|---|---|---|---|---|
| B-1 | 用户上传照片 + 图片审核（原 B33） | `POST /api/my/uploads`（登录用户、每天限额、只收 png/jpg/webp、压缩到 1600px）；上传后调微信图片安全检查（异步，回调或轮询），结果写进 `uploads` 表的 `checkStatus`；没通过的图片不对外显示 | 测试：限额、格式、检查不通过时图片地址返回 404 | A1 | M |
| B-2 | 评价（原 B14、B32） | `reviews` 表；用户提交 `POST /api/my/orders/{no}/review`（只限已签收、手机号已认证）；机审：文字走 `content_security` + `kb.banned_in`，图片用 B-1；状态 `machine_failed / pending / published / rejected / taken_down`；后台审核接口；详情页 `GET /api/templates/{id}/reviews` 只返回 `published` | 测试：含功效词直接打回；人审通过才出现在公开接口 | A7、B-1 | L |
| B-3 | 分享管理（原 B34） | 后台按链接或名字查分享、下架（`shares` 加 `takenDownAt`）、用户举报接口 | 下架后落地页返回“看不到了” | A8 | S |
| B-4 | 文章和规则文字（原 B15、B35） | `articles` 表（标题、题图、正文、关联珠子、底部按钮、上首页、排序、状态）；保存前过禁用词；条款类型加“用户协议”“隐私政策” | 有禁用词保存失败；首页接口带出上首页的文章 | A8 | M |
| B-5 | 首页配置（原 B24、B38） | `banners` 补字段（标题、寓意关键词、跳转、封面、排序、上下线）；模板加 `homeOrder`；`/api/catalog` 按顺序返回 | 后台改顺序后首页接口顺序跟着变 | B-4 | S |
| B-6 | 用户查询（原 B36） | `GET /api/admin/users?q=`，按手机号后 4 位或订单号；返回打码手机号、订单、售后、作品数 | 没有“查用户”权限返回 403 | A8 | S |
| B-7 | 商品按品种分组、批量调价、成本价（原 B37） | 商品加 `costFen`（只给有权限的人）；`POST /api/admin/beads/reprice`：先 `preview=true` 返回改前改后，再执行；整批写一条操作记录 | 预览和执行结果一致；没有“改价格”权限 403 | A8 | M |
| B-8 | AI 返回结构（原 B19） | AI 配返回“一条消息 + 三个方案 + 快捷改法”；消息里的数字由后端过滤；方案的颗数、价格由 `plans`、`pricing` 算 | 测试：模型返回带数字的消息时被替换成模板句 | A3 | M |
| B-9 | 拍照识别置信度（原 B20） | 每种珠子带置信度；失败带原因类别 | — | — | M |
| B-10 | 订阅消息（原 B21） | 三个模板：发货、签收、退款到账；发送记录表 | 开发环境用假的发送函数 | E4 | M |
| B-11 | 地址簿（原 B10）、送礼（原 B11）、作品删除（原 B13） | 地址簿增删改查和默认地址；订单带贺卡留言（50 字、过审）和隐藏价格；`DELETE /api/designs/{id}` | 各一组测试 | A1 | M |
| B-12 | AI 对话记录、统计（原 B39、B40） | 对话记录表（保留期限按隐私政策）；统计按天汇总珠子和搭配次数，不出个人 | — | E5 | M |
| B-13 | 物流轨迹（原 B12） | 接快递查询服务，订单带 `tracking` | — | 选服务商 | M |
| B-14 | 微信支付接入 | 商户号下来后：`payments.py` 加 `wechat` 通道（统一下单、回调验签、退款），`/api/payments/notify` 真正处理回调 | 用微信支付的沙箱或小额真实测试 | E6 | L |

### C. 小程序改版（原 D1–D41，按包分）

**所有 C 任务的共同要求**：
- 照 04 逐页说明和 `mockups-final.html` 做，每个任务的验收截图和稿子并排。
- 状态文字只用 `utils/contract.js`（A1 导出）；订单状态只显示后端给的 `customerStatus`，**删掉 `utils/order-state.js` 里自己推算的部分**。
- 金额只显示后端报价返回的数，不在前端加减。
- 地址只走 `config.js`；不用 `URL` 等浏览器对象。
- 每个任务跑通三条测试，在微信开发者工具里截图；没在开发者工具或真机上验证过的，不写“已通过”。

| # | 包含 | 怎么做（重点文件） | 依赖 | 大小 |
|---|---|---|---|---|
| C0 基础 | D1 变量、D2 图标、D3 字标、D4 基础样式、D5 弹层和底栏、D6 浮动提示、D7 珠子图、D8 手串图、D9 显示函数、D10 输入区 | `app.wxss` 引入 `docs/design/tokens.wxss` 的变量；`components/` 下新建 `c-sheet`、`c-bar`、`c-toast`、`c-state`、`bead-img`、`bracelet-ring`、`composer`；显示函数放 `utils/format.js`（金额、颗数长度、一句寓意） | A1 | L |
| C1 登录和跳转 | D11 登录、D13 跳转 | 重做 `pages/login/login`（手机号组件）；`utils/auth.js` 的 `goLogin(next)`；`utils/nav.js` 的进工作台、回上一个 tab | A7、C0 | M |
| C2 订单状态 | D12 | `utils/order-state.js` 改成只读 `customerStatus`、`progress`、`allowedActions`；动作文字来自 `contract.js` | A2、C0 | S |
| C3 工作台 | D15 布局、D16 反馈、D17 叠戴和起名、D18 珠子弹层 | `pages/diy/diy` 重写，并入 `pages/editor/editor` 的逻辑（先评估迁移量，太大就抽组件）；`components/bead-sheet`；测试 `editor-gestures`、`material-picker`、`size-rule` 改引用路径、不改断言 | C0 | L |
| C4 逛和详情 | D14 首页、D19 我的作品、D22 手串详情、D37 规则和内容页 | `pages/home/home`、`pages/finish/finish`（详情）、新建 `features/works`、`features/reviews`、`features/doc`、`features/article` | C0、B-5（首页数据，没有时用现有 banners） | L |
| C5 AI 配和拍照 | D20、D21、D23 | `pages/ai/ai`（三张卡片横排、时间行、新对话）、`pages/photo/photo`（核对页） | C0、B-8 | L |
| C6 试戴和手围 | D24、D25、D26 | `features/tryon`、`ar-hand`、`pages/wrist/wrist` | C0 | M |
| C7 下单和付款 | D27、D28 确认订单，D30 付款和订单详情 | `pages/order/order` 提交后调 `POST /api/my/orders/{no}/pay`：返回 `mock: true` 时弹模拟支付层（稿 51），否则 `wx.requestPayment`；付款结果以后端为准，前端不改状态；`features/order-detail` | A2、A4、C2 | L |
| C8 订单周边 | D29 地址、D31 我的订单、D32 物流和改地址 | `features/address`、`features/orders`、`features/logistics` | A4、A6、B-11 | M |
| C9 售后和评价 | D33、D34 售后，D35 评价 | `features/after-sale/*`、`features/review`；照片走 B-1 上传 | A5、B-1、B-2 | L |
| C10 我的和分享 | D36 我的和设置、D38 分享海报、D39 分享落地页 | `pages/mine/mine`、`pages/share/share`、`features/shared`（作品页，不是商品详情） | C1、C4 | M |
| C11 收尾 | D40 清理、D41 全流程回归 | 删 `pages/editor`、`pages/ar-tryon`、旧样式；三条主流程逐屏截图 | 以上全部 | M |

### D. 后台前端（原 AD1–AD18）

**共同要求**：照 12、14 和 `mockups-admin.html`（A01–A21）；状态和文字只用 `admin-web/src/contract.ts`（A1 导出）；订单状态只显示后端的 `opsStatus`；权限只决定显示，后端还会再查。

| # | 包含 | 怎么做 | 依赖 | 大小 |
|---|---|---|---|---|
| D0 工程 | AD1 | 补 `admin-web` 的依赖和锁文件、`index.html`、`tsconfig`；`npm run build` 输出到 `server/static/admin/`；README 写命令。先在本地跑通 `npm ci && npm run build` | 无 | S |
| D1 对齐 | AD2、AD3（AD5 由后端 A2 代替） | 删掉 `api.ts` 里的 `LABELS`，改用 `contract.ts`；按 12 §5 改模板预览、工单、物流、条款的读写字段 | A1、A2 | M |
| D2 框架和样式 | AD4 | 左菜单 + 顶栏 + 列表 + 右抽屉的布局组件；去掉图标卡片和彩色数字；按 12 §3 的样式规则 | D0 | M |
| D3 登录和权限 | AD7、AD15–AD18 | 账号密码登录、首次改密码、账号管理、角色勾选表、菜单按权限显示、无权限页 | A8、D2 | L |
| D4 做单 | AD6 | 工单列表和工单页（A03–A05）：编号珠序、领料勾选（存本机）、工序五段、质检、打印 | D1、D2 | M |
| D5 订单和售后 | AD9 | 订单列表和详情抽屉（A06–A09）：按钮来自 `allowedActions`；改地址、内部备注、改运单号、发货；售后审核和退款 | A4、A5、D1 | L |
| D6 商品和模板 | AD13 | 商品按品种分组、批量调价、关联知识库（A10–A11）；模板配方和手围预览（A12） | B-7、D1 | M |
| D7 内容 | AD10、AD11、AD14 | 评价审核（A15）、首页配置（A16）、文章、条款、分享管理、用户查询 | B-2–B-6 | L |
| D8 操作记录 | A14 页 | 操作记录（A14）；知识库改成 K1–K3、KD1–KD2，见 [16-knowledge-base.md](16-knowledge-base.md) | A8 | S |
| D9 清理 | AD8 | 删掉不再加载的旧后台脚本，或在 `admin.html` 留备用入口（负责人定） | D2 | S |

### E. 负责人和数据（只有负责人能做）

| # | 要定或要做的事 | 卡住哪些任务 |
|---|---|---|
| E1 | 珠子新单价（手工费并进单价后），给一张表：编号、新单价 | A3 |
| E2 | 售后规则并过法务：申请期限、制作中退款扣多少、寄回运费谁出 | A5 |
| E3 | 小程序企业认证、开通手机号快速验证（按次收费）；隐私保护指引加手机号 | A7 |
| E4 | 公众平台申请三个订阅消息模板 | B-10 |
| E5 | 隐私政策里写明 AI 对话记录保留多久 | B-12 |
| E6 | 微信支付商户号 | B-14 |
| E7 | 评价、晒图、AI 生成内容的合规要求（请法务） | B-2、B-8 |
| E8 | 商标、字标字体授权；珠子实拍图（先 40 种）；热门款名单和一句寓意 | C0、C4 |
| E9 | 体验环境要不要开模拟支付；待支付保留多久（推荐 24 小时）；签收几天自动确认（推荐 7 天） | A4、C7 |
| E10 | 后台四个角色的权限分配确认；谁是负责人账号 | A8 |
| E12 | 知识库搬进后台（16 号文档，简化版）：确认“编辑知识库”默认给负责人和运营；以后要不要加草稿发布、词典编辑、表格导入导出（16 第 3 节） | K3 |
| E11 | **已定（2026-11-13）：统一成小程序工作台那一份**。后端已改（`review/admin-workbench-fixes` 的 `10f3b78`），小程序模板排珠由卡 C0j 改；两边共用用例 `server/tests/fixtures/size_rule_cases.json`。原问题：小程序工作台排除隔片、金属珠和 6mm 以下的珠子；后端排模板只排除隔片（`review/admin-workbench-fixes` 的 `a25aa67` 让后台工单也跟了后端这份）。推荐统一成小程序那份，后端 `plans.target_mm` 跟着改，并补对照测试。AGENTS.md 说尺寸规则不能改，所以要你拍板 | 后台工单的目标长度、模板和 AI 配的颗数 |

## 4. 里程碑

| 里程碑 | 包含 | 过关条件 |
|---|---|---|
| **M0 打底**（约 1 周） | 推送分支、建 `integration/2026-11`、A0、A1、A2、D0；负责人开始准备 E1–E3 | 契约导出能用；订单接口带 `customerStatus`、`opsStatus`；后台能重新打包 |
| **M1 后端地基** | A3–A9（A3 等 E1，没来就先跳过） | 后端全部测试通过；用户订单、付款、发货、确认收货、售后退款整条用模拟支付走通 |
| **M2 两端改版** | C0–C8、D1–D6；C 和 D 可以同时做 | 小程序三条主流程在开发者工具里逐屏和稿子对上；后台做单、发货、售后能用 |
| **M3 新功能** | B-1–B-7、B-11、C9、C10、D7、D8 | 评价先审后发走通；首页由后台配置 |
| **M4 上线准备** | C11、D9、B-8–B-10、B-12–B-14、A10；E 全部 | 真机验证；法务意见落实；接入微信支付后关掉模拟支付 |

## 5. 每个任务交付时要给什么

沿用 AGENTS.md 的规矩，另加两条：
1. 分支：`agent/<任务号>-<简述>`，从 `integration/2026-11` 拉。不往 `main` 提交。
2. 三条测试都跑通（`python3 -m unittest discover -s server/tests`、`node --test miniprogram/tests/*.test.js`、`python3 kb/validate.py`）；改了后端接口的，`python3 tools/export_contract.py` 重新导出并提交。
3. 汇报：做了什么、改了哪些文件、测试结果、截图（和稿子并排）、**没做或没验证的部分**、有没有偏离设计。
4. 碰到产品意图不清楚的，停下来问，不要猜。

## 6. 分给谁的建议

| 线 | 需要的条件 | 建议 |
|---|---|---|
| A、B 后端 | 能跑 Python 测试 | 可以交给我（Claude）在本机做：能跑全部后端测试，但不能推送，需要负责人推送。也可以交给 Codex / Kimi |
| C 小程序 | 微信开发者工具、node | 交给 Codex / Kimi；负责人在开发者工具和真机上验收 |
| D 后台前端 | node（打包） | 交给 Codex / Kimi。这台机器上没有 node，我不能打包 |
| 审核 | — | 每个 PR 由我审：对照设计稿、契约、AGENTS.md 规矩 |
| E | — | 负责人 |

A 线是所有人的前置，建议先做 A0–A2；C0 和 D0 可以同时开工，它们不依赖后端。

## 附录：旧编号对照

| 旧编号 | 本文 |
|---|---|
| B1 | A3 |
| B2、B7、B9、B26、B28、B29、B31 | A4 |
| B3 | A6 |
| B4 | 已在 `review/admin-workbench-fixes` 修（用户订单不带工单、质检、操作人） |
| B5、B6、B27 | A5 |
| B8 | E9 + A4 |
| B10、B11、B13 | B-11 |
| B12 | B-13 |
| B14、B32 | B-2 |
| B15、B35 | B-4 |
| B16 | A9 |
| B17、B18 | E8 |
| B19 | B-8 |
| B20 | B-9 |
| B21 | B-10 |
| B22、B23 | E3、E2 |
| B24、B38 | B-5 |
| B25 | A7 |
| B30 | A2 |
| B33 | B-1 |
| B34 | B-3 |
| B36 | B-6 |
| B37 | B-7 |
| B39、B40 | B-12 |
| B41–B46 | A8 |
| D1–D41 | C0–C11（见 C 表“包含”一列） |
| AD1–AD18 | D0–D9（见 D 表“包含”一列）；AD5 改由后端 A2 做，AD7 并入 D3 |
