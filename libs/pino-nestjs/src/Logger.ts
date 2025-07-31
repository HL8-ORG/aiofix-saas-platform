import { Inject, Injectable, LoggerService } from '@nestjs/common'
import pino, { Level } from 'pino'
import { isObject, last } from 'radashi'

import { PinoLogger } from './PinoLogger'
import {
  PARAMS_PROVIDER_TOKEN,
  type Params,
} from './params'

/**
 * @function isInterpolated
 * @description
 * 判断给定的 message 字符串中是否包含可插值的占位符（如 %s、%d、%j、%o），
 * 并根据 objIndex 判断对象参数是否应被插入到 message 中。
 *
 * 原理与机制：
 * 1. 仅当 message 为字符串时才进行占位符匹配。
 * 2. 通过正则 /%[sdjo]/g 匹配所有合法的占位符，统计数量。
 * 3. 如果 objIndex 存在，则判断 objIndex 是否小于占位符数量，决定是否插值。
 * 4. 若无 objIndex，仅判断是否存在占位符。
 *
 * @param message 待检测的日志消息
 * @param objIndex 对象参数在可选参数中的索引，用于判断是否插值
 * @returns 是否需要将对象插入到 message 中
 */
function isInterpolated(message: unknown, objIndex: number) {
  if (typeof message !== 'string') {
    return false
  }

  // 匹配所有合法占位符（排除单独的 % 符号）
  const numPlaceholders = (message.match(/%[sdjo]/g) || []).length

  // 根据 objIndex 判断对象是否应被插值
  if (objIndex !== undefined) {
    return objIndex < numPlaceholders
  }

  return numPlaceholders > 0
}

/**
 * @class Logger
 * @implements LoggerService
 * @description
 * 基于 PinoLogger 封装的日志服务，兼容 NestJS LoggerService 接口，支持结构化日志、上下文注入、
 * 参数插值、异常处理等功能。
 *
 * 原理与机制：
 * 1. 通过依赖注入获取 PinoLogger 实例和日志参数配置（如上下文字段名）。
 * 2. 支持 trace/debug/info/warn/error/fatal 六种日志级别，分别映射到 PinoLogger。
 * 3. 核心日志处理逻辑在 call 方法中，自动识别 message 类型（Error、对象、字符串等），
 *    并根据参数类型决定插值、合并或特殊处理（如异常栈）。
 * 4. 自动提取上下文参数（最后一个参数），并合并到日志对象中，便于追踪请求上下文。
 * 5. 兼容 NestJS 内部异常处理器的特殊调用方式，自动修正日志格式。
 */
@Injectable()
export class Logger implements LoggerService {
  /**
   * @property contextName
   * @description 日志上下文字段名，默认 'context'，可通过参数重命名
   */
  private readonly contextName: string

  /**
   * @constructor
   * @param logger PinoLogger 实例
   * @param renameContext 日志上下文字段名配置
   */
  constructor(
    protected readonly logger: PinoLogger,
    @Inject(PARAMS_PROVIDER_TOKEN) { renameContext }: Params,
  ) {
    this.contextName = renameContext || 'context'
  }

  /**
   * @method verbose
   * @description 记录 trace 级别日志（NestJS 语义为 verbose）
   */
  verbose(message: unknown, ...optionalParams: unknown[]) {
    this.call('trace', message, ...optionalParams)
  }

  /**
   * @method debug
   * @description 记录 debug 级别日志
   */
  debug(message: unknown, ...optionalParams: unknown[]) {
    this.call('debug', message, ...optionalParams)
  }

  /**
   * @method log
   * @description 记录 info 级别日志（NestJS 语义为 log）
   */
  log(message: unknown, ...optionalParams: unknown[]) {
    this.call('info', message, ...optionalParams)
  }

  /**
   * @method warn
   * @description 记录 warn 级别日志
   */
  warn(message: unknown, ...optionalParams: unknown[]) {
    this.call('warn', message, ...optionalParams)
  }

  /**
   * @method error
   * @description 记录 error 级别日志
   */
  error(message: unknown, ...optionalParams: unknown[]) {
    this.call('error', message, ...optionalParams)
  }

  /**
   * @method fatal
   * @description 记录 fatal 级别日志
   */
  fatal(message: unknown, ...optionalParams: unknown[]) {
    this.call('fatal', message, ...optionalParams)
  }

  /**
   * @method call
   * @description
   * 核心日志处理方法，根据不同的 message 类型和参数格式，自动分流到合适的日志输出方式。
   *
   * 主要机制与流程：
   * 1. 提取可选参数中的上下文（最后一个参数），并合并到日志对象 mergingObject。
   * 2. 判断可选参数中是否存在对象参数，且该对象是否需要插值（isInterpolated）。
   *    - 若不需要插值，则将对象参数合并到 mergingObject，其余参数用于插值。
   *    - 否则，所有参数用于插值。
   * 3. 针对不同 message 类型采用不同处理分支（守卫子句）：
   *    - Error 实例：自动提取 message 和堆栈，合并到 err 字段。
   *    - NestJS 内部异常处理器特殊调用：自动修正为 Error 对象并合并堆栈。
   *    - 普通对象：合并到 mergingObject 并输出结构化日志。
   *    - 字符串/原始类型：直接作为 message 输出，支持参数插值。
   *
   * @param level 日志级别
   * @param message 日志消息（可为字符串、对象、Error 等）
   * @param optionalParams 额外参数（可包含插值参数、对象、上下文等）
   */
  private call(level: Level, message: unknown, ...optionalParams: unknown[]) {
    // mergingObject 用于收集上下文和合并对象参数
    const mergingObject: Record<string, unknown> = {}

    // 1. 提取上下文参数（最后一个参数），如存在则合并到 mergingObject
    let optionalParamsWithoutContext: unknown[] = []
    const contextOrUndefined = last(optionalParams)
    if (contextOrUndefined !== undefined) {
      const context = contextOrUndefined
      mergingObject[this.contextName] = context
      optionalParamsWithoutContext = optionalParams.slice(0, -1)
    }

    // 2. 判断是否存在对象参数需要合并，还是全部用于插值
    let interpolationValues: unknown[] = []
    const maybeMergingObject = last(optionalParamsWithoutContext)
    if (
      isObject(maybeMergingObject) &&
      !isInterpolated(message, optionalParamsWithoutContext.length - 1)
    ) {
      // 若最后一个参数为对象且不需要插值，则合并到 mergingObject
      interpolationValues = optionalParamsWithoutContext.slice(0, -1)
      Object.assign(mergingObject, maybeMergingObject)
    } else {
      // 否则全部参数用于插值
      interpolationValues = optionalParamsWithoutContext
    }

    // 3. 守卫子句：处理 Error 实例
    if (message instanceof Error) {
      mergingObject.err = message
      this.logger[level](
        mergingObject,
        message.message || 'Error',
        ...interpolationValues,
      )
      return
    }

    // 4. 守卫子句：兼容 NestJS 内部异常处理器特殊调用
    if (
      this.isWrongExceptionsHandlerContract(
        level,
        message,
        optionalParamsWithoutContext,
      )
    ) {
      const err = new Error(message as string)
      err.stack = optionalParamsWithoutContext[0]
      mergingObject.err = err
      this.logger[level](mergingObject)
      return
    }

    // 5. 守卫子句：处理普通对象（非 Error）
    if (typeof message === 'object') {
      this.logger[level](
        { ...mergingObject, ...message },
        undefined,
        ...interpolationValues,
      )
      return
    }

    // 6. 默认分支：处理字符串/原始类型消息
    this.logger[level](mergingObject, String(message), ...interpolationValues)
  }

  /**
   * @method isWrongExceptionsHandlerContract
   * @description
   * 检测是否为 NestJS 内置异常处理器（如 ExceptionsHandler、ExceptionHandler、WsExceptionsHandler、RpcExceptionsHandler）
   * 调用 .error 方法时采用的特殊参数格式（message 为字符串，params[0] 为堆栈字符串）。
   *
   * 原理与机制：
   * 1. 仅在 level 为 'error' 时生效。
   * 2. message 必须为字符串，params 仅有一个元素且为字符串，且内容包含堆栈格式（\n at ...）。
   * 3. 用于自动修正日志格式，避免异常日志丢失堆栈信息。
   *
   * @param level 日志级别
   * @param message 日志消息
   * @param params 可选参数数组
   * @returns 是否为异常处理器的特殊调用格式
   */
  private isWrongExceptionsHandlerContract(
    level: Level,
    message: unknown,
    params: unknown[],
  ): params is [string] {
    return (
      level === 'error' &&
      typeof message === 'string' &&
      params.length === 1 &&
      typeof params[0] === 'string' &&
      /\n\s*at /.test(params[0])
    )
  }
}
