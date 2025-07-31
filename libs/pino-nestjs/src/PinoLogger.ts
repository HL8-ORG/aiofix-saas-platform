import { Inject, Injectable, Scope } from '@nestjs/common'
import pino from 'pino'

import {
  PARAMS_PROVIDER_TOKEN,
  type Params,
  isPassedLogger,
} from './params'
import { storage } from './storage'

/**
 * @typedef PinoMethods
 * @description
 * 仅挑选pino.Logger的六个核心日志方法，用于PinoLogger的接口实现。
 */
type PinoMethods = Pick<
  pino.Logger,
  'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
>

/**
 * @typedef LoggerFn
 * @description
 * 这是对pino.LogFn的本地复制，允许方法重载，兼容如下两种调用方式：
 * 1. trace(msg: string, ...args: any[]): void;
 * 2. trace(obj: object, msg?: string, ...args: any[]): void;
 * 
 * 由于TypeScript的类型兼容性限制，直接使用pino.LogFn会导致重载不兼容，因此采用本地定义。
 */
type LoggerFn =
  | ((msg: string, ...args: any[]) => void)
  | ((obj: object, msg?: string, ...args: any[]) => void)

/**
 * @variable outOfContext
 * @description
 * 用于存储全局（非请求上下文）下的pino.Logger实例，保证在无请求作用域时也能正常记录日志。
 */
let outOfContext: pino.Logger | undefined

/**
 * @function __resetOutOfContextForTests
 * @description
 * 仅用于测试环境，重置全局Logger和root静态属性，确保测试隔离。
 */
export function __resetOutOfContextForTests() {
  outOfContext = undefined
  // @ts-ignore reset root for tests only
  PinoLogger.root = undefined
}

/**
 * @class PinoLogger
 * @implements PinoMethods
 * @description
 * PinoLogger是基于pino的NestJS日志服务实现，支持结构化日志、上下文注入、动态字段绑定等功能。
 * 
 * 原理与机制：
 * 1. 通过依赖注入获取日志配置参数（Params），支持多种pino初始化方式（配置对象、logger实例、流等）。
 * 2. 支持trace/debug/info/warn/error/fatal六种日志级别，均通过call方法统一处理，自动注入上下文。
 * 3. 支持setContext动态设置日志上下文（如模块名、请求ID等），并在每条日志中自动带上。
 * 4. assign方法可为当前请求作用域的logger动态绑定额外字段，实现链路追踪、用户信息注入等。
 * 5. logger属性优先从CLS存储中获取请求级logger，若无则回退到全局logger。
 * 6. 支持自定义errorKey和contextName，兼容不同日志字段规范。
 */
@Injectable({ scope: Scope.TRANSIENT })
export class PinoLogger implements PinoMethods {
  /**
   * @static
   * @readonly
   * @description
   * root为全局最顶层的pino.Logger实例，可用于运行时动态变更日志参数。
   * 仅在Params未设置useExisting时可访问。
   */
  static readonly root: pino.Logger

  /**
   * @property context
   * @description
   * 当前日志上下文（如模块名、请求ID等），会自动注入到每条日志中。
   */
  protected context = ''

  /**
   * @property contextName
   * @description
   * 上下文字段名，默认为'context'，可通过配置renameContext自定义。
   */
  protected readonly contextName: string

  /**
   * @property errorKey
   * @description
   * 错误对象在日志中的字段名，默认为'err'，可通过pinoHttp.customAttributeKeys.err自定义。
   */
  protected readonly errorKey: string = 'err'

  /**
   * @constructor
   * @param params 日志配置参数，包含pinoHttp配置和上下文字段名
   * @description
   * 构造函数根据不同的pinoHttp类型初始化全局logger（outOfContext），
   * 并设置上下文字段名和错误字段名。
   * 
   * 主要机制：
   * - 支持数组、已传入logger、带stream的对象、普通对象等多种pino初始化方式。
   * - 仅首次实例化时初始化outOfContext，后续实例复用。
   */
  constructor(
    @Inject(PARAMS_PROVIDER_TOKEN) { pinoHttp, renameContext }: Params,
  ) {
    // 动态设置错误字段名
    if (
      typeof pinoHttp === 'object' &&
      'customAttributeKeys' in pinoHttp &&
      typeof pinoHttp.customAttributeKeys !== 'undefined'
    ) {
      this.errorKey = pinoHttp.customAttributeKeys.err ?? 'err'
    }

    // 初始化全局logger（仅首次）
    if (!outOfContext) {
      if (Array.isArray(pinoHttp)) {
        outOfContext = pino(...pinoHttp)
      } else if (isPassedLogger(pinoHttp)) {
        outOfContext = pinoHttp.logger
      } else if (
        typeof pinoHttp === 'object' &&
        'stream' in pinoHttp &&
        typeof pinoHttp.stream !== 'undefined'
      ) {
        outOfContext = pino(pinoHttp, pinoHttp.stream)
      } else {
        outOfContext = pino(pinoHttp)
      }
    }

    // 设置上下文字段名
    this.contextName = renameContext || 'context'
  }

  /**
   * @getter logger
   * @description
   * 获取当前作用域下的pino.Logger实例。优先从CLS存储获取请求级logger，
   * 若无则回退到全局logger（outOfContext）。
   */
  get logger(): pino.Logger {
    // outOfContext在首次实例化时已初始化
    return storage.getStore()?.logger || outOfContext!
  }

  /**
   * @method trace
   * @description
   * 记录trace级别日志，支持对象和字符串两种重载。
   */
  trace(msg: string, ...args: any[]): void
  trace(obj: unknown, msg?: string, ...args: any[]): void
  trace(...args: Parameters<LoggerFn>) {
    this.call('trace', ...args)
  }

  /**
   * @method debug
   * @description
   * 记录debug级别日志，支持对象和字符串两种重载。
   */
  debug(msg: string, ...args: any[]): void
  debug(obj: unknown, msg?: string, ...args: any[]): void
  debug(...args: Parameters<LoggerFn>) {
    this.call('debug', ...args)
  }

  /**
   * @method info
   * @description
   * 记录info级别日志，支持对象和字符串两种重载。
   */
  info(msg: string, ...args: any[]): void
  info(obj: unknown, msg?: string, ...args: any[]): void
  info(...args: Parameters<LoggerFn>) {
    this.call('info', ...args)
  }

  /**
   * @method warn
   * @description
   * 记录warn级别日志，支持对象和字符串两种重载。
   */
  warn(msg: string, ...args: any[]): void
  warn(obj: unknown, msg?: string, ...args: any[]): void
  warn(...args: Parameters<LoggerFn>) {
    this.call('warn', ...args)
  }

  /**
   * @method error
   * @description
   * 记录error级别日志，支持对象和字符串两种重载。
   */
  error(msg: string, ...args: any[]): void
  error(obj: unknown, msg?: string, ...args: any[]): void
  error(...args: Parameters<LoggerFn>) {
    this.call('error', ...args)
  }

  /**
   * @method fatal
   * @description
   * 记录fatal级别日志，支持对象和字符串两种重载。
   */
  fatal(msg: string, ...args: any[]): void
  fatal(obj: unknown, msg?: string, ...args: any[]): void
  fatal(...args: Parameters<LoggerFn>) {
    this.call('fatal', ...args)
  }

  /**
   * @method setContext
   * @description
   * 设置当前logger的上下文（如模块名、请求ID等），后续日志会自动带上该上下文。
   * @param value 上下文字符串
   */
  setContext(value: string) {
    this.context = value
  }

  /**
   * @method assign
   * @description
   * 为当前请求作用域的logger动态绑定额外字段（如用户信息、链路ID等），
   * 并同步到responseLogger（如有）。
   * @param fields 需绑定的结构化字段
   * @throws 若不在请求作用域内调用则抛出异常
   */
  assign(fields: pino.Bindings) {
    const store = storage.getStore()
    if (!store) {
      throw new Error(
        `${PinoLogger.name}: unable to assign extra fields out of request scope`,
      )
    }
    store.logger = store.logger.child(fields)
    store.responseLogger?.setBindings(fields)
  }

  /**
   * @method call
   * @protected
   * @description
   * 日志核心处理方法，自动注入上下文、错误对象等结构化字段，并调用对应日志级别方法。
   * 
   * 主要机制：
   * 1. 若设置了context，则自动将context字段合并到日志对象中。
   * 2. 若第一个参数为Error对象，则以errorKey字段注入错误。
   * 3. 支持对象和字符串两种日志调用方式，自动适配参数结构。
   * 4. 最终调用pino的对应日志方法输出日志。
   * 
   * @param method 日志级别（trace/debug/info/warn/error/fatal）
   * @param args 日志参数
   */
  protected call(method: pino.Level, ...args: Parameters<LoggerFn>) {
    if (this.context) {
      if (isFirstArgObject(args)) {
        const firstArg = args[0]
        if (firstArg instanceof Error) {
          args = [
            Object.assign(
              { [this.contextName]: this.context },
              { [this.errorKey]: firstArg },
            ),
            ...args.slice(1),
          ]
        } else {
          args = [
            Object.assign({ [this.contextName]: this.context }, firstArg),
            ...args.slice(1),
          ]
        }
      } else {
        args = [{ [this.contextName]: this.context }, ...args]
      }
    }
    // @ts-ignore args为联合元组类型，类型检查忽略
    this.logger[method](...args)
  }
}

/**
 * @function isFirstArgObject
 * @description
 * 判断日志参数的第一个参数是否为对象类型，用于区分日志重载方式。
 * @param args 日志参数
 * @returns 是否第一个参数为对象
 */
function isFirstArgObject(
  args: Parameters<LoggerFn>,
): args is [obj: object, msg?: string, ...args: any[]] {
  return typeof args[0] === 'object'
}
