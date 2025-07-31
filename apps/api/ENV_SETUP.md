# 后端API环境变量配置

## 概述

后端API使用环境变量来管理配置，支持开发、测试和生产环境。

## 环境变量配置

### 创建 `.env` 文件

在 `apps/api/` 目录下创建 `.env` 文件：

```bash
# ========================================
# 服务器配置
# ========================================
PORT=4000
HOST=0.0.0.0
API_VERSION=v1

# ========================================
# 数据库配置
# ========================================
DATABASE_URL=postgresql://username:password@localhost:5432/aiofix_db
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=aiofix_db
DATABASE_USER=username
DATABASE_PASSWORD=password

# ========================================
# Redis配置
# ========================================
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# ========================================
# JWT认证配置
# ========================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ========================================
# 日志配置
# ========================================
LOG_LEVEL=debug
LOG_PRETTY_PRINT=true

# ========================================
# 限流配置
# ========================================
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# ========================================
# CORS配置
# ========================================
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true
```

## 环境变量说明

### 服务器配置

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `PORT` | 服务器端口 | 4000 | 否 |
| `HOST` | 服务器主机 | 0.0.0.0 | 否 |
| `API_VERSION` | API版本 | v1 | 否 |

### 数据库配置

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `DATABASE_URL` | 数据库连接URL | - | 是 |
| `DATABASE_HOST` | 数据库主机 | localhost | 否 |
| `DATABASE_PORT` | 数据库端口 | 5432 | 否 |
| `DATABASE_NAME` | 数据库名称 | aiofix_db | 否 |
| `DATABASE_USER` | 数据库用户 | - | 否 |
| `DATABASE_PASSWORD` | 数据库密码 | - | 否 |

### JWT配置

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `JWT_SECRET` | JWT签名密钥 | - | 是 |
| `JWT_EXPIRES_IN` | JWT过期时间 | 7d | 否 |
| `JWT_REFRESH_EXPIRES_IN` | 刷新令牌过期时间 | 30d | 否 |

### 日志配置

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `LOG_LEVEL` | 日志级别 | debug | 否 |
| `LOG_PRETTY_PRINT` | 美化日志输出 | true | 否 |

### 限流配置

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `THROTTLE_TTL` | 限流时间窗口(秒) | 60 | 否 |
| `THROTTLE_LIMIT` | 限流请求数量 | 100 | 否 |

## 环境特定配置

### 开发环境

```bash
NODE_ENV=development
LOG_LEVEL=debug
LOG_PRETTY_PRINT=true
```

### 测试环境

```bash
NODE_ENV=test
LOG_LEVEL=info
LOG_PRETTY_PRINT=false
```

### 生产环境

```bash
NODE_ENV=production
LOG_LEVEL=warn
LOG_PRETTY_PRINT=false
JWT_SECRET=your-production-secret-key
```

## 安全注意事项

1. **JWT密钥**: 生产环境必须使用强密钥，至少32字符
2. **数据库密码**: 使用强密码，定期更换
3. **环境变量**: 不要将敏感信息提交到版本控制
4. **CORS配置**: 生产环境只允许特定域名访问

## 快速设置

### 开发环境

```bash
cd apps/api
# 创建 .env 文件
echo "PORT=4000" > .env
echo "JWT_SECRET=dev-secret-key" >> .env
echo "DATABASE_URL=postgresql://user:pass@localhost:5432/aiofix_dev" >> .env
```

### 生产环境

```bash
# 使用环境变量或密钥管理服务
export NODE_ENV=production
export JWT_SECRET=your-production-secret
export DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/prod_db
```

## 验证配置

启动服务器后，可以通过以下方式验证配置：

```bash
# 检查服务器是否正常启动
curl http://localhost:4000/v1/hello

# 查看日志输出
tail -f logs/app.log
``` 