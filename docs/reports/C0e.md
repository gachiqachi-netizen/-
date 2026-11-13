# C0e 交付报告

分支：agent/C0e-bead　最后一个提交：c3e7496

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
| --- | --- | --- |
| 1. bead-image.js：按需下载、索引、20MB 上限按 usedAt 最久没用先删、依赖全注入 | 做了 | miniprogram/utils/bead-image.js（提交 b85ec40），`createCache({ storage, fs, download, now, limit })` |
| 2. bead-paint.js：两色径向渐变 + 内阴影，照 mockups-final.html bead() | 做了 | miniprogram/utils/bead-paint.js（提交 b85ec40）：左上高光 + 左下补光 + 亮→暗主渐变 + 两道内阴影 |
| 3. 组件 components/bead：bead/size/state，loading 骨架、off 透明度 0.4、无红点标记 | 做了 | miniprogram/components/bead/*（提交 37dff61） |
| 4. kit/bead 临时页：8 种 × 三尺寸 + loading 排 + off 排 | 做了 | miniprogram/kit/bead/*（提交 541ee71）；先取 /api/catalog 前 8 种，取不到用写死的 8 种 |
| 5. 测试 bead-image.test.js | 做了 | miniprogram/tests/bead-image.test.js（提交 c3e7496） |

## 2. 验收

| 卡上的验收项 | 结果 | 证据 |
| --- | --- | --- |
| 临时页和稿子的珠子并排截图（不是平涂色块） | 未截图 | 需要负责人在开发者工具看：`kit/bead/index`，对照稿 mockups-final.html 里 bead() 的珠子（高光 + 渐变 + 内阴影）；paint 输出含 radial-gradient 和 box-shadow:inset 有测试断言（bead-image.test.js::paint 输出径向渐变和内阴影，不是平涂） |
| 断网重进：已缓存照常显示、没缓存显示仿真球、不报错 | 逻辑有测试，真机未验证 | 需要负责人在开发者工具看：`kit/bead/index` 断网重进；测试 `bead-image.test.js::命中缓存不重复下载`、`下载失败返回 null`（失败时组件显示仿真球） |
| 三条测试通过 | 通过 | 见第 4 节 |

## 3. 改了的文件

```
 miniprogram/components/bead/index.js   | 93 ++++++++++++++++++++++++++++++++++
 miniprogram/components/bead/index.json |  3 ++
 miniprogram/components/bead/index.wxml |  3 ++
 miniprogram/components/bead/index.wxss |  7 +++
 miniprogram/kit/bead/index.js          | 33 +++++++++++-
 miniprogram/kit/bead/index.json        |  4 +-
 miniprogram/kit/bead/index.wxml        | 23 ++++++++-
 miniprogram/kit/bead/index.wxss        |  3 ++
 miniprogram/tests/bead-image.test.js   | 86 +++++++++++++++++++++++++++++++
 miniprogram/utils/bead-image.js        | 63 +++++++++++++++++++++++
 miniprogram/utils/bead-paint.js        |  16 ++++++
 11 files changed, 330 insertions(+), 4 deletions(-)
```
（git diff --stat origin/integration/2026-11...HEAD；均在卡的“只能改”里；未改 app.json）

## 4. 测试

```
$ python3 -m unittest discover -s server/tests
Ran 225 tests in 13.819s
OK (skipped=7)

$ node --test miniprogram/tests/*.test.js
ℹ tests 90
ℹ pass 90
ℹ fail 0

$ python3 kb/validate.py
已填 200/200 种，有问题 0 条，缺 0 种
```

测试数：后端 开工前 225 个 → 现在 225 个；小程序 开工前 84 个 → 现在 90 个（未变少）。

这张卡新加的测试（miniprogram/tests/bead-image.test.js）：
- `命中缓存不重复下载`：同一地址取两次，download 只调一次，路径一致。
- `超过上限按最久没用的先删`：三张图超上限时删掉 usedAt 最旧的那张（不是新加的、不是刚摸过的）。
- `地址变了重新下载`：url 变化触发新下载，新旧路径不同。
- `下载失败返回 null`：download 抛错时 get 返回 null 且不进索引（组件据此画仿真球）。
- `paint 输出径向渐变和内阴影，不是平涂`：样式串含 radial-gradient、两个输入颜色、inset 内阴影。
- `paint 没有颜色数据时用中性灰兜底`：c 为空也有合法渐变输出。

## 5. 自查（贴命令和输出）

```
$ git log --oneline origin/integration/2026-11..HEAD
c3e7496 C0e: bead-image 缓存和 paint 测试
541ee71 C0e: kit/bead 临时页 8 种珠子三尺寸加 loading/off
37dff61 C0e: bead 组件（实拍图/仿真球/loading/off）
b85ec40 C0e: bead-image 缓存（注入依赖）和 bead-paint 仿真球
ed27e95 C0e: 开工

$ grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(" miniprogram/components/bead/index.wxss miniprogram/kit/bead/index.wxss
（无输出）

$ grep -rnE "new URL|URLSearchParams" miniprogram --include=*.js
（无输出）
```

说明：组件 wxss 引用了 `var(--c-surface)` 等 C0a 的 tokens 变量；C0a 合并前开发版里骨架色不生效（布局不受影响），C0a 合并后自动生效。渐变高光等效果色在 bead-paint.js 里，是卡第 2 步要求的产物。

## 6. 没做 / 没验证 / 偏离卡片

- 截图验收未做：本环境打不开微信开发者工具，按 00-dispatch.md 第 5.3 节写“需要负责人看”（见第 2 节），未在开发者工具验证。

## 7. 审核修改（打回后才有）

（暂无）
