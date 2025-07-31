import { useState, useCallback } from 'react';
import { ApiResponse } from '../types/api';

/**
 * @interface UseApiState
 * @description
 * useApi Hook的状态接口，定义API调用的各种状态。
 */
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * @interface UseApiReturn
 * @description
 * useApi Hook的返回值接口，包含状态和执行函数。
 */
export interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

/**
 * @function useApi
 * @description
 * 自定义Hook，用于管理API调用的状态和逻辑。
 * 
 * 主要原理与机制如下：
 * 1. 使用useState管理API调用的状态（数据、加载、错误）。
 * 2. 使用useCallback缓存执行函数，避免不必要的重新渲染。
 * 3. 提供reset方法用于重置状态，便于重新开始API调用。
 * 4. 统一的错误处理和加载状态管理，提升用户体验。
 * 5. 支持泛型，提供类型安全的API调用体验。
 * 
 * @param apiFunction - 要执行的API函数
 * @returns 包含状态和执行方法的对象
 */
export function useApi<T = string>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * @function execute
   * @description
   * 执行API调用的方法，管理整个调用生命周期。
   * 
   * 主要原理与机制如下：
   * 1. 设置loading状态为true，清空之前的错误和数据。
   * 2. 调用传入的API函数，传入所有参数。
   * 3. 根据API响应结果更新状态：
   *    - 成功：设置data，清空error
   *    - 失败：设置error，清空data
   * 4. 最后重置loading状态。
   * 5. 使用try-catch确保即使API函数抛出异常也能正确处理。
   */
  const execute = useCallback(
    async (...args: any[]) => {
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const response = await apiFunction(...args);

        if (response.success) {
          setState({
            data: response.data || null,
            loading: false,
            error: null,
          });
        } else {
          setState({
            data: null,
            loading: false,
            error: response.error || '请求失败',
          });
        }
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : '未知错误',
        });
      }
    },
    [apiFunction]
  );

  /**
   * @function reset
   * @description
   * 重置API调用状态的方法。
   * 
   * 主要原理与机制如下：
   * 1. 清空所有状态数据，回到初始状态。
   * 2. 便于用户重新开始API调用。
   * 3. 在组件卸载或需要重新开始时调用。
   */
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
} 