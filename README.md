# CNB 亚洲互联网学院

> 认证你的数字创造力 · cnb.asia

为亚洲创作者提供权威的作品认证与技能评估服务，让每一份作品都有证可循。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Tailwind CSS + Vue Router + Pinia |
| 后端 | Node.js + Express + JWT |
| 数据库 | SQLite (better-sqlite3) |
| 证书生成 | PDFKit + QRCode |

## 快速开始

### 1. 安装依赖

```bash
npm run install:all
```

### 2. 开发模式（前后端分离）

```bash
npm run dev
```

- 前端: http://localhost:5173
- 后端: http://localhost:3000

### 3. 生产模式（单服务器）

```bash
cd client && npm run build   # 构建前端
cd ../server && npm start     # 启动服务器
```

访问 http://localhost:3000

### 默认管理员账号

- 用户名: `admin`
- 密码: `admin123`

## 核心功能

### 用户系统
- 注册 / 登录（JWT 认证）
- 个人中心管理
- 个人仪表盘

### 作品提交与审核
- 用户提交作品（支持 GitHub/Behance/链接等多种类型）
- 管理员审核作品（通过/拒绝 + 审核意见）
- 审核通过可自动颁发证书

### 证书系统
- **四大证书类型**：作品完成证书、技能认证证书、原创性存证证书、优质作品表彰证书
- 每张证书含：唯一编号（CNB-年份-8位编码）、SHA-256 哈希、持有人信息、作品信息
- 精美 PDF 证书生成（含二维码、装饰边框、防伪哈希）
- 证书下载

### 证书验证
- 公开验证页面：`/verify/{证书编号}`
- 任何人可在线验证证书真伪
- 记录每次验证操作（IP、时间、User-Agent）
- 显示验证次数

### 管理后台
- 数据概览（用户数、作品数、证书数、验证次数）
- 作品审核管理
- 手动颁发证书
- 证书撤销
- 用户管理

## 数据库结构

```
users          - 用户表（用户名、邮箱、密码、姓名、角色）
works          - 作品表（标题、描述、分类、链接、审核状态）
certificates   - 证书表（编号、类型、持有人、哈希、状态）
verifications  - 验证记录表（证书ID、IP、时间）
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 获取当前用户 |
| PUT | /api/auth/profile | 更新个人资料 |
| POST | /api/works | 提交作品 |
| GET | /api/works/my | 获取我的作品 |
| GET | /api/certificates/my | 获取我的证书 |
| GET | /api/certificates/:id/download | 下载证书 PDF |
| GET | /api/certificates/verify/:certNumber | 公开验证证书 |
| GET | /api/admin/stats | 管理后台统计 |
| GET | /api/admin/works | 获取所有作品 |
| PUT | /api/admin/works/:id/review | 审核作品 |
| POST | /api/certificates/issue | 颁发证书 |
| PUT | /api/admin/certificates/:id/revoke | 撤销证书 |

## 部署到 cnb.asia

1. 在服务器上安装 Node.js 18+
2. 克隆项目并安装依赖
3. 构建前端：`cd client && npm run build`
4. 启动服务：`cd server && npm start`
5. 配置 Nginx 反向代理到 3000 端口
6. 配置 SSL 证书

## 免责声明

CNB 证书为技能认证与作品完成证明，非国家认可的学历证书或职业资格证书。
