# C5a 交付报告

分支：agent/C5a-ai-chat　最后一个审核提交：065295c

## 1. 步骤
| 卡上的步骤（照抄编号和第一句） | 做了 / 没做 | 在哪（文件:行，或提交 hash） |
|---|---|---|
| 首屏只有一句标题和三个示例（左对齐、同宽整行）。 | 做了 | `miniprogram/pages/ai/ai.wxml:8-11`，bcbfc36 |
| 回复 = 一条消息 + 一行三张卡片。 | 做了 | `miniprogram/pages/ai/ai.wxml:20-40`，bcbfc36 |
| 时间行只在隔 5 分钟以上或跨天时出现；导航栏左边“新对话”。 | 做了 | `miniprogram/pages/ai/ai.js:97-100`、`ai.wxml:3-6`，bcbfc36 |
| 卡片上的名字、价格、颗数长度只用后端 B-8 返回的字段，消息文字不显示模型写的数字。 | 做了 | `miniprogram/pages/ai/ai.js:18-22,58-65,109-119`，bcbfc36 |
| B-8 没合并时卡片只显示一张（旧接口）。 | 不适用；B-8 已合并 | `miniprogram/pages/ai/ai.js:106-113` |

## 2. 验收
| 卡上的验收项（照抄） | 结果 | 证据 |
|---|---|---|
| 1. 第一次进来和稿 21 并排截图：只有一句标题和三个示例，没有说明段落；标题和示例都左对齐，示例是同样宽的整行胶囊。 | 待视觉验收 | 需要负责人在开发者工具看：`pages/ai/ai`，对照稿 s21 |
| 2. 点示例：气泡出现，进入等待（稿 23），然后出结果（稿 24）。截图三张。 | 代码完成，待实机验收 | `miniprogram/tests/creation-flows.test.js`；需要负责人在开发者工具看：`pages/ai/ai`，对照稿 s23/s24 |
| 3. 推荐卡片：名字、一句寓意、关键词最显眼，价格在右上小字；第二张露出一截，上方有“1 / 3”；左右滑能看到三条；点卡片进手串详情；“改一改”进工作台；“去下单”进确认订单。截图三张。 | 代码完成，待实机验收 | `miniprogram/pages/ai/ai.wxml:24-40`；需要负责人在开发者工具看：`pages/ai/ai`，对照稿 s24 |
| 3a. 隔 5 分钟以上再进来发一条：对话中间出现一行时间；同一轮里连续发不出现时间。截图。 | 代码完成，待实机验收 | `miniprogram/pages/ai/ai.js:97-100`；需要负责人在开发者工具看：`pages/ai/ai`，对照稿 s24 |
| 4. 对话里没有材料清单、注意事项、尺寸段落。截图。 | 代码完成，待实机验收 | `miniprogram/pages/ai/ai.wxml:20-40`；需要负责人在开发者工具看：`pages/ai/ai`，对照稿 s24 |
| 5. 断网发送：AI 的位置是原因和“再试一次”，原话还在（稿 26）。截图。 | 代码完成，待实机验收 | `miniprogram/tests/creation-flows.test.js`；需要负责人在开发者工具看：`pages/ai/ai`，对照稿 s26 |
| 6. 点用户气泡：内容回到输入框。截图。 | 代码完成，待实机验收 | `miniprogram/pages/ai/ai.js:72-73`；需要负责人在开发者工具看：`pages/ai/ai`，对照稿 s24 |
| 7. 09 清单：6；15（满足不了条件直说）；16（数字不让模型写）；17；25（输入区）；29（对话里只有消息 + 卡片）；31（先讲寓意）；G1–G8。 | 代码完成，待实机验收 | `miniprogram/pages/ai/ai.js`、`ai.wxml`；需要负责人在开发者工具看：`pages/ai/ai`，对照稿 s21/s24/s26 |

## 3. 改了的文件
```
 docs/reports/C5a.md                      |  63 +++++++++++++
 miniprogram/pages/ai/ai.js               | 146 +++++++++++++++++++++++++------
 miniprogram/pages/ai/ai.json             |  10 ++-
 miniprogram/pages/ai/ai.wxml             |  61 +++++++++----
 miniprogram/pages/ai/ai.wxss             |  47 ++++++++--
 miniprogram/tests/ai-page.test.js        |  86 ++++++++++++++++++
 miniprogram/tests/creation-flows.test.js |   2 +-
 7 files changed, 361 insertions(+), 54 deletions(-)
```

## 4. 测试
测试数：原交付后端 555 个 → 合并 integration 后 558 个 → 审核后 558 个；小程序原交付 168 个 → 合并 integration 后 200 个 → 审核 1–4 后 204 个 → 本次 205 个。
审核新增 `miniprogram/tests/ai-page.test.js`：plans 优先、数字回复替换、按 pricing 计价（含零手工费）、时间行规则，原有 4 个测试；本次新增小数长度四舍五入测试，共 5 个。相关旧流程测试 `creation-flows.test.js` 的价格期望从 69 元改为 54 元：测试目录没有 pricing 配置时，新的统一计价按 18 颗 × 3 元，手工费和运费默认 0 分，不再写死加 15 元。
三条全量测试（先执行 `unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy`）：
```
python3 -m unittest discover -s server/tests 2>&1 | tail -15
Ran 558 tests in 119.556s
OK (skipped=7)

node --test miniprogram/tests/*.test.js 2>&1 | tail -15
ℹ tests 204
ℹ pass 204
ℹ fail 0

python3 kb/validate.py 2>&1 | tail -15
已填 200/200 种，有问题 0 条，缺 0 种
```
本次按要求只重跑小程序全量：`node --test miniprogram/tests/*.test.js 2>&1 | tail -15` → `tests 205`、`pass 205`、`fail 0`。

## 5. 自查（贴命令和输出）
`git log --oneline origin/integration/2026-11..HEAD`：审核前 4 条 `C5a:` 提交；此前审核新增 2 条 `C5a: 审核` 提交；本次再新增 1 条 `C5a: 审核 5` 提交。另有按审核要求合入 integration 的 merge 提交。
`grep -nE "#[0-9a-fA-F]{3,8}\\b|rgba?\\(" miniprogram/pages/ai/ai.wxss`：无输出。
`grep -rnE "new URL|URLSearchParams" miniprogram --include=*.js`：无输出。
`git diff --check`：无输出。

## 6. 没做 / 没验证 / 偏离卡片
未在微信开发者工具验证，无并排截图；需负责人对照 s21、s23、s24、s26 检查。

## 7. 审核修改（打回后才有）
| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
| 1 | 先读取 plans；designs 仅提供寓意和旧兼容字段；plans 独立存在仍可展示、编辑和下单。 | 167b048 |
| 2 | 卡片用 plans.count 与 plans.lengthMm 显示“颗数 · 厘米长度”。 | 167b048 |
| 3 | 兜底价按 catalog.pricing 调用共用 totalHand，金额计算用整数分，最后调用 money.yuan。 | 167b048 |
| 4 | 新增 ai-page.test.js 四项测试；旧流程测试的价格期望由 69 改 54。 | 065295c |
| 5 | 长度允许正的有限小数毫米；新增 162.5mm → 16.3cm 测试，小程序全量 205/205。 | ed80bf1 |
