# C0c 交付报告

分支：agent/C0c-wordmark　最后一个提交：60fcefc

> 临时稿，字体授权待确认：字标用本机系统 Songti SC Regular + Times New Roman 转曲生成，正式稿等品牌设计师给后同名替换。

## 1. 步骤
| 卡上的步骤（照抄编号和第一句） | 做了 / 没做 | 在哪（文件:行，或提交 hash） |
| --- | --- | --- |
| 1. 字标是两行：宋体“珠养养”，下面一行衬线大写“ZHU YANG YANG”，比例照 mockups-final.html 第〇节（中英文约 2.3:1，中文字距约字号 0.35 倍），做成文字转曲线的 SVG | 做了 | miniprogram/assets/brand/wordmark.svg 等三文件；fontTools 取 Songti SC（珠养养，70px，字距 24.5px=0.35×字号）与 Times New Roman（ZHU YANG YANG，≈30.4px=70/2.3）字形轮廓转 path，不依赖设备字体；提交 5d3b3ea |
| 2. 三个颜色：wordmark.svg #111111；wordmark-line.svg 取 --c-line 值 #e8e8e8；wordmark-on.svg 白色 | 做了 | 三色 SVG 各一，颜色在根元素 fill；--c-line 取自 docs/design/tokens.wxss 第 16 行 #e8e8e8；提交 5d3b3ea |
| 3. 组件 components/wordmark：属性 tone（text/line/on 默认 text）、size（nav 40rpx / tray 64rpx / corner 28rpx / block 120rpx），内部是 image mode="heightFix" | 做了 | miniprogram/components/wordmark/index.{js,json,wxml,wxss}；提交 60fcefc |
| 4. 临时页 kit/wordmark：3 种颜色 × 4 种尺寸排出来，on 那一行放在深色底上 | 做了 | miniprogram/kit/wordmark/*；深色底用 var(--c-text)（C0a 的 tokens.wxss）；提交 60fcefc |

## 2. 验收
| 卡上的验收项（照抄） | 结果 | 证据 |
| --- | --- | --- |
| 临时页和稿子第〇节并排截图 | 未在开发者工具验证 | 需要负责人在开发者工具看：kit/wordmark/index，对照稿 s65。字标本体已在本机渲染成 PNG 目检通过（宋体两行结构正确，黑/线灰/白三版） |
| corner 尺寸在 320 宽下认得出三个字 | 未在开发者工具验证 | 需要负责人在开发者工具用 iPhone 5/SE（320 宽）看 kit/wordmark/index。corner 高 28rpx，SVG 为矢量放大不虚 |
| 不像任何系统图标、只有一种颜色（09 第 27 条） | 通过 | 每个 SVG 单一 fill 颜色，共 18 个 path 组无渐变无描边混合；文字字形非图标 |

## 3. 改了的文件
```
 miniprogram/assets/brand/wordmark-line.svg | 18 ++++++++++++++++++
 miniprogram/assets/brand/wordmark-on.svg   | 18 ++++++++++++++++++
 miniprogram/assets/brand/wordmark.svg      | 18 ++++++++++++++++++
 miniprogram/components/wordmark/index.js   | 20 ++++++++++++++++++++
 miniprogram/components/wordmark/index.json |  4 ++++
 miniprogram/components/wordmark/index.wxml |  1 +
 miniprogram/components/wordmark/index.wxss |  1 +
 miniprogram/kit/wordmark/index.js          |   8 ++++++++
 miniprogram/kit/wordmark/index.json        |   4 +++-
 miniprogram/kit/wordmark/index.wxml        |  10 ++++++++--
 miniprogram/kit/wordmark/index.wxss        |   4 ++++
 docs/reports/C0c.md                        |  （本报告）
```
除本报告外，每个文件都在卡的「只能改」里。

## 4. 测试
```
python3 -m unittest discover -s server/tests
Ran 225 tests in 8.440s
OK (skipped=7)

node --test miniprogram/tests/*.test.js
ℹ tests 84
ℹ pass 84
ℹ fail 0

python3 kb/validate.py
已填 200/200 种，有问题 0 条，缺 0 种
```
测试数：后端 开工前 225 个 → 现在 225 个；小程序 开工前 84 个 → 现在 84 个（本卡没有纯函数，按共同规矩第 6 条不加 node:test）。
这张卡新加的测试：无。

## 5. 自查（贴命令和输出）
```
$ git log --oneline origin/integration/2026-11..HEAD
60fcefc C0c: wordmark 组件（tone/size）+ kit/wordmark 预览页
5d3b3ea C0c: 宋体转曲字标三版（text/line/on），临时稿字体授权待确认
26feb0d C0c: 开工

$ grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(" miniprogram/kit/wordmark/index.wxss miniprogram/components/wordmark/index.wxss
（无输出）

$ grep -rnE "new URL|URLSearchParams" miniprogram/components/wordmark/ miniprogram/kit/wordmark/
（无输出）
```

## 6. 没做 / 没验证 / 偏离卡片
- 未在开发者工具验证（本机打不开）：临时页截图、corner 320 宽认字需负责人在开发者工具看 kit/wordmark/index，对照稿 s65。
- 字标为临时稿：系统 Songti SC + Times New Roman 转曲，字体授权待确认，正式稿由品牌设计师给后同名替换（已按卡要求在 PR 注明）。
- 深色底在 C0a 的 tokens.wxss 合并前 var(--c-text) 无定义（只影响本临时页的 on 行底色，合并后即正常）。
