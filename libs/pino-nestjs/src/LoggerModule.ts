import { IncomingMessage, ServerResponse } from 'node:http'

import {
  DynamicModule,
  Global,
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common'
import { Provider } from '@nestjs/common/interfaces'
import { pinoHttp } from 'pino-http'

import { createProvidersForDecorated } from './InjectPinoLogger'
import { Logger } from './Logger'
import { PinoLogger } from './PinoLogger'
import {
  LoggerModuleAsyncParams,
  PARAMS_PROVIDER_TOKEN,
  type Params,
} from './params'
import { Store, storage } from './storage'

/**
 * @constant DEFAULT_ROUTES
 * @description
 * 默认路由配置，适配NestJS@11及Express@4的通配符路由写法，保证向后兼容。
 * 
 * 原理与机制：
 * - path: '*' 表示匹配所有路由
 * - method: RequestMethod.ALL 表示匹配所有HTTP方法
 * - 未来可根据NestJS新版本升级为更现代的路由匹配方式
 */
const DEFAULT_ROUTES = [{ path: '*', method: RequestMethod.ALL }]

/**
 * @module LoggerModule
 * @description
 * 全局日志模块，基于Pino集成，支持同步/异步配置、请求级日志上下文隔离、自动注入等功能。
 * 
 * 原理与机制：
 * 1. 通过@Global()装饰器声明为全局模块，所有模块可直接注入Logger。
 * 2. forRoot静态方法支持同步配置，forRootAsync支持异步配置（如依赖ConfigModule）。
 * 3. 自动注册Logger、PinoLogger及自定义装饰器相关Provider，便于依赖注入。
 * 4. 通过NestModule的configure方法，自动为指定路由注册Pino日志中间件，实现请求日志采集与上下文隔离。
 * 5. 支持exclude、forRoutes、pinoHttp、useExisting、assignResponse等参数灵活定制日志行为。
 */
@Global()
@Module({ providers: [Logger], exports: [Logger] })
export class LoggerModule implements NestModule {
  /**
   * @method forRoot
   * @description
   * 同步注册日志模块，支持直接传入Params参数。
   * 
   * 原理与机制：
   * - 创建Params Provider，注入全局配置
   * - 自动注册Logger、PinoLogger及装饰器Provider
   * - 返回DynamicModule，便于在AppModule中导入
   */
  static forRoot(params?: Params | undefined): DynamicModule {
    const paramsProvider: Provider<Params> = {
      provide: PARAMS_PROVIDER_TOKEN,
      useValue: params || {},
    }

    const decorated = createProvidersForDecorated()

    return {
      module: LoggerModule,
      providers: [Logger, ...decorated, PinoLogger, paramsProvider],
      exports: [Logger, ...decorated, PinoLogger, paramsProvider],
    }
  }

  /**
   * @method forRootAsync
   * @description
   * 异步注册日志模块，支持依赖其他模块（如ConfigModule）动态加载配置。
   * 
   * 原理与机制：
   * - 通过useFactory和inject实现依赖注入
   * - 支持额外自定义Provider注入
   * - 返回DynamicModule，便于在AppModule中导入
   */
  static forRootAsync(params: LoggerModuleAsyncParams): DynamicModule {
    const paramsProvider: Provider<Params | Promise<Params>> = {
      provide: PARAMS_PROVIDER_TOKEN,
      useFactory: params.useFactory,
      inject: params.inject,
    }

    const decorated = createProvidersForDecorated()

    const providers: any[] = [
      Logger,
      ...decorated,
      PinoLogger,
      paramsProvider,
      ...(params.providers || []),
    ]

    return {
      module: LoggerModule,
      imports: params.imports,
      providers,
      exports: [Logger, ...decorated, PinoLogger, paramsProvider],
    }
  }

  /**
   * @constructor
   * @param params 日志模块配置参数，通过依赖注入获取
   */
  constructor(@Inject(PARAMS_PROVIDER_TOKEN) private readonly params: Params) {}

  /**
   * @method configure
   * @description
   * 配置中间件，将Pino日志中间件自动挂载到指定路由，实现请求级日志采集与上下文隔离。
   * 
   * 原理与机制：
   * 1. 解析exclude、forRoutes、pinoHttp、useExisting、assignResponse等参数
   * 2. 通过createLoggerMiddlewares生成日志中间件数组
   * 3. 根据exclude参数决定是否排除部分路由
   * 4. 通过consumer.apply注册中间件到指定路由
   */
  configure(consumer: MiddlewareConsumer) {
    const {
      exclude,
      forRoutes = DEFAULT_ROUTES,
      pinoHttp,
      useExisting,
      assignResponse,
    } = this.params

    const middlewares = createLoggerMiddlewares(
      pinoHttp || {},
      useExisting,
      assignResponse,
    )

    if (exclude) {
      consumer
        .apply(...middlewares)
        .exclude(...exclude)
        .forRoutes(...forRoutes)
    } else {
      consumer.apply(...middlewares).forRoutes(...forRoutes)
    }
  }
}

/**
 * @function createLoggerMiddlewares
 * @description
 * 创建Pino日志中间件数组，支持复用已有日志实例或新建日志实例，并自动绑定请求上下文。
 * 
 * 原理与机制：
 * 1. useExisting为true时，仅绑定已有日志实例到上下文
 * 2. 否则，创建新的pinoHttp中间件，并将PinoLogger.root指向主logger实例
 * 3. 始终追加bindLoggerMiddlewareFactory，确保日志上下文隔离
 * 4. 返回中间件数组，供NestJS中间件系统注册
 * 
 * @param params pinoHttp配置参数
 * @param useExisting 是否复用已有日志实例
 * @param assignResponse 是否将日志实例绑定到响应对象
 */
function createLoggerMiddlewares(
  params: NonNullable<Params['pinoHttp']>,
  useExisting = false,
  assignResponse = false,
) {
  if (useExisting) {
    return [bindLoggerMiddlewareFactory(useExisting, assignResponse)]
  }

  const middleware = pinoHttp(
    ...(Array.isArray(params) ? params : [params as any]),
  )

  // @ts-expect-error: root为只读字段，此处为实际赋值点
  PinoLogger.root = middleware.logger

  // FIXME: params类型为pinoHttp.Options | pino.DestinationStream
  // pinoHttp有两种重载，分别支持这两种类型
  return [middleware, bindLoggerMiddlewareFactory(useExisting, assignResponse)]
}

/**
 * @function bindLoggerMiddlewareFactory
 * @description
 * 工厂函数，生成绑定日志上下文的中间件，确保每个请求拥有独立的日志实例。
 * 
 * 原理与机制：
 * 1. 从请求对象(req)和响应对象(res)提取日志实例
 * 2. 若useExisting为false且存在allLogs，则取最新的日志实例
 * 3. 通过AsyncLocalStorage的storage.run方法，将日志实例注入到当前异步上下文
 * 4. 保证后续所有异步操作均可安全获取当前请求的日志实例，实现请求级日志隔离
 * 
 * @param useExisting 是否复用已有日志实例
 * @param assignResponse 是否将日志实例绑定到响应对象
 */
function bindLoggerMiddlewareFactory(
  useExisting: boolean,
  assignResponse: boolean,
) {
  return function bindLoggerMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) {
    let log = req.log
    let resLog = assignResponse ? res.log : undefined

    if (!useExisting && req.allLogs) {
      log = req.allLogs[req.allLogs.length - 1]!
    }
    if (assignResponse && !useExisting && res.allLogs) {
      resLog = res.allLogs[res.allLogs.length - 1]!
    }

    storage.run(new Store(log, resLog), next)
  }
}
