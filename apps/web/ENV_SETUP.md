# 环境变量配置说明

## 概述

本项目使用环境变量来管理不同环境的配置。请根据您的环境创建相应的 `.env` 文件。

## 前端环境变量

### 创建 `.env.local` 文件

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

### 环境变量说明

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `NEXT_PUBLIC_APP_NAME` | 应用名称 | Aiofix SaaS Platform | 否 |
| `NEXT_PUBLIC_APP_VERSION` | 应用版本 | 1.0.0 | 否 |
| `NEXT_PUBLIC_API_URL` | API基础URL | http://localhost:4000/v1 | 是 |
| `NODE_ENV` | Node.js环境 | development | 否 |
| `NEXT_PUBLIC_ENV` | 前端环境标识 | development | 否 |
| `NEXT_PUBLIC_DEBUG` | 调试模式 | true | 否 |
| `NEXT_PUBLIC_LOG_LEVEL` | 日志级别 | debug | 否 |

## 后端环境变量

### 创建 `.env` 文件

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
```

### 环境变量说明

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `PORT` | 服务器端口 | 4000 | 否 |
| `HOST` | 服务器主机 | 0.0.0.0 | 否 |
| `API_VERSION` | API版本 | v1 | 否 |
| `DATABASE_URL` | 数据库连接URL | - | 是 |
| `JWT_SECRET` | JWT密钥 | - | 是 |
| `LOG_LEVEL` | 日志级别 | debug | 否 |

## 环境文件优先级

Next.js 按以下优先级加载环境变量：

1. `.env.local` (最高优先级)
2. `.env.development` (开发环境)
3. `.env` (通用)

## 安全注意事项

1. **不要提交敏感信息**: `.env.local` 文件已被 `.gitignore` 忽略
2. **生产环境**: 使用环境变量或密钥管理服务
3. **JWT密钥**: 生产环境必须使用强密钥
4. **数据库密码**: 使用强密码并定期更换

## 快速设置

### 开发环境

```bash
# 前端
cd apps/web
cp .env.example .env.local  # 如果存在示例文件
# 编辑 .env.local 文件

# 后端
cd apps/api
# 创建 .env 文件并配置
```

### 生产环境

```bash
# 设置生产环境变量
export NODE_ENV=production
export NEXT_PUBLIC_API_URL=https://api.aiofix.com/v1
export JWT_SECRET=your-production-secret
# ... 其他生产环境变量
``` 