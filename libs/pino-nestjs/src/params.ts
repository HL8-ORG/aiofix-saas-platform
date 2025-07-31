import {
  MiddlewareConfigProxy,
  ModuleMetadata,
} from '@nestjs/common/interfaces'
import { DestinationStream, Logger } from 'pino'
import { Options } from 'pino-http'

/**
 * @typedef PassedLogger
 * @description
 * 用于标识已传入的Pino Logger实例的类型定义。
 * 
 * 原理与机制：
 * - 当外部已创建好Logger实例并希望直接注入时，可通过该类型进行类型守卫和参数传递。
 */
export type PassedLogger = { logger: Logger }

/**
 * @interface Params
 * @description
 * 日志模块的核心配置参数接口，支持灵活定制Pino日志中间件的行为。
 * 
 * 原理与机制：
 * 1. pinoHttp：用于配置pino-http中间件，支持传入Options、DestinationStream或二者组合，决定日志格式、输出流等。
 * 2. exclude/forRoutes：用于控制哪些路由应用或排除日志中间件，底层依赖NestJS的MiddlewareConfigProxy机制，实现路由级别的日志采集控制。
 * 3. useExisting：适配Fastify场景，允许跳过pino配置，直接复用已在FastifyAdapter中配置的logger，避免重复初始化。
 * 4. renameContext：自定义日志输出中的context字段名，便于与业务日志结构对齐。
 * 5. assignResponse：控制PinoLogger.assign方法是否同时影响响应日志，提升日志链路一致性。
 */
export interface Params {
  /**
   * @property pinoHttp
   * @description
   * pino-http中间件的可选配置参数。支持直接传入pino-http的Options、日志输出流DestinationStream，或二者的元组组合。
   * 通过该参数可灵活定制日志格式、输出目标、序列化等行为。
   * @see https://github.com/pinojs/pino-http#pinohttpopts-stream
   */
  pinoHttp?: Options | DestinationStream | [Options, DestinationStream]

  /**
   * @property exclude
   * @description
   * 路由排除参数，类型与NestJS内置MiddlewareConfigProxy['exclude']一致。
   * 用于指定哪些路由不应用日志中间件，常用于关闭部分接口的自动请求/响应日志采集。
   * 若仅需关闭自动日志但保留请求上下文，可结合pinoHttp.autoLogging字段使用。
   * @see https://docs.nestjs.com/middleware#applying-middleware
   */
  exclude?: Parameters<MiddlewareConfigProxy['exclude']>

  /**
   * @property forRoutes
   * @description
   * 路由应用参数，类型与NestJS内置MiddlewareConfigProxy['forRoutes']一致。
   * 用于指定哪些路由应用日志中间件，支持精细化控制日志采集范围。
   * 若仅需关闭自动日志但保留请求上下文，可结合pinoHttp.autoLogging字段使用。
   * @see https://docs.nestjs.com/middleware#applying-middleware
   */
  forRoutes?: Parameters<MiddlewareConfigProxy['forRoutes']>

  /**
   * @property useExisting
   * @description
   * 跳过pino配置的可选参数。适用于已在FastifyAdapter中配置logger的场景，避免重复初始化。
   * 详见FAQ文档说明。
   * @see https://github.com/yamcodes/pino-nestjs#faq
   */
  useExisting?: true

  /**
   * @property renameContext
   * @description
   * 自定义日志输出中的context字段名。默认输出为"level":30, ... "context":"AppController"，
   * 通过该参数可将context字段重命名为其他业务字段，便于日志聚合与分析。
   */
  renameContext?: string

  /**
   * @property assignResponse
   * @description
   * 控制PinoLogger.assign方法是否同时影响响应日志（如"Request completed"等）。
   * 默认情况下，assign仅影响主日志，不影响响应日志。开启后可实现日志链路的全局属性注入。
   */
  assignResponse?: boolean
}

/**
 * @interface LoggerModuleAsyncParams
 * @description
 * 日志模块异步注册参数接口，支持依赖其他模块（如ConfigModule）动态加载日志配置。
 * 
 * 原理与机制：
 * 1. 通过useFactory工厂函数异步生成Params配置，支持Promise返回。
 * 2. inject数组指定依赖注入的Provider，实现配置解耦与灵活扩展。
 * 3. 兼容nestjs@8及以上版本，避免因useFactory返回类型不一致导致的类型兼容性问题。
 */
export interface LoggerModuleAsyncParams
  extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  /**
   * @method useFactory
   * @description
   * 工厂函数，用于异步生成日志模块的Params配置。支持依赖注入和Promise异步返回。
   */
  useFactory: (...args: any[]) => Params | Promise<Params>
  /**
   * @property inject
   * @description
   * 依赖注入的Provider数组，决定useFactory的参数来源。
   */
  inject?: any[]
}

/**
 * @function isPassedLogger
 * @description
 * 类型守卫函数，用于判断传入的pinoHttpProp是否为PassedLogger类型（即是否已包含logger实例）。
 * 
 * 原理与机制：
 * - 通过判断对象是否存在且包含'logger'属性，确定其为PassedLogger类型。
 * - 常用于动态类型判断和参数分支处理。
 * @param pinoHttpProp 任意类型的pinoHttp参数
 * @returns 是否为PassedLogger类型
 */
export function isPassedLogger(
  pinoHttpProp: any,
): pinoHttpProp is PassedLogger {
  return !!pinoHttpProp && 'logger' in pinoHttpProp
}

/**
 * @constant PARAMS_PROVIDER_TOKEN
 * @description
 * 日志模块全局Params配置的Provider Token，用于依赖注入和Provider注册。
 * 
 * 原理与机制：
 * - 通过唯一字符串标识，保证全局Params配置在NestJS依赖注入体系中的唯一性和可复用性。
 */
export const PARAMS_PROVIDER_TOKEN = 'pino-params'
