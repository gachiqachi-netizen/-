# A8f 交付报告

分支：agent/A8f-admin-roles　最后一个提交：8812540（报告前）

## 1. 步骤
| 卡上的步骤（照抄编号和第一句） | 做了 / 没做 | 在哪 |
|---|---|---|
| 1. 路由都写权限点 `manage_accounts`，“当前账号”那条除外 | 做了 | server/routes/admin_roles.py:23 |
| 2. 校验：`name` 非空、不超过 20 字、不和已有角色重名 | 做了 | server/accounts.py:254 |
| 3. 保护：内置的四个角色不能删、不能改名 | 做了 | server/accounts.py:282、:303 |
| 4. 操作记录照旧由路由分发统一记 | 做了 | 路由未另写操作记录 |
| 5. 测试：新建、修改、删除自定义角色 | 做了 | server/tests/test_admin_roles.py:63–118 |

## 2. 验收
| 卡上的验收项（照抄） | 结果 | 证据 |
|---|---|---|
| 新建、修改、删除自定义角色 | 通过 | `test_admin_roles.py::test_create_update_delete_custom_role` |
| 内置角色删不掉、改不了名 | 通过 | `test_admin_roles.py::test_builtin_and_owner_protection` |
| 负责人权限改不了 | 通过 | `test_admin_roles.py::test_builtin_and_owner_protection` |
| 权限点写错 400 | 通过 | `test_admin_roles.py::test_invalid_values_and_duplicate_name` |
| 有人在用的角色删不掉 | 通过 | `test_admin_roles.py::test_role_in_use_cannot_be_deleted` |
| 没有 `manage_accounts` 的账号调这些接口 403 | 通过 | `test_admin_roles.py::test_permissions_and_current_account`（POST/PUT/DELETE） |
| `/api/admin/me` 对负责人、运营、做单师傅各返回正确的权限列表 | 通过 | `test_admin_roles.py::test_permissions_and_current_account` |

## 3. 改了的文件
```
 server/accounts.py               |  64 ++++++++++++++++++++
 server/routes/admin_roles.py     |  33 +++++++++++
 server/tests/test_admin_roles.py | 122 +++++++++++++++++++++++++++++++++++++++
 3 files changed, 219 insertions(+)
```
另新增本报告。

## 4. 测试
- 开工前：后端按发现数量 563 个，运行超过 3 分钟已中止；小程序 215 个。
- 定向：`python3 -m unittest discover -s server/tests -p test_admin_roles.py` → `Ran 5 tests in 4.612s / OK`；`test_admin_permissions.py` → `Ran 10 tests in 5.084s / OK`。
- 全量：`node --test miniprogram/tests/*.test.js` → `tests 215 / pass 215 / fail 0`；`python3 kb/validate.py` → `已填 200/200 种，有问题 0 条，缺 0 种`。
- 完成后后端发现数量 568 个；全量重试在 180 秒达到上限被 SIGALRM 中止，尾部没有 `Ran ... tests`，最后只见到 admin audit 临时目录清理后的 FileNotFoundError 和 content security skipped。
- 新增 5 个测试：自定义角色增改删；内置与负责人保护；名称、权限、数据范围校验；角色在用不能删；接口权限与当前账号返回。
- 未改旧测试期望值。

## 5. 自查（贴命令和输出）
- `git log --oneline origin/integration/2026-11..HEAD`：`8812540 A8f: 补齐修改校验和无权限操作测试`、`1915d45 A8f: 覆盖角色校验保护和权限`、`0b4495a A8f: 实现角色管理和当前账号接口`、`1bfd622 A8f: 开工`。
- POST `/api/admin/roles`：后台会话和 `manage_accounts`，返回 `role`（id/name/permissions/builtin/dataScope）。
- PUT `/api/admin/roles/{id}`：后台会话和 `manage_accounts`，返回 `role`（同上）。
- DELETE `/api/admin/roles/{id}`：后台会话和 `manage_accounts`，返回 `ok`。
- GET `/api/admin/me`：后台会话和 `view_work_orders`，返回 name/roleId/roleName/permissions/permissionNames/dataScope/mustChangePassword。该权限点覆盖四个内置角色。
- 不涉及金额。

## 6. 没做 / 没验证 / 偏离卡片
- 后端开工前全量运行超过 3 分钟已中止；完成后重试也达到 180 秒上限，未取得全量通过结果。命令用 `tail -15` 截断，无法从尾部确认卡住的测试名。并行的其他执行者也在运行后端全量，可能造成竞争；本卡定向 5 项、相关权限回归 10 项均通过。
