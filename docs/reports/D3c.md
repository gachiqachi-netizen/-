# D3c 交付报告

分支：agent/D3c-admin-menu-perms　最后一个代码提交：66ccf84

## 1. 步骤
| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 登录后调 GET /api/admin/me 取权限点 | 做了 | `admin-web/src/App.tsx` `loadAllData`；d93fb00 |
| 没权限的菜单项不显示 | 做了 | `admin-web/src/layout/Shell.tsx`、`src/permissions.ts`；5a8614e |
| 没权限的按钮不出现 | 已完成授权范围 | `src/pages/products.tsx`、`products/pricingSettings.tsx`、`templates/TemplatesWorkbench.tsx`、`workOrders/detail.tsx`、`afterSales/detail.tsx`；9bdfdf7 |
| 直接打开没权限的页面显示需要的权限与找负责人开通 | 做了 | `Shell.tsx` `denied` 分支；5a8614e |
| 后端 403 的 need 中文显示出来 | 做了 | `src/api.ts`、`src/App.tsx`；d93fb00 |
| 按权限请求分区数据，403 只标该区，401 回登录页 | 做了 | `src/App.tsx` `section`；d93fb00 |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 登录后菜单按权限显示 | 代码与构建通过；待浏览器核对 | `npm run build` → `✓ built`；需要负责人在浏览器看：`/admin/`，对照稿 A20 |
| 没权限的操作按钮消失而非变灰 | 代码与构建通过；待浏览器核对 | `Can` 返回 `null`；需要负责人在浏览器看：商品、模板、工单、售后页，对照稿 A20 |
| 无权限页写需要的权限和找负责人开通 | 代码与构建通过；待浏览器核对 | `Shell.tsx` 无权限分支；需要负责人在浏览器看：`/admin/` 无权限页面，对照稿 A21 |
| 后端 403 显示 need | 代码与构建通过；待浏览器核对 | `api.ts` 将 `data.need` 加入错误文字；`App.tsx` 分区记 `deniedBlocks` |

按 A8f 默认角色的权限，预期菜单如下；**需要负责人分别用三个角色在浏览器验**：

| 角色 | 预期可见菜单 |
|---|---|
| 运营 | 今天、做单、订单、评价、珠子与配件、模板、知识库、首页、文章 |
| 客服 | 今天、做单、订单、售后、评价、知识库 |
| 做单师傅 | 今天、做单、知识库 |

## 3. 改了的文件
```
 admin-web/src/App.tsx                              | 40 ++++++++++++-----
 admin-web/src/api.ts                               |  2 +
 admin-web/src/layout/Shell.tsx                     | 25 +++++++++--
 admin-web/src/pages/afterSales/detail.tsx          |  9 ++--
 admin-web/src/pages/products.tsx                   | 11 ++---
 admin-web/src/pages/products/pricingSettings.tsx   |  3 +-
 .../src/pages/templates/TemplatesWorkbench.tsx     | 17 ++++----
 admin-web/src/pages/workOrders/detail.tsx          | 17 ++++----
 admin-web/src/permissions.ts                       | 50 ++++++++++++++++++++++
 9 files changed, 134 insertions(+), 40 deletions(-)
```

## 4. 测试
- 后端：`python3 -m unittest discover -s server/tests -v` → `Ran 581 tests in 139.588s; OK (skipped=7)`。首轮有 3 个 HTTP 用例在读取本机响应时发生 3 秒 socket 超时，复跑全部通过。
- 小程序：`node --test miniprogram/tests/*.test.js` → `tests 248; pass 248; fail 0`。
- 知识库：`python3 kb/validate.py` → `已填 200/200 种，有问题 0 条，缺 0 种`。
- 后台：`cd admin-web && npm run build` → `tsc --noEmit && vite build; ✓ built`。
- 测试数：后端开工前 581 个 → 现在 581 个（发现测试数，本卡没有后端改动）；小程序开工前 248 个 → 现在 248 个。
- 权限映射核对：esbuild 打包 `permissions.ts` 后用 Node 调 `canPage`，输出 `operator: today,workOrders,orders,reviews,products,templates,knowledge,home,articles`、`service: today,workOrders,orders,afterSales,reviews,knowledge`、`maker: today,workOrders,knowledge`；`can(quality_gate)` 为真、`can(refund)` 为假。
- 本卡未加测试：`admin-web` 没有现成测试框架，按负责人本次许可用构建与待浏览器验收。

## 5. 自查（贴命令和输出）
- `git log --oneline origin/integration/2026-11..HEAD`：所有本卡提交均以 `D3c:` 开头；`git merge origin/integration/2026-11` → `Already up to date.`
- `cd admin-web && npm run build`：`✓ 1615 modules transformed; ✓ built`。
- `git status --short`：无输出（打包产物未提交）。

## 6. 没做 / 没验证 / 偏离卡片
- 经负责人同意扩展：修改 `src/App.tsx`、`src/api.ts` 及指定的商品、模板、做单、售后页面，只按本卡接权限加载、403 显示与按钮可见性。
- 未碰 `accounts`、`reviews`、`home`、`articles`、`terms`、`knowledge`、`orders*`、`src/components/OrdersView.tsx`；这些页面的按钮尚未按权限隐藏，交由各自卡或 D9 收尾。
- 没有在浏览器用运营、客服、做单师傅的实际账号验证，也没有截图；上表是由默认角色权限推算的预期。
- 后端开工前基线命令超过 3 分钟已按规则中止；复跑全量通过。
