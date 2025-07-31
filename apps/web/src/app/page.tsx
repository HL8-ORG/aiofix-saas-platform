'use client';

import { Button } from '@pkg/design-system/components/shadcn/button';
import { getHello } from '../services/api';
import { useApi } from '../hooks/useApi';

/**
 * @component Home
 * @description
 * 首页组件，提供用户交互界面，通过点击按钮获取后端API信息。
 * 
 * 主要原理与机制如下：
 * 1. 使用'use client'指令声明为客户端组件，支持React hooks和事件处理。
 * 2. 通过useApi自定义Hook管理API调用状态，包括loading、数据、错误状态。
 * 3. 使用getHello API服务方法，实现业务逻辑与UI组件的解耦。
 * 4. 响应式UI设计，在不同状态下显示相应的用户反馈。
 * 5. 提供reset功能，允许用户重新获取数据。
 */
export default function Home() {
  const { data, loading, error, execute, reset } = useApi<string>(getHello);

  /**
   * @function handleApiCall
   * @description
   * 处理API调用，使用统一的API服务层。
   * 
   * 主要原理与机制如下：
   * 1. 调用useApi Hook提供的execute方法，无需手动管理状态。
   * 2. 错误处理和加载状态由Hook统一管理。
   * 3. 代码更简洁，关注点分离更清晰。
   */
  const handleApiCall = () => {
    execute();
  };

  /**
   * @function handleReset
   * @description
   * 重置API调用状态，清空所有数据。
   */
  const handleReset = () => {
    reset();
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1>Hello World</h1>
      
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          <Button 
            onClick={handleApiCall} 
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? '获取中...' : '获取API信息'}
          </Button>
          
          {(data || error) && (
            <Button 
              onClick={handleReset}
              variant="outline"
              className="min-w-[80px]"
            >
              重置
            </Button>
          )}
        </div>
        
        {data && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">API响应:</p>
            <p className="text-green-700">{data}</p>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">错误信息:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
