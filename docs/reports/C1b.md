# C1b 交付报告

分支：agent/C1b-nav　最后一个代码提交：7999d80（报告提交见分支 HEAD）

## 1. 步骤
| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| `openWorkbench(design)`：先存未保存草稿，再切到工作台 tab | 做了 | `miniprogram/utils/nav.js`；f8fb633 |
| `backFromWorkbench()`：返回进入前的 tab，记不到回首页 | 做了 | `miniprogram/utils/nav.js`；f8fb633 |
| 手围默认 15cm 并明说，首次去下单确认一次 | 做了 | `miniprogram/utils/nav.js`；f8fb633 |
| 删 `pages/ar-tryon/` 并从 `app.json` 去掉 | 做了 | `miniprogram/app.json`、跳板目录；908affc |
| 试戴入口直达 `ar-hand/index`，失败时提示照片试戴 | 做了 | `miniprogram/features/tryon/tryon.js`；0de6174 |
| 替换旧跳板测试并覆盖导航 | 做了 | `miniprogram/tests/ar-model-cache.test.js`、`nav.test.js`；ef05a8a、d438d4a |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 有未保存草稿时打开另一条，前一条进作品 | 通过 | `nav.test.js::opening another design saves an unsaved current draft before switching tab` |
| 首页、AI 配、我的进入工作台后返回原 tab | 逻辑测试通过，界面未验证 | `nav.test.js::workbench returns to the tab from home, AI, or mine`；需要负责人在开发者工具看：`pages/diy/diy`，对照稿 s08 |
| 手围没量过默认 15cm，首次去下单确认一次 | 通过 | `nav.test.js::unmeasured wrist defaults to 15cm and checkout confirms only once` |
| AR 入口直达 `ar-hand/index`，失败时出现照片试戴提示 | 通过 | `ar-model-cache.test.js::tryon opens AR directly and offers photo tryon if navigation fails` |
| `grep -rn 'ar-tryon' miniprogram` 无结果 | 通过 | 该命令无输出；删除前 `rg 'ar-tryon/(yuv.js\|LICENSE)' miniprogram/ar-hand` 也无输出 |

## 3. 改了的文件
```text
 docs/reports/C1b.md                      |  89 ++++++++++++++++++++
 miniprogram/app.json                     |   3 +-
 miniprogram/features/tryon/tryon.js      |   2 +-
 miniprogram/pages/ar-tryon/LICENSE       |  21 -----
 miniprogram/pages/ar-tryon/ar-tryon.js   |   2 -
 miniprogram/pages/ar-tryon/ar-tryon.json |   1 -
 miniprogram/pages/ar-tryon/ar-tryon.wxml |   1 -
 miniprogram/pages/ar-tryon/ar-tryon.wxss |   1 -
 miniprogram/pages/ar-tryon/yuv.js        | 140 -------------------------------
 miniprogram/tests/ar-model-cache.test.js |  11 +--
 miniprogram/tests/creation-flows.test.js |   4 +-
 miniprogram/tests/nav.test.js            |  69 ++++++++++++++-
 miniprogram/utils/nav.js                 |  51 +++++++++--
 13 files changed, 209 insertions(+), 186 deletions(-)
```

## 4. 测试
```text
python3 -m unittest discover -s server/tests
Ran 531 tests in 81.117s
OK (skipped=7)

node --test miniprogram/tests/*.test.js
ℹ tests 150
ℹ pass 150
ℹ fail 0

python3 kb/validate.py
已填 200/200 种，有问题 0 条，缺 0 种
```
测试数：后端开工前 531 个 → 现在 531 个；小程序开工前 146 个 → 现在 150 个。

本卡新加的测试：`opening another design saves an unsaved current draft before switching tab` 验证草稿自动存作品；`unchanged current draft does not create another saved work` 验证无改动不重复存；`workbench returns to the tab from home, AI, or mine` 验证返回来源；`unmeasured wrist defaults to 15cm and checkout confirms only once` 验证默认值与一次确认。`openEditor uses tab navigation without exceeding page stack` 是原循环测试改用新跳转规则。`tryon opens AR directly and offers photo tryon if navigation fails` 替换了原跳板页测试。

旧测试期望改动：`creation-flows.test.js` 中照片和 AI 方案使用后的两处导航期望，从 `/pages/editor/editor` 改为 `/pages/diy/diy`；原行为已由本卡工作台 tab 跳转取代，只改期望路由，其他断言保留。`ar-model-cache.test.js` 中原“legacy AR entry redirects to photo page after subpackage failure”测试按负责人明确授权删除，换成直达 AR 与失败提示测试；该文件其他测试未改。

## 5. 自查（贴命令和输出）
```text
git log --oneline origin/integration/2026-11..HEAD
7999d80 C1b: 更新旧流程测试的工作台路由期望
908affc C1b: 删除 AR 跳板页和主包注册
ef05a8a C1b: 用直接 AR 入口测试替换旧跳板测试
0de6174 C1b: 试戴页直达 AR 并提示照片试戴
fe626b9 C1b: 记录 AR 跳板引用范围阻塞
d438d4a C1b: 覆盖草稿切换返回和手围导航
f8fb633 C1b: 工作台跳转和首次下单手围确认
1a2b98b C1b: 开工

grep -rn 'ar-tryon' miniprogram
（空）
grep -rnE 'new URL|URLSearchParams' miniprogram --include=*.js
（空）
```
本卡未改 `.wxss` 颜色样式；`git status --short` 在报告提交后为空。

## 6. 没做 / 没验证 / 偏离卡片
经负责人在本次回复中同意，额外修改 `miniprogram/features/tryon/tryon.js`、`miniprogram/tests/ar-model-cache.test.js`；另按已授权的旧期望值规则改 `miniprogram/tests/creation-flows.test.js` 的两处路由期望。未在微信开发者工具或真机验证；需负责人对照稿 s08 检查工作台返回。无其他未完成项。

## 7. 审核修改（打回后才有）
| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
| 授权 A-1 | 试戴页直达 AR，失败时用本页 error 提示 | 0de6174 |
| 授权 A-2 | 替换旧跳板页测试，其他测试不变 | ef05a8a |
| 授权 A-3 | 确认 ar-hand 无旧文件引用后删除跳板目录和注册项 | 908affc |
