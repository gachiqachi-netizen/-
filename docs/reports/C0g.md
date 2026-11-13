# C0g 交付报告

分支：agent/C0g-layer　最后一个提交：4cceeaf（报告提交后另计）

## 1. 步骤
| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 1. components/sheet：show/title/maskClose/grab、默认+footer 插槽、close 事件、200ms 升起、60% 屏上限、遮罩拦滚动、安全区、tabBar 收起恢复 | 做了 | miniprogram/components/sheet/index.{js,wxml,wxss} |
| 2. components/bar：left/top/默认插槽、安全区、原位置同高占位 | 做了 | miniprogram/components/bar/index.{js,wxml,wxss}（占位高度用 createSelectorQuery 量实际高度写入） |
| 3. utils/toast.js + components/toast：createQueue({now,setTimer,clearTimer}) 纯提示 1000ms、带操作 3000ms、新的顶掉旧的、点操作立即消失调 onAction；黑底白字胶囊、一句话、最多一个操作、底部中央不遮 c-bar、anchor 改位置 | 做了 | miniprogram/utils/toast.js、miniprogram/components/toast/index.*；默认 bottom 让开 c-bar（安全区 + 144rpx）；未替换各页 wx.showToast |
| 4. 隐私弹层改 c-sheet 样子，文案照 04 第 28.2 节，只在第一次真正用到权限时出现 | 做了 | components/privacy-popup/index.{wxml,wxss}：标题“用相机前，请先看一下”、正文带 scene、“查看《隐私保护指引》 ›”（wx.openPrivacyContract，低版本守卫）、按钮“先不用/同意并继续”；open-type 与 agree 事件未动；utils/privacy.js 未改——install 挂在启动时，但 wx.onNeedPrivacyAuthorization 只在第一次真实调用相机/相册等 API 时才触发，触发时机已符合卡片要求 |
| 5. 临时页 kit/layer：两个 sheet（一个 maskClose=false）、c-bar（左 ¥78 右主按钮）、五个按钮触发稿 85 五种提示 | 做了 | miniprogram/kit/layer/* |
| 6. 测试 toast.test.js：顶掉旧的、到时消失、点操作回调、带操作 3 秒 | 做了 | miniprogram/tests/toast.test.js（4 条） |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| sheet 背后不滚、点遮罩能关、maskClose=false 不关（截图两张） | 未验证 | 需要负责人在开发者工具看：kit/layer/index（“打开 sheet”“maskClose=false”两个按钮），对照稿 s86；遮罩与面板均 catchtouchmove="noop"（index.wxml） |
| 在首页打开 sheet 时 tabBar 收起、关了回来（截图两张） | 未验证 | 需要负责人在开发者工具看：首页打开 sheet 的联动；实现为 sheet/index.js 的 onEnter/onLeave，用 getCurrentPages 判断当前页是否在 tabBar 列表（pages/home/home 等 4 个），仅在此情况下 hideTabBar/showTabBar |
| c-bar 在 320 宽下价格不折行 | 未验证 | 需要负责人在开发者工具看：kit/layer/index，切 iPhone 5/SE（320 宽）；c-bar__left 有 white-space:nowrap + ellipsis（index.wxss） |
| 隐私弹层是稿 86 的样子，privacy.test.js 仍通过 | 通过（样子未验证） | node --test miniprogram/tests/privacy.test.js：5 用例全过（含本次未改动的原有用例）；样式需要负责人在开发者工具对照稿 s86 |

## 3. 改了的文件
```
 miniprogram/components/bar/index.js            |  24 +
 miniprogram/components/bar/index.json          |   4 +
 miniprogram/components/bar/index.wxml          |  15 +
 miniprogram/components/bar/index.wxss          |  45 +
 miniprogram/components/privacy-popup/index.js  |   5 +
 miniprogram/components/privacy-popup/index.wxml|  19 +-
 miniprogram/components/privacy-popup/index.wxss| 100 +++++-----
 miniprogram/components/sheet/index.js          |  49 +++++
 miniprogram/components/sheet/index.json        |   4 +
 miniprogram/components/sheet/index.wxml        |  13 ++
 miniprogram/components/sheet/index.wxss        |  65 ++++++
 miniprogram/components/toast/index.js          |  22 ++
 miniprogram/components/toast/index.json        |   4 +
 miniprogram/components/toast/index.wxml        |   6 +
 miniprogram/components/toast/index.wxss        |  36 +++
 miniprogram/kit/layer/index.js                 |  23 ++-
 miniprogram/kit/layer/index.json               |   6 +-
 miniprogram/kit/layer/index.wxml               |  42 +++-
 miniprogram/kit/layer/index.wxss               |  45 ++++-
 miniprogram/tests/toast.test.js                |  58 ++++++
 miniprogram/utils/toast.js                     |  51 +++++
 21 files changed, 591 insertions(+), 13 deletions(-)
```
全部在卡的“只能改”清单内（含本报告）。

## 4. 测试
```
python3 -m unittest discover -s server/tests
OK (skipped=7)

node --test miniprogram/tests/*.test.js
ℹ tests 138　ℹ pass 138　ℹ fail 0

python3 kb/validate.py
已填 200/200 种，有问题 0 条，缺 0 种
```
测试数：后端 开工前 263 个（其中 test_migrations_registry 4 个失败/报错，属在途卡 A11m 且随后同代码复跑即恢复通过，与本卡无关）→ 现在 263 个（256 ok + 7 skipped，全过）；小程序 开工前 134 个 → 现在 138 个（+4，未减少）。
本卡新加的测试（miniprogram/tests/toast.test.js）：
- 新的顶掉旧的：只剩一个待触发定时器 —— 连发两条，旧定时器被清掉
- 到时消失：定时器触发后队列清空并通知订阅者
- 点操作后立即消失且回调被调用：onAction 恰好调一次
- 带操作 3 秒，纯提示 1 秒，duration 可覆盖 —— 验证默认时长规则和覆盖

## 5. 自查
```
git log --oneline origin/integration/2026-11..HEAD
（均为 C0g: 开头，见分支）

grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(" 本卡 5 个 wxss → 无输出（颜色只用变量）
grep -rnE "new URL|URLSearchParams" 本卡新增/改动文件 → 无输出
```
- sheet/bar/toast/privacy-popup/kit-layer 五个 wxss 均无颜色字面量；z-index 用固定数值（sheet 800、toast 950、privacy 990），不在变量预算内。
- 小程序卡无后台构建要求。

## 6. 没做 / 没验证 / 偏离卡片
- 截图四项均未在开发者工具验证（本机打不开），按 5.3 节写“需要负责人看”，未编造截图。
- utils/privacy.js 未改：现有 install/subscribe/finish 已满足“第一次真正用到权限时才出现”（wx.onNeedPrivacyAuthorization 语义），privacy.test.js 仍通过。
- 环境异常（已报告负责人）：本仓库工作区被多个执行会话共用，做卡期间 D2、C0i 会话的提交多次落到当前检出的分支上。处理：把误落的 D2 两个提交移回 agent/D2-admin-shell（dc85c35、af7161c 及其副本已保存在该分支），C0i 分支上的 C0g sheet 提交副本已移除；本分支远端始终只含 C0g 提交（9f0e6ef 开工 + 6 个工作提交）。

## 7. 审核修改
（尚无）
