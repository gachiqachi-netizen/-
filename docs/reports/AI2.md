# AI2 交付报告

分支：`agent/AI2-ai-settings-page`　最后一个代码提交：`cfe6500`

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 1. 一页四块：当前状态、开关、切换服务商和模型、测试按钮 | 做了 | `admin-web/src/pages/aiSettings.tsx` |
| 2. 最近 7 天用量表 | 做了 | `admin-web/src/pages/aiSettings.tsx` |
| 3. 密钥在服务器上配置说明 | 做了 | `admin-web/src/pages/aiSettings.tsx` |
| 4. 后台界面不用英文代码并通过构建 | 做了构建，待人工看界面 | `admin-web/src/layout/Shell.tsx`；`npm run build` |

## 2. 验收

| 验收项 | 结果 | 证据 |
|---|---|---|
| 当前服务商、模型、密钥配置状态 | 已实现 | 需要负责人在浏览器看：后台“系统 → AI 设置”页，使用有 `manage_accounts` 权限的账号 |
| 两个开关、只列已配置服务商、编辑模型并保存 | 已实现 | 需要负责人在浏览器看：后台“系统 → AI 设置”页 |
| 测试成功或失败、耗时、模型 | 已实现 | 需要负责人在浏览器看：后台“系统 → AI 设置”页，点“测试一下” |
| 最近 7 天按日展示配串与拍照用量 | 已实现 | 需要负责人在浏览器看：后台“系统 → AI 设置”页底部 |
| 密钥说明 | 已实现 | 页面文字：“密钥在服务器上配置，这里看不到也改不了。” |
| 后台构建 | 通过 | `npm run build`: `✓ built in 1.28s` |

## 3. 改了的文件

`git diff --stat origin/integration/2026-11...HEAD`：

```text
admin-web/src/layout/Shell.tsx     | 10 +++-
admin-web/src/pages/aiSettings.tsx | 115 +++++++++++++++++++++++++++++++++++++
2 files changed, 122 insertions(+), 3 deletions(-)
```

## 4. 测试

```text
python3 -m unittest discover -s server/tests: Ran 631 tests in 98.854s; OK (skipped=7)
node --test miniprogram/tests/*.test.js: tests 297; pass 297; fail 0
python3 kb/validate.py: 已填 200/200 种，有问题 0 条，缺 0 种
cd admin-web && npm run build: ✓ built in 1.28s
```

测试数：后端 631 → 631；小程序 297 → 297。本卡未新增测试（只新增后台页面）。

## 5. 自查

`git log --oneline origin/integration/2026-11..HEAD`：`cfe6500 AI2: 增加设置页面及系统菜单入口`、`35b2463 AI2: 开工`。`git diff --check` 无输出。构建产物 `server/static/admin/shadcn-admin.*` 已还原，未提交。

## 6. 没做 / 没验证 / 偏离卡片

未用有权限的真实后台账号在浏览器人工验证页面和测试按钮；需要负责人查看“系统 → AI 设置”页。页面调用现有 AI1 接口，未改接口。模型名称由管理员输入，因为接口没有提供模型清单；只有已配置密钥的服务商出现在选项中。
