# 03 UI 设计规范与组件规范

> 配套文件：[tokens.wxss](tokens.wxss)（可直接落地的变量）、[mockups.html](mockups.html)（用同一组变量画的高保真稿，图标源稿也在里面）。
> 本文是唯一的视觉依据。和 `prototype.html` 的样式冲突时，以本文为准（`prototype.html` 继续当功能参照）。

## 1. 视觉方向：素纸朱砂

**一句话**：米宣纸色的底、墨色的字、浅绒布托盘上的珠子；朱砂红只当“印章”用。

### 1.1 为什么是它

现在的界面（`miniprogram/app.wxss`）是纯白底 + `#c8302e` 红 + `1rpx solid #eee` 描边卡片，问题有三个：

1. **珠子没有被衬托**。托盘底色 `#faf9f8` 和页面白底几乎一样，木、玉、水晶这些有温度的材质放在冷白上发灰，看不出质感。卖的是珠子，珠子必须是页面上最好看的东西。
2. **红色用滥了**。主按钮、选中、价格、标签、开关、滑杆、角标全是红，安全提示也是红（`.material-safety{color:#c62828}`）。结果是最该被看见的“朱砂含汞”提示，和“¥128”长得一样。大面积的电商红也是“廉价感”的主要来源。
3. **没有规矩**。98 种颜色、19 种字号、13 种圆角，页面之间对不齐。

“素纸朱砂”对这三点各给一个答案：

| 问题 | 答案 |
|---|---|
| 珠子不出彩 | 页面底用暖的纸色 `#f5f1ea`，托盘用更深一档的绒布渐变，珠子自己的高光和投影在暖底上立得住。界面本身不抢色 |
| 红色用滥 | **朱砂只做三件事**：主按钮、选中态、tab 选中。价格用墨色配 DIN 数字；标签用中性色。**红色文字全站只留给安全警示和错误** |
| 没规矩 | 颜色 30 个变量、字号 7 档、间距 8 档、圆角 5 档，写进 `tokens.wxss`，页面里不许再出现字面量 |

**东方手作感从哪来**：纸色、墨色、朱砂、松绿、琥珀、黛蓝、鎏金，这组颜色本身就是文房和矿物色；展示标题用宋体（系统自带，不加载字库）；标签用小圆角的“签条”形状。**不用**的东西：祥云、回纹、仿古边框、毛笔字、大红大金渐变。这些是“土”的来源。

**不廉价从哪来**：留白（页面边距 32rpx、区块间距 48rpx）、克制的颜色、统一的圆角、数字用等宽的 DIN、卡片不描边不投影、图标是一套 1.5 描边的线性图标。

### 1.2 T13 逐项结论

`docs/codex-tasks.md` 的 T13 留了五个没定的问题，这里全部定下：

| T13 的问题 | 结论 | 说明 |
|---|---|---|
| 托盘底色（现在接近纯白，原规范是浅色绒布渐变） | **用绒布渐变，但换成暖色** | `radial-gradient(circle at 50% 42%, var(--c-tray-a), var(--c-tray-b))`，即中心 `#fbf8f2` 到边缘 `#e9e2d5`。所有放手串、放珠子的底都用它（类名 `.c-tray`）。`components/bracelet3d/index.wxss` 里写死的 `background:#faf9f8` 改成它 |
| 卡片描边（现在加了 `1rpx #eee` 边框，原规范不加） | **不加描边，也不加阴影** | 卡片靠“纸色底 `--c-bg` 上的白卡面 `--c-surface`”的明度差分层。发丝线 `--c-line` 只用在：卡片内部的分隔、输入框和未选中筹码的边 |
| 语音按钮用 emoji `🎙` | **全站不用 emoji 和字符当图标** | 换成线性 SVG（24 网格、1.5 描边、圆角端点）。语音按钮本身删掉（功能没有），等做了语音识别再加。要替换的字符还有 `⊕ ✧ ▣ ◎ ↑ ↶ › ···`，清单见第 4.2 节 |
| 编辑页把“名称与寓意”“按颗数串”折叠 | **保留折叠，合成一个“手串设置”弹层** | 低频操作收起是对的。但**尺寸量尺必须常驻**，不能折叠（它是高频且最容易出错的）。现有的“设计设置”和“个性选择”两个弹层合并，见 [02 第 2 节](02-core-flows.md) |
| “去下单”前加了“完成设计”页 | **保留，升级成“手串详情”页** | 路由不变（`pages/finish/finish`）。它不只是编辑器的下一步，而是每条手串的详情：热门款、AI 方案、我的作品都先到这里，见 [01 第 2.2 节](01-information-architecture.md) |

## 2. 设计 token

变量名和取值以 [tokens.wxss](tokens.wxss) 为准，下面是说明和使用规则。

### 2.1 颜色

| 变量 | 浅色 | 深色 | 用途 |
|---|---|---|---|
| `--c-bg` | `#f5f1ea` | `#151311` | 页面底（米宣纸色） |
| `--c-surface` | `#fffdfa` | `#1f1c19` | 卡面、底栏、弹层、导航栏 |
| `--c-sunken` | `#efeae1` | `#282420` | 凹陷区：输入框底、分类栏、步进器底 |
| `--c-tray-a` / `--c-tray-b` | `#fbf8f2` / `#e9e2d5` | `#332e28` / `#1b1815` | 托盘绒布渐变的中心 / 边缘 |
| `--c-line` | `#e6dfd3` | `#36312b` | 发丝分隔线 |
| `--c-line-strong` | `#cfc6b8` | `#4a443c` | 输入框、未选中筹码的边 |
| `--c-ink` | `#1f1b18` | `#f1ece4` | 标题、正文、价格 |
| `--c-ink-2` | `#5a524b` | `#c3bbb0` | 次要文字 |
| `--c-ink-3` | `#736a61` | `#978e83` | 辅助说明（最浅的可读文字，对比度 ≥ 4.5） |
| `--c-ink-4` | `#a39a90` | `#6b645c` | 占位符、禁用。不放必须读到的信息 |
| `--c-brand` | `#b73a2b` | `#c24a38` | 朱砂：主按钮底、选中描边、tab 选中 |
| `--c-brand-press` | `#9a2e21` | `#a83d2d` | 主按钮按下 |
| `--c-brand-tint` | `#f7e6e1` | `#3a211c` | 选中底 |
| `--c-brand-ink` | `#a23022` | `#ec8b78` | 朱砂色文字：文字链、选中文字 |
| `--c-on-brand` | `#fffdfa` | `#fffdfa` | 朱砂底上的字 |
| `--c-gold` / `--c-gold-tint` | `#7a5e22` / `#f3ebda` | `#d4b26a` / `#2e2714` | 鎏金：只用于“精选”类角标 |
| `--c-ok` / `--c-ok-tint` | `#2f6b4f` / `#e3efe7` | `#7fc49f` / `#1a2e24` | 松绿：尺寸合适、已完成、已同步 |
| `--c-warn` / `--c-warn-tint` | `#8a5a0b` / `#faf0d9` | `#e2b25c` / `#33280f` | 琥珀：待支付、尺寸偏差、离线、改价 |
| `--c-info` / `--c-info-tint` | `#3b5b7a` / `#e6edf3` | `#8fb2d4` / `#1a2632` | 黛蓝：中性说明、制作中、运输中 |
| `--c-danger` / `--c-danger-tint` / `--c-danger-line` | `#a8261a` / `#fbe9e5` / `#e9b4ab` | `#f2877a` / `#3a1b17` / `#6e2e26` | 安全警示、错误、不可撤销动作 |
| `--c-mask` | `rgba(31,27,24,.48)` | `rgba(0,0,0,.6)` | 弹层遮罩 |
| `--c-skeleton` / `--c-skeleton-hi` | `#ece6db` / `#f6f2ea` | `#2a2622` / `#36312b` | 骨架屏底 / 高光 |

使用规则：

1. **红色文字只属于安全警示和错误**（`--c-danger`）。价格、标签、链接都不许用 `--c-danger`。
2. **朱砂（`--c-brand`）每屏最多一个实心块**：通常是底栏主按钮。同屏第二个强调用描边按钮。
3. **价格用 `--c-ink`**，不用红。
4. **语义色成对用**：文字用 `--c-xx`，底用 `--c-xx-tint`，不单独拿语义色当大面积底色。
5. **不用纯黑纯白**：`#000`、`#fff` 不出现在界面里（画布里的照片除外）。
6. 画布（海报、缩略图、图标）里用不了 CSS 变量，统一从 `miniprogram/utils/theme.js` 读同一组十六进制值（D1 建这个文件，和 `tokens.wxss` 一一对应，测试校验两边一致）。

### 2.2 字体、字号、行高

```
--font-sans : -apple-system, "PingFang SC", "HarmonyOS Sans SC", "MiSans", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif
--font-serif: "Songti SC", "STSong", "Noto Serif CJK SC", "Source Han Serif SC", serif
--font-num  : "DIN Alternate", "DIN Condensed", "Helvetica Neue", "Roboto", Arial, sans-serif
```

全部是系统字体，不加载任何字库（主包 2MB 上限，且网络字体在小程序里首屏会闪）。

| 档位 | 变量 | 字号 / 行高 | 字重 | 类名 | 用在 |
|---|---|---|---|---|---|
| 展示 | `--fs-display` | 48 / 64 rpx | 600 | `.t-display` | 订单状态词、手围大数字、首页轮播标题 |
| 标题一 | `--fs-h1` | 40 / 56 rpx | 600 | `.t-h1` | 页面主标题（手串名）、底栏大价格 |
| 标题二 | `--fs-h2` | 34 / 48 rpx | 600 | `.t-h2` | 区块标题、弹层标题 |
| 标题三 | `--fs-h3` | 30 / 44 rpx | 500 / 600 | `.t-h3` | 卡片标题、按钮文字、列表主文字 |
| 正文 | `--fs-body` | 28 / 44 rpx | 400 | `.t-body` | 正文、输入框、对话气泡 |
| 说明 | `--fs-caption` | 24 / 36 rpx | 400 | `.t-caption` | 说明、标签、规格行 |
| 角标 | `--fs-micro` | 22 / 32 rpx | 500 | `.t-micro` | 角标、数量角标、步骤条文字 |

规则：

- **只有这 7 档**。现有的 21、23、25、26、27、32、36、42、44rpx 等全部归到最近的一档（26→28 或 24，32→34，36→34 或 40）。
- **最小 22rpx**（11px）。现在编辑器里的 20rpx 提示文字升到 24rpx。
- **宋体 `--font-serif` 只用在四处**：首页轮播标题、手串详情的手串名、分享海报和落地页的手串名、空状态标题。类名 `.t-serif`。安卓上没有宋体的机器会回退到系统默认字体，可以接受（README“待负责人确认”第 8 条）。
- **数字用 `--font-num`**：价格、手围、颗数、长度、订单号。类名 `.u-num`，同时加 `font-variant-numeric: tabular-nums`。
- 字重只用 400 / 500 / 600。不用 700 以上（中文粗体发糊）。
- 文字颜色搭配：标题 `--c-ink`，正文 `--c-ink` 或 `--c-ink-2`，说明 `--c-ink-3`。

### 2.3 间距（4/8 栅格）

| 变量 | rpx | px | 用在 |
|---|---|---|---|
| `--sp-1` | 8 | 4 | 图标与文字、标签之间 |
| `--sp-2` | 16 | 8 | 同组元素之间、筹码之间 |
| `--sp-3` | 24 | 12 | 卡片之间、列表项内上下 |
| `--sp-4` | 32 | 16 | **页面左右边距**、卡片内边距 |
| `--sp-5` | 40 | 20 | 标题与内容 |
| `--sp-6` | 48 | 24 | **区块之间** |
| `--sp-8` | 64 | 32 | 空状态上下留白 |
| `--sp-10` | 80 | 40 | 页面底部留白 |

规则：所有 `padding / margin / gap` 取这 8 个值之一。页面左右边距统一 32rpx（现在首页 32、编辑器 24/20、通用 `.wrap` 28）。底部固定栏的页面，内容区底部留白 = 栏高 + `env(safe-area-inset-bottom)` + 32rpx。

### 2.4 圆角

| 变量 | rpx | 用在 |
|---|---|---|
| `--r-xs` | 8 | 角标、标签 |
| `--r-sm` | 16 | 输入框、珠子格、提示条、缩略图小托盘 |
| `--r-md` | 24 | 卡片、托盘 |
| `--r-lg` | 32 | 底部弹层的上两个角、首页轮播 |
| `--r-pill` | 999 | 按钮、筹码、状态标签 |

现有的 6、10、12、18、20、22、28、40rpx 全部归档。

### 2.5 描边与阴影

| 变量 | 值 | 用在 |
|---|---|---|
| `--bd-hair` | `1rpx solid var(--c-line)` | 卡片内分隔线、底栏上沿 |
| `--bd-field` | `2rpx solid var(--c-line-strong)` | 输入框、未选中筹码、次要按钮 |
| `--bd-selected` | `2rpx solid var(--c-brand)` | 选中的筹码、选中的备选珠 |
| `--bd-danger` | `2rpx solid var(--c-danger-line)` | 安全提示条、出错的输入框 |
| `--sh-float` | `0 4rpx 16rpx rgba(60,45,30,.10)` | 托盘上的圆形工具钮、Toast |
| `--sh-bar` | `0 -4rpx 24rpx rgba(60,45,30,.06)` | 底部操作栏 |
| `--sh-sheet` | `0 -16rpx 64rpx rgba(60,45,30,.14)` | 底部弹层 |
| `--sh-bead` | `0 4rpx 8rpx rgba(40,28,18,.22)` | 平面珠子色块的投影 |

规则：**卡片没有描边也没有阴影**。阴影只给浮在内容上面的东西。阴影颜色是暖棕不是黑。

### 2.6 动效

| 变量 | 值 | 用在 |
|---|---|---|
| `--dur-fast` | 120ms | 按下变色、选中切换 |
| `--dur-base` | 200ms | 展开收起、Toast 进出、量尺游标移动 |
| `--dur-slow` | 320ms | 底部弹层进出、遮罩淡入 |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | 进入 |
| `--ease-in-out` | `cubic-bezier(.4,0,.2,1)` | 位移、退出 |

规则：只动 `opacity` 和 `transform`。不做弹跳、不做循环动画（骨架屏的呼吸和 AI 等待的三个点除外，周期 1.2s）。系统开了“减弱动态效果”时（`@media (prefers-reduced-motion: reduce)`），时长全部设为 0。

### 2.7 尺寸与层级

`--tap-min: 88rpx`（任何可点的东西点击区不小于 88×88rpx，视觉可以更小，用 padding 补）；`--h-btn-lg/md/sm: 96/80/64rpx`；`--h-cell: 104rpx`；`--h-bar: 128rpx`；`--h-field: 96rpx`；图标 `--icon-sm/md/lg: 32/40/48rpx`；层级 `--z-bar: 50`、`--z-sheet: 100`、`--z-toast: 200`。

## 3. 布局约定

- **导航栏**：用原生导航栏，不做自定义导航栏（免去胶囊按钮对齐问题）。`app.json` 的 `navigationBarBackgroundColor` 改 `#f5f1ea`（和页面底一致，导航栏和页面连成一片），`navigationBarTextStyle: black`，`backgroundColor: #f5f1ea`。唯一的例外是实时 AR 页（全屏相机），它保持现状。
- **胶囊按钮**：因为不做自定义导航栏，页面内容都在导航栏下面，不会和胶囊重叠。以后如果某页要做沉浸式头图，必须用 `wx.getMenuButtonBoundingClientRect()` 算避让，不许写死数值。
- **安全区**：底部固定栏 `padding-bottom: calc(var(--sp-3) + env(safe-area-inset-bottom))`；tab 页不用加（原生 tabBar 已经处理）。
- **tabBar**：`backgroundColor: #fffdfa`，`color: #736a61`，`selectedColor: #b73a2b`，`borderStyle: white`。
- **内容宽度**：左右 32rpx 边距；两列卡片间距 24rpx。
- **滚动**：整页滚动为主。只有编辑器是一屏固定布局（托盘和底栏不动，材料面板内部滚动）。

## 4. 图标规范

### 4.1 画法

- 24×24 网格，内容画在中间 20×20 的活动区内。
- 线性：`stroke-width="1.5"`，`stroke-linecap="round"`，`stroke-linejoin="round"`，`fill="none"`。
- 颜色用 `currentColor`（源稿），落地时由组件替换成具体颜色。
- 圆角：外轮廓拐角半径 2，内部细节 1。
- 一个图标不超过 4 条路径；不画实心块（选中态的 tab 图标例外，见 4.3）。
- **不用 emoji，不用 `⊕ ✧ ▣ ◎ ↑ ↶ ›` 这类字符当图标**。

### 4.2 图标清单（共 50 个，另有 4 个 tab 图标）

源稿在 [mockups.html](mockups.html) 顶部的 `<svg><symbol id="i-名称">…</symbol></svg>` 里，照抄路径即可。

| 分类 | 名称（`ui-icon` 的 `name`） | 用在 |
|---|---|---|
| 导航 | `chevron-right` `chevron-down` `close` `more` `back-home` | 列表项、展开、弹层关闭、更多、回到我的 |
| 通用动作 | `plus` `minus` `check` `edit` `trash` `undo` `refresh` `copy` `filter` `settings` `eye` | 加减、勾选、改一改、删除、撤销、重试、复制、筛选、手串设置、预览 |
| 编辑器 | `flip` `sound` `mute` `fill` | 翻转、音效开关、补齐（替换 `assets/editor-icons/` 里现有的 5 个，保持同一套线宽） |
| 创作入口 | `bead` `sparkle` `camera` `image` `hand` `ar` `ruler` `send` | 自己串、AI 配、拍照、相册、试戴、实时 AR、手围、发送 |
| 分享 | `share` `download` `wechat-friend` | 分享、保存图片、发给好友（画成“纸飞机”，不用微信商标） |
| 订单 | `receipt` `wallet` `box` `truck` `check-circle` `headset` `location` `gift` `cord` `clock` | 订单、待支付、制作中、待收货、完成、客服、地址、礼盒、穿绳、时间 |
| 状态 | `warning` `info` `cloud` `cloud-off` `device` `shield` `user` `empty-tray` `wifi-off` | 安全警示、说明、已同步、未同步、仅本机、隐私、账号、空状态、离线 |
| tab（png） | `tab-home` `tab-diy` `tab-ai` `tab-mine` | tabBar，见 4.3 |

要替换的现有字符：

| 文件 | 现在 | 换成 |
|---|---|---|
| `pages/home/home.wxml` | `⊕` `✧` `▣` `◎` | `bead` `sparkle` `camera`（第四个入口删除） |
| `pages/diy/diy.wxml` | `⊕` `▣` | `plus` `camera` |
| `pages/ai/ai.wxml` | `🎙` `↑` | 删除语音；`send` |
| `pages/editor/editor.wxml` | `↶ 撤销`、`更多 ···` | `undo`、`settings` |
| `pages/photo/photo.wxml` | `◎` | `camera` |
| 各页的 `›` | 文字里的 `›` | `chevron-right` 图标（文字链末尾的箭头也换） |

### 4.3 落地方式

**页面内图标：`components/icon`**（全局注册为 `ui-icon`，避开原生 `<icon>` 组件名）

```html
<ui-icon name="camera" size="48" tone="ink" />
```

- `name`：上表的名称。`size`：rpx，默认 48。`tone`：`ink`（默认）、`ink-2`、`ink-3`、`brand`、`on-brand`、`ok`、`warn`、`info`、`danger`。
- 实现：`components/icon/icons.js` 里存每个图标的 path 字符串；组件把它拼成一段 SVG，把 `stroke` 换成 `tone` 对应的十六进制（从 `utils/theme.js` 取），输出 `<image src="data:image/svg+xml;charset=utf-8,{{encodeURIComponent(svg)}}">`。
- 不用字体图标（要打包字体文件），不用每个颜色导出一份 svg 文件（数量翻几倍）。
- 50 个图标的 path 合计约 12KB，在主包预算内。
- 纯装饰的图标加 `aria-hidden="true"`；单独作为按钮的图标，外层 `view` 写 `role="button"` 和 `aria-label`。
- 这个做法需要在真机（iOS 和安卓各一台）确认 `image` 能显示 data URI 的 SVG；不行的话退回方案：把这些图标按用到的颜色导出成 svg 文件放 `assets/icons/`，组件接口不变。

**tabBar 图标**：原生 tabBar 只收本地 png。4 个 tab × 2 态 = 8 张，81×81px，放 `miniprogram/assets/tab/`，命名 `home.png / home-on.png / diy.png / diy-on.png / ai.png / ai-on.png / mine.png / mine-on.png`。未选中：`#736a61` 线性。选中：`#b73a2b`，同一图形，主体轮廓内填 `#f7e6e1`。每张控制在 3KB 以内。源稿同样在 `mockups.html` 里。

## 5. 组件规范

分两类：

- **样式类**（写在 `miniprogram/styles/components.wxss`，由 `app.wxss` 引入）：只是外观，没有行为。前缀 `c-`；工具类前缀 `u-`；文字类前缀 `t-`。
- **自定义组件**（`miniprogram/components/` 下，在 `app.json` 全局注册，前缀 `ui-`）：有结构或行为。组件 js 里统一写 `options: { styleIsolation: 'apply-shared' }`，这样组件内部也能用全局样式类。

下面每个组件写：变体、尺寸、状态、使用规则。

### 5.1 按钮 `.c-btn`

小程序 `style: v2` 下原生 `button` 自带固定宽度、内边距和 `::after` 边框，之前的审查已经踩过（“原生 button 默认宽度挤占价格区”）。所有按钮先套重置：

```css
.c-btn { margin: 0; padding: 0 var(--sp-4); width: auto; min-width: 0; min-height: 0;
  height: var(--h-btn-md); line-height: var(--h-btn-md); border-radius: var(--r-pill);
  font-size: var(--fs-h3); font-weight: var(--fw-medium); background: transparent; color: var(--c-ink);
  display: inline-flex; align-items: center; justify-content: center; gap: var(--sp-1);
  transition: background var(--dur-fast), opacity var(--dur-fast); }
.c-btn::after { border: 0; }
```

| 变体 | 类名 | 外观 | 用在 |
|---|---|---|---|
| 主按钮 | `.c-btn--primary` | 底 `--c-brand`，字 `--c-on-brand` | 每屏一个：完成、去下单、提交订单、确定 |
| 次按钮 | `.c-btn--secondary` | 底 `--c-surface`，`--bd-field` 边，字 `--c-ink` | 改一改、分享、保存图片 |
| 浅色按钮 | `.c-btn--tonal` | 底 `--c-brand-tint`，字 `--c-brand-ink` | 补齐 N 颗、用微信地址、行内的强调动作 |
| 文字按钮 | `.c-btn--text` | 无底无边，字 `--c-brand-ink` | 重试、去量手围、清空对话 |
| 危险按钮 | `.c-btn--danger` | 底 `--c-surface`，`--bd-danger` 边，字 `--c-danger` | 取消订单、删除作品（确认弹层里的确认键用实心：底 `--c-danger`，字 `--c-on-brand`，类名 `.c-btn--danger-solid`） |

| 尺寸 | 类名 | 高 | 字号 | 用在 |
|---|---|---|---|---|
| 大 | `.c-btn--lg` | 96rpx | 30rpx / 600 | 底栏主按钮、整行按钮 |
| 中（默认） | — | 80rpx | 30rpx / 500 | 卡片内、并排按钮 |
| 小 | `.c-btn--sm` | 64rpx | 24rpx / 500 | 行内、卡片角落；点击区用 `padding` 或外层补到 88rpx |
| 整行 | `.c-btn--block` | — | — | `display:flex; width:100%` |
| 图标钮 | `.c-btn--icon` | 88×88rpx | — | 只有图标，圆形；浮在托盘上时加 `--sh-float` 和 `--c-surface` 底 |

状态：按下（主按钮底换 `--c-brand-press`，其余 `opacity:.7`）；禁用（`opacity:.4`，不响应；**禁用的主按钮旁边必须有一句话说明为什么**）；加载中（用原生 `loading` 属性，文字换成“正在…”）。

规则：一屏只有一个主按钮；并排最多两个按钮，主的在右；按钮文字是动词开头，2–6 个字；不可撤销的动作用危险按钮且必须有确认弹层。

### 5.2 卡片 `.c-card`

| 变体 | 类名 | 外观 |
|---|---|---|
| 默认 | `.c-card` | 底 `--c-surface`，圆角 `--r-md`，内边距 `--sp-4`，无边无阴影 |
| 可点 | `.c-card--tap` | 按下时底换 `--c-sunken` |
| 凹陷 | `.c-card--sunken` | 底 `--c-sunken`，用在卡片里的次级信息块 |
| 分组 | `.c-card--group` | 内边距左右 `--sp-4`、上下 0，里面放 `.c-cell`，项之间 `--bd-hair` |

卡片之间间距 `--sp-3`（24rpx）；卡片标题用 `.t-h3`（600），和内容间距 `--sp-3`。卡片里不嵌卡片；需要次级块用 `.c-card--sunken`。

### 5.3 托盘 `.c-tray`

所有放手串或珠子的底。`background: radial-gradient(circle at 50% 42%, var(--c-tray-a), var(--c-tray-b)); border-radius: var(--r-md); overflow: hidden; position: relative;`

| 变体 | 类名 | 尺寸 | 用在 |
|---|---|---|---|
| 舞台 | `.c-tray--stage` | 宽撑满，高 400rpx（编辑器）/ 560rpx（详情、落地页） | 3D 预览 |
| 方形 | `.c-tray--square` | 宽高 1:1 | 手串卡的图 |
| 缩略 | `.c-tray--thumb` | 128×128rpx，圆角 `--r-sm` | 列表里的缩略图 |
| 珠格 | `.c-tray--bead` | 96×96rpx，圆角 `--r-sm` | 编辑器材料格、备选珠 |

`components/bracelet3d` 的画布本身是透明的（`alpha:true`），把 `index.wxss` 里 `.viewer` 的 `background:#faf9f8` 去掉，由外层 `.c-tray` 提供底色。

### 5.4 手串缩略图 `bracelet-thumb`（现有组件）

行为不变（离屏 2D 画布出图并缓存，`utils/thumb-cache.js`）。改三处：

- 组件自己不带底色，外面套 `.c-tray--thumb` 或 `.c-tray--square`。
- 画珠子时加投影和高光（径向渐变从 `c[0]` 到 `c[1]`，左上 30%/25% 处高光），和编辑器里的平面珠子一致。穿绳线用 `theme.line`。
- 失败占位图 `placeholder.svg` 换成新图标 `empty-tray` 的样子（纸色底上一圈虚线圆环）。
- 加载中显示 `.c-skeleton` 圆环，不闪白。

### 5.5 手串卡 `design-card`（新组件）

把首页热门款、AI 方案、我的作品、订单列表里“一条手串”的展示统一成一个组件。

| 变体 | `layout` | 结构 | 用在 |
|---|---|---|---|
| 竖卡 | `grid` | 方形托盘图 → 名称（`.t-h3`，单行）→ 标签（最多 2 个）→ 价格 + 规格 | 首页热门款（两列） |
| 横卡 | `row` | 左 128rpx 缩略托盘；右：名称 + 右上角槽位（状态标签或同步标记）、规格行、一句说明；最右 `chevron-right` | 我的作品、订单列表、最近一单、继续上次的设计 |
| 滑卡 | `slide` | 宽 480rpx：方形托盘图 → 名称 + 角标 → 标签 → 一句寓意（2 行截断）→ 价格 + “看这条” | AI 方案横滑 |

属性：`name`、`beads`、`catalog`、`cover`、`tags`、`price`（字符串，已格式化）、`spec`、`note`、`badge`、`layout`；插槽 `extra`（右上角）、`action`（右下角）。事件 `tap`。

状态：无图时由 `bracelet-thumb` 自己降级；`disabled`（方案配不齐）整卡 `opacity:.5` 且不可点；骨架态 `loading`。

规则：卡片整体可点，进手串详情；竖卡上不放按钮（现在每张卡有“试戴”“用这款”两个按钮，删掉）；首页竖卡的图右下角可以放一个 64rpx 的 `hand` 图标钮作为“试戴”入口。

### 5.6 珠子格 `.c-bead-cell`（编辑器材料格、备选珠）

结构：`.c-tray--bead`（里面是实拍图，或径向渐变的圆 + `--sh-bead`）→ 名称（`.t-caption`，`--c-ink`，最多两行）→ 规格（`.t-micro`，`--c-ink-3`，“8mm · ¥3.5”，数字用 `.u-num`）。

| 状态 | 外观 |
|---|---|
| 默认 | 无边 |
| 按下 | 整格 `transform: scale(.96)`，120ms |
| 选中（备选珠） | `--bd-selected` + 底 `--c-brand-tint`，右上角 `check` 小圆标 |
| 有安全提示 | 托盘右上角一个 28rpx 的 `warning` 图标（`tone="danger"`），`aria-label` 加“有安全提示” |
| 已下架 | `opacity:.4`，名称后加“已下架” |

格子最小宽 200rpx（三列），点击区整格。长按出珠子详情弹层。

### 5.7 价格 `.c-price`

```html
<view class="c-price c-price--lg"><text class="c-price__cur">¥</text><text class="c-price__int">128</text><text class="c-price__dec">.00</text></view>
```

- 字体 `--font-num`，颜色 `--c-ink`，`tabular-nums`。
- `¥` 和小数部分比整数小一档：`--lg`（底栏、详情）整数 40rpx、其余 24rpx；`--md`（卡片）整数 30rpx、其余 22rpx；`--sm`（明细行）整体 28rpx 不分大小。
- 金额从“分”算：`Math.floor(fen/100)` 和 `String(fen%100).padStart(2,'0')`。提供 `utils/money.js` 的 `split(fen)`，不在 wxml 里做除法。
- 小数为 `.00` 时仍然显示（金额一律两位）。
- 价格待定显示“—”，不显示 `¥--`。
- 改价对比：旧价 `--c-ink-3` 加删除线，箭头，新价 `--c-ink` 加粗。
- 说明文字（“含手工费”）在价格下方，`.t-micro`，`--c-ink-3`。

### 5.8 标签与筹码

**标签 `.c-tag`**（只读）：高 40rpx，左右内边距 12rpx，圆角 `--r-xs`，`.t-micro`。

| 变体 | 类名 | 颜色 | 用在 |
|---|---|---|---|
| 中性 | `.c-tag` | 底 `--c-sunken`，字 `--c-ink-2` | 寓意标签（平安、温润…） |
| 鎏金 | `.c-tag--gold` | 底 `--c-gold-tint`，字 `--c-gold` | 精选方案、热门款 |
| 琥珀 | `.c-tag--warn` | 底 `--c-warn-tint`，字 `--c-warn` | 略超预算、实验 |
| 黛蓝 | `.c-tag--info` | 底 `--c-info-tint`，字 `--c-info` | 方案库推荐、仅本机 |
| 松绿 | `.c-tag--ok` | 底 `--c-ok-tint`，字 `--c-ok` | 已同步 |

寓意标签一律中性色，**不按寓意分颜色**（`prototype.html` 里的 `--wealth / --love / --study` 等六组颜色不再使用：颜色太多是“花”的来源，而且“财”“爱情”的配色容易往功效上引）。

**筹码 `.c-chip`**（可点、可选）：高 64rpx，左右内边距 24rpx，圆角 `--r-pill`，`.t-caption`；点击区上下补到 88rpx。

| 状态 | 外观 |
|---|---|
| 默认 | 底 `--c-surface`，`--bd-field` 边，字 `--c-ink-2` |
| 选中 `.is-on` | 底 `--c-brand-tint`，`--bd-selected` 边，字 `--c-brand-ink`，字重 500 |
| 禁用 | `opacity:.4` |

用在：筛选项、手围预设、间隔选择、追问、示例。横向排不下时用 `scroll-view scroll-x`，右侧留 32rpx 露出半个表示可滑。

**分段切换 `.c-seg`**：底 `--c-sunken`，圆角 `--r-pill`，内边距 6rpx；每段高 64rpx；选中段底 `--c-surface` 加 `--sh-float`，字 `--c-ink` 500；未选中字 `--c-ink-3`。用在：编辑器“珠子 / 配饰 / 绳子”、试戴三种方式、穿绳选择。2–4 段。

### 5.9 列表项 `.c-cell`

最小高 `--h-cell`（104rpx），上下内边距 24rpx，`display:flex; align-items:center; gap: var(--sp-3)`。

结构：`[图标 48rpx]` `标题（.t-h3 400）+ 副标题（.t-caption --c-ink-3）` `[右侧值（.t-body --c-ink-2）]` `[chevron-right 32rpx --c-ink-4]`。

变体：`.c-cell--tap`（可点，按下底 `--c-sunken`）；`.c-cell--kv`（明细行：左标签 `--c-ink-2`，右值 `--c-ink` 右对齐，高 72rpx，无箭头）；`.c-cell--total`（合计行：上面一条 `--bd-hair`，右值用 `.c-price--md`）。

规则：放在 `.c-card--group` 里，项与项之间自动加 `--bd-hair`（从文字左边缘开始，不通到卡片边）。可点的才有箭头。

### 5.10 表单

**输入框 `.c-field`**：

```html
<view class="c-field"><text class="c-field__label">收货人</text><input class="c-field__input" placeholder="姓名" placeholder-class="c-field__ph"/></view>
<view class="c-field__error">请输入有效的 11 位手机号</view>
```

- 高 `--h-field`（96rpx），底 `--c-sunken`，圆角 `--r-sm`，无边；左侧标签宽 144rpx、`--c-ink-2`；输入文字 `--c-ink`、`.t-body`；占位 `--c-ink-4`。
- 聚焦 `.is-focus`：`--bd-selected` 边，底 `--c-surface`。
- 出错 `.is-error`：`--bd-danger` 边；下方 `.c-field__error`（`.t-caption`，`--c-danger`，前面 `warning` 图标）。
- 禁用：`opacity:.5`。
- 多个输入框上下间距 `--sp-2`。
- 输入框必须有可见的标签，不能只靠占位符。

**步进器 `.c-stepper`**：两个 88rpx 圆形图标钮（`minus` / `plus`，底 `--c-sunken`）夹一个数字（`.t-display .u-num`）。到上下限时对应按钮禁用。

**开关**：原生 `switch`，`color` 传 `theme.brand`（现在各页写死 `#c8302e`）。

**滑杆**：原生 `slider`，`activeColor` 传 `theme.brand`，`backgroundColor` 传 `theme.line`，`block-size="24"`。

**勾选框 `.c-check`**：44rpx 方框，圆角 8rpx，`--bd-field`；勾选后底 `--c-brand`、里面 `check` 图标（`on-brand`）。整行可点。用在安全提示的“我已阅读”。安全场景下未勾选被拦时，方框边换 `--c-danger` 并左右晃动一次（`translateX ±6rpx`，200ms）。

### 5.11 步骤条 `ui-steps`

| 变体 | `type` | 用在 |
|---|---|---|
| 横向进度 | `progress` | 订单详情五步（下单 / 支付 / 制作 / 发货 / 完成） |
| 竖向说明 | `guide` | 拍照做同款三步、怎么量手围 |

横向：圆点 24rpx，连线 4rpx；已完成＝圆点和连线 `--c-ok`，圆点里 `check`；进行中＝圆点 `--c-ink`，外面一圈 6rpx 的 `--c-line`，文字 `--c-ink` 600（不用朱砂，避免和“出问题”的红混淆）；未到＝圆点和连线 `--c-line-strong`，文字 `--c-ink-3`；出问题＝圆点 `--c-danger` 里面 `warning`，文字 `--c-danger`。文字 `.t-micro`，在圆点下方居中。

属性：`steps`（`[{label, state: 'done'|'current'|'todo'|'error'}]`）。数据由 `utils/order-state.js` 的 `progress()` 给。

竖向：左侧 48rpx 圆形序号（底 `--c-sunken`，字 `--c-ink-2`，`.u-num`），右侧标题（`.t-h3`）+ 说明（`.t-caption`）；序号之间不画连线。

### 5.12 底部操作栏 `ui-bottom-bar`

固定在底部，底 `--c-surface`，上沿 `--sh-bar`，内边距 `24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom))`，层级 `--z-bar`。

结构（插槽）：`left`（价格 + 说明，或一句状态；可伸缩，`min-width:0`）｜`default`（1–2 个按钮，不伸缩）。

| 变体 | 内容 | 用在 |
|---|---|---|
| 价格 + 主按钮 | 左价格，右一个 `.c-btn--primary.c-btn--lg`（最小宽 240rpx） | 下单页、手围页 |
| 价格 + 次 + 主 | 左价格，右次按钮（宽 160rpx）+ 主按钮（宽 220rpx） | 手串详情、试戴、落地页 |
| 图标钮 + 价格 + 主 | 最左一个图标钮，再价格，右主按钮 | 编辑器（设置键） |
| 多动作 | 左文字按钮，右 1–2 个按钮 | 订单详情 |
| 单按钮 | 一个整行主按钮 | 拍照做同款初始屏 |

规则：价格区文字不许换行、不许被按钮挤压（按钮定宽，价格区 `flex:1`）；页面内容底部要留出栏高；键盘弹起时底栏不跟着顶上来（输入框所在页面除外）；tab 页不用它（AI 配的输入框是页面自己的 `composer`）。

### 5.13 底部弹层 `ui-sheet`

从底部滑上来的面板。遮罩 `--c-mask`；面板底 `--c-surface`，上两角 `--r-lg`，阴影 `--sh-sheet`，最大高 80vh，内容超出时内部滚动；底部内边距含安全区。进出 `--dur-slow`。

结构：顶部 8rpx×64rpx 的拖动条示意（`--c-line-strong`）→ 标题行（`.t-h2` + 右侧 `close` 图标钮）→ 内容插槽 → 底部按钮插槽 `footer`（固定在面板底部，不随内容滚动）。

属性：`show`、`title`、`closable`（默认 true，点遮罩和关闭键可关）；事件 `close`。

规则：一次只开一个弹层；弹层里不再开弹层（需要二次确认用 `ui-confirm`）；必须有明确的关闭方式；打开时页面不滚动（遮罩 `catchtouchmove`）。

替换现有的：`editor.wxml` 里 5 处手写的 `sheet-mask` + `sheet`。

### 5.14 确认弹窗 `ui-confirm`

居中的确认框，取代带长内容或需要样式的 `wx.showModal`。宽 600rpx，底 `--c-surface`，圆角 `--r-md`，内边距 `--sp-6`。

结构：`[图标 64rpx]` → 标题（`.t-h2` 居中）→ 内容插槽（`.t-body --c-ink-2`；可放列表、安全提示条）→ 两个并排按钮（取消在左，确认在右）。

| 变体 | `tone` | 确认键 | 用在 |
|---|---|---|---|
| 普通 | `default` | `.c-btn--primary` | 清空对话、离开未保存 |
| 危险 | `danger` | `.c-btn--danger-solid` | 取消订单、清空托盘、删除作品 |

规则：标题是一个问句或一个明确的陈述（“取消这笔订单？”）；按钮文字写动作本身（“取消订单”“再想想”），不写“确定 / 取消”；点遮罩不关闭。**内容长、需要用户逐条看的确认（改价、下单确认）用 `ui-sheet`，不用它。** 一句话的简单确认可以继续用 `wx.showModal`，但 `confirmColor` 传 `theme.brand`。

### 5.15 Toast

继续用 `wx.showToast`（原生，层级最高，不用自己管）。规则：

- 只用于**不需要用户处理**的反馈：已保存、已复制、已加入。`icon:'none'`，文字 ≤ 14 个字，时长 2000ms。
- 成功用 `icon:'success'` 的只有：已保存、登录成功。
- **错误不用 Toast**（一闪就没了）。错误显示在出错的位置旁边：输入框下、按钮下、提示条里。
- 不连续弹两个 Toast。

### 5.16 提示条 `ui-notice`

页面里常驻的一条说明。高自适应，内边距 `20rpx 24rpx`，圆角 `--r-sm`，`display:flex; gap:16rpx`；左侧图标 40rpx，文字 `.t-caption`（行高 36rpx），右侧可选一个文字按钮。

| 变体 | `tone` | 颜色 | 图标 | 用在 |
|---|---|---|---|---|
| 说明 | `info` | 底 `--c-info-tint`，字 `--c-info` | `info` | 预览模式、仅本机处理、方案库推荐 |
| 注意 | `warn` | 底 `--c-warn-tint`，字 `--c-warn` | `info` | 离线示例数据、改价待确认、支付暂未开放、尺寸偏差 |
| 成功 | `ok` | 底 `--c-ok-tint`，字 `--c-ok` | `check-circle` | 长度合适、已同步（“订单已提交”不用它，用 `info`：订单停在待支付，不是成功） |
| 错误 | `danger` | 底 `--c-danger-tint`，字 `--c-danger` | `warning` | 材料下架、加载失败、提交失败 |

属性：`tone`、`text`（或默认插槽）、`action`（按钮文字）、`full`（通栏：无圆角，贴页面顶部，用于离线提示）；事件 `action`。

规则：一屏同一位置最多叠两条；通栏变体只给“离线示例数据”用；错误提示条必须说明下一步（带按钮或在文字里写明）。

### 5.17 安全提示条 `ui-safety`

材料安全提示专用，**全站最醒目的静态元素**，和普通错误提示区分开。

```html
<ui-safety items="{{safetyItems}}" />
<!-- safetyItems: [{name:'朱砂 8mm', text:'含硫化汞，不可入口，避免高温和长期贴身摩擦。孕妇、儿童不建议佩戴。'}] -->
```

外观：底 `--c-danger-tint`，`--bd-danger` 边（2rpx），圆角 `--r-sm`，内边距 `--sp-3`。

结构：标题行（`warning` 图标 40rpx `tone="danger"` +“材料安全提示”，`.t-h3` 600，`--c-danger`）→ 每条一段：材料名（`.t-body` 600，`--c-danger`）换行，提示正文（`.t-body`，`--c-danger`，**红字**，不截断、不折叠、不放进滚动区）→ 条与条之间 `--c-danger-line` 发丝线。

| 变体 | `mode` | 差别 | 用在 |
|---|---|---|---|
| 完整 | `full`（默认） | 如上 | 手串详情、下单页、订单详情、落地页、材料清单弹层、提交确认弹层 |
| 带勾选 | `confirm` | 底部多一行 `.c-check` +“我已阅读以上安全提示”；事件 `change` | 下单页 |
| 单条 | `inline` | 没有标题行，只有图标 + 红字 | 珠子详情弹层、材料清单里某一行下面 |
| 摘要 | `summary` | 一行：图标 +“含 N 项材料安全提示”+ `chevron-right`，可点 | 编辑器底栏材料入口旁、列表里 |

规则：

1. **有安全提示的地方必须显示，不能因为空间小而省略**。空间实在不够用 `summary`，点了必须能看到完整内容。
2. 正文原样显示后端 `safety` 字段，不改写、不截断。
3. 红字 + 红边 + 警示图标三样同时出现。全站其他地方不许出现这个组合。
4. 不能放在可折叠区域的折叠态里；不能放在需要横向滚动才能看到的地方。
5. 屏幕阅读：容器 `role="alert"`，`aria-label="材料安全提示"`。

替换现有的：各页的 `.material-safety`（`editor.wxss`、`order.wxss`、`order-detail.wxss`）。

### 5.18 空状态 `ui-empty`

结构（居中，上下留白 `--sp-8`）：图标 96rpx（`tone="ink-3"`，放在 160rpx 的 `--c-sunken` 圆底上）→ 标题（`.t-h3 .t-serif`，`--c-ink`）→ 说明（`.t-caption`，`--c-ink-3`，最多两行）→ 可选按钮（`.c-btn--secondary.c-btn--sm`，错误时是“重试”）。

| 变体 | `type` | 图标 | 例 |
|---|---|---|---|
| 空 | `empty` | `empty-tray` | 还没有作品 / 做好的手串会自动存在这里 |
| 错误 | `error` | `wifi-off` | 没加载出来 / 检查一下网络再试试 + 重试 |
| 未登录 | `login` | `user` | 登录后查看订单 + 微信登录 |

属性：`type`、`title`、`desc`、`action`；事件 `action`。

规则：标题说“现在是什么情况”，说明说“接下来可以做什么”；不用“暂无数据”这种话；卡片内的空状态用紧凑变体 `compact`（图标 64rpx，无圆底，上下留白 `--sp-5`）。

### 5.19 骨架屏 `.c-skeleton`

```css
.c-skeleton { background: var(--c-skeleton); border-radius: var(--r-xs); animation: c-sk 1.2s var(--ease-in-out) infinite alternate; }
@keyframes c-sk { from { opacity: 1 } to { opacity: .5 } }
```

用和真实内容同样位置、同样大小的色块占位：文字行高 24rpx、宽 40%–80%；图片块和托盘同尺寸、同圆角；圆形用 `border-radius:50%`。

规则：首屏有网络请求的页面都要有骨架（首页、自己串、手串详情、下单页金额、订单列表、订单详情、落地页、分享海报）；骨架最少显示 200ms，避免一闪；超过 8 秒还没回来，换成 `ui-empty` 错误态；不用“正在加载…”的裸文字（现在 `order-detail.wxml`、`shared.wxml`、`share.wxml` 都是）。

### 5.20 订单状态标签 `ui-status-tag`

高 44rpx，左右内边距 16rpx，圆角 `--r-pill`，`.t-micro` 500。左侧可带一个 12rpx 的实心圆点。

| `tone`（来自 `order-state.js`） | 颜色 | 对应状态 |
|---|---|---|
| `warning` | 底 `--c-warn-tint`，字 `--c-warn` | 待确认、待支付、支付处理中、退款处理中、售后进行中 |
| `pending` | 底 `--c-info-tint`，字 `--c-info` | 待制作、制作中、运输中 |
| `success` | 底 `--c-ok-tint`，字 `--c-ok` | 已支付、待发货、已发货、已签收、已完成 |
| `danger` | 底 `--c-danger-tint`，字 `--c-danger` | 支付失败、退款失败、履约异常、物流异常、售后未通过 |
| `muted` | 底 `--c-sunken`，字 `--c-ink-3` | 已取消、已关闭、已退款、已退回 |

属性：`label`、`tone`。文字用后端给的 `label`（契约：小程序只依据 `state` 展示），没有就用 `order-state.js` 的兜底中文。

替换现有的：`mine.wxss` 和 `order-detail.wxss` 里各一份的 `.status-badge / .status-*`（两份数值不一样，且都缺 `status-pending`）。

### 5.21 尺寸量尺 `size-meter`（新组件）

编辑器和手串详情共用。

结构：一条 12rpx 高的轨道（底 `--c-sunken`，圆角 pill）；轨道上一段“合适区间”（底 `--c-ok-tint`，两端各一条 2rpx 的 `--c-ok` 竖线）；一个 28rpx 的圆形游标（底随状态取色，白边 4rpx，`--sh-float`），位置变化有 `--dur-base` 过渡。轨道下方左边是“21 颗 · 16.8cm”（`.t-caption .u-num`），右边是状态文字（`.t-caption` 500，随状态取色）。

属性：`length`（mm）、`target`（mm）、`count`、`fit`（`logic.stats()` 返回的字符串）、`compact`（详情页用，不带下方文字，只有轨道 + 右侧状态）。状态和取色见 [02 第 2 节](02-core-flows.md) 的表。

规则：只做展示，不改 `pages/editor/logic.js` 的任何计算；合适区间固定是目标 −4 到 +6mm；颜色之外必须有文字（不能只靠颜色表达合不合适）。

### 5.22 隐私弹窗 `privacy-popup`（现有组件）

行为不变。外观换成 `ui-confirm` 的样式：顶部 `shield` 图标，标题“隐私保护说明”，正文不变，按钮“暂不使用”（次）和“同意并继续”（主，保留 `open-type="agreePrivacyAuthorization"`）。

### 5.23 对话气泡 `.c-bubble`（AI 配专用）

我的话：靠右，底 `--c-brand-tint`，字 `--c-ink`，圆角 `24rpx 24rpx 8rpx 24rpx`；回复：靠左，底 `--c-surface`，字 `--c-ink`，圆角 `24rpx 24rpx 24rpx 8rpx`。最大宽 78%。内边距 `20rpx 24rpx`。等待态：三个 12rpx 圆点依次变浅。

## 6. 旧类名的过渡

`app.wxss` 现有的 12 个全局类（`.wrap .card .title .sub .row .primary .muted .chips .chip .active .actions .error`）被各页大量使用。迁移顺序：

1. **D1**：`app.wxss` 换成引入 `tokens.wxss`，这 12 个旧类保留，但取值全部改成变量（比如 `.primary{background:var(--c-brand);color:var(--c-on-brand)}`、`.card` 去掉边框）。这一步之后，没改过的页面也会整体换成新配色，不会坏。
2. **逐页任务**：每改一页，把那一页的旧类换成 `c-` 类，页面 wxss 里的字面量全部换成变量。
3. **收尾任务**：全仓库搜不到旧类的引用后，从 `app.wxss` 删掉。

验收用的检查命令（写进收尾任务）：

```bash
# 页面和组件的 wxss 里不应再有颜色字面量（tokens.wxss 除外）
grep -rnoE '#[0-9a-fA-F]{3,8}\b' miniprogram --include='*.wxss' | grep -v 'styles/tokens.wxss'
# wxml 里不应再有内联颜色
grep -rnE 'style="[^"]*(color|background)[^"]*#' miniprogram --include='*.wxml'
# 不应再有 emoji 和字符图标
grep -rnE '🎙|⊕|✧|▣|◎|↶' miniprogram --include='*.wxml'
```

## 7. 文案规范

1. **只讲寓意，不讲功效**。任何给用户看的字都要过 `kb/data/attributes.json` 的 banned 词表（“转运珠”“本命年”除外）。现有的一处违规：`pages/ai/ai.wxml` 的示例“送爸妈，保平安”（“保平安”在词表里），改成“送爸妈，寓意平安”。
2. **寓意的说法**：用“寓意…”“象征…”“常用来表达…”，不用“能…”“可以带来…”“有助于…”。
3. **说人话**：不出现“履约”“兜底”“快照”“同步冲突”“幂等”这类内部词。“方案库兜底”→“方案库推荐”，“制作履约”→不展示。
4. **按钮写动作**：“去下单”“改一改”“看这条”，不写“确定”“下一步”。
5. **错误提示三段**：发生了什么 + 为什么（知道的话）+ 现在能做什么。不显示接口原始报错。
6. **不承诺没有的事**：没接支付，就不出现“支付成功”“立即付款”“首单立减”；没有物流轨迹，就不说“实时物流”。
7. **示意要标明**：缩略图、3D、试戴、海报都是示意，旁边保留“颜色和尺寸以实物为准”。
8. **数字和单位**：数字和中文之间空一格（“21 颗”“手围 15cm”）；单位紧跟数字（`15cm`、`8mm`、`¥128.00`）；手围用 cm，珠径和长度差用 mm，总长用 cm 保留一位小数。
9. D 任务里有一条专门加测试扫 wxml 和页面 js 里的中文字符串，命中 banned 词就失败。
