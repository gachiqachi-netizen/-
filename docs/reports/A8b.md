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
`git diff --stat origin/integration/2026-11...HEAD`（更新报告前）：
```
 docs/reports/A8b.md                    |  59 +++++++++++
 server/accounts.py                     |  80 +++++++++++++++
 server/app.py                          | 104 +++++++++++--------
 server/routes/__init__.py              |   7 +-
 server/tests/test_admin_permissions.py | 181 +++++++++++++++++++++++++++++++++
 server/tests/test_routes_registry.py   |   6 +-
 6 files changed, 389 insertions(+), 48 deletions(-)
```
`test_routes_registry.py` 仅把已成为合法权限点的 `edit_kb` 测试前提换为真正未知的 `unknown_permission`，保留拒绝断言。

## 4. 测试
- 开工前后端：376 项，5 项 HTTP 超时错误、7 项跳过；小程序：146 项。
- 后端最终 `python3 -m unittest discover -s server/tests`：382 项，0 条断言失败、4 条 HTTP 超时错误、7 项跳过（117.452 秒）。错误为 `test_env_prod.AIFallbackHTTPTest` 3 项和 `test_http.HTTPTest.test_ai_input_and_unconfigured_fallback` 1 项；开工前同类错误 5 项。
- 小程序最终 `node --test miniprogram/tests/*.test.js`：146 项，146 通过，0 失败。
- 知识库 `python3 kb/validate.py`：`已填 200/200 种，有问题 0 条，缺 0 种`。
- 新增 6 项：`test_four_roles_by_every_registered_endpoint` 覆盖四角色；`test_sensitive_actions_have_separate_permissions` 覆盖敏感动作；`test_legacy_endpoint_mapping` 覆盖旧接口映射；`test_permissions_are_loaded_from_role_record` 覆盖动态角色；`test_route_registry_accepts_permission_names` 覆盖新路由声明；`test_http_permission_denials` 覆盖 401、403 与负责人放行。
- 已有测试调整：`test_routes_registry.py` 两处测试前提 `edit_kb` → `unknown_permission`，因 `edit_kb` 现在是合法权限点；断言不变。没有改期望值。
- 全量小程序测试前两次在并发后端测试期间出现 `ar-model-cache.test.js` 计时失败；该文件单独运行 9/9 通过，第三次全量 146/146 通过。

审核复测（合入 `origin/integration/2026-11` 后）：`python3 -m unittest discover -s server/tests` 406 项，OK，跳过 7 项（54.462 秒）；`node --test miniprogram/tests/*.test.js` 146 项全过；`python3 kb/validate.py` 已填 200/200 种，有问题 0 条，缺 0 种。新增测试：`test_operator_can_save_name_with_unchanged_price`、`test_operator_cannot_change_price`、`test_owner_can_change_price`、`test_every_admin_route_has_permission_mapping`。定向测试 `test_admin_permissions.py` 10/10、`test_articles.py` 6/6、`test_admin_accounts.py` 7/7、`test_routes_registry.py` 16/16 通过。

## 5. 自查（命令和输出）
`git log --oneline origin/integration/2026-11..HEAD`：
```
fba0b8e A8b: 审核 1-3 修复价格和新路由权限
ca0e18b Merge remote-tracking branch 'origin/integration/2026-11' into agent/A8b-admin-permissions
509f2cd A8b: 交付报告与测试证据
4270256 A8b: 保留旧订单写接口的负责人校验
7efe4fe A8b: 覆盖现有后台接口权限映射
48e9d3e A8b: 验证角色权限与更新旧路由前提
afc5bda A8b: 接入后台权限检查与路由映射
f92e710 A8b: 开工
```
`git diff --check origin/integration/2026-11...HEAD`：无输出。`ca0e18b` 是按审核意见 2 指定执行 `git merge` 生成的合并提交。

接口：原有后台 GET `/api/admin/{beads,templates,banners,orders,after-sales,terms,work-orders,audit}` 及其详情路径仍返回原字段，分别需要编辑商品、编辑模板、编辑内容、看订单、处理售后、编辑和发布条款、看工单、管理账号权限。POST/PUT/DELETE 对应的商品、模板、内容、条款、售后接口需要同名写权限；PUT 订单状态/物流需要处理订单，取消状态需要取消订单，地址/备注需要改地址和备注，工单需要做单，质检需要质检；账号接口需要管理账号权限。`/api/admin/accounts/bootstrap` 和 `/api/admin/accounts/me/password` 保留原有特殊登录检查。所有原有接口的返回字段未改；本卡不涉及金额计算。

## 6. 没做 / 没验证 / 偏离卡片
- 初次交付时后端全量有 4 项 HTTP 超时错误；本次合入最新 integration 后复测 406 项通过。
- 未改后台页面，未在浏览器验证。

## 7. 审核修改（打回后才有）
| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
| 1 | 商品保存将请求价格按整数分与库中价格比较；未变只需 `edit_products`，变价才需 `edit_prices`。补运营改名、运营改价、负责人改价的实际 HTTP 测试。 | fba0b8e |
| 2 | 合入最新 integration，文章后台接口映射 `edit_content`；测试遍历全部 `auth="admin"` 路由，验证都有权限映射；路由说明要求新后台路由直接写权限点。保留初始化和改密码的特殊登录规则。 | ca0e18b、fba0b8e |
| 3 | GET/DELETE 不传 `data`，POST/PUT 直接传已定义的 `data`，移除 `locals().get("data")`。 | fba0b8e |
| 4 | 更新本报告并重新运行三条全量测试：后端 406 项通过（7 项跳过）、小程序 146 项通过、知识库 200/200。 | 本报告提交 |

