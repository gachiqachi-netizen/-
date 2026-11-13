# C0i 交付报告

分支：agent/C0i-composer　最后一个提交：09f83e0

## 1. 步骤
| 卡上的步骤（照抄编号和第一句） | 做了 / 没做 | 在哪（文件:行，或提交 hash） |
|---|---|---|
| 1. `components/composer`：大圆角框（圆角 40rpx，浅灰底）。上面一整行是输入框 | 做了 | miniprogram/components/composer/index.wxml（`.c-composer__box` / `.c-composer__input`）、index.wxss:22-40（40rpx 圆角、max-height 224rpx = 5 行） |
| 框内下面一排：左边圆形“+”按钮和条件标签，右边圆形按钮——没输入时是语音，有字变成黑色发送键 | 做了 | index.wxml（tools 行：plus 圆钮 + tag + 右侧 `wx:if="{{hasText}}"` 黑色发送钮 / `wx:elif="{{voice}}"` 语音钮）、index.js:47-50（hasText 由 draft 计算） |
| 上方可选一排快捷回复（chips，横向排，超出可横滑） | 做了 | index.wxml（scroll-view scroll-x）、index.wxss:5-11，复用 C0f 的 `.c-chip` |
| 2. 属性 value/placeholder/tag/chips/voice/photo/sending，事件 send/plus/tag/chip/voicestart/voiceend/voicecancel | 做了 | index.js:14-23（properties，placeholder 默认“说说想要的感觉、送谁、预算…”）、index.js:45-104（方法与事件） |
| 3. 按住说话面板（稿 22）：波形、“松开发送，上滑取消”、黑色长按钮“松开 发送”；上滑超过 80rpx 触发 voicecancel | 做了 | index.wxml（speaking 分支）、index.wxss:95-153（6 根竖条 keyframes 动画）、index.js:72-97（px→rpx 换算、80rpx 阈值、cancel 后只发一次 voicecancel、松手未取消发 voiceend） |
| 4. 临时页 kit/composer：一个 composer、上方三个快捷回复、显示最近一次事件名 | 做了 | miniprogram/kit/composer/index.*（chips 三条、tag“手围 15cm”、_log 显示事件名与带的文字） |

## 2. 验收
| 卡上的验收项（照抄） | 结果 | 证据 |
|---|---|---|
| 没输入时右侧是语音，输入一个字变成发送键，清空后变回来（截图三张） | 未在开发者工具验证 | 需要负责人在开发者工具看：`kit/composer/index`，对照稿 s21/s24；逻辑依据 index.wxml `hasText` 分支 + index.js:36-38 observer 同步 value |
| 提示语在 320 宽下一行放得下 | 未在开发者工具验证 | 需要负责人在开发者工具看：`kit/composer/index`（iPhone 5/SE 320 宽），对照稿 s21 |
| 输入 6 行文字停在 5 行高、内部滚动（截图） | 未在开发者工具验证 | 需要负责人在开发者工具看：`kit/composer/index`；依据 index.wxss:32-34（textarea max-height 224rpx，auto-height 超出内部滚动） |
| 按住说话、上滑取消各截一张 | 未在开发者工具验证 | 需要负责人在开发者工具看：`kit/composer/index`，对照稿 s22；临时页事件日志会显示 voicestart / voicecancel / voiceend |

## 3. 改了的文件
```
 miniprogram/components/composer/index.js   |  87 ++++++++++++++++++
 miniprogram/components/composer/index.json |   4 +
 miniprogram/components/composer/index.wxml |  48 ++++++++++
 miniprogram/components/composer/index.wxss | 138 ++++++++++++++++++++++
 miniprogram/kit/composer/index.js          |  27 ++++-
 miniprogram/kit/composer/index.json        |   4 +-
 miniprogram/kit/composer/index.wxml        |  24 ++++-
 miniprogram/kit/composer/index.wxss        |  36 ++++++-
 8 files changed, 374 insertions(+), 5 deletions(-)
```
除本报告外都在卡的“只能改”里。

## 4. 测试
```
python3 -m unittest discover -s server/tests
Ran 311 tests in 10.385s
OK (skipped=7)

node --test miniprogram/tests/*.test.js
ℹ pass 138
ℹ fail 0

python3 kb/validate.py
已填 200/200 种，有问题 0 条，缺 0 种
```
测试数：后端开工前 316 个 → 现在 311 个；小程序开工前 134 个 → 现在 138 个（本卡没有删改任何测试；数量波动是因为工作区在测试运行期间被另一个会话切换分支，两次基线分别落在不同分支内容上，本卡改动不含任何测试文件，不影响数量）。
这张卡新加的测试：无（卡上没要求，组件没有需要单测的纯函数）。

## 5. 自查（贴命令和输出）
- git log --oneline origin/integration/2026-11..HEAD：
```
09f83e0 C0i: 按住说话面板（稿 22 波形+上滑取消）与 kit/composer 临时页
5678145 C0i: composer 组件（输入框/快捷回复/语音发送切换，稿 21、24）
f4e2ea8 C0i: 开工
```
- 颜色检查（应为空）：
```
$ git grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(" agent/C0i-composer -- miniprogram/components/composer miniprogram/kit/composer
（无输出）
```
- URL 检查（应为空）：
```
$ git grep -nE "new URL|URLSearchParams" agent/C0i-composer -- miniprogram/components/composer miniprogram/kit/composer
（无输出）
```

## 6. 没做 / 没验证 / 偏离卡片
- 截图均未在开发者工具验证（打不开开发者工具），已按第 5.3 节写“需要负责人看”。
- 本机 mic 图标没有白色版资产（白色版只有 up/check），“松开 发送”黑条上的 mic 用 `filter: brightness(0) invert(1)` 反色，未新增资产文件（卡在“只能改”里不许加）。
- 过程记录：本工作区被另一个会话并发切换分支，本卡的两次提交曾落在 agent/D2-admin-shell 上，已 cherry-pick 回本分支配 09f83e0/5678145 并 push；本分支本地曾被他人提交污染（2445ad3，C0g 的 sheet，内容与 D2 分支上的重复），已用 `git branch -f` 移除，未 push 过该提交。
