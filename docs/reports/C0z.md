# C0z 交付报告

分支：agent/C0z-register　最后一个提交：51d33ac

## 1. 步骤
| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 1. app.json 加 usingComponents，注册 10 个全局组件（c- 前缀） | 做了 | miniprogram/app.json:21，c-wordmark/c-bead/c-state/c-bracelet/c-cell/c-design-row/c-sheet/c-bar/c-toast/c-composer，路径均 /components/<名字>/index |
| 2. tabBar 四项 iconPath/selectedIconPath 换 C0b 的 /assets/tab/*.png | 做了 | miniprogram/app.json:36，首页→home、自己串→bead、AI 配→chat、我的→me（未选中灰 #6e6e6e、选中黑 #111111，沿用 C0a 的颜色值） |
| 3. 各临时页 index.json 删已全局注册的条目 | 做了 | kit/layer/index.json、kit/composer/index.json 清空（c-sheet/c-bar/c-toast/c-composer 已全局）；kit/basic/index.json 删 c-state，保留页面自己的 bead（该页 wxml 用 `<bead>` 标签，不是全局名 c-bead）；kit/bead、kit/wordmark、kit/bracelet、kit/icons 的条目名（bead/wordmark/bracelet/cell/design-row）都不是全局注册名，按卡面"保留页面自己的"原样未动 |
| 4. 把 7 个临时页挨个打开一遍确认正常 | 未验证 | 打不开微信开发者工具，写"需要负责人看"（见第 2 节） |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 四个 tab 都有新图标，选中变黑（截图） | 未验证 | 需要负责人在开发者工具看：tabBar 四个 tab，对照 C0b 交付的 assets/tab/*.png |
| 7 个临时页各截一张 | 未验证 | 需要负责人在开发者工具用"编译模式 → 启动页面"挨个打开：kit/icons/index、kit/wordmark/index、kit/bead/index、kit/basic/index、kit/bracelet/index、kit/layer/index、kit/composer/index |
| 主包体积增加不超过 60KB（截图） | 未验证 | 需要负责人在开发者工具"详情 → 本地代码"看；本卡只加了 app.json 里的注册声明和 8 个图标引用，图标文件本身在 C0b 已进包，预计增量远小于 60KB |

静态自查证据：
- 所有 kit 页 wxml 实际用到的标签与 index.json 里保留的条目一一对应（grep 核对，无悬空引用）。
- 主包页面（pages/*）没有任何 usingComponents 引用这些组件，不受注册改动影响。
- app.json 与各 kit index.json 均通过 JSON 解析校验。
- 全局注册名与 C0i/C0g 等卡组件目录一一对应：components/ 下 wordmark、bead、state、bracelet、cell、design-row、sheet、bar、toast、composer 均存在。

## 3. 改了的文件
```
 miniprogram/app.json               | 全局 usingComponents + tabBar 图标
 miniprogram/kit/basic/index.json   | 删 c-state（保留 bead）
 miniprogram/kit/layer/index.json   | 清空（c-sheet/c-bar/c-toast 已全局）
 miniprogram/kit/composer/index.json| 清空（c-composer 已全局）
 docs/reports/C0z.md                | 本报告
```

## 4. 测试
```
python3 -m unittest discover -s server/tests  → Ran 316 tests, OK (skipped=7)
node --test miniprogram/tests/*.test.js        → tests 138 / pass 138 / fail 0
python3 kb/validate.py                         → 已填 200/200 种，有问题 0 条，缺 0 种
```
测试数：后端 开工前 316 个 → 现在 316 个；小程序 开工前 138 个 → 现在 138 个（没变少；基线比 D2 当时多，是别的卡合并带进来的）。
这张卡新加的测试：无（纯配置卡；miniprogram/tests/package-config.test.js 两条用例通过，覆盖了 app.json 分包与上传配置仍合法）。

## 5. 自查
- git log --oneline origin/integration/2026-11..HEAD：
```
51d33ac C0z: 删 kit 临时页里已全局注册的 usingComponents 条目
ec14f22 C0z: app.json 全局注册 10 个组件并给 tabBar 换 C0b 图标
54f784e C0z: 开工
```
- 小程序卡自查：
  - 本卡没改 .wxss，颜色变量检查不适用。
  - grep -rnE "new URL|URLSearchParams" miniprogram --include=*.js 的适用范围是本卡改动文件，未新增任何 JS。
- 未在开发者工具验证（本卡所有验收都依赖它）。

## 6. 没做 / 没验证 / 偏离卡片
1. 步骤 4（7 个临时页打开确认）和三项截图验收都未在开发者工具验证，全部写"需要负责人看"。
2. kit/bead、kit/wordmark、kit/bracelet 三页的标签名（bead/wordmark/bracelet/cell/design-row）没有换成 c- 前缀全局名，它们的 usingComponents 按卡面"保留页面自己的"未动；wxml 不在本卡"只能改"内。功能不受影响。
3. 无其他偏离。
