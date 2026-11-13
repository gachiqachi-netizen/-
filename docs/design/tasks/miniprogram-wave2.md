# 小程序任务卡 · 第二波及以后（页面）

> 派活批次见 [00-dispatch.md](00-dispatch.md) 第 2 节（第 5–9 批）。第一波的“共同规矩”全部适用（见 [miniprogram-wave1.md](miniprogram-wave1.md) 开头）。
> 提示词用 [01-agents.md](01-agents.md) 第 3 节的格式（省 token 的版本）。
>
> **第二波起多四条规矩，为的是能并行**：
> 1. **每张页面卡只改自己页面的文件夹**（加上卡片写明的测试文件）。新页面的空壳和 `app.json` 注册由 C1p 一次做完，页面卡不碰 `app.json`。
> 2. **请求后端写在自己页面的 js 里**，用现成的 `utils/api.js` 的 `request(path, data, method)`；不往 `utils/api.js` 里加函数（避免多张卡同时改它）。
> 3. **只用第一波做好的组件**（`c-sheet`、`c-bar`、`c-toast`、`c-state`、`c-bracelet`、`c-cell`、`c-design-row`、`c-bead`、`c-composer`、`c-wordmark`）和 `styles/components.wxss` 的类。缺组件就停下来问，不要在页面里另做一个长得差不多的。
> 4. **后端接口还没合并时**：按卡片写的“没有时怎么表现”做（大多是不显示那一块），PR 里写明“等 B-x 合并后再验”。
>
> 每张卡的“依据”就是它的全部需求：04 的那一节（布局、组件、文案逐字、反馈表、状态）+ 稿号 + 05 里对应 D 任务的“验收”。卡片里只写**容易做错的地方**和**接口**。

---

## C1p 新页面空壳和注册

- **依赖**：C0z　**大小**：S　**这张卡做完，后面的页面卡才能并行**

**只能改**：`miniprogram/app.json`（`subPackages` 里 `features` 的 `pages`）、`miniprogram/tests/package-config.test.js`、新建下面每个页面的四个文件（`.js/.json/.wxml/.wxss`，内容只有标题和一行“这一页由卡 Cxx 做”）。

新页面（都在 `features` 分包，路径照 04 第 0.1 节）：`works/works`（C4b）、`reviews/reviews`（C4c）、`doc/doc`、`article/article`（C4d）、`orders/orders`（C8b）、`logistics/logistics`（C8c）、`address/address`（C8a）、`address-edit/address-edit`（C8a）、`after-sale/type`、`after-sale/apply`（C9a）、`after-sale/detail`、`after-sale/return`（C9b）、`review/review`（C9c）、`settings/settings`（C10a）。

`package-config.test.js` 里写死的 `features` 页面清单改成新的完整清单（这是清单变了，不是改规则）。主包不加页面。

**验收**：开发者工具里每个新页面都能打开（截一张页面列表）；三条测试通过。

---

## C1a 手机号登录页（原 D11 后半）

- **依赖**：A7、C1p　**依据**：04 第 22.1 节、稿 77–79、05 D11

**只能改**：`miniprogram/pages/login/*`、`miniprogram/utils/auth.js`、`miniprogram/tests/auth.test.js`、新建 `miniprogram/tests/login-page.test.js`。

**容易做错的地方**
- 主按钮和协议弹层的“同意并继续”**都必须是** `<button open-type="getPhoneNumber" bindgetphonenumber="onPhone">`；拿到 `e.detail.code` 调 `POST /api/auth/phone`。不做输入手机号和验证码。
- 协议勾选框默认不勾；没勾就点主按钮时升起 `c-sheet`（稿 78）。
- `auth.goLogin(next)`：`next` 是登录成功后要做的事（`{ type: 'submitOrder' | 'navigate', ... }`），存进页面栈参数；登录成功后自动执行 `next`，**不让用户再点一次**。
- 微信弹窗点“拒绝”（`e.detail.errMsg` 含 `deny` 或没有 `code`）：按钮下面一行灰字“没拿到手机号，可以再点一次，或先逛逛”，不弹窗。
- 逛、自己串、AI 配、拍照、试戴、看我的作品都**不能**触发登录。
- 开发版：后端在开发环境接受 `dev-` 开头的假 code，开发者工具里拿不到真 code 时用它测（只在 `envVersion === 'develop'` 时）。

**验收**：05 D11 的验收 1–5。

---

## C1b 页面跳转（原 D13）

- **依赖**：C1p　**依据**：05 D13、04 第 0 节“从别的页面进工作台”

**只能改**：`miniprogram/utils/nav.js`、`miniprogram/tests/nav.test.js`、删除 `miniprogram/pages/ar-tryon/`（跳板页）并从 `app.json` 去掉它（**这张卡可以改 `app.json` 的这一行**）。

**容易做错的地方**：工作台是 tab 页，不能带参数跳转——先把要打开的设计写成“当前草稿”，再 `wx.switchTab`；当前草稿里有没保存的改动时，先自动存进我的作品并浮动提示“原来那条已存到我的作品”。手围没量过时默认 15cm 并明说，只在第一次去下单时确认一次。

---

## C3 工作台（原 D15–D18，拆成四张，串行）

四张都改 `miniprogram/pages/diy/*`，**必须串行**：C3a → C3b → C3c → C3d。

### C3a 工作台布局、选珠、全屏（原 D15）

- **依赖**：C0z、C0j、C1b　**依据**：04 第 2 节布局、稿 08–11、05 D15

**只能改**：`miniprogram/pages/diy/*`、`miniprogram/pages/editor/*`（只搬逻辑）、`miniprogram/app.json`（`pages/diy/diy` 设 `navigationStyle: custom`；删 `pages/editor/editor`）、原编辑器相关测试的 `require` 路径。

**第一步先评估，再动手**：把 `pages/editor/editor.js` 的逻辑搬进 `pages/diy/diy` 要改多少行，在 PR 里先写评估（文件、行数、风险），**超过 600 行就停下来问**，可能改成把编辑器抽成组件由工作台引用。

**容易做错的地方**
- 全屏：`onShow` 隐藏 tabBar、`onHide` 恢复；左上返回调 `nav.backFromWorkbench`。
- 状态行的文字只用 C0d 的 `fitText`，量尺位置用 `meterPos`，**不另写尺寸判断**。
- 原编辑器的测试（`editor-gestures`、`material-picker`、`design-reflow`、`creation-flows`、`size-rule`、`size-rule-shared`）只改 `require` 路径，**断言一个都不改**。

### C3b 工作台每一步的反馈（原 D16）

- **依赖**：C3a　**依据**：04 第 2 节反馈表、稿 10–14、05 D16

**只能改**：`miniprogram/pages/diy/*`、新建 `miniprogram/pages/diy/feedback.js`、`miniprogram/tests/workbench-feedback.test.js`。

反馈表每一行都要做；“什么操作 → 什么提示文字”抽成 `feedback.js` 里的纯函数并逐行测试。第一次加有安全提示的珠子（朱砂等）先出弹层（文字逐字取目录里的 `safety`），珠子格上**不加任何标记**。浮动提示用 `c-toast`，删掉这个页面里的 `wx.showToast`。

### C3c 叠戴、起名、“更多”、托盘放大（原 D17）

- **依赖**：C3b　**依据**：04 第 2 节、稿 15–17、05 D17

叠戴只换托盘（`c-bracelet` 的 `stack` 模式），选珠区和底部栏都还在；起名弹层的推荐名只用所选珠子的 `tags`，过 banned 词表（复用 `tools/check-copy.py` 的词表文件，前端读 `kb/data/attributes.json` 不行的话，请后端把词表放进 `/api/meta/contract`——**先停下来问**）。

### C3d 珠子选规格弹层（原 D18）

- **依赖**：C3c　**依据**：04 第 3 节、稿 18、05 D18

新建 `miniprogram/components/bead-sheet/*`，在工作台里长按珠子格打开。大图一期放三张（珠子、细节、戴在手上），没有实拍图用 `c-bead` 的仿真球。提示“加 3 颗刚好合适”用 C0d 的函数算。**不建独立的珠子详情页。**

---

## C4 逛和看（四张，可以并行）

### C4a 首页（原 D14）

- **依赖**：C0z　**依据**：04 第 1 节、稿 01–04、05 D14　**只能改**：`miniprogram/pages/home/*`

沿用原首页结构（轮播、四个能力入口、热门款、珠子小知识），只换视觉。数据：`/api/catalog` 的 `banners`、`templates`（B-5 合并后按 `homeOrder`）、`homeArticles`（B-4、B-5 合并后才有，没有时不显示“珠子小知识”这一块）。“按你的 15cm 手围排好”用 `utils/template.js` 的 `build` 按用户手围重排。款式没加载出来：只把热门款那一块换成失败提示，轮播和入口照常（09 第 37 条，**不叠骨架**）。

### C4b 我的作品（原 D19）

- **依赖**：C1p、B-11c（删除）　**依据**：04 第 4 节、稿 19–20　**只能改**：`miniprogram/features/works/*`

不需要登录，先显示本机的；登录后同步。删除不弹确认，浮动提示“已删除 ／ 撤销”。B-11c 没合并时只删本机并写明。

### C4c 手串详情和全部评价（原 D22）

- **依赖**：C1p　**依据**：04 第 6 节、稿 28–31、05 D22　**只能改**：`miniprogram/pages/finish/*`、`miniprogram/features/reviews/*`

电商详情结构：轮播（左下“戴上看看”）→ 价格卡 → 已选 / 配送 / 服务 → 评价（只有热门款有；B-2 合并前不显示这块）→ 详情（每一颗的寓意 + 实拍图，**不放佩戴与保养**）→ 底部栏（改一改、立即下单；**不放客服**）。缺货写在“已选”那一行，主按钮变“换一颗再下单”。全部评价页：全部 / 有图 / 手围相近三栏，底部栏能直接下单。

### C4d 规则文字页和内容页（原 D37）

- **依赖**：C1p、B-4　**依据**：04 第 24、25 节、稿 81、05–07　**只能改**：`miniprogram/features/doc/*`、`miniprogram/features/article/*`

内容页从三处进：首页小知识（有底部按钮）、签收后的“怎么戴、怎么保养”（没有底部栏）、设置的“关于珠养养”（没有底部栏）。题图没有时画这颗珠子（`c-bead` 大号）。规则文字页读后端条款（`/api/terms/...`，看后端现有接口名，没有就停下来问）。

---

## C5 AI 配和拍照（三张，可以并行）

### C5a AI 配对话和推荐卡片（原 D20）

- **依赖**：C0z、B-8　**依据**：04 第 5 节、稿 21、23、24、26、05 D20　**只能改**：`miniprogram/pages/ai/*`

首屏只有一句标题和三个示例（左对齐、同宽整行）；回复 = 一条消息 + 一行三张卡片（第二张露一截，上方“1 / 3 左右滑看另外两条 ›”）；时间行只在隔 5 分钟以上或跨天时出现；导航栏左边“新对话”。**卡片上的名字、价格、颗数长度只用后端 B-8 返回的字段，消息文字不显示模型写的数字。** B-8 没合并时卡片只显示一张（旧接口）。

### C5b 语音和照片（原 D21）

- **依赖**：C5a；**负责人选好语音识别服务**　**依据**：稿 22、25、27

语音识别服务没定之前，`c-composer` 的 `voice` 设为 false（语音键不显示）；照片走 B-1 上传。**服务没定时这张卡只做照片那一半。**

### C5c 拍照做同款（原 D23）

- **依赖**：C0z、B-1、B-9　**依据**：04 第 7 节、稿 32–37、05 D23　**只能改**：`miniprogram/pages/photo/*`

结果页是**核对页**，不套手串详情结构：照片和复原对照、认出来的珠子（`confidence < 0.6` 标“可能不准 / 换一颗”）、“不太像？重拍一张”、底部“放到工作台改 / 就要这条”。B-9 没合并时不显示“可能不准”。

---

## C6 试戴、AR、手围（三张，可以并行）

- **C6a 试戴**（原 D24）：`features/tryon/*`；依据 04 第 8 节、稿 38–39。舞台下写“戴的是 某某　换一条 ›”；从首页进来默认最近看过或串过的那条。
- **C6b 实时 AR**（原 D25）：`ar-hand/*`；依据 04 第 9 节、稿 40–42。只改样式和下载进度页、失败页，不改识别逻辑。
- **C6c 手围**（原 D26）：`pages/wrist/*`；依据 04 第 10 节、稿 43–44。改了手围回到原页面时浮动提示“已按 16cm 重新判断”。

---

## C7 下单和付款（两张，串行）

### C7a 确认订单（原 D27、D28）

- **依赖**：C0z、C1a（提交时没登录要进登录页）　**依据**：04 第 11 节、稿 45–50、05 D27–D28　**只能改**：`miniprogram/pages/order/*`

勾选只有一个，贴着提交按钮；没有第二次确认弹层；金额只显示后端报价的数（`toHand`）；改价弹层“按新价格提交”后要用户自己再点提交。提交时没登录：`auth.goLogin({ type: 'submitOrder' })`，回来自动提交。

### C7b 付款、付款成功、订单详情（原 D30）

- **依赖**：C7a、C2、A4b　**依据**：04 第 11–12 节、稿 51–59、05 D30　**只能改**：`miniprogram/pages/order/*`（只加付款那一段）、`miniprogram/features/order-detail/*`

**付款流程（最容易做错）**：提交订单成功后马上调 `POST /api/my/orders/{no}/pay`。返回 `payment.mock === true` 时弹模拟支付层（稿 51，`c-sheet`，写明“体验版，不会真的扣款”），点“支付成功 / 支付失败”调 `POST /api/payments/mock/notify`；否则用返回的参数调 `wx.requestPayment`。**付款成功与否以后端为准**：支付完重新拉一次订单（`GET /api/my/orders/{no}`），看 `paymentStatus`，前端不自己改状态。成功进付款成功页（稿 52），没成功进订单详情 · 待支付（稿 53，主按钮“去支付”）。订单详情的标题、一句话、按钮只用 `customerStatus`、`progress`、`allowedActions`（C2 已做）。

---

## C8 订单周边（三张，可以并行）

- **C8a 地址簿和编辑地址**（原 D29）：`features/address/*`、`features/address-edit/*`；依赖 B-11a；依据 04 第 15、21 节、稿 64、73。表单用列表行；出错在对应行下面一行红字。
- **C8b 我的订单**（原 D31）：`features/orders/*`；依赖 A6；依据 04 第 13 节、稿 60–62。分栏按 `customerStatus.code` 归类（待收货 = 运输中 + 已签收）。
- **C8c 物流详情和发货前改地址**（原 D32）：`features/logistics/*`；依赖 A4b（改地址接口）、B-13（轨迹，没合并时只显示单号和复制）；依据 04 第 14、15 节、稿 63–64。

---

## C9 售后和评价（三张）

- **C9a 选择售后类型、填写申请**（原 D33）：`features/after-sale/type`、`apply`；依赖 A5a、B-1；依据 04 第 16–17 节、稿 65–66。能选哪些类型、原因列表**都用后端给的**（A5a 的 `customer_after_sale_types` 和契约里的 `afterSaleReasons`），金额只读后端算的。
- **C9b 售后详情、填写寄回单号**（原 D34）：`features/after-sale/detail`、`return`；依赖 C9a、A5b；依据 04 第 18–19 节、稿 67–71。只有“协商历史”一种进度表达。
- **C9c 评价**（原 D35）：`features/review/*`；依赖 B-2、B-1；依据 04 第 20 节、稿 72。机审不过时显示后端给的原因；匿名默认开。

C9a、C9c 可以并行；C9b 等 C9a。

---

## C10 我的和分享（两张，可以并行）

- **C10a 我的和设置**（原 D36）：`pages/mine/*`、`features/settings/*`；依赖 C1a；依据 04 第 22–23 节、稿 74–76、80。没登录时顶部是“手机号快捷登录 ›”；我的作品不要求登录。客服行等负责人定（README 待确认第 17 条），没定之前不显示。
- **C10b 分享海报和分享落地页**（原 D38、D39）：`pages/share/*`、`features/shared/*`；依赖 B-3、C3a；依据 04 第 26–27 节、稿 82–84。落地页是**作品页**，不是商品详情：没有价格、配送、服务、评价；“照这条串一条”按看的人的手围排好放进工作台。

---

## C11 收尾（两张，最后做，串行）

- **C11a 清理**（原 D40）：删 `pages/editor`、`kit` 分包、旧样式类、所有 `wx.showToast` / `wx.showModal`；`tools/check-copy.py` 跑一遍没有问题。改 `app.json`。
- **C11b 全流程回归**（原 D41）：三条主流程（05 D41）在开发者工具和真机上逐屏截图，和稿子并排；每屏数颜色和按钮。只出报告，不改代码；发现的问题列清单给我。
