# C0h 交付报告

分支：agent/C0h-bracelet　最后一个提交：561b99b

## 1. 步骤
| 卡上的步骤（照抄编号和第一句） | 做了 / 没做 | 在哪（文件:行，或提交 hash） |
| --- | --- | --- |
| 1. `components/bracelet`（正视圆环）：属性 `beads`、`size`、`wordmark`、`selected`、`mode` | 做了 | miniprogram/components/bracelet/index.{js,json,wxml,wxss}；提交 ed99daa（排珠公式修正含在 561b99b） |
| 2. `components/cell`（款式格，稿 03）：属性 `design`（`{name, line, beads, priceFen}`） | 做了 | miniprogram/components/cell/index.{js,json,wxml,wxss}；提交 634b623。价格用 C0d 的 `utils/money.js` `yuan`（已合并） |
| 3. `components/design-row`（手串摘要行，稿 02、19、45）：左边缩略图，右边名字、一句寓意、一行小字（`sub`）、右侧插槽 | 做了 | miniprogram/components/design-row/index.{js,json,wxml,wxss}；提交 ee0a256。缩略图复用 bracelet-thumb + thumb-cache，未改它们的行为 |
| 4. **名字和一句寓意的字号、位置在组件里写死**，不开放属性去改小 | 做了 | cell/index.wxss（名字 fs-body 粗、寓意 fs-caption）、design-row/index.wxss（名字 fs-title 粗、寓意 fs-body），均无字号相关属性 |
| 5. 临时页 `kit/bracelet`：三个组件各摆两三种情况（正常、高亮一颗、叠戴、加载中骨架） | 做了 | miniprogram/kit/bracelet/index.{js,json,wxml,wxss}；提交 561b99b |

依赖确认：C0e（bead 组件）、C0c（wordmark 组件，tone=line 用 wordmark-line.svg）、C0d（yuan）都已在 origin/integration/2026-11 合并，无临时替代。

## 2. 验收
| 卡上的验收项（照抄） | 结果 | 证据 |
| --- | --- | --- |
| 和稿 03、19、45 并排截图 | 未验证 | 需要负责人在开发者工具看：`kit/bracelet/index`，对照稿 s03（款式格）、s19 / s45（摘要行）。本机打不开微信开发者工具，未截图（按 00-dispatch.md 5.3） |
| 320 宽下名字和一句寓意只会被省略号截断，价格不折行 | 未验证（代码层保证） | cell 与 design-row 的名字/寓意均 `overflow:hidden; text-overflow:ellipsis; white-space:nowrap`（cell/index.wxss:37-40、44-47、51-54；design-row/index.wxss:29-32、36-39），价格 `white-space:nowrap`（cell/index.wxss:51-54）；需负责人在开发者工具 iPhone 5/SE（320 宽）复核 |

## 3. 改了的文件
```
 miniprogram/components/bracelet/index.js   |  98 ++++++
 miniprogram/components/bracelet/index.json  |   8 +
 miniprogram/components/bracelet/index.wxml  |  31 ++
 miniprogram/components/bracelet/index.wxss  |  38 +++
 miniprogram/components/cell/index.js        |  19 +
 miniprogram/components/cell/index.json      |   7 +
 miniprogram/components/cell/index.wxml      |  10 +
 miniprogram/components/cell/index.wxss      |  36 +++
 miniprogram/components/design-row/index.js  |  13 +
 miniprogram/components/design-row/index.json|   7 +
 miniprogram/components/design-row/index.wxml |  13 +
 miniprogram/components/design-row/index.wxss |  44 +++
 miniprogram/kit/bracelet/index.js          |  78 +++++
 miniprogram/kit/bracelet/index.json        |   9 +
 miniprogram/kit/bracelet/index.wxml        |  45 +++
 miniprogram/kit/bracelet/index.wxss        |  37 +++
 miniprogram/tests/bracelet-layout.test.js  |  41 +++
```
除本报告和测试文件外，每个文件都在卡的“只能改”里；测试文件见第 6 节说明。

## 4. 测试
三条命令的最后几行输出：
```
Ran 229 tests in 9.776s
OK (skipped=7)
ℹ tests 132
ℹ pass 132
ℹ fail 0
已填 200/200 种，有问题 0 条，缺 0 种
```
测试数：后端 开工前 229 个 → 现在 229 个；小程序 开工前 129 个 → 现在 132 个（不能变少）。

这张卡新加的测试（miniprogram/tests/bracelet-layout.test.js，测 components/bracelet/index.js 导出的纯函数 layout()）：
- `珠子直径按 mm 占比分圆周，10mm 的珠子比 8mm 的大，整圈相切排满`：珠径与 mm 成正比、珠径之和等于圆心圆周 2π·rc、最大珠外沿贴圆环边缘。这条测试抓到过真 bug（初版公式没扣珠径，珠子飞出圆环），已修正。
- `同 mm 的珠子直径相同，位置都在圆环上（到圆心距离一致）`：同规格珠子一致性 + 不出界。
- `空数组 / 没有 size 返回空，缺 mm 的珠子被跳过`：边界情况。

## 5. 自查（贴命令和输出）
- git log --oneline origin/integration/2026-11..HEAD：
```
561b99b C0h: kit/bracelet 临时页 + 排珠算法测试（修正相切排满公式）
ee0a256 C0h: design-row 手串摘要行（缩略图+名字/寓意/sub+右侧插槽）
634b623 C0h: cell 款式格（稿 03：手串图+名字+一句寓意+小字价格，字号写死）
ed99daa C0h: bracelet 组件（正视圆环，ring/stack、选中高亮、中央字标）
8b3a47d C0h: 开工
```
- grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\("（bracelet/cell/design-row/kit 的 wxss）：无输出（颜色只用变量）
- grep -rnE "new URL|URLSearchParams"（本卡新增目录）：无输出

## 6. 没做 / 没验证 / 偏离卡片
- 未在开发者工具验证：临时页视觉效果需要负责人看 `kit/bracelet/index`（对照稿 s03、s19、s45），未编截图。
- 偏离一处：新建了 `miniprogram/tests/bracelet-layout.test.js`。原因：共同规矩第 6 条“纯函数一定要有 node:test 测试”，卡上没列测试文件，但 bracelet 的排珠 layout() 是纯函数且值得测（测试确实抓到了排珠公式 bug）。组件 js 里用 `typeof Component === 'function'` 守卫 + `module.exports = { layout }` 以便 node 直接引用。如果这算越界，删掉这个测试文件即可，组件不受影响。
- bracelet-thumb 和 utils/thumb-cache.js 只为复用，未改。

## 7. 审核修改（打回后才有）
无。
