# A8b 交付报告

分支：agent/A8b-admin-permissions　最后一个代码提交：4270256

## 1. 步骤
| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 1. `admin_can(perm)`：登录了且角色的 `permissions` 包含 `perm` | 做了 | `server/app.py:241`、`server/accounts.py:92`；afc5bda |
| 2. 每个后台接口配权限点，对照表写在 `accounts.py` 的 `ROUTE_PERMISSIONS` 里 | 做了 | `server/accounts.py:38`；afc5bda、4270256 |
| 3. 测试：四个默认角色 × 每个后台接口，结果和 14 第 2.3 节的表一致（表驱动） | 做了 | `server/tests/test_admin_permissions.py:24`；48e9d3e、7efe4fe |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 未登录 401 | 通过 | `test_admin_permissions.py::test_http_permission_denials` |
| 没权限 403，含错误和权限中文 | 通过 | `test_admin_permissions.py::test_http_permission_denials` |
| 负责人全部权限；其余角色按已存角色权限判定 | 通过 | `test_admin_permissions.py::test_four_roles_by_every_registered_endpoint`、`test_permissions_are_loaded_from_role_record` |
| 旧后台接口与新路由统一查权限表 | 通过 | `test_admin_permissions.py::test_legacy_endpoint_mapping`、`test_route_registry_accepts_permission_names`；`test_routes_registry.py` 16 项通过 |
| 取消、改价、工单、质检使用独立权限 | 通过 | `test_admin_permissions.py::test_sensitive_actions_have_separate_permissions` |

## 3. 改了的文件
```
 server/accounts.py                     |  64 +++++++++++++++++++
 server/app.py                          | 103 +++++++++++++++++-------------
 server/routes/__init__.py              |   6 +-
 server/tests/test_admin_permissions.py | 110 +++++++++++++++++++++++++++++++++
 server/tests/test_routes_registry.py   |   6 +-
 5 files changed, 241 insertions(+), 48 deletions(-)
```
另有本报告。`test_routes_registry.py` 仅把已成为合法权限点的 `edit_kb` 测试前提换为真正未知的 `unknown_permission`，保留拒绝断言。

## 4. 测试
- 开工前后端：376 项，5 项 HTTP 超时错误、7 项跳过；小程序：146 项。
- 后端最终 `python3 -m unittest discover -s server/tests`：382 项，0 条断言失败、4 条 HTTP 超时错误、7 项跳过（117.452 秒）。错误为 `test_env_prod.AIFallbackHTTPTest` 3 项和 `test_http.HTTPTest.test_ai_input_and_unconfigured_fallback` 1 项；开工前同类错误 5 项。
- 小程序最终 `node --test miniprogram/tests/*.test.js`：146 项，146 通过，0 失败。
- 知识库 `python3 kb/validate.py`：`已填 200/200 种，有问题 0 条，缺 0 种`。
- 新增 6 项：`test_four_roles_by_every_registered_endpoint` 覆盖四角色；`test_sensitive_actions_have_separate_permissions` 覆盖敏感动作；`test_legacy_endpoint_mapping` 覆盖旧接口映射；`test_permissions_are_loaded_from_role_record` 覆盖动态角色；`test_route_registry_accepts_permission_names` 覆盖新路由声明；`test_http_permission_denials` 覆盖 401、403 与负责人放行。
- 已有测试调整：`test_routes_registry.py` 两处测试前提 `edit_kb` → `unknown_permission`，因 `edit_kb` 现在是合法权限点；断言不变。没有改期望值。
- 全量小程序测试前两次在并发后端测试期间出现 `ar-model-cache.test.js` 计时失败；该文件单独运行 9/9 通过，第三次全量 146/146 通过。

## 5. 自查（命令和输出）
`git log --oneline origin/integration/2026-11..HEAD`：
```
4270256 A8b: 保留旧订单写接口的负责人校验
7efe4fe A8b: 覆盖现有后台接口权限映射
48e9d3e A8b: 验证角色权限与更新旧路由前提
afc5bda A8b: 接入后台权限检查与路由映射
f92e710 A8b: 开工
```
`git diff --check origin/integration/2026-11...HEAD`：无输出。

接口：原有后台 GET `/api/admin/{beads,templates,banners,orders,after-sales,terms,work-orders,audit}` 及其详情路径仍返回原字段，分别需要编辑商品、编辑模板、编辑内容、看订单、处理售后、编辑和发布条款、看工单、管理账号权限。POST/PUT/DELETE 对应的商品、模板、内容、条款、售后接口需要同名写权限；PUT 订单状态/物流需要处理订单，取消状态需要取消订单，地址/备注需要改地址和备注，工单需要做单，质检需要质检；账号接口需要管理账号权限。`/api/admin/accounts/bootstrap` 和 `/api/admin/accounts/me/password` 保留原有特殊登录检查。所有原有接口的返回字段未改；本卡不涉及金额计算。

## 6. 没做 / 没验证 / 偏离卡片
- 后端全量开工前已有 5 项 HTTP 超时错误；最终仍有 4 项，未在本卡范围内修改这些测试或 AI 接口。
- 未改后台页面，未在浏览器验证。

## 7. 审核修改（打回后才有）
无。
