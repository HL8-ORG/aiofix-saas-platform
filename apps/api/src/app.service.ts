import { Injectable } from '@nestjs/common';

/**
 * @class AppService
 * @description
 * 应用主服务，负责承载全局或基础的业务逻辑。
 *
 * 主要原理与机制如下：
 * 1. 通过`@Injectable()`装饰器声明为可注入服务，支持依赖注入机制，便于在控制器或其他服务中复用核心逻辑。
 * 2. 该服务可扩展实现如健康检查、全局配置、通用工具方法等基础功能，实现控制器与具体业务的解耦。
 */
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!!!!';
  }
}
