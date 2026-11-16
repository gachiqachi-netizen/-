# 任务看板

> 自动生成，别手改。更新：`git fetch origin --prune && python3 tools/board.py`。审核每合并一次都会重新生成并推送。
> 总共 116 张（第一波之外），已完成 109 张。

## 在做或待审（1）

| 卡 | 做什么 | 说明 |
|---|---|---|
| U16 | 空状态、错误状态和确认订单的地址行 | 分支上有提交，交了就告诉审核 |

## 现在能派（1）

| 卡 | 做什么 | 说明 |
|---|---|---|
| B-14 | 接入微信支付 |  |

### 提示词（一张卡一个对话，整段复制）

<details><summary>B-14 接入微信支付</summary>

```
你是“串个珠”项目的执行者。仓库 https://github.com/gachiqachi-netizen/-.git（私有，HTTPS），所有工作从 origin/integration/2026-11 开始。
这次直接领 B-14（接入微信支付，卡在 docs/design/tasks/backend-wave2.md，先读文件开头的共同规矩，再读 B-14 这一节）。开工前先跑 git log origin/integration/2026-11 --oneline | grep -E "^[0-9a-f]+ (A5b):"，A5b 都有提交才开工，否则停下等我。
从最新的 origin/integration/2026-11 开新目录 ~/chuan-B-14，读 docs/design/tasks/02-prompts.md 里的“Codex 总提示词”，照它做：领卡占位、只改卡上“只能改”的文件、跑三条测试、写交付报告、推送到 agent/B-14-wechat-pay，不要直接推 integration。
交付后回复“B-14 交了，分支 xxx，没做的：……”然后停下。收到审核意见时在原分支改完再推送。
```

</details>

## 等前面的卡（2）

| 卡 | 做什么 | 说明 |
|---|---|---|
| V7a | 记录类手串图统一：三档尺寸、去灰框 | 等 U16 |
| V7b | 后台手串图和小程序同一画法 | 等 V7a |

## 等负责人（3）

| 卡 | 做什么 | 说明 |
|---|---|---|
| B-13 | 物流轨迹 | 选快递查询服务商 |
| C5b | 语音和照片 | 选语音识别服务（照片部分可以先做） |
| C11b | 全流程回归 | 负责人在开发者工具和真机上把三条主流程逐屏走一遍（等 V3、W1、U16 都合并后） |

## 已完成（109）

A3、A7、A8a、A8b、A8c、A8d、A8e、A8f、K1、K2、K3、B-1、B-2、B-3、B-4、B-5、B-6、B-7、B-8、B-9、B-10、B-11a、B-11b、B-11c、B-12、A5c、C1p、C1a、C1b、C3a、C3b、C3c、C3d、C4a、C4b、C4c、C4d、C5a、C5c、C6a、C6b、C6c、C7a、C7b、C8a、C8b、C8c、C9a、C9b、C9c、C10a、C10b、C11a、D3a、D3b、D3c、D3d、D4、D5a、D5b、D6a、D6c、D6b、D7a、D7b、D7c、D8、KD1、KD2、F1、F2、F3、F4、F5、F6、F7、D9、A10、T1、U0、U1、U2、U3、U4、U5、U6、U7、U8、U9、U10、U12、U13、V1、V2、V2b、V3、V4、V5、U14、U15、W1、T2、P1、V6、AI1、AI2、R1、T3、U11
