# 任务看板

> 自动生成，别手改。更新：`git fetch origin --prune && python3 tools/board.py`。审核每合并一次都会重新生成并推送。
> 总共 152 张（第一波之外），已完成 140 张。

## 在做或待审（1）

| 卡 | 做什么 | 说明 |
|---|---|---|
| C5b | 语音和照片 | 分支上有提交，交了就告诉审核 |

## 现在能派（5）

| 卡 | 做什么 | 说明 |
|---|---|---|
| B-22 | 新珠子补颜色：照片取色 + 名称兜底，按数据文件写回 | 卡片待修：407 行路径不存在：tools/bead_colors.py；408 行路径不存在：deploy/data-files/bead-colors-2026-11.json |
| B-25 | 支付测试款：0.2 元左右的测试模板，带“测试”标记和上线前提醒 |  |
| U30 | 工作台顶部大片空白 |  |
| U32 | 珠盘中间的“珠养养”字标要看得见 |  |
| H1 | 删除历史包袱：原型页、原型小程序、旧变量名、过期文档 | 卡片待修：8 行路径不存在：docs/archive/；13 行路径不存在：docs/archive/ |

### 提示词（一张卡一个对话，整段复制）

<details><summary>B-22 新珠子补颜色：照片取色 + 名称兜底，按数据文件写回</summary>

```
你是“串个珠”项目的执行者。仓库 https://github.com/gachiqachi-netizen/-.git（私有，HTTPS），所有工作从 origin/integration/2026-11 开始。
这次直接领 B-22（新珠子补颜色：照片取色 + 名称兜底，按数据文件写回，卡在 docs/design/tasks/backend-wave2.md，先读文件开头的共同规矩，再读 B-22 这一节）。开工前先跑 git log origin/integration/2026-11 --oneline | grep -E "^[0-9a-f]+ (B-21):" | grep -v "开工$"，B-21 都有提交才开工，否则停下等我。
从最新的 origin/integration/2026-11 开新目录 ~/chuan-B-22，读 docs/design/tasks/02-prompts.md 里的“Codex 总提示词”，照它做：领卡占位、只改卡上“只能改”的文件、跑三条测试、写交付报告、推送到 agent/B-22-bead-colors，不要直接推 integration。
交付后回复“B-22 交了，分支 xxx，没做的：……”然后停下。收到审核意见时在原分支改完再推送。
```

</details>

<details><summary>B-25 支付测试款：0.2 元左右的测试模板，带“测试”标记和上线前提醒</summary>

```
你是“串个珠”项目的执行者。仓库 https://github.com/gachiqachi-netizen/-.git（私有，HTTPS），所有工作从 origin/integration/2026-11 开始。
这次直接领 B-25（支付测试款：0.2 元左右的测试模板，带“测试”标记和上线前提醒，卡在 docs/design/tasks/backend-wave2.md，先读文件开头的共同规矩，再读 B-25 这一节）。开工前先跑 git log origin/integration/2026-11 --oneline | grep -E "^[0-9a-f]+ (B-21):" | grep -v "开工$"，B-21 都有提交才开工，否则停下等我。
从最新的 origin/integration/2026-11 开新目录 ~/chuan-B-25，读 docs/design/tasks/02-prompts.md 里的“Codex 总提示词”，照它做：领卡占位、只改卡上“只能改”的文件、跑三条测试、写交付报告、推送到 agent/B-25-test-template，不要直接推 integration。
交付后回复“B-25 交了，分支 xxx，没做的：……”然后停下。收到审核意见时在原分支改完再推送。
```

</details>

<details><summary>U30 工作台顶部大片空白</summary>

```
你是“串个珠”项目的执行者。仓库 https://github.com/gachiqachi-netizen/-.git（私有，HTTPS），所有工作从 origin/integration/2026-11 开始。
这次直接领 U30（工作台顶部大片空白，卡在 docs/design/tasks/followups-ui.md，先读文件开头的共同规矩，再读 U30 这一节）。开工前先跑 git log origin/integration/2026-11 --oneline | grep -E "^[0-9a-f]+ (U26):" | grep -v "开工$"，U26 都有提交才开工，否则停下等我。
从最新的 origin/integration/2026-11 开新目录 ~/chuan-U30，读 docs/design/tasks/02-prompts.md 里的“Codex 总提示词”，照它做：领卡占位、只改卡上“只能改”的文件、跑三条测试、写交付报告、推送到 agent/U30-diy-top-gap，不要直接推 integration。页面只用 U0 的 c-page、c-card、c-cell、c-bar 组件拼；交付前跑 python3 tools/check-ui.py；用 tools/shoot 截改前改后的图（先登录、等数据加载完；空状态、出错状态也截），提交到 docs/reports/shots/U30/。
交付后回复“U30 交了，分支 xxx，没做的：……”然后停下。收到审核意见时在原分支改完再推送。
```

</details>

<details><summary>U32 珠盘中间的“珠养养”字标要看得见</summary>

```
你是“串个珠”项目的执行者。仓库 https://github.com/gachiqachi-netizen/-.git（私有，HTTPS），所有工作从 origin/integration/2026-11 开始。
这次直接领 U32（珠盘中间的“珠养养”字标要看得见，卡在 docs/design/tasks/followups-ui.md，先读文件开头的共同规矩，再读 U32 这一节）。开工前先跑 git log origin/integration/2026-11 --oneline | grep -E "^[0-9a-f]+ (U26):" | grep -v "开工$"，U26 都有提交才开工，否则停下等我。
从最新的 origin/integration/2026-11 开新目录 ~/chuan-U32，读 docs/design/tasks/02-prompts.md 里的“Codex 总提示词”，照它做：领卡占位、只改卡上“只能改”的文件、跑三条测试、写交付报告、推送到 agent/U32-tray-logo，不要直接推 integration。页面只用 U0 的 c-page、c-card、c-cell、c-bar 组件拼；交付前跑 python3 tools/check-ui.py；用 tools/shoot 截改前改后的图（先登录、等数据加载完；空状态、出错状态也截），提交到 docs/reports/shots/U32/。
交付后回复“U32 交了，分支 xxx，没做的：……”然后停下。收到审核意见时在原分支改完再推送。
```

</details>

<details><summary>H1 删除历史包袱：原型页、原型小程序、旧变量名、过期文档</summary>

```
你是“串个珠”项目的执行者。仓库 https://github.com/gachiqachi-netizen/-.git（私有，HTTPS），所有工作从 origin/integration/2026-11 开始。
这次直接领 H1（删除历史包袱：原型页、原型小程序、旧变量名、过期文档，卡在 docs/design/tasks/followups-infra.md，先读文件开头的共同规矩，再读 H1 这一节）。开工前先跑 git log origin/integration/2026-11 --oneline | grep -E "^[0-9a-f]+ (B-20|B-24):" | grep -v "开工$"，B-20、B-24 都有提交才开工，否则停下等我。
从最新的 origin/integration/2026-11 开新目录 ~/chuan-H1，读 docs/design/tasks/02-prompts.md 里的“Codex 总提示词”，照它做：领卡占位、只改卡上“只能改”的文件、跑三条测试、写交付报告、推送到 agent/H1-remove-legacy，不要直接推 integration。
交付后回复“H1 交了，分支 xxx，没做的：……”然后停下。收到审核意见时在原分支改完再推送。
```

</details>

## 等前面的卡（4）

| 卡 | 做什么 | 说明 |
|---|---|---|
| B-23 | 新珠子知识库补齐和寓意：映射到现有条目，缺的新建 | 等 B-22 |
| U31 | 工作台挑珠子加名称搜索 | 等 U30 |
| H2 | 镜像带上 tools/，去掉逐个挂载 | 等 H1、B-22、B-25 |
| H6 | 商品批量导入命令进仓库，并校验必填字段 | 等 B-23 |

## 等负责人（2）

| 卡 | 做什么 | 说明 |
|---|---|---|
| B-13 | 物流轨迹 | 确认微信物流服务和物流查询插件已开通 |
| C11b | 全流程回归 | 负责人在开发者工具和真机上把三条主流程逐屏走一遍（等 V3、W1、U16 都合并后） |

## 已完成（140）

A3、A7、A8a、A8b、A8c、A8d、A8e、A8f、K1、K2、K3、B-1、B-2、B-3、B-4、B-5、B-6、B-7、B-8、B-9、B-10、B-11a、B-11b、B-11c、B-12、B-16、B-17、B-18、B-19、B-20、B-21、B-24、B-15、B-14、A5c、C1p、C1a、C1b、C3a、C3b、C3c、C3d、C4a、C4b、C4c、C4d、C5a、C5c、C6a、C6b、C6c、C7a、C7b、C8a、C8b、C8c、C9a、C9b、C9c、C10a、C10b、C11a、D3a、D3b、D3c、D3d、D4、D5a、D5b、D6a、D6c、D6b、D7a、D7b、D7c、D8、KD1、KD2、F1、F2、F3、F4、F5、F6、F7、D9、A10、T1、U0、U1、U2、U3、U4、U5、U6、U7、U8、U9、U10、U12、U13、V1、V2、V2b、V3、V4、V5、U14、U15、W1、T2、P1、V6、AI1、AI2、R1、T3、U16、U17、U18、U19、U20、U21、U22、U23、U24、U25、U26、U27、U28、U29、V7a、V8、V9、V10、V7b、U11、H3、H4、H5
