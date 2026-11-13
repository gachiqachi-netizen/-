# C0d 交付报告

分支：agent/C0d-format　最后一个提交：dddf4ad

## 1. 步骤
| 卡上的步骤（照抄编号和第一句） | 做了 / 没做 | 在哪（文件:行，或提交 hash） |
| --- | --- | --- |
| 1. meaning.js：keywords / beadLine / tagline | 做了 | miniprogram/utils/meaning.js（c660c10）；tagline 不编句子，design.line 优先，否则 keywords().join(' · ') |
| 2. money.js：yuan / toHand | 做了 | miniprogram/utils/money.js（c660c10）；toHand 不做加法，payableFen→totalFen→抛错 |
| 3. fit-text.js：fitText / meterPos | 做了 | miniprogram/utils/fit-text.js（c660c10）；多圈串先看颗数 ≥54，量尺 43+(length-(target-4))/10*17，夹 2–98 |
| 4. 三个测试文件 | 做了 | miniprogram/tests/fit-text.test.js、meaning.test.js、money.test.js（e603f12），13 个用例 |
| 5. tools/check-copy.py | 做了 | tools/check-copy.py（dddf4ad），白名单“转运珠”“本命年” |

## 2. 验收
| 卡上的验收项（照抄） | 结果 | 证据 |
| --- | --- | --- |
| fit-text.test.js：21 颗 → “刚好合适”，20 → “还差约 5mm”，22 → “超出约 11mm”，54 → “多圈串” | 通过 | 测试名：'21 颗 8mm 珠（差 +3mm）显示“刚好合适”'、'20 颗 8mm 珠（差 -5mm）显示“还差约 5mm”'、'22 颗 8mm 珠（差 +11mm）显示“超出约 11mm”'、'54 颗起算多圈串，只看颗数不看差值'（miniprogram/tests/fit-text.test.js） |
| meaning.test.js：keywords 每个词都在珠子的 tags 里；meaning 为空 beadLine 返回 '' | 通过 | 测试名：'keywords 按颗数从多到少取 tags 并去重，默认最多 3 个，每个词都来自珠子的 tags'、'beadLine 只返回第一句，meaning 为空返回空串'（miniprogram/tests/meaning.test.js） |
| money.test.js：卡上例子；toHand({goodsFen:9200,shippingFen:800,payableFen:10000}) 是 10000 | 通过 | 测试名：'yuan：整数元不带小数，有零头带两位'、'toHand：payableFen 优先，其次 totalFen'（miniprogram/tests/money.test.js） |
| 组件样子截图（共同规矩第 7 条） | 不适用 | 本卡无组件、无 wxml/wxss，纯函数 + 脚本工具，无界面可看 |

## 3. 改了的文件
```
 miniprogram/tests/fit-text.test.js | 42 +
 miniprogram/tests/meaning.test.js  | 34 +
 miniprogram/tests/money.test.js    | 29 +
 miniprogram/utils/fit-text.js      | 20 +
 miniprogram/utils/meaning.js       | 38 +
 miniprogram/utils/money.js         | 24 +
 tools/check-copy.py                | 40 +
 7 files changed, 227 insertions(+)
```
都在卡的“只能改”里（含本报告 docs/reports/C0d.md）。

## 4. 测试
三条命令的最后几行输出：
```
python3 -m unittest discover -s server/tests
OK (skipped=7)

node --test miniprogram/tests/*.test.js
ℹ tests 97
ℹ pass 97
ℹ fail 0

python3 kb/validate.py
已填 200/200 种，有问题 0 条，缺 0 种
```
测试数：后端 开工前 225 个 → 现在 225 个；小程序 开工前 84 个 → 现在 97 个（+13，没少）。
这张卡新加的测试（13 个）：
- fit-text.test.js（5 个）：21/20/22/54 颗四种 fitText 结果；meterPos 边界 43%/60%、区间内部、两端夹 2%/98%。
- meaning.test.js（4 个）：keywords 排序去重上限且每个词出自 tags；Infinity 取全；beadLine 取首句及空 meaning；tagline line 优先与关键词回退。
- money.test.js（4 个）：yuan 整元/零头/零值显示；非整数分抛错；toHand payableFen 优先 totalFen 回退；缺字段抛错不做加法。

## 5. 自查（贴命令和输出）
- git log --oneline origin/integration/2026-11..HEAD：
```
dddf4ad C0d: 新增 tools/check-copy.py 文案禁用词检查（白名单转运珠本命年）
e603f12 C0d: 新增 fit-text/meaning/money 三个 node:test 测试文件
c660c10 C0d: 新建寓意/金额/长度显示函数 meaning.js money.js fit-text.js
0bf841c C0d: 开工
```
- 小程序卡自查（本卡没改 .wxss，颜色 grep 不适用）；`grep -rnE "new URL|URLSearchParams" miniprogram/utils/meaning.js miniprogram/utils/money.js miniprogram/utils/fit-text.js` 无输出（未用 URL）。
- python3 tools/check-copy.py 输出：
```
miniprogram/pages/ai/ai.wxml:6: 保平安
exit=1
```
  这是工具的真实输出：既有文件 pages/ai/ai.wxml 第 6 行示例按钮“送爸妈，保平安”命中禁用词，不在本卡“只能改”里，未动，留给 C11 处理；utils/catalog-preview.js 里的“转运”均在“转运珠”中，白名单生效未误报。

## 6. 没做 / 没验证 / 偏离卡片
- 无偏离。ai.wxml 的“保平安”是存量命中，按规矩没改（本卡不能改那个文件）。
- 纯函数卡，无界面，未在开发者工具验证（无界面可验）。
