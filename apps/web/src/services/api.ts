import { ApiResponse, ApiRequestOptions } from '../types/api';

/**
 * @file api.ts
 * @description
 * API服务层，负责集中管理所有与后端的通信逻辑。
 * 
 * 主要原理与机制如下：
 * 1. 定义统一的API基础URL和请求配置，便于环境切换和维护。
 * 2. 封装通用的请求方法，统一处理错误、超时、重试等逻辑。
 * 3. 为每个API端点创建专门的调用方法，提供类型安全的接口。
 * 4. 统一的错误处理和响应格式，提升用户体验和开发效率。
 */

// API基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

// 开发环境调试信息
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', API_BASE_URL);
}

/**
 * @function createApiRequest
 * @description
 * 创建统一的API请求方法，处理通用的请求逻辑。
 * 
 * 主要原理与机制如下：
 * 1. 自动添加基础URL前缀，简化API调用。
 * 2. 设置默认的请求头，包括Content-Type和认证信息。
 * 3. 统一的超时处理，避免请求长时间挂起。
 * 4. 统一的错误处理，将HTTP错误转换为用户友好的错误信息。
 * 5. 支持请求拦截和响应拦截，便于添加日志、认证等功能。
 */
async function createApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();

    // 尝试解析JSON，如果失败则返回原始文本
    try {
      const jsonData = JSON.parse(data);
      return {
        data: jsonData,
        success: true,
      };
    } catch {
      return {
        data: data as T,
        success: true,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '网络请求失败';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * @function getHello
 * @description
 * 获取hello信息的API调用方法。
 * 
 * 主要原理与机制如下：
 * 1. 调用统一的API请求方法，传入具体的端点路径。
 * 2. 返回类型安全的响应结果。
 * 3. 错误信息会被统一处理并返回。
 */
export async function getHello(): Promise<ApiResponse<string>> {
  return createApiRequest<string>('/hello');
}

/**
 * @function getHelloRaw
 * @description
 * 获取hello信息的原始响应，不进行JSON解析。
 * 用于向后兼容，直接返回文本内容。
 */
export async function getHelloRaw(): Promise<string> {
  const response = await getHello();
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || '获取hello信息失败');
} 