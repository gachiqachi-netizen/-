# 小程序任务卡 · 第一波（基础组件）

> 派活顺序和并行批次见 [00-dispatch.md](00-dispatch.md)。每张卡一个会话，做完开 PR 就停。
> 设计依据：[03-design-system.md](../03-design-system.md)（规范）、[04-page-redesign.md](../04-page-redesign.md)（逐页）、[mockups-final.html](../mockups-final.html)（稿子，浏览器直接打开；组件的样子照稿子里同名的 CSS 类）。

## 所有小程序卡的共同规矩

1. **只改卡片“只能改这些”里的文件。**特别是：第 1–3 批的卡**都不改 `miniprogram/app.json`**（C0a 只改颜色几行），组件只在自己的临时页 `miniprogram/kit/<名字>/index.json` 的 `usingComponents` 里引用。
2. **临时页**已经建好空壳（`miniprogram/kit/` 分包，7 页），在开发者工具里用“编译模式 → 启动页面”填 `kit/<名字>/index` 打开。只填自己那一页。
3. 样式只用 `styles/tokens.wxss` 的变量（C0a 建），不写颜色值；尺寸用 `rpx`。能点的是胶囊或圆，只看的是直角（03 第 0 节）。不加任何警告符号（三角、感叹号、红点）。
4. 不用 `URL` 等浏览器对象；地址只走 `config.js`；金额只显示后端给的整数分换算出来的元。
5. 组件写法：`Component({ options: { styleIsolation: 'apply-shared' }, properties, data, methods })`，组件目录 `components/<名字>/index.{js,json,wxml,wxss}`，`index.json` 里 `"component": true`。
6. 测试：纯函数一定要有 `node:test` 测试（放 `miniprogram/tests/`，文件名 `<名字>.test.js`）。组件的样子用截图验收。
7. 截图：开发者工具选 iPhone 12/13（390 宽）截一张，再切到 iPhone 5/SE（320 宽）截一张，和稿子对应那一屏并排放进 PR。没在开发者工具里看过的写“未验证”。（打不开开发者工具或浏览器时不要编截图，按 [00-dispatch.md](00-dispatch.md) 第 5.3 节写“需要负责人看”。）
8. 三条测试都要跑：`python3 -m unittest discover -s server/tests`、`node --test miniprogram/tests/*.test.js`、`python3 kb/validate.py`。

---

## C0a 变量和全局样式（原 D1）

- **批次**：第 1 批　**依赖**：无　**大小**：S　**分支**：`agent/C0a-tokens`

**只能改**：新建 `miniprogram/styles/tokens.wxss`、`miniprogram/utils/theme.js`、`miniprogram/tests/theme-tokens.test.js`；改 `miniprogram/app.wxss`、`miniprogram/app.json`（只改 `window` 和 `tabBar` 里的颜色和标题，不碰 `pages`、`subPackages`、`tabBar.list`）。

**步骤**
1. 把 `docs/design/tokens.wxss` **原样复制**到 `miniprogram/styles/tokens.wxss`（不改一个字）。
2. `app.wxss` 第一行 `@import "styles/tokens.wxss";`。现有的旧类（`.wrap .card .title .sub .row .primary .muted .chips .chip .active .actions .error`）**类名保留**，颜色和边框改成变量：`.primary` 变成黑底白字胶囊（`background: var(--c-text)`）；`.card` 去掉边框；`.active` 不再用红色。旧类在 C11 统一删。
3. `app.wxss` 加文字类：`.t-display .t-title .t-body .t-caption .t-2（次要色） .t-bold .t-num`，字号照 03 第 3 节的 4 档。
4. 新建 `utils/theme.js`，导出 `tokens.wxss` 里每个 `--c-*` 颜色的值（给画布、原生控件用），例如 `module.exports = { text: '#111111', ... }`。
5. `app.json`：`window.navigationBarBackgroundColor` 白、`navigationBarTextStyle` black、`navigationBarTitleText` “珠养养”、`backgroundColor` 白；`tabBar` 的 `color` `#6e6e6e`、`selectedColor` `#111111`、`backgroundColor` `#ffffff`、`borderStyle` `white`。
6. 测试 `theme-tokens.test.js`：读 `styles/tokens.wxss`，解析出全部 `--c-*: <值>`，和 `theme.js` 逐项相等；变量总数不超过 30；文件里没有 `accent`；`app.wxss` 里没有任何 `#` 开头的颜色值。

**验收**：首页底纯白、主按钮黑底白字胶囊（截图）；四个 tab、编辑器、下单页都能正常打开，文字看得见、不错位（各截一张，只要求不坏）；三条测试通过。

**提示词**
```
你在仓库 串个珠 的小程序里做任务卡 C0a（变量和全局样式）。先读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/miniprogram-wave1.md 的“共同规矩”和 C0a 这一节，严格按步骤做，只改卡里列出的文件。分支 agent/C0a-tokens，从 origin/integration/2026-11 拉。每步提交一次，提交说明以“C0a:”开头。在微信开发者工具里截图放进 PR。做完开 PR 后停下。
```

---

## C0b 图标（原 D2）

- **批次**：第 1 批　**依赖**：无　**大小**：S　**分支**：`agent/C0b-icons`

**只能改**：新建 `miniprogram/assets/icons/*.svg`、`miniprogram/assets/tab/*.png`、`miniprogram/tests/icons.test.js`；填 `miniprogram/kit/icons/*`。

**步骤**
1. 打开 `docs/design/mockups-final.html` 看源码，顶部有一组 `<symbol id="i-…">`。照着它们画成单独的 SVG 文件：`back undo stack share save mic plus minus up check copy close more chevron-right camera image hand spark bead`。规格：`viewBox="0 0 24 24"`，`fill="none"`，`stroke="#111111"`，`stroke-width="1.5"`，`stroke-linecap="round"`，`stroke-linejoin="round"`。`up`、`check` 另存白色版 `up-on.svg`、`check-on.svg`（`stroke="#ffffff"`）。**不要做 `alert` 之类的警告图标。**
2. tab 图标：首页（房子）、自己串（`bead`）、AI 配（对话气泡）、我的（人像），各两张 81×81 PNG：`home.png`/`home-on.png`……未选中 `#6e6e6e`，选中 `#111111`，透明底，每张不超过 3KB。（这张卡**不改** `app.json`，C0z 再换上去。）
3. 临时页 `kit/icons`：把全部图标排成网格，每个下面写名字；用 `<image src="/assets/icons/xx.svg">`。
4. 测试 `icons.test.js`：步骤 1 列的每个名字都有文件；`assets/icons` 里没有文件名含 `alert`、`warn` 的；每个 SVG 都含 `stroke-width="1.5"`；tab 的 8 张 PNG 都存在且不超过 3KB。

**验收**：临时页截图，粗细一致；**需真机**：iOS、安卓各一台打开临时页，SVG 能显示（不显示就改成同名 PNG，并在 PR 里说明）。

**提示词**
```
你在仓库 串个珠 的小程序里做任务卡 C0b（图标）。先读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/miniprogram-wave1.md 的“共同规矩”和 C0b 这一节，严格按步骤做，只改卡里列出的文件，不要改 app.json。分支 agent/C0b-icons，从 origin/integration/2026-11 拉。每步提交一次，提交说明以“C0b:”开头。截图放进 PR，做完开 PR 后停下。
```

---

## C0c 品牌字标（原 D3）

- **批次**：第 1 批　**依赖**：无　**大小**：S　**分支**：`agent/C0c-wordmark`

**只能改**：新建 `miniprogram/assets/brand/wordmark.svg`、`wordmark-line.svg`、`wordmark-on.svg`、`miniprogram/components/wordmark/*`；填 `miniprogram/kit/wordmark/*`。

**步骤**
1. 字标是两行：宋体“珠养养”，下面一行衬线大写“ZHU YANG YANG”，比例照 `mockups-final.html` 第〇节（中文字号 : 英文字号约 2.3 : 1，中文字距约字号的 0.35 倍）。**做成文字转曲线的 SVG**（不能依赖手机上装没装宋体）。正式稿由品牌设计师给，现在先用系统宋体转曲做临时稿，文件名不变，PR 里写“临时稿，字体授权待确认”。
2. 三个颜色：`wordmark.svg` 主字色 `#111111`；`wordmark-line.svg` 分隔线色（取 `tokens.wxss` 里 `--c-line` 的值）；`wordmark-on.svg` 白色。
3. 组件 `components/wordmark`：属性 `tone`（`text` / `line` / `on`，默认 `text`）、`size`（`nav` 高 40rpx / `tray` 高 64rpx / `corner` 高 28rpx / `block` 高 120rpx）。内部就是一个 `<image mode="heightFix">`。
4. 临时页 `kit/wordmark`：3 种颜色 × 4 种尺寸排出来（`on` 那一行放在深色底上）。

**验收**：临时页和稿子第〇节并排截图；`corner` 尺寸在 320 宽下认得出三个字；不像任何系统图标、只有一种颜色（09 第 27 条）。

**提示词**
```
你在仓库 串个珠 的小程序里做任务卡 C0c（品牌字标）。先读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/miniprogram-wave1.md 的“共同规矩”和 C0c 这一节，严格按步骤做，只改卡里列出的文件，不要改 app.json。分支 agent/C0c-wordmark，从 origin/integration/2026-11 拉。每步提交一次，提交说明以“C0c:”开头。截图放进 PR，做完开 PR 后停下。
```

---

## C0d 寓意、金额、长度的显示函数（原 D9）

- **批次**：第 1 批　**依赖**：无　**大小**：M　**分支**：`agent/C0d-format`

**只能改**：新建 `miniprogram/utils/meaning.js`、`miniprogram/utils/money.js`、`miniprogram/utils/fit-text.js`、`miniprogram/tests/meaning.test.js`、`money.test.js`、`fit-text.test.js`、`tools/check-copy.py`。

**先知道的事实**（已在后端核对过）：
- 目录接口 `/api/catalog` 里每颗珠子：**`tags`** 是寓意关键词数组（最多 3 个，来自知识库），**`meaning`** 是一段文字（寓意那句话），**不是** `meaning.tags`。知识库把握低的珠子 `meaning` 是空字符串，这时不显示寓意。
- 报价接口返回的金额都是整数分：`goodsFen`、`shippingFen`、`payableFen`、`totalFen`（`totalFen` 等于 `payableFen`）。
- 尺寸判断用现有的 `pages/editor/logic.js` 的 `stats(ids, catalog, wrist)`，它返回 `{ length, target, fit, missing, ... }`。

**步骤**
1. `meaning.js`：
   - `keywords(items, limit = 3)`：`items` 是手串里的珠子对象数组（有重复）。按每种珠子出现的颗数从多到少排，依次取它的 `tags`，去重，最多 `limit` 个（详情页传 `Infinity`）。
   - `beadLine(bead)`：`bead.meaning` 不为空就返回它的第一句（以“。”切开取第一段再补回“。”）；为空返回 `''`。
   - `tagline(design, items)`：`design.line` 有值（后端或运营给的一句话）就用它；否则用 `keywords(items).join(' · ')`。**不在前端编句子。**
2. `money.js`：
   - `yuan(fen)`：整数元不带小数（`10000` → `'¥100'`），有零头带两位（`10050` → `'¥100.50'`）；`fen` 不是整数时抛错。
   - `toHand(quote)`：返回 `quote.payableFen`，没有就 `quote.totalFen`，都没有抛错。**不做任何加法。**
3. `fit-text.js`：`fitText(stats, count)` 只看 `stats.length - stats.target` 和颗数：
   - `count >= 54` → `{ word: '多圈串', state: 'multi' }`
   - 差值 `< -4` → `{ word: '还差约 Nmm', state: 'short', mm: N }`（N 四舍五入）
   - 差值 `> 6` → `{ word: '超出约 Nmm', state: 'long', mm: N }`
   - 其他 → `{ word: '刚好合适', state: 'ok', short: '合适' }`
   - 再给一个 `meterPos(stats)` 返回 0–100 的量尺位置（合适区间 −4..+6mm 映射到 43%–60%，超出两端夹在 2%–98%），和 `mockups-final.html` 里 `wb()` 函数的算法一致：`43 + (length - (target - 4)) / 10 * 17`。
4. 测试：
   - `fit-text.test.js`：用 `logic.stats` 造数据：手围 15cm、全 8mm 珠子，21 颗 → “刚好合适”，20 颗 → “还差约 5mm”，22 颗 → “超出约 11mm”，54 颗 → “多圈串”。
   - `meaning.test.js`：读 `miniprogram/pages/home/data.js` 或测试里手写 3 颗带 `tags` 和 `meaning` 的珠子：`keywords` 的每个词都在这些珠子的 `tags` 里；`meaning` 为空时 `beadLine` 返回 `''`。
   - `money.test.js`：上面列的例子；`toHand({ goodsFen: 9200, shippingFen: 800, payableFen: 10000 })` 是 `10000`。
5. `tools/check-copy.py`（C11 用）：扫 `miniprogram/` 下的 `.wxml`、`.js` 里的中文文案，检查有没有 `kb/data/attributes.json` 里的 banned 词（“转运珠”“本命年”除外），有就列出文件和行号，退出码 1。

**提示词**
```
你在仓库 串个珠 的小程序里做任务卡 C0d（寓意、金额、长度的显示函数）。先读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/miniprogram-wave1.md 的“共同规矩”和 C0d 这一节（特别是“先知道的事实”），严格按步骤做，只改卡里列出的文件。不要另外实现尺寸规则，只读 pages/editor/logic.js 的 stats 输出。分支 agent/C0d-format，从 origin/integration/2026-11 拉。每步提交一次，提交说明以“C0d:”开头。做完开 PR 后停下。
```

---

## C0e 珠子图（原 D7）

- **批次**：第 1 批　**依赖**：无　**大小**：M　**分支**：`agent/C0e-bead`

**只能改**：新建 `miniprogram/utils/bead-image.js`、`miniprogram/utils/bead-paint.js`、`miniprogram/components/bead/*`、`miniprogram/tests/bead-image.test.js`；填 `miniprogram/kit/bead/*`。

**步骤**
1. `bead-image.js`：实拍图按需下载到本地（`wx.downloadFile` + `wx.getFileSystemManager().saveFile`），建索引（存 `wx.setStorageSync('beadImageIndex', {url: {path, usedAt, size}})`），总大小超过 20MB 时按 `usedAt` 最久没用的先删；地址变了重新下载。**把读写存储、下载、删文件都通过参数传进来**（`createCache({ storage, fs, download, now, limit })`），这样测试里能用假的替换。
2. `bead-paint.js`：没有实拍图时画仿真球。输入珠子的两个颜色 `c: [亮色, 暗色]`（目录里有），输出给 `<view>` 用的 `style` 字符串：径向渐变（左上高光 → 亮色 → 暗色），加一圈内阴影。照 `mockups-final.html` 里 `bead()` 的效果，**不是平涂色块**。
3. 组件 `components/bead`：属性 `bead`（珠子对象）、`size`（`s` 48rpx / `m` 80rpx / `l` 120rpx）、`state`（`normal` / `loading` / `off`）。有实拍图显示图片，没有就用 `bead-paint`；`loading` 时是浅灰圆形骨架；`off`（缺货）时整体透明度 0.4。**格子上不加任何标记，没有红点。**
4. 临时页 `kit/bead`：8 种示例珠子（从 `/api/catalog` 取前 8 种，取不到就用测试里写死的 8 种）× 三个尺寸，再加一排 `loading` 和 `off`。
5. 测试 `bead-image.test.js`：用假的 storage / fs / download：命中缓存不重复下载；超过上限按最久没用的删；地址变化重新下载；下载失败返回 `null`（组件据此显示仿真球）。

**验收**：临时页和稿子的珠子并排截图（不是平涂色块）；断网重进，已缓存的照常显示、没缓存的显示仿真球、不报错（截图）。

**提示词**
```
你在仓库 串个珠 的小程序里做任务卡 C0e（珠子图）。先读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/miniprogram-wave1.md 的“共同规矩”和 C0e 这一节，严格按步骤做，只改卡里列出的文件，不要改 app.json。分支 agent/C0e-bead，从 origin/integration/2026-11 拉。每步提交一次，提交说明以“C0e:”开头。截图放进 PR，做完开 PR 后停下。
```

---

## C0j 模板排珠改用工作台的尺寸规则

- **批次**：第 1 批　**依赖**：无（后端已在 `integration/2026-11` 里改好）　**大小**：S　**分支**：`agent/C0j-size-rule`

**为什么**：负责人 2026-11-13 定：尺寸规则统一成**小程序工作台** `pages/editor/logic.js` 的 `stats` 那一份。后端已经改好，并留了两边共用的用例 `server/tests/fixtures/size_rule_cases.json`。小程序里还有一处不一致：`utils/template.js` 的 `build` 按“配方”算主珠、而且没有排除金属珠。

规则（以 `logic.stats` 为准，不要改 `logic.js`）：主珠 = 整串里排除隔片、金属珠、6mm 以下珠子后出现最多的直径，一样多取较小的，没有就按 8mm；目标长度 = `Math.round(手围 × 10 + max(8, 2.5 × 主珠 − 5))`。

**只能改**：`miniprogram/utils/template.js`、新建 `miniprogram/tests/size-rule-shared.test.js`。

**步骤**
1. `utils/template.js` 的 `build(template, catalog, wrist)`：
   - 开头的校验和 `fixed`（按颗数串）分支**保持不变**。
   - 删掉自己算 `sizes`、`main`、`target` 的那几行。
   - 改成和工作台 `fill` 一样的循环：`const logic = require('../pages/editor/logic')`；`beads` 从 `special` 开始，`i = 0`；循环条件 `beads.length < 80`：取 `next = pattern[i % pattern.length]`，算 `const target = logic.stats(beads.concat(next, tail), catalog, wrist).target`、`const length = logic.stats(beads.concat(tail), catalog, wrist).length`；如果 `length + Number(byId[next].mm) / 2 >= target` 就停，否则 `beads.push(next); i++`。最后返回 `beads.concat(tail)`。
   - `wrist` 没传时按 15（原来就是 `Number(wrist) || 15`）。
2. 新建 `tests/size-rule-shared.test.js`：
   ```js
   const fixture = require('../../server/tests/fixtures/size_rule_cases.json')
   const logic = require('../pages/editor/logic')
   const template = require('../utils/template')
   ```
   - 对 `fixture.stats` 每一条：`logic.stats(c.ids, fixture.catalog, c.wrist)` 的 `target` 等于 `c.target`、`length` 等于 `c.length`。
   - 对 `fixture.fill` 每一条：`template.build({ special: c.special, pattern: c.pattern, tail: c.tail }, fixture.catalog, c.wrist)` 深相等 `c.beads`。
   - 用 `test(c.name, ...)` 让每条用例单独显示。
3. 原有的 `tests/size-rule.test.js`、`creation-flows.test.js`、`design-reflow.test.js` 必须仍然通过。**不要改这些测试的断言**；有失败就停下来，把失败的用例和输出贴给我。

**验收**：`node --test miniprogram/tests/*.test.js` 全过，新测试 16 条用例全过；在开发者工具里从首页点一个热门款进工作台，状态行显示的颗数和长度截图（好运连连 15cm 应是 19 颗 162mm）。

**提示词**
```
你在仓库 串个珠 的小程序里做任务卡 C0j（模板排珠改用工作台的尺寸规则）。先读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/miniprogram-wave1.md 的“共同规矩”和 C0j 这一节，严格按步骤做，只改卡里列出的两个文件，不要改 pages/editor/logic.js，不要改 server/tests/fixtures 里的用例，不要改已有测试的断言。分支 agent/C0j-size-rule，从 origin/integration/2026-11 拉。每步提交一次，提交说明以“C0j:”开头。做完开 PR 后停下。
```

---

## C0f 基础样式和小控件（原 D4）

- **批次**：第 2 批　**依赖**：C0a 已合并　**大小**：M　**分支**：`agent/C0f-basic`

**只能改**：新建 `miniprogram/styles/components.wxss`、`miniprogram/components/state/*`、`miniprogram/tests/ui-basic.test.js`；填 `miniprogram/kit/basic/*`；改 `miniprogram/app.wxss`（只在 tokens 那行下面加一行 `@import "styles/components.wxss";`）。

**步骤**（样子照 `mockups-final.html` 里同名或同义的 CSS 类）
1. `components.wxss` 写这些类（类名必须一致，后面的卡都会用）：
   - `.c-btn`（主按钮：黑底白字、高 100rpx、胶囊）、`.c-btn--sec`（灰底黑字）、`.c-btn--s`（小号，高 60rpx）、`.is-off`（不可点，透明度 0.35）。套在原生 `<button>` 上时去掉默认边框（`::after { border: 0 }`）、去掉最小宽度。
   - `.c-link`（文字按钮）、`.c-row`（列表行：左标签、右值、可选下方说明和错误行；`.c-row--tap` 右侧带 “›”）。
   - `.c-tabs`（文字分段，选中的加粗、下划线）、`.c-chip`（胶囊标签，选中 `.is-on` 黑底白字）、`.c-pk`（“已选”标签，带小珠子图）。
   - `.c-check`（圆形勾选；`.is-on` 黑底白勾；`.is-err` 红色圈）、`.c-switch`（开关）、`.c-stepper`（圆形加减键 + 中间数字）。
   - `.c-skeleton`（骨架块，浅灰、不闪动）、`.c-gap`（分组之间的浅灰条，高 16rpx）。
2. 组件 `components/state`：属性 `title`、`desc`、`action`（按钮文字）、`link`（文字链接）；事件 `action`、`link`。空状态和失败状态共用（稿 20、62、87 的样子：居中，一行大字、一行灰字、一个次按钮）。
3. 临时页 `kit/basic`：每个类和组件各摆一个（按钮四种状态并排、勾选三种状态、开关开和关、加减键、骨架块、`c-state` 一个空状态一个失败状态）。
4. 测试 `ui-basic.test.js`：`components.wxss` 里没有 `#` 开头的颜色值；步骤 1 列的每个类名都出现在文件里。

**验收**：临时页和稿子并排截图；两个按钮并排不换行；`.is-off` 变淡；`.c-check.is-err` 是红圈，其他地方没有红色。

**提示词**
```
你在仓库 串个珠 的小程序里做任务卡 C0f（基础样式和小控件）。先确认 origin/integration/2026-11 里已经有 C0a 的提交。读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/miniprogram-wave1.md 的“共同规矩”和 C0f 这一节，严格按步骤做，类名一个字都不要改，只改卡里列出的文件。分支 agent/C0f-basic。每步提交一次，提交说明以“C0f:”开头。截图放进 PR，做完开 PR 后停下。
```

---

## C0h 手串图、款式格、手串摘要（原 D8）

- **批次**：第 2 批　**依赖**：C0e 已合并　**大小**：M　**分支**：`agent/C0h-bracelet`

**只能改**：新建 `miniprogram/components/bracelet/*`、`miniprogram/components/cell/*`、`miniprogram/components/design-row/*`；填 `miniprogram/kit/bracelet/*`；改 `miniprogram/components/bracelet-thumb/*`、`miniprogram/utils/thumb-cache.js`（只为了复用，不改对外行为）。

**步骤**
1. `components/bracelet`（正视圆环）：属性 `beads`（珠子对象数组，按顺序）、`size`（直径 rpx）、`wordmark`（布尔，中央放 `wordmark-line` 字标；C0c 没合并时先放一个同尺寸的空 `<view>`，PR 里注明）、`selected`（高亮第几颗：描边，其余透明度 0.35）、`mode`（`ring` 单条 / `stack` 叠戴：上下各一条半透明，传 `stackBeads: [beadsA, beadsB]`）。每颗珠子用 C0e 的 `bead` 组件，按珠子直径占圆周的比例排（和 `mockups-final.html` 里 `ring()` 的算法一致：所有珠子刚好排满一圈）。
2. `components/cell`（款式格，稿 03）：属性 `design`（`{name, line, beads, priceFen}`）；上面手串图，下面名字（粗）、一句寓意、小字价格（用 C0d 的 `yuan`；C0d 没合并时先在组件里写一个同名的私有函数，PR 里注明）。
3. `components/design-row`（手串摘要行，稿 02、19、45）：左边缩略图，右边名字、一句寓意、一行小字（颗数等，由调用方传 `sub`）、右侧插槽。
4. **名字和一句寓意的字号、位置在组件里写死**，不开放属性去改小（09 第 31 条）。
5. 临时页 `kit/bracelet`：三个组件各摆两三种情况（正常、高亮一颗、叠戴、加载中骨架）。

**验收**：和稿 03、19、45 并排截图；320 宽下名字和一句寓意只会被省略号截断，价格不折行。

**提示词**
```
你在仓库 串个珠 的小程序里做任务卡 C0h（手串图、款式格、手串摘要）。先确认 origin/integration/2026-11 里已经有 C0e 的提交。读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/miniprogram-wave1.md 的“共同规矩”和 C0h 这一节，严格按步骤做，只改卡里列出的文件，不要改 app.json。分支 agent/C0h-bracelet。每步提交一次，提交说明以“C0h:”开头。截图放进 PR，做完开 PR 后停下。
```

---

## C0g 弹层、底部栏、浮动提示（原 D5、D6）

- **批次**：第 3 批　**依赖**：C0f 已合并　**大小**：M　**分支**：`agent/C0g-layer`

**只能改**：新建 `miniprogram/components/sheet/*`、`miniprogram/components/bar/*`、`miniprogram/components/toast/*`、`miniprogram/utils/toast.js`、`miniprogram/tests/toast.test.js`；填 `miniprogram/kit/layer/*`；改 `miniprogram/components/privacy-popup/*`、`miniprogram/utils/privacy.js`（只改样子和触发时机，不改 `open-type="agreePrivacyAuthorization"` 和它的事件）。

**步骤**
1. `components/sheet`：属性 `show`、`title`、`maskClose`（默认 true）、`grab`（顶部小横条，默认 true）；默认插槽 + `footer` 插槽；事件 `close`。从底部升起 200ms；内容区最高 60% 屏（电商选规格弹层的高度；超过说明该做成页面）；遮罩拦住背后滚动（`catchtouchmove`）；带底部安全区；直角。在 tab 页上打开时调 `wx.hideTabBar`，关闭时 `wx.showTabBar`（用 `getCurrentPages()` 判断当前页是不是 tabBar 里的页面）。
2. `components/bar`：固定在底部的操作栏：`left` 插槽（价格）、`top` 插槽（比如确认订单的勾选行）、默认插槽（按钮）；带底部安全区；组件自己在原位置留一个同高的占位，页面内容不会被盖住。
3. `utils/toast.js` + `components/toast`（04 第 28.1 节，稿 85）：
   - 纯函数部分 `createQueue({ now, setTimer, clearTimer })`，方法 `show({ text, action, onAction, duration })`：纯提示默认 1000ms，带操作或失败的 3000ms；新的顶掉旧的；点操作后立即消失并调 `onAction`。
   - 组件：黑底白字胶囊，一句话，最多一个操作（操作文字加粗）；位置在内容区底部中央，不遮住 `c-bar`；页面可以传 `anchor` 改位置（工作台用托盘底部）。
   - 这张卡**不替换**各页面现有的 `wx.showToast`，页面卡自己换。
4. 隐私弹层（04 第 28.2 节，稿 86）：改成 `c-sheet` 的样子，文案照 04；只在第一次真正用到相机、相册、麦克风、微信地址时出现。
5. 临时页 `kit/layer`：一个按钮打开 sheet（再一个 `maskClose=false` 的）；页面底部放一个 `c-bar`（左边 ¥78，右边主按钮）；五个按钮分别触发稿 85 的五种提示。
6. 测试 `toast.test.js`：顶掉旧的；到时消失；点操作后立即消失且回调被调用；带操作时 3 秒。

**验收**：sheet 背后不滚、点遮罩能关、`maskClose=false` 不关（截图两张）；在首页打开 sheet 时 tabBar 收起、关了回来（截图两张）；`c-bar` 在 320 宽下价格不折行；隐私弹层是稿 86 的样子，`privacy.test.js` 仍通过。

**提示词**
```
你在仓库 串个珠 的小程序里做任务卡 C0g（弹层、底部栏、浮动提示）。先确认 origin/integration/2026-11 里已经有 C0f 的提交。读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/miniprogram-wave1.md 的“共同规矩”和 C0g 这一节，严格按步骤做，只改卡里列出的文件，不要改 app.json，不要替换各页面的 wx.showToast。分支 agent/C0g-layer。每步提交一次，提交说明以“C0g:”开头。截图放进 PR，做完开 PR 后停下。
```

---

## C0i AI 输入区（原 D10，去掉首页输入条）

- **批次**：第 3 批　**依赖**：C0f 已合并　**大小**：M　**分支**：`agent/C0i-composer`

> 原 D10 里的首页输入条 `c-ask` **不做了**：首页已经恢复成原来的结构（轮播、四个入口、热门款），没有输入条。

**只能改**：新建 `miniprogram/components/composer/*`；填 `miniprogram/kit/composer/*`。

**步骤**（稿 21、24、22）
1. `components/composer`：大圆角框（圆角 40rpx，浅灰底）。**上面一整行是输入框**（`<textarea auto-height>`，最多长到 5 行，超出内部滚动）；框内下面一排：左边圆形“+”按钮和一个条件标签（属性 `tag`，例如“手围 15cm”），右边圆形按钮——**没输入时是语音，有字时变成黑色发送键**。上方可选一排快捷回复（属性 `chips`，横向排，超出可横滑）。
2. 属性：`value`、`placeholder`（默认“说说想要的感觉、送谁、预算…”）、`tag`、`chips`、`voice`（false 时不显示语音）、`photo`（false 时不显示“+”）、`sending`（为 true 时发送键不可点）。事件：`send`（带文字）、`plus`、`tag`、`chip`（带文字）、`voicestart`、`voiceend`、`voicecancel`。
3. 按住说话的面板（稿 22）：按住语音键时，输入区换成波形（用 5–7 根竖条做高度动画即可）、一行“松开发送，上滑取消”、一个黑色长按钮“松开 发送”；上滑超过 80rpx 触发 `voicecancel`。这张卡**不接语音识别**，只发事件。
4. 临时页 `kit/composer`：放一个 composer，上方三个快捷回复；页面上显示最近一次收到的事件名，方便截图证明事件对。

**验收**：没输入时右侧是语音，输入一个字变成发送键，清空后变回来（截图三张）；提示语在 320 宽下一行放得下；输入 6 行文字停在 5 行高、内部滚动（截图）；按住说话、上滑取消各截一张。

**提示词**
```
你在仓库 串个珠 的小程序里做任务卡 C0i（AI 输入区）。先确认 origin/integration/2026-11 里已经有 C0f 的提交。读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/miniprogram-wave1.md 的“共同规矩”和 C0i 这一节，严格按步骤做，只改卡里列出的文件，不要做首页输入条，不要接语音识别。分支 agent/C0i-composer。每步提交一次，提交说明以“C0i:”开头。截图放进 PR，做完开 PR 后停下。
```

---

## C0z 组件注册和收口

- **批次**：第 4 批　**依赖**：C0a–C0j 全部已合并　**大小**：S　**分支**：`agent/C0z-register`

**只能改**：`miniprogram/app.json`；各 `miniprogram/kit/*/index.json`（删掉已经变成全局的 `usingComponents` 条目）。

**步骤**
1. `app.json` 加 `"usingComponents"`，注册为全局组件（名字前缀 `c-`）：`c-wordmark`、`c-bead`、`c-state`、`c-bracelet`、`c-cell`、`c-design-row`、`c-sheet`、`c-bar`、`c-toast`、`c-composer`，路径 `/components/<名字>/index`。
2. `tabBar.list` 四项的 `iconPath`、`selectedIconPath` 换成 C0b 做的 `/assets/tab/*.png`。
3. 各临时页的 `index.json` 里，已经全局注册的组件删掉，保留页面自己的。
4. 把 7 个临时页挨个打开一遍，确认都还正常。

**验收**：四个 tab 都有新图标，选中变黑（截图）；7 个临时页各截一张；主包体积和改之前比较，增加不超过 60KB（开发者工具“详情 → 本地代码”截图）。

**提示词**
```
你在仓库 串个珠 的小程序里做任务卡 C0z（组件注册和收口）。先确认 origin/integration/2026-11 里已经有 C0a、C0b、C0c、C0d、C0e、C0f、C0g、C0h、C0i、C0j 全部的提交，缺任何一个就停下来告诉我。读 docs/design/tasks/miniprogram-wave1.md 的“共同规矩”和 C0z 这一节，只改卡里列出的文件。分支 agent/C0z-register。每步提交一次，提交说明以“C0z:”开头。截图放进 PR，做完开 PR 后停下。
```

---

## C2 订单状态改读后端（原 D12）

- **批次**：第 4 批　**依赖**：A2、C0z 已合并　**大小**：S　**分支**：`agent/C2-order-state`

**为什么**：订单的主状态、进度条以前由 `utils/order-state.js` 自己从五组状态推算，现在后端（A2）直接给 `customerStatus`、`progress`、`allowedActions`。前端只负责显示。

**只能改**：`miniprogram/utils/order-state.js`、`miniprogram/tests/order-state.test.js`、`miniprogram/features/order-detail/*`（只改读状态的那几行，不改样式和布局——布局是 C7 的事）。

**步骤**
1. `order-state.js` 只保留“显示”的函数：
   - `view(order)` 返回 `{ label, desc, tone, primaryAction, progress, actions }`，全部直接取自 `order.customerStatus`、`order.progress`、`order.allowedActions`；动作的中文从 `utils/contract.js`（A1 导出）的 `actions` 取。
   - 订单里没有 `customerStatus`（旧接口）时，返回 `{ label: '订单正在处理', desc: '', tone: 'normal', primaryAction: null, progress: { show: false, steps: [] }, actions: [] }`，**不再自己推算**。
   - 删掉文件里原来的 `STATUS` 表和推算逻辑；别的文件如果还在用这些导出，先搜一遍（`grep -rn "order-state" miniprogram --include=*.js`），把调用处换成 `view()`；调用处超出“只能改”的范围就停下来问。
2. `tone` 到样式：`normal` 主字色，`attention` 主字色加粗，`danger` 红色（03 第 0 节：状态字一律主字色，只有异常用红）。
3. `features/order-detail`：把原来读五组状态、自己拼文字的地方换成 `view(order)`。
4. 测试 `order-state.test.js`：重写成测 `view()`：拿后端 `server/tests/test_order_view.py` 里的几组典型输出（待支付、制作中、已签收、退款中、售后处理中）作为输入，检查文字和按钮来自 `customerStatus` 和 `contract.js`；旧订单没有 `customerStatus` 时走兜底。

**验收**：用后台把一笔订单依次推到待支付、制作中、已签收、已取消，订单详情的标题和一句话和后端返回一致（各截一张）；`grep -n "已送达\|履约异常" miniprogram -r` 没有结果。

**提示词**
```
你在仓库 串个珠 的小程序里做任务卡 C2（订单状态改读后端）。先确认 origin/integration/2026-11 里已经有 A2 和 C0z 的提交。读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/miniprogram-wave1.md 的“共同规矩”和 C2 这一节，严格按步骤做，前端不再自己推算订单状态，只改卡里列出的文件；需要改其他调用处时停下来问我。分支 agent/C2-order-state。每步提交一次，提交说明以“C2:”开头。截图放进 PR，做完开 PR 后停下。
```
