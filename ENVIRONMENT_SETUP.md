# 环境变量配置指南

## 概述

本项目使用环境变量来管理不同环境的配置。本文档将指导您如何设置和管理环境变量。

## 快速设置

### 方法一：使用自动设置脚本（推荐）

```bash
# 在项目根目录运行
./scripts/setup-env.sh
```

这个脚本会自动创建前端和后端的环境变量文件。

### 方法二：手动设置

#### 前端环境变量

在 `apps/web/` 目录下创建 `.env.local` 文件：

```bash
# 应用基础配置
NEXT_PUBLIC_APP_NAME=Aiofix SaaS Platform
NEXT_PUBLIC_APP_VERSION=1.0.0

# API配置
NEXT_PUBLIC_API_URL=http://localhost:4000/v1

# 开发环境配置
NODE_ENV=development
NEXT_PUBLIC_ENV=development

# 调试配置
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

#### 后端环境变量

在 `apps/api/` 目录下创建 `.env` 文件：

```bash
# 服务器配置
PORT=4000
HOST=0.0.0.0
API_VERSION=v1

# 数据库配置
DATABASE_URL=postgresql://username:password@localhost:5432/aiofix_db
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=aiofix_db
DATABASE_USER=username
DATABASE_PASSWORD=password

# Redis配置
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 日志配置
LOG_LEVEL=debug
LOG_PRETTY_PRINT=true

# 限流配置
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# CORS配置
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true
```

## 环境变量说明

### 前端环境变量

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `NEXT_PUBLIC_APP_NAME` | 应用名称 | Aiofix SaaS Platform | 否 |
| `NEXT_PUBLIC_APP_VERSION` | 应用版本 | 1.0.0 | 否 |
| `NEXT_PUBLIC_API_URL` | API基础URL | http://localhost:4000/v1 | 是 |
| `NODE_ENV` | Node.js环境 | development | 否 |
| `NEXT_PUBLIC_ENV` | 前端环境标识 | development | 否 |
| `NEXT_PUBLIC_DEBUG` | 调试模式 | true | 否 |
| `NEXT_PUBLIC_LOG_LEVEL` | 日志级别 | debug | 否 |

### 后端环境变量

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `PORT` | 服务器端口 | 4000 | 否 |
| `HOST` | 服务器主机 | 0.0.0.0 | 否 |
| `API_VERSION` | API版本 | v1 | 否 |
| `DATABASE_URL` | 数据库连接URL | - | 是 |
| `JWT_SECRET` | JWT签名密钥 | - | 是 |
| `LOG_LEVEL` | 日志级别 | debug | 否 |

## 环境特定配置

### 开发环境

```bash
NODE_ENV=development
LOG_LEVEL=debug
LOG_PRETTY_PRINT=true
NEXT_PUBLIC_DEBUG=true
```

### 测试环境

```bash
NODE_ENV=test
LOG_LEVEL=info
LOG_PRETTY_PRINT=false
NEXT_PUBLIC_DEBUG=false
```

### 生产环境

```bash
NODE_ENV=production
LOG_LEVEL=warn
LOG_PRETTY_PRINT=false
NEXT_PUBLIC_DEBUG=false
JWT_SECRET=your-production-secret-key
```

## 安全注意事项

1. **敏感信息保护**:
   - `.env.local` 和 `.env` 文件已被 `.gitignore` 忽略
   - 不要将敏感信息提交到版本控制
   - 生产环境使用环境变量或密钥管理服务

2. **JWT密钥**:
   - 开发环境可以使用简单密钥
   - 生产环境必须使用强密钥（至少32字符）
   - 定期更换密钥

3. **数据库密码**:
   - 使用强密码
   - 定期更换密码
   - 不同环境使用不同的数据库

4. **CORS配置**:
   - 开发环境允许本地域名
   - 生产环境只允许特定域名

## 验证配置

### 前端验证

```bash
cd apps/web
pnpm run dev
```

访问 http://localhost:3000 查看是否正常加载。

### 后端验证

```bash
cd apps/api
pnpm run start:dev
```

测试API端点：
```bash
curl http://localhost:4000/v1/hello
```

## 故障排除

### 常见问题

1. **环境变量未生效**:
   - 确保文件名正确（`.env.local` 或 `.env`）
   - 重启开发服务器
   - 检查文件权限

2. **API连接失败**:
   - 检查 `NEXT_PUBLIC_API_URL` 配置
   - 确保后端服务器正在运行
   - 检查CORS配置

3. **数据库连接失败**:
   - 检查数据库服务是否运行
   - 验证连接字符串格式
   - 确认数据库用户权限

### 调试技巧

1. **查看环境变量**:
   ```bash
   # 前端
   echo $NEXT_PUBLIC_API_URL
   
   # 后端
   echo $PORT
   ```

2. **检查配置文件**:
   ```bash
   # 查看前端配置
   cat apps/web/.env.local
   
   # 查看后端配置
   cat apps/api/.env
   ```

## 相关文档

- [前端环境变量配置](apps/web/ENV_SETUP.md)
- [后端环境变量配置](apps/api/ENV_SETUP.md)
- [API服务层文档](apps/web/src/services/README.md) 