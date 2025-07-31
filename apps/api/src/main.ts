import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { Logger } from '@libs/pino-nestjs';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { v4 as uuidv4 } from 'uuid';
import { REQUEST_ID_HEADER } from 'src/common/constants';
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { writeFileSync } from "fs";
/**
 * @function bootstrap
 * @description
 * NestJS 应用的启动主函数。负责初始化 Fastify 适配器、全局中间件、日志、版本控制、全局校验管道等核心功能，并监听端口启动服务。
 *
 * 代码原理与机制说明：
 * 1. FastifyAdapter 初始化：
 *    - 通过 `trustProxy: true` 支持代理场景下的真实 IP 获取。
 *    - `genReqId` 方法用于生成全局唯一的请求 ID，优先使用客户端传递的请求头（如 x-request-id），否则自动生成 UUID。
 *      这样便于日志追踪和分布式链路追踪。
 * 2. NestFactory.create：
 *    - 创建 NestFastifyApplication 实例，注入 FastifyAdapter，并开启日志缓冲（bufferLogs: true），
 *      保证日志系统初始化前日志不丢失。
 * 3. API 版本控制：
 *    - 通过 `enableVersioning` 启用 URI 版本控制（如 /v1/xxx），默认版本为 '1'，便于 API 兼容与演进。
 * 4. 全局校验管道：
 *    - 注册 ValidationPipe，自动对请求数据进行类型转换和校验，提升接口健壮性和安全性。
 * 5. 全局日志系统：
 *    - 注入自定义 pino-nestjs Logger，提升日志结构化和性能。
 * 6. class-validator 容器集成：
 *    - 通过 useContainer 让 class-validator 支持依赖注入，便于自定义校验器的注入和复用。
 *    - fallbackOnErrors: true 保证解析失败时回退到默认容器，增强健壮性。
 * 7. 应用监听端口：
 *    - 通过 listen 方法监听环境变量 PORT 指定端口（默认 3000），并绑定 0.0.0.0 以支持容器化部署。
 */
async function bootstrap() {
  // 初始化 Fastify 适配器，配置请求 ID 生成逻辑
  const fastifyAdapter = new FastifyAdapter({
    trustProxy: true,
    // 重写fastify的genReqId方法，自定义请求 ID 生成逻辑，而不是使用fastify默认的递增整型ID
    genReqId: (req: { headers: { [x: string]: any } }) => {
      // 优先使用客户端传递的请求 ID，否则自动生成, 需要与前端约定好请求头字段名 REQUEST_ID_HEADER
      const userRequestId = req.headers[REQUEST_ID_HEADER];
      if (userRequestId) {
        return userRequestId;
      }
      return uuidv4();
    },
  });

  // 可选：自动在响应头中设置 X-Request-Id，便于前后端链路追踪
  // fastifyAdapter.getInstance().addHook('onSend', (request, reply, done) => {
  //   if (request.id) {
  //     reply.header('X-Request-Id', request.id);
  //   }
  //   done();
  // });

  // 创建 NestFastifyApplication 实例，注入日志缓冲
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
    { bufferLogs: true },
  );

  // 启用基于 URI 的 API 版本控制，默认版本为 1
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 注册全局校验管道，自动转换和校验请求数据
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  // 设置全局日志系统为 pino-nestjs 的 Logger
  app.useLogger(app.get(Logger));
  // 添加测试日志
  const logger = app.get(Logger);
  logger.log('应用启动成功，开始监听端口');
  logger.error('测试错误日志');
  logger.debug('测试调试日志');
  // 配置 class-validator 使用 Nest 的依赖注入容器，支持自定义校验器注入
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle("API Documentation")
    .setDescription("API description")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);
  writeFileSync("swagger.json", JSON.stringify(document, null, 2));




  // 启动 HTTP 服务，监听指定端口（默认 3000），支持容器化部署
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(
    `Swagger documentation available at http://localhost:${process.env.PORT}/docs`
  );
}

/**
 * 应用启动入口
 */
bootstrap();
