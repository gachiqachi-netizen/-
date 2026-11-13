# C0b 交付报告

分支：agent/C0b-icons　最后一个提交：0d1ba8a

## 1. 步骤
| 卡上的步骤（照抄编号和第一句） | 做了 / 没做 | 在哪（文件:行，或提交 hash） |
| --- | --- | --- |
| 1. 打开 mockups-final.html 看源码，照着 symbol 画成单独的 SVG 文件（back undo stack share save mic plus minus up check copy close more chevron-right camera image hand spark bead；viewBox 0 0 24 24，stroke #111111 width 1.5；up/check 另存白色版） | 做了 | miniprogram/assets/icons/*.svg（20 个文件）；chevron-right、image 稿子里没有 symbol，按同款风格自绘（chevron-right 为 back 的镜像；image 为方框+圆点+山形线）；提交 14a5b14 |
| 2. tab 图标：首页/自己串/AI 配/我的各两张 81×81 PNG，未选中 #6e6e6e、选中 #111111，透明底，每张 ≤3KB（不改 app.json） | 做了 | miniprogram/assets/tab/ 8 张 PNG（PIL 4 倍超采样绘制后缩到 81×81，量化 32 色压缩，最大 963B）；未改 app.json；提交 297506d |
| 3. 临时页 kit/icons：全部图标排成网格，每个下面写名字，用 /assets/icons/xx.svg | 做了 | miniprogram/kit/icons/index.{js,wxml,wxss}，另加 tab PNG 对照区；提交 eaaad08 |
| 4. 测试 icons.test.js：每个名字都有文件；无 alert/warn；每个 SVG 含 stroke-width="1.5"；8 张 tab PNG 存在且 ≤3KB | 做了 | miniprogram/tests/icons.test.js，6 个测试；提交 0d1ba8a |

## 2. 验收
| 卡上的验收项（照抄） | 结果 | 证据 |
| --- | --- | --- |
| 临时页截图，粗细一致 | 未在开发者工具验证 | 需要负责人在开发者工具看：kit/icons/index，对照稿 s65。规格统一由 icons.test.js 的「every svg uses stroke-width 1.5 and 24 viewBox」保证 |
| 需真机：iOS、安卓各一台打开临时页，SVG 能显示（不显示就改成同名 PNG，并在 PR 里说明） | 未验证 | 无真机；需要负责人真机查看 kit/icons/index。若 SVG 不显示需打回改成 PNG |

## 3. 改了的文件
```
 miniprogram/assets/icons/back.svg          |   1 +
 miniprogram/assets/icons/bead.svg          |   1 +
 miniprogram/assets/icons/camera.svg        |   1 +
 miniprogram/assets/icons/check-on.svg      |   1 +
 miniprogram/assets/icons/check.svg         |   1 +
 miniprogram/assets/icons/chevron-right.svg |   1 +
 miniprogram/assets/icons/close.svg         |   1 +
 miniprogram/assets/icons/copy.svg          |   1 +
 miniprogram/assets/icons/hand.svg          |   1 +
 miniprogram/assets/icons/image.svg         |   1 +
 miniprogram/assets/icons/mic.svg           |   1 +
 miniprogram/assets/icons/minus.svg         |   1 +
 miniprogram/assets/icons/more.svg          |   1 +
 miniprogram/assets/icons/plus.svg          |   1 +
 miniprogram/assets/icons/save.svg          |   1 +
 miniprogram/assets/icons/share.svg         |   1 +
 miniprogram/assets/icons/spark.svg         |   1 +
 miniprogram/assets/icons/stack.svg         |   1 +
 miniprogram/assets/icons/undo.svg          |   1 +
 miniprogram/assets/icons/up-on.svg         |   1 +
 miniprogram/assets/icons/up.svg            |   1 +
 miniprogram/assets/tab/bead-on.png         | Bin 0 -> 633 bytes
 miniprogram/assets/tab/bead.png            | Bin 0 -> 963 bytes
 miniprogram/assets/tab/chat-on.png         | Bin 0 -> 414 bytes
 miniprogram/assets/tab/home-on.png         | Bin 0 -> 456 bytes
 miniprogram/assets/tab/home.png            | Bin 0 -> 595 bytes
 miniprogram/assets/tab/me-on.png           | Bin 0 -> 546 bytes
 miniprogram/assets/tab/me.png              | Bin 0 -> 815 bytes
 miniprogram/kit/icons/index.js             |   9 ++++-
 miniprogram/kit/icons/index.wxml           |  19 ++++++++-
 miniprogram/kit/icons/index.wxss           |   5 +++
 miniprogram/tests/icons.test.js            |  61 +++++++++++++++++++++++++
 docs/reports/C0b.md                        |  （本报告）
```
除本报告外，每个文件都在卡的「只能改」里。

## 4. 测试
```
python3 -m unittest discover -s server/tests
Ran 225 tests in 9.373s
OK (skipped=7)

node --test miniprogram/tests/*.test.js
ℹ tests 90
ℹ pass 90
ℹ fail 0

python3 kb/validate.py
已填 200/200 种，有问题 0 条，缺 0 种
```
测试数：后端 开工前 225 个 → 现在 225 个；小程序 开工前 84 个 → 现在 90 个（新增 6 个，没有变少）。

这张卡新加的测试（miniprogram/tests/icons.test.js）：
- every icon name from step 1 has an svg file：步骤 1 点名的 18 个图标每个都有文件
- white variants up-on and check-on exist：白色版存在
- no alert or warn icon files：目录里没有 alert/warn 文件名
- every svg uses stroke-width 1.5 and 24 viewBox：每个 SVG 都含 stroke-width="1.5"、viewBox 0 0 24 24、fill="none"（more.svg 的圆点按稿子用 stroke-width="2.5" 覆盖，根元素仍是 1.5）
- up-on and check-on are white：白色版 stroke 是 #ffffff
- eight tab pngs exist and each is at most 3KB：8 张 tab PNG 都在 3KB 以内

## 5. 自查（贴命令和输出）
```
$ git log --oneline origin/integration/2026-11..HEAD
0d1ba8a C0b: 图标文件与 tab PNG 的 node:test 测试
eaaad08 C0b: kit/icons 临时页图标网格
297506d C0b: tab 图标 4 组 8 张 81×81 PNG
14a5b14 C0b: 18 个 SVG 图标 + up/check 白色版
f88682a C0b: 开工

$ grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(" miniprogram/kit/icons/index.wxss
（无输出）

$ grep -rnE "new URL|URLSearchParams" miniprogram/kit/icons/ miniprogram/tests/icons.test.js
（无输出）
```

## 6. 没做 / 没验证 / 偏离卡片
- 未在开发者工具验证（本机打不开）：临时页截图、粗细一致为规范统一保证，需要负责人在开发者工具看 kit/icons/index，对照稿 s65。
- 真机未验证：iOS/安卓 SVG 显示情况需负责人真机查看；如不显示，按卡的要求打回改成同名 PNG。
- 偏离：chevron-right、image 两个图标稿子里没有 symbol，按同款线宽和风格自绘（已在步骤 1 注明）。
- tab PNG 用 PIL 程序绘制（本机无 SVG 渲染器），形状与稿子 symbol 路径一致。
