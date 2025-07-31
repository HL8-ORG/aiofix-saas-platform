import { registerAs } from '@nestjs/config';
import { pinoDevConfig, pinoProdConfig } from './logger-options';

/**
 * @constant pinoLoggerConfig
 * @description
 * Pino 日志配置注册器，用于根据当前运行环境（开发或生产）动态选择并注册日志配置，供 NestJS 应用全局使用。
 *
 * 主要原理与机制如下：
 * 1. 通过 registerAs 工具函数，将日志配置注册到 NestJS 配置系统的 'pinoLogger' 命名空间下，便于后续依赖注入和集中管理。
 * 2. 根据 process.env.NODE_ENV 判断当前环境：
 *    - 若为 'development'，则返回开发环境专用的 pinoDevConfig，通常包含更详细的日志输出和调试信息。
 *    - 否则返回生产环境专用的 pinoProdConfig，通常更注重性能与安全，日志输出更为精简。
 * 3. 该配置最终会被注入到全局日志模块，驱动 pino-http 中间件，实现 HTTP 请求日志、请求ID追踪、日志序列化、日志输出流定制等功能。
 * 4. 通过环境区分，确保开发与生产环境下日志行为的差异化，既满足开发调试需求，也保障生产环境的性能与安全。
 */
const pinoLoggerConfig = registerAs('pinoLogger', () => {
  if (process.env.NODE_ENV === 'development') {
    return pinoDevConfig;
  }
  // TODO: 生产环境配置，目前只写了开发和生产环境的配置，继续配置更多的不同环境配置
  return pinoProdConfig;
});

export default pinoLoggerConfig;