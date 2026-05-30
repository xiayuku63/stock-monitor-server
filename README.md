# Stock Monitor Pro - API Server

股票监控工具云端同步服务器。

## 功能

- 用户注册/登录 (JWT 认证)
- 关注列表云端同步
- 提醒数据云端同步
- 设置云端同步

## 技术栈

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT + bcrypt

## 本地开发

```bash
npm install
npm run dev
```

服务器运行在 `http://localhost:3000`

## 部署到 Render

1. Fork 或上传此仓库到 GitHub
2. 在 [render.com](https://render.com) 创建 Web Service
3. 连接 GitHub 仓库
4. Render 会自动检测 `render.yaml` 配置
5. 点击部署，等待完成

## API 接口

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/` | GET | 否 | 健康检查 |
| `/api/health` | GET | 否 | 服务状态 |
| `/api/auth/register` | POST | 否 | 注册 |
| `/api/auth/login` | POST | 否 | 登录 |
| `/api/auth/me` | GET | 是 | 获取用户信息 |
| `/api/sync` | GET | 是 | 拉取数据 |
| `/api/sync` | POST | 是 | 推送数据 |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | 3000 |
| `JWT_SECRET` | JWT 密钥 | (必须设置) |
| `DB_PATH` | 数据库路径 | ./db/data.db |
| `ALLOWED_ORIGINS` | CORS 允许的源 | * |
