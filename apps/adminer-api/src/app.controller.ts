import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * @class AppController
 * @description
 * 应用主控制器，负责处理根路径相关的基础接口（如健康检查、服务状态等）。
 *
 * 主要原理与机制如下：
 * 1. 通过`@Controller()`装饰器声明为全局控制器，路由前缀为空，处理根路径请求。
 * 2. 可注入`AppService`用于承载核心业务逻辑，实现控制器与服务的解耦。
 * 3. 可扩展添加如`@Get()`等装饰器的方法，实现健康检查、版本信息等基础API。
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('hello')
  getHello(): string {
    return this.appService.getHello();
  }
}
