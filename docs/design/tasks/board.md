# 任务看板

> 自动生成，别手改。更新：`git fetch origin --prune && python3 tools/board.py`。审核每合并一次都会重新生成并推送。
> 总共 172 张（第一波之外），已完成 154 张。

## 在做或待审（1）

| 卡 | 做什么 | 说明 |
|---|---|---|
| C5b | 语音和照片 | 分支上有提交，交了就告诉审核 |

## 现在能派（7）

| 卡 | 做什么 | 说明 |
|---|---|---|
| B-26 | 小程序码按体验版、正式版分别生成 |  |
| U34 | 工作台补齐入口：返回、保存、删除、清空、手围 |  |
| H7 | 导入交流素材里的全部珠子 |  |
| H8 | 后端 HTTP 测试不走系统代理 | 卡片待修：71 行环境变量不存在：NO_PROXY；75 行环境变量不存在：HTTP_PROXY；75 行环境变量不存在：HTTPS_PROXY |
| TRY-2 | 我的手：引导拍照 + 自动对位 + 微调 | 卡片待修：40 行路径不存在：docs/reports/TRY-2-assets/ |
| AI-1a | 后端：对话接口收图片 |  |
| AI-1b | 前台：输入区“+”发图、气泡显示图片和“看到了什么” |  |

### 提示词（一张卡一个对话，整段复制）

<details><summary>B-26 小程序码按体验版、正式版分别生成</summary>

```
你是“串个珠”项目的执行者。仓库 https://github.com/gachiqachi-netizen/-.git（私有，HTTPS），所有工作从 origin/integration/2026-11 开始。
这次直接领 B-26（小程序码按体验版、正式版分别生成，卡在 docs/design/tasks/followups-1119.md，先读文件开头的共同规矩，再读 B-26 这一节）。
从最新的 origin/integration/2026-11 开新目录 ~/chuan-B-26，读 docs/design/tasks/02-prompts.md 里的“Codex 总提示词”，照它做：领卡占位、只改卡上“只能改”的文件、跑三条测试、写交付报告、推送到 agent/B-26-wxacode-env，不要直接推 integration。
交付后回复“B-26 交了，分支 xxx，没做的：……”然后停下。收到审核意见时在原分支改完再推送。
```

</details>

<details><summary>U34 工作台补齐入口：返回、保存、删除、清空、手围</summary>

```
你是“串个珠”项目的执行者。仓库 https://github.com/gachiqachi-netizen/-.git（私有，HTTPS），所有工作从 origin/integration/2026-11 开始。
这次直接领 U34（工作台补齐入口：返回、保存、删除、清空、手围，卡在 docs/design/tasks/followups-1119.md，先读文件开头的共同规矩，再读 U34 这一节）。开工前先跑 git log origin/integration/2026-11 --oneline | grep -E "^[0-9a-f]+ (U33):" | grep -v "开工$"，U33 都有提交才开工，否则停下等我。
从最新的 origin/integration/2026-11 开新目录 ~/chuan-U34，读 docs/design/tasks/02-prompts.md 里的“Codex 总提示词”，照它做：领卡占位、只改卡上“只能改”的文件、跑三条测试、写交付报告、推送到 agent/U34-diy-entries，不要直接推 integration。
交付后回复“U34 交了，分支 xxx，没做的：……”然后停下。收到审核意见时在原分支改完再推送。
```

</details>

<details><summary>H7 导入交流素材里的全部珠子</summary>

```
你是“串个珠”项目的执行者。仓库 https://github.com/gachiqachi-netizen/-.git（私有，HTTPS），所有工作从 origin/integration/2026-11 开始。
这次直接领 H7（导入交流素材里的全部珠子，卡在 docs/design/tasks/followups-1119.md，先读文件开头的共同规矩，再读 H7 这一节）。开工前先跑 git log origin/integration/2026-11 --oneline | grep -E "^[0-9a-f]+ (H6):" | grep -v "开工$"，H6 都有提交才开工，否则停下等我。
从最新的 origin/integration/2026-11 开新目录 ~/chuan-H7，读 docs/design/tasks/02-prompts.md 里的“Codex 总提示词”，照它做：领卡占位、只改卡上“只能改”的文件、跑三条测试、写交付报告、推送到 agent/H7-import-hc，不要直接推 integration。
交付后回复“H7 交了，分支 xxx，没做的：……”然后停下。收到审核意见时在原分支改完再推送。
```

</details>

<details><summary>H8 后端 HTTP 测试不走系统代理</summary>

```
你是“串个珠”项目的执行者。仓库 https://github.com/gachiqachi-netizen/-.git（私有，HTTPS），所有工作从 origin/integration/2026-11 开始。
这次直接领 H8（后端 HTTP 测试不走系统代理，卡在 docs/design/tasks/followups-infra.md，先读文件开头的共同规矩，再读 H8 这一节）。
从最新的 origin/integration/2026-11 开新目录 ~/chuan-H8，读 docs/design/tasks/02-prompts.md 里的“Codex 总提示词”，照它做：领卡占位、只改卡上“只能改”的文件、跑三条测试、写交付报告、推送到 agent/H8-tests-no-proxy，不要直接推 integration。
交付后回复“H8 交了，分支 xxx，没做的：……”然后停下。收到审核意见时在原分支改完再推送。
```

</details>

<details><summary>TRY-2 我的手：引导拍照 + 自动对位 + 微调</summary>

```
你是“串个珠”项目的执行者。仓库 https://github.com/gachiqachi-netizen/-.git（私有，HTTPS），所有工作从 origin/integration/2026-11 开始。
这次直接领 TRY-2（我的手：引导拍照 + 自动对位 + 微调，卡在 docs/design/tasks/followups-tryon.md，先读文件开头的共同规矩，再读 TRY-2 这一节）。开工前先跑 git log origin/integration/2026-11 --oneline | grep -E "^[0-9a-f]+ (TRY-1):" | grep -v "开工$"，TRY-1 都有提交才开工，否则停下等我。
从最新的 origin/integration/2026-11 开新目录 ~/chuan-TRY-2，读 docs/design/tasks/02-prompts.md 里的“Codex 总提示词”，照它做：领卡占位、只改卡上“只能改”的文件、跑三条测试、写交付报告、推送到 agent/TRY-2-my-hand，不要直接推 integration。
交付后回复“TRY-2 交了，分支 xxx，没做的：……”然后停下。收到审核意见时在原分支改完再推送。
```

</details>

<details><summary>AI-1a 后端：对话接口收图片</summary>

```
你是“串个珠”项目的执行者。仓库 https://github.com/gachiqachi-netizen/-.git（私有，HTTPS），所有工作从 origin/integration/2026-11 开始。
这次直接领 AI-1a（后端：对话接口收图片，卡在 docs/design/tasks/followups-ai.md，先读文件开头的共同规矩，再读 AI-1a 这一节）。开工前先跑 git log origin/integration/2026-11 --oneline | grep -E "^[0-9a-f]+ (AI-2):" | grep -v "开工$"，AI-2 都有提交才开工，否则停下等我。
从最新的 origin/integration/2026-11 开新目录 ~/chuan-AI-1a，读 docs/design/tasks/02-prompts.md 里的“Codex 总提示词”，照它做：领卡占位、只改卡上“只能改”的文件、跑三条测试、写交付报告、推送到 agent/AI-1a-chat-image-api，不要直接推 integration。
交付后回复“AI-1a 交了，分支 xxx，没做的：……”然后停下。收到审核意见时在原分支改完再推送。
```

</details>

<details><summary>AI-1b 前台：输入区“+”发图、气泡显示图片和“看到了什么”</summary>

```
你是“串个珠”项目的执行者。仓库 https://github.com/gachiqachi-netizen/-.git（私有，HTTPS），所有工作从 origin/integration/2026-11 开始。
这次直接领 AI-1b（前台：输入区“+”发图、气泡显示图片和“看到了什么”，卡在 docs/design/tasks/followups-ai.md，先读文件开头的共同规矩，再读 AI-1b 这一节）。
从最新的 origin/integration/2026-11 开新目录 ~/chuan-AI-1b，读 docs/design/tasks/02-prompts.md 里的“Codex 总提示词”，照它做：领卡占位、只改卡上“只能改”的文件、跑三条测试、写交付报告、推送到 agent/AI-1b-chat-image-ui，不要直接推 integration。
交付后回复“AI-1b 交了，分支 xxx，没做的：……”然后停下。收到审核意见时在原分支改完再推送。
```

</details>

## 等前面的卡（8）

| 卡 | 做什么 | 说明 |
|---|---|---|
| U35 | 手串排布改成固定圈、按真实尺寸放珠子，可旋转 | 等 U34 |
| U36 | 热门款和封面里的手串居中 | 等 U35 |
| U38 | 分享给好友点一次就能发 | 等 B-26 |
| H9 | 旧珠子和配件全部下架，只留 H7 导入的 | 等 H7 |
| H10 | 用新导入的珠子做 8 个首页模板 | 等 H9 |
| U40 | 工作台按设计图 v7.2 改版 | 等 U36 |
| U41 | 加珠动效：沿轨道滑入 | 等 U40 |
| U42 | 工作台“更多”精简，“保存”放到底部栏 | 等 U41 |

## 等负责人（2）

| 卡 | 做什么 | 说明 |
|---|---|---|
| B-13 | 物流轨迹 | 确认微信物流服务和物流查询插件已开通 |
| C11b | 全流程回归 | 负责人在开发者工具和真机上把三条主流程逐屏走一遍（等 V3、W1、U16 都合并后） |

## 已完成（154）

A3、A7、A8a、A8b、A8c、A8d、A8e、A8f、K1、K2、K3、B-1、B-2、B-3、B-4、B-5、B-6、B-7、B-8、B-9、B-10、B-11a、B-11b、B-11c、B-12、B-16、B-17、B-18、B-19、B-20、B-21、B-22、B-23、B-24、B-25、B-15、B-14、A5c、C1p、C1a、C1b、C3a、C3b、C3c、C3d、C4a、C4b、C4c、C4d、C5a、C5c、C6a、C6b、C6c、C7a、C7b、C8a、C8b、C8c、C9a、C9b、C9c、C10a、C10b、C11a、D3a、D3b、D3c、D3d、D4、D5a、D5b、D6a、D6c、D6b、D7a、D7b、D7c、D8、KD1、KD2、F1、F2、F3、F4、F5、F6、F7、D9、A10、T1、U0、U1、U2、U3、U4、U5、U6、U7、U8、U9、U10、U12、U13、V1、V2、V2b、V3、V4、V5、U14、U15、W1、T2、P1、V6、AI1、AI2、R1、T3、U16、U17、U18、U19、U20、U21、U22、U23、U24、U25、U26、U27、U28、U29、U30、U31、U32、U33、V7a、V8、V9、V10、V7b、U11、H1、H2、H3、H4、H5、H6、U39、TRY-1、AI-2、H11
