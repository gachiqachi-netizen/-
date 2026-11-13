# C4d 交付报告

分支：agent/C4d-content-pages　最后一个代码提交：34777de

## 1. 步骤
| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 内容页从三处进：首页小知识（有底部按钮）、签收后的“怎么戴、怎么保养”（没有底部栏）、设置的“关于珠养养”（没有底部栏） | 做了页面按 `context=home` 显示配置按钮，其余不显示 | `miniprogram/features/article/article.js`、`.wxml`；34777de |
| 题图没有时画这颗珠子（`c-bead` 大号） | 做了 | `article.wxml`；34777de |
| 规则文字页读后端条款（`/api/terms/...`，看后端现有接口名，没有就停下来问） | 做了；缺接口时已先停下来问，负责人授权补两文件 | `server/routes/terms_public.py`、`miniprogram/features/doc/doc.js`；939a11e、a0efbfd |
| 内容页题图、标题、正文、配置按钮、分享 | 做了 | `miniprogram/features/article/*`；34777de |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 从设置进“定制商品退换说明”：稿 81 版式 | 待视觉验收 | 需要负责人在开发者工具看：`features/doc/doc?type=定制商品说明`，对照稿 s81 |
| 从确认订单的勾选链接进同一页 | 待入口验收 | 需要负责人在开发者工具看：`features/doc/doc?type=定制商品说明`，对照稿 s81 |
| 首页点一篇内容：稿 05；底部按钮进工作台并滚到这颗珠子 | 部分完成 | `article.js::followButton` 带 `beadKbId` 参数跳转；滚动接收端需工作台卡支持。需要负责人在开发者工具看：`features/article/article?id=<已发布文章ID>`，对照稿 s05 |
| B15 没做：规则页显示现有 `term-*` 文字；首页没有内容区块 | 已由新增公开接口解决 | `test_terms_public.py::test_unauthenticated_list_excludes_drafts_body_and_admin_fields`；首页区块属 C4a 范围 |
| 09 清单：17、26、G1–G8 | 待视觉及跨页验收 | 内容正文来自已发布文章接口；需要负责人在开发者工具看：`features/article/article?id=<已发布文章ID>`，对照稿 s05 |
| 已发布条款可公开查询，草稿 404，列表不带正文和后台字段 | 通过 | `test_terms_public.py::test_unauthenticated_list_excludes_drafts_body_and_admin_fields`、`test_detail_only_returns_published_reader_fields` |

## 3. 改了的文件
`git diff --stat origin/integration/2026-11...HEAD`（更新本报告前）：
```
 docs/reports/C4d.md                       | 34 +++++++++++++++++
 miniprogram/features/article/article.js   | 45 ++++++++++++++++++++++-
 miniprogram/features/article/article.json |  7 +++-
 miniprogram/features/article/article.wxml | 18 ++++++++-
 miniprogram/features/article/article.wxss | 12 ++++--
 miniprogram/features/doc/doc.js           | 28 +++++++++++++-
 miniprogram/features/doc/doc.json         |  3 +-
 miniprogram/features/doc/doc.wxml         | 11 +++++-
 miniprogram/features/doc/doc.wxss         | 10 +++--
 server/routes/terms_public.py             | 24 ++++++++++++
 server/tests/test_terms_public.py         | 61 +++++++++++++++++++++++++++++++
 11 files changed, 239 insertions(+), 14 deletions(-)
```

## 4. 测试
- 后端开工前 553 项 → 现在 555 项；小程序开工前 162 项 → 现在 162 项。
- `python3 -m unittest discover -s server/tests`：`Ran 555 tests in 85.950s`、`OK (skipped=7)`。
- `node --test miniprogram/tests/*.test.js`：`tests 162`、`pass 162`、`fail 0`。
- `python3 kb/validate.py`：`已填 200/200 种，有问题 0 条，缺 0 种`。
- 新增 `test_unauthenticated_list_excludes_drafts_body_and_admin_fields`：未登录可读列表，只含发布条款及公开字段。
- 新增 `test_detail_only_returns_published_reader_fields`：正文详情只给已发布条款；草稿和不存在均 404。

## 5. 自查（贴命令和输出）
`git log --oneline origin/integration/2026-11..HEAD`：
```
34777de C4d: 实现文章正文题图分享与配置按钮
a0efbfd C4d: 实现按类型读取公开条款的规则页
939a11e C4d: 新增公开条款查询接口与测试
aecf89f C4d: 记录公开条款接口缺失的阻塞
bff84e3 C4d: 开工
```
`rg -n '#[0-9a-fA-F]{3,8}\\b|rgba?\\(' miniprogram/features/doc/*.wxss miniprogram/features/article/*.wxss`：无输出。
`rg -n 'new URL|URLSearchParams' miniprogram --glob '*.js'`：无输出。
`git diff --check origin/integration/2026-11...HEAD`：无输出。
`git merge origin/integration/2026-11`：`Already up to date.`。

新增接口：`GET /api/terms` 公开，返回已发布条款的 `id,type,title,version,publishedAt` 列表；`GET /api/terms/{id}` 公开，返回 `id,type,title,body,version,publishedAt`，未发布或不存在 404。无金额字段。

## 6. 没做 / 没验证 / 偏离卡片
- 经负责人同意新增了这两个后端文件：`server/routes/terms_public.py`、`server/tests/test_terms_public.py`。其他后端文件未改。
- 未在微信开发者工具验证。首页、订单详情、设置入口由各自页面卡负责；本卡页面已支持参数。
- 文章页将 `beadKbId` 传给配置的工作台目标；当前工作台没有读取这个参数的代码，本卡范围不含工作台，因此“滚到这颗珠子”未完成，需要后续工作台卡接收。未声称该项通过。
- 分享控件位于文章正文上方右侧，未放入原生导航栏右侧；需要负责人看实际效果。

## 7. 审核修改（打回后才有）
无。
