import { Inject, Provider } from '@nestjs/common'
import { PinoLogger } from './PinoLogger'

/**
 * @constant decoratedTokenPrefix
 * @description
 * 注入PinoLogger时的Token前缀，用于区分不同context下的Logger实例。
 * 
 * 原理与机制：
 * - 每个context（日志上下文）都会生成唯一的Provider Token，格式为'PinoLogger:context'
 * - 便于在依赖注入时按需获取带有特定上下文的PinoLogger实例，实现日志分组与溯源
 */
const decoratedTokenPrefix = 'PinoLogger:'

/**
 * @variable decoratedLoggers
 * @description
 * 已装饰的Logger上下文集合，记录所有通过@InjectPinoLogger注册过的context。
 * 
 * 原理与机制：
 * - 使用Set<string>保证context唯一性，避免重复注册Provider
 * - 后续通过createProvidersForDecorated批量生成所有已装饰Logger的Provider
 */
const decoratedLoggers = new Set<string>()

/**
 * @function InjectPinoLogger
 * @description
 * PinoLogger依赖注入装饰器工厂，支持按context注入带上下文的Logger实例。
 * 
 * 原理与机制：
 * 1. 调用时将context加入decoratedLoggers集合，便于后续批量注册Provider
 * 2. 返回NestJS的@Inject装饰器，注入特定context的Logger Provider
 * 3. 支持无参（默认context=''）和自定义context两种用法，实现日志分组
 * 
 * @param context 日志上下文字符串，默认为空字符串
 * @returns ParameterDecorator NestJS参数装饰器
 * 
 * @example
 * ```ts
 * constructor(@InjectPinoLogger('UserService') private readonly logger: PinoLogger) {}
 * ```
 */
export function InjectPinoLogger(context = '') {
  decoratedLoggers.add(context)
  return Inject(getLoggerToken(context))
}

/**
 * @function createDecoratedLoggerProvider
 * @description
 * 为指定context创建PinoLogger的Provider，支持依赖注入。
 * 
 * 原理与机制：
 * 1. Provider的provide字段为唯一Token（含context）
 * 2. useFactory注入全局PinoLogger实例，并设置context后返回
 * 3. inject依赖全局PinoLogger，保证上下文隔离但共享底层实现
 * 
 * @param context 日志上下文字符串
 * @returns Provider<PinoLogger> NestJS Provider对象
 */
function createDecoratedLoggerProvider(context: string): Provider<PinoLogger> {
  return {
    provide: getLoggerToken(context),
    useFactory: (logger: PinoLogger) => {
      logger.setContext(context)
      return logger
    },
    inject: [PinoLogger],
  }
}

/**
 * @function createProvidersForDecorated
 * @description
 * 批量生成所有已装饰Logger上下文的Provider数组，便于在Module中注册。
 * 
 * 原理与机制：
 * - 遍历decoratedLoggers集合，为每个context生成独立Provider
 * - 解决多处@InjectPinoLogger使用时Provider自动注册问题
 * 
 * @returns Array<Provider<PinoLogger>> Provider数组
 */
export function createProvidersForDecorated(): Array<Provider<PinoLogger>> {
  return [...decoratedLoggers.values()].map(createDecoratedLoggerProvider)
}

/**
 * @function getLoggerToken
 * @description
 * 根据context生成唯一的Logger Provider Token。
 * 
 * 原理与机制：
 * - 拼接decoratedTokenPrefix与context，保证Token全局唯一
 * - 用于依赖注入时区分不同上下文的Logger实例
 * 
 * @param context 日志上下文字符串
 * @returns string 唯一Provider Token
 */
export function getLoggerToken(context: string): string {
  return `${decoratedTokenPrefix}${context}`
}
