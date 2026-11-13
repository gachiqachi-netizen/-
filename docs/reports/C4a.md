# C4a 交付报告

分支：`agent/C4a-home`　最后一个代码提交：`3372ac7`（报告后续更新提交见分支 HEAD）

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 沿用原首页结构（轮播、四个能力入口、热门款、珠子小知识），只换视觉 | 做了 | `miniprogram/pages/home/home.wxml:1`、`home.wxss:1`；`a324756` |
| 数据：`/api/catalog` 的 `banners`、`templates`（按 `homeOrder`）、`homeArticles` | 做了 | `home.js:13`；目录接口已排序；无文章时隐藏区块 |
| “按你的 15cm 手围排好”用 `utils/template.js` 的 `build` 按用户手围重排 | 做了 | `home.js:8`、`home.js:16` 调用现有 `data.js::catalogCards`，其内部调用 `template.build` |
| 款式没加载出来：只把热门款换成失败提示，轮播和入口照常 | 做了 | `home.js:21`、`home.wxml:19`；`home.test.js::home catalog failure keeps banner and entrances while replacing only templates` |

## 2. 验收

| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 1. 首页与稿 01 并排；轮播手串、无角标，四入口线性图标，热门款有手围说明 | 代码完成，视觉待看 | `home.wxml:1`、`home.wxml:4`、`home.wxml:13`；需要负责人在开发者工具看：`pages/home/home`，对照稿 s01 |
| 2. 四入口分别到工作台、AI、拍照、试戴 | 代码完成，交互待看 | `home.test.js::home quick entrances keep their distinct destinations`；需要负责人在开发者工具看：`pages/home/home`，对照稿 s01 |
| 3. 改手围为 15.5cm 回来重排，出现提示 | 自动化通过，视觉待看 | `home.test.js::home reloads templates for changed wrist and shows the new size`；需要负责人在开发者工具看：`pages/home/home`，对照稿 s02 |
| 4. 往下滑有图、名字、一句寓意、小字到手价 | 代码完成，视觉待看 | `home.wxml:21`；需要负责人在开发者工具看：`pages/home/home`，对照稿 s03 |
| 5. 断网仅热门款失败，无骨架，轮播和入口保持 | 自动化通过，视觉待看 | `home.test.js::home catalog failure keeps banner and entrances while replacing only templates`；需要负责人在开发者工具看：`pages/home/home`，对照稿 s04 |
| 6. 珠子小知识有图、标题、一句话，点进内容页，无“我们是谁” | 自动化通过，内容页待 C4d | `home.test.js::home articles appear only when catalog supplies them and open content page`；需要负责人在开发者工具看：`pages/home/home`，对照稿 s03、s05 |
| 7. 09 清单 6、10、11、19、23–24、31、G1–G8 | 代码自查完成，视觉待看 | `home.wxml`、`home.wxss`、下方自查输出；需要负责人在开发者工具看：`pages/home/home`，对照稿 s01–s04 |

## 3. 改了的文件

`git diff --stat origin/integration/2026-11...HEAD`（交付提交后包含报告）：

```text
 docs/reports/C4a.md                 |  69 +++++++++++++++++++++++
 miniprogram/pages/home/home.js      |  76 ++++++++++++++++++++++----
 miniprogram/pages/home/home.json    |   2 +-
 miniprogram/pages/home/home.test.js | 106 ++++++++++++++++++++++++++++++++++++
 miniprogram/pages/home/home.wxml    |  33 ++++++++---
 miniprogram/pages/home/home.wxss    |  36 +++++++++++-
 6 files changed, 301 insertions(+), 21 deletions(-)
```

## 4. 测试

- `python3 -m unittest discover -s server/tests 2>&1 | tail -15`：`Ran 553 tests in 84.796s`；`OK (skipped=7)`。
- `node --test miniprogram/tests/*.test.js 2>&1 | tail -15`：`tests 162`；`pass 162`；`fail 0`。
- `python3 kb/validate.py 2>&1 | tail -15`：`已填 200/200 种，有问题 0 条，缺 0 种`。
- `node --test miniprogram/pages/home/home.test.js 2>&1 | tail -15`：`tests 6`；`pass 6`；`fail 0`。
- 测试数：后端开工前 553 → 现在 553；小程序全量开工前 162 → 现在 162；本卡另增首页目录内 6 条测试。
- 新测试：`home catalog failure keeps banner and entrances while replacing only templates` 验证失败仅替换热门款；`home reloads templates for changed wrist and shows the new size` 验证重排提示；`home template card opens bracelet detail with selected design` 验证款式详情路由；`home articles appear only when catalog supplies them and open content page` 验证小知识内容和入口；`home quick entrances keep their distinct destinations` 验证快捷入口；`home banner page target follows configured route` 验证运营配置的轮播目标页。
- 旧测试期望值未改。

## 5. 自查（贴命令和输出）

- `git log --oneline origin/integration/2026-11..HEAD`：`C4a:` 开头的开工、页面、测试和报告提交；无其他卡提交。
- `git diff --check origin/integration/2026-11...HEAD`：无输出。
- `grep -nE "#[0-9a-fA-F]{3,8}\\b|rgba?\\(" miniprogram/pages/home/home.wxss`：无输出。
- `grep -rnE "new URL|URLSearchParams" miniprogram --include='*.js'`：无输出。
- 范围：`home.js`、`home.json`、`home.wxml`、`home.wxss`、`home.test.js` 均在 `miniprogram/pages/home/*`；另有本报告。未改尺寸规则、金额契约、依赖或打包文件。

## 6. 没做 / 没验证 / 偏离卡片

- 未在微信开发者工具或真机验证，没有截图；需负责人对照 s01–s04 检查 390px 和 320px 宽度。
- `features/article/article` 目前仍是 C4d 空壳；本卡只接了文章入口，文章内容要等 C4d 合并后验。
- 文章 `cover` 是上传编号时，目录接口没有图片 URL；首页先显示现有珠子图标占位，不显示无效图片。上传编号到可访问 URL 的映射需要后续接口或负责人确认。
- 首页针对性测试按“只能改 `miniprogram/pages/home/*`”放在该目录，现有小程序全量通配命令不包含它；已单独运行并在上方报告。

## 7. 审核修改（打回后才有）

| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
| 无 | 无 | 无 |
