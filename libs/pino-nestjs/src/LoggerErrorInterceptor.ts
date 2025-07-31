import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable, catchError, throwError } from 'rxjs'

/**
 * @class LoggerErrorInterceptor
 * @implements NestInterceptor
 * @description
 * 全局异常拦截器，用于捕获请求处理链中的异常，并将异常对象挂载到响应对象上，便于日志中间件或后续处理流程获取异常信息。
 * 
 * 原理与机制：
 * 1. 实现NestJS的NestInterceptor接口，拦截所有经过的请求。
 * 2. 在intercept方法中，调用next.handle()获取请求处理的Observable流。
 * 3. 通过RxJS的catchError操作符捕获流中的异常error。
 * 4. 获取原生HTTP响应对象（Express为response，Fastify为response.raw），判断当前运行环境。
 * 5. 将捕获到的异常对象error挂载到响应对象的err属性（Express为response.err，Fastify为response.raw.err）。
 *    这样日志中间件可以在响应阶段访问到异常信息，实现结构化异常日志采集。
 * 6. 最终重新抛出异常，保证NestJS全局异常过滤器等后续机制能够继续处理该异常。
 */
@Injectable()
export class LoggerErrorInterceptor implements NestInterceptor {
  /**
   * @method intercept
   * @description
   * 拦截请求处理流程，捕获异常并将其挂载到响应对象上。
   * 
   * @param context 当前执行上下文，包含请求和响应对象
   * @param next 请求处理链的下一个处理器
   * @returns Observable<any> | Promise<Observable<any>> 处理后的响应流
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      catchError((error) => {
        return throwError(() => {
          // 获取原生响应对象
          const response = context.switchToHttp().getResponse()

          // 判断是否为Fastify响应对象
          const isFastifyResponse = response.raw !== undefined

          // 挂载异常到响应对象，便于日志采集
          if (isFastifyResponse) {
            response.raw.err = error
          } else {
            response.err = error
          }

          // 重新抛出异常，交由全局异常过滤器处理
          return error
        })
      }),
    )
  }
}
