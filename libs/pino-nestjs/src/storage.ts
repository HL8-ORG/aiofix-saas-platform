import { AsyncLocalStorage } from 'async_hooks'
import { Logger } from 'pino'

/**
 * @class Store
 * @description
 * Store类用于封装每个请求作用域下的日志实例，支持主日志（logger）和可选的响应日志（responseLogger）。
 * 
 * 原理与机制：
 * 1. logger：主日志实例，负责记录当前请求上下文中的所有日志信息。
 * 2. responseLogger：可选的响应日志实例，通常用于记录响应相关的日志（如响应体、耗时等），便于与主日志分离。
 * 3. 该类作为AsyncLocalStorage的存储对象，实现请求级别的日志隔离，保证每个请求拥有独立的日志上下文。
 */
export class Store {
  constructor(
    public logger: Logger,
    public responseLogger?: Logger,
  ) {}
}

/**
 * @variable storage
 * @description
 * 基于Node.js的AsyncLocalStorage实现的请求级别存储，用于在异步调用链中安全地存取Store实例。
 * 
 * 原理与机制：
 * 1. AsyncLocalStorage<Store>为每个HTTP请求创建独立的存储空间，避免多请求间的日志上下文污染。
 * 2. 在NestJS中间件或拦截器中初始化Store实例后，后续所有异步操作均可通过storage.getStore()获取当前请求的日志实例。
 * 3. 结合PinoLogger实现日志的自动注入与链路追踪，提升日志的结构化和可追溯性。
 */
export const storage = new AsyncLocalStorage<Store>()
