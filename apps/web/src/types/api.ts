/**
 * @file api.ts
 * @description
 * API相关的类型定义，提供统一的类型安全支持。
 * 
 * 主要原理与机制如下：
 * 1. 定义标准的API响应格式，确保前后端数据一致性。
 * 2. 为不同的API端点定义专门的响应类型。
 * 3. 提供错误类型定义，便于错误处理和调试。
 * 4. 支持泛型和联合类型，提升类型系统的灵活性。
 */

/**
 * @interface BaseApiResponse
 * @description
 * 基础API响应接口，定义所有API响应的通用结构。
 */
export interface BaseApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * @interface ApiResponse
 * @description
 * 泛型API响应接口，支持不同类型的响应数据。
 */
export interface ApiResponse<T = any> extends BaseApiResponse {
  data?: T;
}

/**
 * @interface HelloResponse
 * @description
 * Hello API的响应类型定义。
 */
export interface HelloResponse {
  message: string;
  timestamp?: string;
}

/**
 * @interface ApiError
 * @description
 * API错误信息类型定义。
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

/**
 * @interface ApiRequestOptions
 * @description
 * API请求选项类型定义。
 */
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retry?: number;
}

/**
 * @type ApiEndpoints
 * @description
 * API端点类型定义，便于类型安全的端点管理。
 */
export type ApiEndpoints =
  | '/hello'
  | '/users'
  | '/auth'
  | '/health';

/**
 * @interface PaginationParams
 * @description
 * 分页参数类型定义。
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * @interface SearchParams
 * @description
 * 搜索参数类型定义。
 */
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  pagination?: PaginationParams;
} 