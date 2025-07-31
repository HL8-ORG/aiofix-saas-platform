# API服务层架构说明

## 概述

本项目采用分层架构设计，将API调用逻辑从UI组件中剥离出来，实现关注点分离和代码复用。

## 架构层次

```
┌─────────────────┐
│   UI Components │  ← 页面组件，只负责UI渲染和用户交互
├─────────────────┤
│   Custom Hooks  │  ← 自定义Hook，管理API调用状态
├─────────────────┤
│  API Services   │  ← API服务层，封装所有API调用逻辑
├─────────────────┤
│   TypeScript    │  ← 类型定义，提供类型安全
└─────────────────┘
```

## 文件结构

```
src/
├── services/
│   └── api.ts          # API服务层，集中管理所有API调用
├── hooks/
│   └── useApi.ts       # 自定义Hook，管理API调用状态
├── types/
│   └── api.ts          # API相关类型定义
└── app/
    └── page.tsx        # 页面组件，使用API服务
```

## 核心特性

### 1. API服务层 (`services/api.ts`)

- **统一配置**: 集中管理API基础URL和请求配置
- **错误处理**: 统一的错误处理和响应格式
- **类型安全**: 使用TypeScript提供完整的类型支持
- **可扩展**: 易于添加新的API端点

```typescript
// 使用示例
import { getHello } from '../services/api';

const response = await getHello();
if (response.success) {
  console.log(response.data);
}
```

### 2. 自定义Hook (`hooks/useApi.ts`)

- **状态管理**: 自动管理loading、data、error状态
- **缓存优化**: 使用useCallback避免不必要的重新渲染
- **类型安全**: 支持泛型，提供完整的类型推导
- **重置功能**: 提供reset方法清空状态

```typescript
// 使用示例
const { data, loading, error, execute, reset } = useApi(getHello);

// 执行API调用
execute();

// 重置状态
reset();
```

### 3. 类型定义 (`types/api.ts`)

- **标准接口**: 定义统一的API响应格式
- **端点类型**: 类型安全的API端点管理
- **错误类型**: 完整的错误信息类型定义
- **扩展性**: 支持分页、搜索等复杂参数

## 使用指南

### 添加新的API端点

1. **在 `types/api.ts` 中定义响应类型**:
```typescript
export interface UserResponse {
  id: string;
  name: string;
  email: string;
}
```

2. **在 `services/api.ts` 中添加API方法**:
```typescript
export async function getUser(id: string): Promise<ApiResponse<UserResponse>> {
  return createApiRequest<UserResponse>(`/users/${id}`);
}
```

3. **在组件中使用**:
```typescript
const { data, loading, error, execute } = useApi(getUser);

// 调用时传入参数
execute('user-id');
```

### 环境配置

通过环境变量配置API基础URL:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/v1
```

## 最佳实践

1. **错误处理**: 始终检查API响应的success字段
2. **加载状态**: 在API调用期间显示loading状态
3. **类型安全**: 为所有API响应定义明确的类型
4. **代码复用**: 使用useApi Hook避免重复的状态管理代码
5. **测试友好**: 服务层易于进行单元测试

## 优势

- ✅ **关注点分离**: UI逻辑与API逻辑完全解耦
- ✅ **代码复用**: 多个组件可以共享相同的API调用逻辑
- ✅ **类型安全**: 完整的TypeScript类型支持
- ✅ **易于维护**: API变更时只需要修改服务层
- ✅ **易于测试**: 可以独立测试API逻辑
- ✅ **用户体验**: 统一的错误处理和加载状态 