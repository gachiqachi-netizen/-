# 珠养养后台前端（admin-web）

技术栈：React 19 + Vite 6 + Tailwind CSS v4 + TypeScript。需要 node 20 或以上。

## 装依赖

```bash
npm ci
```

## 本地开发

先起后端（测试口令自己随便起一个，不要用真实口令；`DATA_DIR` 一定要指向临时目录，否则会改到仓库里提交着的 `server/data.sqlite3`）：

```bash
cd ../server && DATA_DIR=/tmp/zyy-admin-data ADMIN_TOKEN=<自己起的测试口令> DEMO_ORDERS=1 PAYMENT_PROVIDER=mock PORT=8801 python3 app.py
```

再开前端开发服务：

```bash
npm run dev     # 打开 http://localhost:5173/admin/
```

开发服务已配置 `/api` 代理到 `http://127.0.0.1:8801`。

## 打包

```bash
npm run build
```

`npm run build` 会先跑 `tsc --noEmit` 做类型检查，再用 vite 打包。**打包结果会覆盖 `server/static/admin/` 下的 `shadcn-admin.js` 和 `shadcn-admin.css` 两个文件，这两个文件要随源码改动一起提交。**
