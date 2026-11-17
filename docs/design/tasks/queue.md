# 总队列（2026-11-13 起，第一波剩下的 + 第二波全部）

> 给执行 agent 用：按 [02-prompts.md](02-prompts.md) 的总提示词，从上往下领第一张能做的卡。
> - **要先合并**：每一张都在 `origin/integration/2026-11` 里有“<卡号>:”开头的提交才能开工。
> - **不能同时做**：表里列的卡如果已被领走、还没合并（GitHub 上有它的 `agent/<卡号>-*` 分支，但 integration 里没有它的提交），这张先跳过。它们会改同一个函数。
> - **卡片里写的“依赖”和这张表不一样时，以这张表为准**（比如 C8b 卡上写的 A6 已经并进 A4b）。
> - **谁做**：`Codex` 只给 Codex；`任何` 给 Kimi 或其他执行者。
> - **等负责人**：写了内容的先跳过，负责人定了以后我会把这一格清空。
> - 卡的内容在“卡在哪”那个文件里，用 `grep -n "^#\+ <卡号> \|^- \*\*<卡号> " <文件>` 找。
> - **后台页面卡不提交打包文件**（`server/static/admin/shadcn-admin.*`）；打包由负责人指定时单独发一张 DB 卡（`admin-wave2.md` 的 DB）。

| 卡 | 分支 | 卡在哪 | 要先合并 | 谁做 | 不能同时做 | 等负责人 |
|---|---|---|---|---|---|---|
| A11 | agent/A11-routes | backend-wave2.md | A4c、A5a | 任何 |  |  |
| A11m | agent/A11m-migrations-registry | backend-wave2.md | A5a | 任何 |  |  |
| C0g | agent/C0g-layer | miniprogram-wave1.md | C0f | 任何 |  |  |
| C0i | agent/C0i-composer | miniprogram-wave1.md | C0f | 任何 |  |  |
| C0z | agent/C0z-register | miniprogram-wave1.md | C0a、C0b、C0c、C0d、C0e、C0f、C0g、C0h、C0i、C0j | 任何 |  |  |
| C2 | agent/C2-order-state | miniprogram-wave1.md | A2、C0z | 任何 |  |  |
| D2 | agent/D2-admin-shell | admin-wave1.md | D1 | 任何 |  |  |
| D1b | agent/D1b-admin-order-detail | admin-wave1.md | A2、D2 | 任何 |  |  |
| A3 | agent/A3-pricing-settings | backend-wave2.md | A1、A11、A11m | Codex | B-11b |  |
| A7 | agent/A7-phone-login | backend-wave2.md | A11 | Codex |  |  |
| A8a | agent/A8a-admin-accounts | backend-wave2.md | A11、A11m | Codex |  |  |
| A8b | agent/A8b-admin-permissions | backend-wave2.md | A8a | Codex | B-5、B-8 |  |
| A8c | agent/A8c-mask | backend-wave2.md | A8b | Codex | K3 |  |
| A8d | agent/A8d-operator | backend-wave2.md | A8b | 任何 |  |  |
| A8e | agent/A8e-data-scope | backend-wave2.md | A8c、A8d | Codex |  |  |
| A8f | agent/A8f-admin-roles | backend-wave2.md | A8b | 任何 |  |  |
| K1 | agent/K1-kb-store | backend-wave2.md | A11、A11m | Codex |  |  |
| K2 | agent/K2-kb-rules | backend-wave2.md | K1 | 任何 |  |  |
| K3 | agent/K3-kb-admin | backend-wave2.md | K2、A8b | 任何 | A8c |  |
| B-1 | agent/B-1-uploads | backend-wave2.md | A11、A11m | 任何 |  |  |
| B-2 | agent/B-2-reviews | backend-wave2.md | A7、B-1、A11m | 任何 |  |  |
| B-3 | agent/B-3-shares-admin | backend-wave2.md | A11、A11m | 任何 | B-11c |  |
| B-4 | agent/B-4-articles | backend-wave2.md | A11、A11m | 任何 |  |  |
| B-5 | agent/B-5-home-config | backend-wave2.md | B-4 | 任何 | A8b |  |
| B-6 | agent/B-6-user-lookup | backend-wave2.md | A8b | 任何 |  |  |
| B-7 | agent/B-7-reprice | backend-wave2.md | A8b | 任何 |  |  |
| B-8 | agent/B-8-ai-design | backend-wave2.md | A3 | Codex | A8b |  |
| B-9 | agent/B-9-photo-confidence | backend-wave2.md | A11 | 任何 |  |  |
| B-10 | agent/B-10-notify | backend-wave2.md | A11、A11m | 任何 |  |  |
| B-11a | agent/B-11a-addresses | backend-wave2.md | A11、A11m | 任何 |  |  |
| B-11b | agent/B-11b-gift | backend-wave2.md | A11 | 任何 | A3 |  |
| B-11c | agent/B-11c-design-delete | backend-wave2.md | A11 | 任何 | B-3 |  |
| B-12 | agent/B-12-ai-logs | backend-wave2.md | A8b、A11m | 任何 |  |  |
| B-15 | agent/B-15-wx-shipping | backend-wave2.md | B-14 | Codex |  | 确认发货信息管理已开通 |
| B-13 | agent/B-13-tracking | backend-wave2.md | A11 V7a | 任何 |  | 确认微信物流服务和物流查询插件已开通 |
| B-14 | agent/B-14-wechat-pay | backend-wave2.md | A5b | Codex |  |  |
| A5c | agent/A5c-rewrist | backend-wave2.md | A5b | Codex |  |  |
| C1p | agent/C1p-page-shells | miniprogram-wave2.md | C0z | 任何 |  |  |
| C1a | agent/C1a-login-page | miniprogram-wave2.md | A7、C1p | 任何 |  |  |
| C1b | agent/C1b-nav | miniprogram-wave2.md | C1p | 任何 |  |  |
| C3a | agent/C3a-workbench-layout | miniprogram-wave2.md | C0z、C0j、C1b | 任何 |  |  |
| C3b | agent/C3b-workbench-feedback | miniprogram-wave2.md | C3a | 任何 |  |  |
| C3c | agent/C3c-workbench-stack | miniprogram-wave2.md | C3b | 任何 |  |  |
| C3d | agent/C3d-bead-sheet | miniprogram-wave2.md | C3c | 任何 |  |  |
| C4a | agent/C4a-home | miniprogram-wave2.md | C0z、C1b | 任何 |  |  |
| C4b | agent/C4b-works | miniprogram-wave2.md | C1p、B-11c | 任何 |  |  |
| C4c | agent/C4c-design-detail | miniprogram-wave2.md | C1p | 任何 |  |  |
| C4d | agent/C4d-content-pages | miniprogram-wave2.md | C1p、B-4 | 任何 |  |  |
| C5a | agent/C5a-ai-chat | miniprogram-wave2.md | C0z、B-8 | 任何 |  |  |
| C5b | agent/C5b-voice-photo | miniprogram-wave2.md | C5a U19 | 任何 |  | 确认同声传译插件已申请通过 |
| C5c | agent/C5c-photo-copy | miniprogram-wave2.md | C0z、B-1、B-9 | 任何 |  |  |
| C6a | agent/C6a-tryon | miniprogram-wave2.md | C0z、C1b | 任何 |  |  |
| C6b | agent/C6b-ar | miniprogram-wave2.md | C0z、C1b | 任何 |  |  |
| C6c | agent/C6c-wrist | miniprogram-wave2.md | C0z、C1b | 任何 |  |  |
| C7a | agent/C7a-checkout | miniprogram-wave2.md | C0z、C1a | 任何 |  |  |
| C7b | agent/C7b-pay-detail | miniprogram-wave2.md | C7a、C2、A4b | 任何 |  |  |
| C8a | agent/C8a-address-book | miniprogram-wave2.md | C1p、B-11a | 任何 |  |  |
| C8b | agent/C8b-my-orders | miniprogram-wave2.md | C1p、A4b | 任何 |  |  |
| C8c | agent/C8c-logistics | miniprogram-wave2.md | C1p、A4b | 任何 |  |  |
| C9a | agent/C9a-after-sale-apply | miniprogram-wave2.md | C1p、A5a、B-1 | 任何 |  |  |
| C9b | agent/C9b-after-sale-detail | miniprogram-wave2.md | C9a | 任何 |  |  |
| C9c | agent/C9c-review | miniprogram-wave2.md | C1p、B-2 | 任何 |  |  |
| C10a | agent/C10a-mine | miniprogram-wave2.md | C1a | 任何 |  |  |
| C10b | agent/C10b-share | miniprogram-wave2.md | B-3、C3a | 任何 |  |  |
| C11a | agent/C11a-cleanup | miniprogram-wave2.md | C1a、C1b、C3d、C4a、C4b、C4c、C4d、C5a、C5c、C6a、C6b、C6c、C7b、C8a、C8b、C8c、C9b、C9c、C10a、C10b | 任何 |  |  |
| C11b | agent/C11b-regression | miniprogram-wave2.md | C11a | 任何 |  |  |
| D3a | agent/D3a-admin-login | admin-wave2.md | A8a、D2 | 任何 |  |  |
| D3b | agent/D3b-admin-roles | admin-wave2.md | D3a、A8b | 任何 |  |  |
| D3c | agent/D3c-admin-menu-perms | admin-wave2.md | D3b、A8f | 任何 |  |  |
| D3d | agent/D3d-admin-role-save | admin-wave2.md | A8f、D3b | 任何 |  |  |
| D4 | agent/D4-work-orders | admin-wave2.md | D2 | 任何 |  |  |
| D5a | agent/D5a-order-detail-ops | admin-wave2.md | D1b、A4c | 任何 |  |  |
| D5b | agent/D5b-after-sale-admin | admin-wave2.md | A5b、D2 | 任何 |  |  |
| D6a | agent/D6a-products | admin-wave2.md | B-7、D2 | 任何 |  |  |
| D6c | agent/D6c-pricing-settings | admin-wave2.md | A3、D2、D6a | 任何 |  |  |
| D6b | agent/D6b-templates | admin-wave2.md | D2 | 任何 |  |  |
| D7a | agent/D7a-review-moderation | admin-wave2.md | B-2、D2 | 任何 |  |  |
| D7b | agent/D7b-home-admin | admin-wave2.md | B-5、D2 | 任何 |  |  |
| D7c | agent/D7c-content-admin | admin-wave2.md | B-3、B-4、B-6、D2 | 任何 |  |  |
| D8 | agent/D8-audit-log | admin-wave2.md | D2 | 任何 |  |  |
| KD1 | agent/KD1-kb-list | admin-wave2.md | K3、D2 | 任何 |  |  |
| KD2 | agent/KD2-kb-edit | admin-wave2.md | KD1 | 任何 |  |  |
| F1 | agent/F1-workorder-gift | followups.md |  | 任何 |  |  |
| F2 | agent/F2-reveal-phone | followups.md |  | 任何 |  |  |
| F3 | agent/F3-return-address | followups.md |  | 任何 |  |  |
| F4 | agent/F4-drop-ai-legacy | followups.md | C11a | 任何 |  |  |
| F5 | agent/F5-admin-perm-buttons | followups.md | KD2 | 任何 |  |  |
| F6 | agent/F6-banned-words | followups.md |  | 任何 |  |  |
| F7 | agent/F7-design-name-check | followups.md |  | 任何 |  |  |
| D9 | agent/D9-admin-cleanup | admin-wave2.md | D3c、D4、D5a、D5b、D6a、D6b、D7a、D7b、D7c、D8、KD2、F1、F2、F3、F5 | 任何 |  |  |
| A10 | agent/A10-drop-legacy | backend-wave2.md | C11a、D9、F4 | 任何 |  |  |
| T1 | agent/T1-auto-screenshots | followups-ui.md |  | 任何 |  |  |
| U0 | agent/U0-ui-base | followups-ui.md |  | 任何 |  |  |
| U1 | agent/U1-bracelet-thumb | followups-ui.md | U0、T1 | 任何 |  |  |
| U2 | agent/U2-nav-bar | followups-ui.md | U0、T1 | 任何 |  |  |
| U3 | agent/U3-home-fix | followups-ui.md | U0、T1 | 任何 |  |  |
| U4 | agent/U4-order-confirm-fix | followups-ui.md | U0、T1 | 任何 |  |  |
| U5 | agent/U5-order-detail-fix | followups-ui.md | U0、T1、U1、U2 | 任何 |  |  |
| U6 | agent/U6-ai-fix | followups-ui.md | U0、T1 | 任何 |  |  |
| U7 | agent/U7-share-fix | followups-ui.md | U0、T1 | 任何 |  |  |
| U8 | agent/U8-orders-list-fix | followups-ui.md | U0、T1 | 任何 |  |  |
| U9 | agent/U9-after-sale-fix | followups-ui.md | U0、T1、U1 | 任何 |  |  |
| U10 | agent/U10-review-address-fix | followups-ui.md | U0、T1、U1、U2 | 任何 |  |  |
| U12 | agent/U12-hide-scrollbar | followups-ui.md |  | 任何 |  |  |
| U13 | agent/U13-shape-audit | followups-ui.md | U5、U9、U10 | 任何 |  |  |
| V1 | agent/V1-bead-visual-snapshot | followups-visual.md |  | 任何 |  |  |
| V2 | agent/V2-bracelet-layout | followups-visual.md |  | 任何 |  |  |
| V2b | agent/V2b-tangent-layout | followups-visual.md | V2 | 任何 |  |  |
| V3 | agent/V3-mini-bracelet-unify | followups-visual.md | V1、V2、V2b、U9、U13、U14、U15 | 任何 |  |  |
| V4 | agent/V4-admin-bracelet-unify | followups-visual.md | V1、V2 | 任何 |  |  |
| V5 | agent/V5-bead-photo-upload | followups-visual.md | V2、V4 | 任何 |  |  |
| U14 | agent/U14-button-size | followups-ui.md | U13 | 任何 |  |  |
| U15 | agent/U15-skeleton | followups-ui.md | U14 | 任何 |  |  |
| W1 | agent/W1-workbench-tray | followups-ui.md | U14、U15 | 任何 |  |  |
| T2 | agent/T2-shoot-ready | followups-perf.md |  | 任何 |  |  |
| P1 | agent/P1-load-speed | followups-perf.md |  | 任何 |  |  |
| V6 | agent/V6-qc-photo-mini | followups-perf.md | V3 | 任何 |  |  |
| AI1 | agent/AI1-ai-settings-api | followups-perf.md |  | 任何 |  |  |
| AI2 | agent/AI2-ai-settings-page | followups-perf.md | AI1 | 任何 |  |  |
| R1 | agent/R1-repair-return | followups-perf.md |  | Codex |  |  |
| T3 | agent/T3-all-states-shots | followups-ui.md | T2 | 任何 |  |  |
| U16 | agent/U16-states-address | followups-ui.md | U15、T3 | 任何 |  |  |
| U17 | agent/U17-icon-buttons | followups-ui.md | U16 | 任何 |  |  |
| U18 | agent/U18-home-title | followups-ui.md | U16 | 任何 |  |  |
| U19 | agent/U19-ai-input | followups-ui.md | U16 | 任何 |  |  |
| V7a | agent/V7a-bracelet-tiers | followups-visual.md | U16 | 任何 |  |  |
| V8 | agent/V8-share-poster | followups-visual.md | V7a | 任何 |  |  |
| V7b | agent/V7b-admin-bracelet-style | followups-visual.md | V7a | 任何 |  |  |
| U11 | agent/U11-admin-aftersale-review-fix | followups-ui.md |  | 任何 |  |  |

已完成（不用再领）：A1、A2、A4a、A4b、A4c、A5a、A5b、C0a、C0b、C0c、C0d、C0e、C0f、C0h、C0j、D0、D1。A12 不做（尺寸规则已统一）。A9b 是负责人在后台做的数据任务，不在队列里。
