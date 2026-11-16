# 真机走查修改卡 U1–U11（2026-11-16，负责人走完三条主流程后）

> 共同规矩：照 `02-prompts.md` 的总提示词做；测试放 `miniprogram/tests/` 或 `server/tests/`；对照设计稿用 `python3 docs/design/tasks/screen.py s<屏号>`（后台 `A<屏号>`）；颜色、字号、圆角只用 C0a 的变量（`styles/tokens.wxss`），不写新颜色；尺寸规则 `pages/diy/logic.js` 一个字不能改；金额整数分；用户看到的文字只讲寓意、不出现英文代码。
> 每张卡只改自己列出的文件；要动别的文件先停下来问。**U1–U11 都要等 T1、U0 合并后再做**：页面一律用 U0 的 `c-page`、`c-card`、`c-cell`、`c-bar`、`c-nav-bar` 拼，不自己画；交付前跑 `python3 tools/check-ui.py` 必须通过；用 T1 的脚本截改前改后（`--only` 本卡涉及的页），截图提交到 `docs/reports/shots/<卡号>/`，报告里贴出来。
> 状态修复已合并（e04a7e0），U5、U8、U9 不用再等它。
> U0 组件用法：页面注册并使用 `c-page`、`c-card`（标题放 `slot="title"`）、`c-cell`、`c-nav-bar`；`c-bar` 通过 `layout="price"`（左侧 `slot="left"` + 默认按钮）、`layout="dual"`（`slot="secondary"` + 默认按钮）、`layout="agreement"`（上方 `slot="top"`、左侧价格和默认按钮）选择三种底部栏。

## T1 自动截图（底子卡，先做）

- **依赖**：无　**谁做**：在装了微信开发者工具的那台电脑上做　**只能改**：新建 `tools/shoot/`（`package.json`、`shoot.js`、`pages.json`、`README.md`）；`.gitignore` 加 `tools/shoot/node_modules/`
- **为什么**：执行者一直看不到页面，样式全靠猜。这张卡做一个脚本，自动打开小程序各页并截图，以后每张界面卡交付都附改前改后截图。
1. 用微信官方的 `miniprogram-automator`（只装在 `tools/shoot/` 里，写进它自己的 `package.json`，不加到小程序或后端的依赖）。开发者工具要先在“设置 → 安全设置”里打开“服务端口”；CLI 路径（macOS 默认 `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`）用环境变量 `WECHAT_DEVTOOLS_CLI` 可改，写进 README。
2. 前提：本地服务按 README 起在 8801（`DEV_LOGIN=1`、`PAYMENT_PROVIDER=mock`、`DEMO_ORDERS=1`、临时 `DATA_DIR`）。脚本先用开发版登录、造好演示数据（一个模板作品、一笔待支付订单、一笔已签收订单、一条售后、一条评价），造数据只调现有接口，不改后端。
3. `pages.json` 列出要截的页：首页、工作台、手串详情、AI 配（发一句话后）、确认订单（含送礼弹层打开）、下单成功、订单详情（待支付、运输中、售后中各一张）、我的订单、我的、写评价、选择售后类型、申请售后、售后详情、好友落地页、分享海报、编辑地址。每页写清路径、参数和截图前要做的操作。
4. 运行 `node tools/shoot/shoot.js --out docs/reports/shots/<卡号>/<before|after>`：按 iPhone 13（390×844）截图，文件名用页面名，比如 `order-confirm.png`；`--only order-confirm,order-detail` 只截指定页。
5. 截图很小（每张压到 300KB 以内），可以提交进仓库。本卡自己跑一遍，把全量截图提交到 `docs/reports/shots/T1/`，作为现状基线。
6. 报告写清楚：第一次配置要负责人点哪里、跑一次要多久、哪些页截不出来和原因。

## U0 统一版式组件和样式检查（底子卡，先做）

- **依赖**：无　**只能改**：`miniprogram/components/` 下新建 `page/`、`card/`、`nav-bar/`，改 `bar/`、`cell/`；`miniprogram/styles/components.wxss`；新建 `tools/check-ui.py`、`tools/check-ui-baseline.json`、`miniprogram/tests/ui-components.test.js`。**不改任何页面**（页面由 U1–U11 换成用这些组件）。
- **为什么**：`styles/tokens.wxss` 早就定好了颜色、字号、间距、圆角（能点的胶囊、只看的直角、页面左右边距 40rpx、按钮高 104rpx），但各页没按它写，自己画了圆角大卡片、乱写间距。
1. 组件，尺寸只用 tokens 变量，不接受页面传颜色和尺寸：
   - `c-page`：页面底色、左右边距 `--sp-base`、底部给固定按钮栏留出高度（含安全区）。
   - `c-card`：白底、直角（`--r-panel`），区块之间 `--sp-section`；有标题插槽。
   - `c-cell`（已有，补齐）：左标题、右内容、可选箭头和开关，行高 `--h-row`；开关是黑白的，不用微信默认绿色。
   - `c-bar`（已有，补齐）：底部固定栏，支持“左边价格 + 右边主按钮”“两个按钮”“上面一行勾选 + 下面一行价格和按钮”三种布局；按钮高 `--h-btn`、胶囊圆角；适配底部安全区。
   - `c-nav-bar`：自定义导航栏，用状态栏高度和右上角胶囊位置算布局，标题和胶囊垂直对齐；左边“返回”或“回首页”图标（C0b 图标、无灰底）。
2. `tools/check-ui.py`：扫 `miniprogram/**/*.wxss`（跳过 `styles/tokens.wxss`）：写死的颜色（`#xxx`、`rgb()`）、`font-size` 不是 tokens 变量、`border-radius` 不是 tokens 变量，都报出来。现有的违规全部记进 `check-ui-baseline.json` 作为基线，基线里的不报错，**新增的违规直接失败**。以后每张界面卡交付前必须跑过，并且基线只能减不能加。
3. 测试：组件渲染出的类名和变量正确（node 测试读 wxss、wxml 文本断言即可）；`check-ui.py` 对一个故意写了 `#ff0000` 的临时文件报错。
4. 在 `docs/design/tasks/followups-ui.md` 开头的共同规矩后面补一句用法说明（组件名、三种底部栏怎么写），这一处可以改。

## U1 手串缩略图和隔珠画法（共用组件）

- **只能改**：`miniprogram/components/bracelet-thumb/*`、`miniprogram/components/bracelet/*`、`miniprogram/tests/` 里对应测试
- 现象：确认订单、AI 配卡片、“我的”页最近订单里的小手串画成一团、溢出盖住旁边文字；工作台和详情页的银色隔珠画得和主珠一样大、一样白；详情页手串正中的“珠养养”水印压在珠子上。
- 要求：珠子直径按容器尺寸和颗数缩放，整串永远在容器内、不溢出（容器 `overflow: hidden`）；隔片、金属件按自身 `mm` 画小、用金属色（照分享海报的画法）；水印放到图片右下角或去掉，不压珠子。补测试：容器 80px、颗数 19 和 40 时，算出的珠子直径和圆周都在容器内。

## U2 顶部导航栏

- **只能改**：用到自定义导航栏的页面（导航组件 `c-nav-bar` 由 U0 做好，本卡只把页面换成用它）的 `.json` 和导航那几行 wxml：`pages/diy/*`、`features/order-detail/*`、`features/shared/*`、`features/review/*`
- 现象：工作台“我的作品 >”压在状态栏上；订单详情、好友落地页左上“回首页”是灰色圆圈，落地页“首页”两个字掉到导航栏下面；写评价页出现两个标题（微信自带一个、页面自己画一个）。
- 要求：这几页的自定义导航全部换成 U0 的 `c-nav-bar`；不需要自定义导航的页面（写评价）去掉自己画的标题，只用微信自带的。

## U3 首页

- **只能改**：`miniprogram/pages/home/*`、`server/seed.py` 里宣传位的文案
- 现象：宣传位写“首单立减 ¥10”，系统没有这个优惠；热门款卡片第二行开头被切掉，价格行被截断。
- 要求：示例宣传位改成不承诺优惠的文案（比如“自己设计的手串，师傅手工串好寄到家”），不写任何减价；热门款卡片文字左对齐、在卡片内边距里，名字一行、寓意一行省略号、价格一行，照稿 s01–s04。

## U4 确认订单

- **只能改**：`miniprogram/pages/order/*`
- 现象：底部栏“我已阅读…”、价格、“提交订单”挤成一行，按钮被挤出屏幕；送礼弹层“礼盒 +¥10”“隐藏价格”旁边没有开关；弹层“好了”按钮不居中。
- 要求：底部栏两行：上面一行是勾选和协议链接，下面一行左边价格、右边提交按钮，按钮完整显示；送礼弹层两行都用 `c-cell` 带开关（开关黑白，不用微信默认绿色）；“好了”整行宽。

## U5 订单详情和下单成功页（等状态修复）

- **只能改**：`miniprogram/features/order-detail/*`
- 现象和要求：
  1. 金额区补“手工费”一行（取订单报价里的 `handworkFen`，为 0 时不显示），珠子 + 手工费 + 运费 = 实付。
  2. 下单时间显示成“2026-11-16 13:22”（按北京时间），不显示毫秒数字。
  3. 商品行左边显示手串缩略图（用 U1 的组件），名字和“19 颗 · 手围 15cm”在右边左对齐、不折行。
  4. 订单状态是售后中（`customerStatus.code` 以 `after_sale` 开头）时，显示“查看售后 ›”，进售后详情（`features/after-sale/detail?no=售后编号`，用 C9b 的 `GET /api/my/orders/{no}/after-sales` 取最新一条）。
  5. “确认收货”“写评价”“去付款”这类主要动作放到页面底部固定的主按钮，其余（查看物流、再串一条、申请售后）留在列表里；按钮文字从契约取。
  6. 整页样式照稿（电商卡片：白底卡片、浅灰页面背景，不要灰卡片套白底）；下单成功页下面加“你可能还喜欢”之类不要做，只把成功卡片放在页面中上部、背景统一即可。

## U6 AI 配页

- **只能改**：`miniprogram/pages/ai/*`
- 现象和要求：消息时间按北京时间显示（现在差 8 小时）；方案库兜底的卡片也显示“N 颗 · X.Xcm”（没有长度就只显示颗数）；去掉右侧露出的滚动条（`scroll-view` 的 `show-scrollbar="{{false}}"` 或样式隐藏）；左上“新对话”和标题垂直对齐。

## U7 分享海报和好友落地页

- **只能改**：`miniprogram/pages/share/*`、`miniprogram/features/shared/*`
- 现象和要求：落地页寓意行只显示最多 3 个寓意关键词（现在把知识库长句子串在一起，还以“· 点缀”结尾），关键词取法照 C10b 的纯函数；海报文字换行时不让逗号、句号出现在行首（避头尾）；“保存图片”在真机上验证，失败时提示“没有相册权限，去设置里打开”并给按钮调 `wx.openSetting`；“准备分享”按钮名对照稿改（稿上没有就改成“分享给好友”）。

## U8 我的订单和“我的”页（等状态修复）

- **只能改**：`miniprogram/features/orders/*`、`miniprogram/pages/mine/*`
- 现象和要求：
  1. **我的订单列表仍然是空的**（T1 截图 `docs/reports/shots/T1/my-orders.png`：分栏“全部 5”，列表“这里没有订单”）。原因：`orders.wxml` 里写了 `wx:elif="{{!visibleRows().length}}"`，WXML 不能调用页面方法，表达式永远为空，所以总是显示空态，列表也没渲染。改法：在 `orders.js` 里算好当前分栏的数组放进 data（比如 `visible`），加载、切分栏、确认收货后都更新它，wxml 只读 `visible`。补测试：5 笔订单，切每个分栏后 `data.visible` 的条数和分栏数字一致。e04a7e0 的测试只测了 rows，没覆盖到这里。
  2. “我的”页头像位置是灰色大椭圆，改成圆形头像（没头像用 C0b 的默认图标）。

## U9 售后页面（等状态修复）

- **只能改**：`miniprogram/features/after-sale/*`
- 现象和要求：选择售后类型页“实付 ¥”后面没有金额，补上；售后详情页顶部状态标题被导航栏盖住一半；申请时间显示成毫秒数字，改成“2026-11-16 13:29”；商品缩略图只露出半个手串（用 U1 的组件）；申请页“照片”的加号按钮是一个大椭圆，改成圆形加号（照 03 设计规范：加照片的格子能点，用圆形；和评价页的“加照片”一样，直径 120rpx 左右）；已经选好的照片缩略图是直角方格。

## U10 写评价页和编辑地址页

- **只能改**：`miniprogram/features/review/*`、`miniprogram/features/address-edit/*`
- 现象和要求：评价页商品缩略图是空灰框（用 U1 的组件）；“匿名评价”开关改成黑白（不用微信默认绿色）；匿名说明和后端一致（后端匿名昵称是“X*”的写法，页面写“昵称显示成‘X*’”或照后端实际返回改）；编辑地址页底部“发货后不能在这里改，请联系客服”改成“发货后不能修改地址”（客服还没定）。标题重复的问题由 U2 处理，这张卡不碰导航。

## U11 后台售后和评价的显示（后台卡，不用等 T1、U0）

- **只能改**：`admin-web/src/pages/afterSales/*`、`admin-web/src/pages/reviews.tsx`
- 现象和要求：售后详情“联系电话”显示“—”，但用户填了电话：读售后记录里的 `contactPhone`，按 A8c 规则打码（没有 `view_full_contact` 权限显示 `140****0000`）；协商历史里的操作人显示成英文 `customer`，改成“用户”（`admin` 改成账号名字，`system` 改成“系统”）；“退款金额：169.00（后端算好）”去掉括号里的开发说明，金额显示“¥169”；评价审核抽屉的“驳回”“通过并公开”改成正式按钮（主按钮黑底、驳回次按钮），布局分块照 A15。

## U12 隐藏滚动条（2026-11-16 补）

- **依赖**：无（和 U5、U9、U10 不改同一批文件，可以并行）　**只能改**：`miniprogram/app.wxss`、`miniprogram/components/sheet/index.wxml`、`miniprogram/pages/ai/ai.wxml`、`miniprogram/pages/diy/diy.wxml` 里 `<scroll-view>` 标签的属性、`miniprogram/tests/` 里新增一个测试
- 现象：工作台已选珠子、分类、珠子列表、AI 对话、弹层内容滑动时露出灰色滚动条。
1. `app.wxss` 加全局隐藏：`::-webkit-scrollbar { display: none; width: 0 !important; height: 0 !important; background: transparent; color: transparent; }`（页面滚动和没开 enhanced 的 scroll-view 都生效）。
2. 上面几处 `<scroll-view>` 都补上 `enhanced show-scrollbar="{{false}}"`（已经有的不动）。只改标签属性，不改别的。
3. 测试：扫 `miniprogram/**/*.wxml`，每个 `<scroll-view` 都带 `show-scrollbar="{{false}}"` 和 `enhanced`；`app.wxss` 里有 `::-webkit-scrollbar`。以后新增的 scroll-view 漏写会直接测出来。
4. 截图：工作台（珠子列表滑动一下再截）、AI 配、确认订单弹层打开时，改前改后各一张。

## U13 图片和卡片的形状统一（2026-11-16 补）

- **依赖**：U5、U9、U10 合并后再做（它们也改订单、售后、评价页的样式，避免撞车）　**只能改**：`miniprogram/components/card/*`、`miniprogram/components/nav-bar/*`、`miniprogram/components/page/*`（见第 0 条）、`miniprogram/pages/` 和 `miniprogram/features/` 下各页的 `.wxss`（只改 `border-radius`、卡片间距、背景这类形状相关的样式），`tools/check-ui.py`、`tools/check-ui-baseline.json`、`miniprogram/tests/` 里对应测试
- **规矩**（03 设计规范 3.3 节，早就定了，各页没照做）：**能点的是圆的，只用来看的是方的。**
  - 直角（`--r-panel`）：照片、宣传位图片、款式格、商品缩略图、文章题图、整块版面、列表、弹层。
  - 胶囊或圆形（`--r-pill`）：按钮、输入条、标签、发送键、头像、加减键、加照片的格子。
  - 首页两列款式格：两格之间只留 2rpx 的缝（露出分隔色），没有圆角、没有阴影；宣传位是直角通栏图。
  - 例外只有两个：AI 配的推荐卡片和输入区，沿用圆角卡（04 第 0 节写明的）。
- 要做的：
  0. `c-card` 现在没有内边距，卡片里的字贴着卡片边（U5、U9 截图里很明显）：给 `c-card` 加内边距 `--sp-base`（左右）和 `--sp-tight`（上下），各页面里为了凑边距自己加的 padding 一并去掉。
  0b. `c-nav-bar` 现在会跟着页面一起滚走，滚动后页面内容压到状态栏上（U9 截图 after-sale-apply-bottom.png）。导航栏改成固定在顶部（`position: fixed`），`c-page` 顶部留出导航栏的高度。
  1. 全部页面过一遍，把图片、宣传位、款式格、缩略图、题图上的圆角改成直角；首页宣传位、热门款照上面的规矩改。
  2. 把“加照片”的格子统一成圆形（评价、申请售后、拍照做同款里如果有）。
  3. 扩展 `tools/check-ui.py`：选择器名里带 `image`、`img`、`photo`、`banner`、`cover`、`thumb`、`grid`、`swiper` 的规则，如果用了 `--r-pill` 或数值圆角，就报错（AI 卡片的类名加进例外名单）。改完的页面从基线里删掉对应条目，基线只减不加。
  4. 截图：首页、手串详情、我的作品、文章页、我的订单、写评价，改前改后各一张。
