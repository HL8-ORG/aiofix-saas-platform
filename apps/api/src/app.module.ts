import { Module } from '@nestjs/common';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { LoggerModule } from '@libs/pino-nestjs';
import pinoLoggerConfig from 'src/config/pino-logger.config';

/**
 * @module AppModule
 * @description
 * 应用的主模块，负责全局依赖注入、配置加载、数据库连接、日志、限流、租户、权限等核心功能的集成。
 *
 * 主要原理与机制如下：
 *
 * 1. ClsModule：全局上下文存储（CLS），用于实现请求级别的数据隔离和追踪，支持多租户等场景。
 *    - 通过`global: true`和`middleware.mount: true`，自动为每个请求创建独立上下文。
 *
 * 2. ConfigModule：全局配置模块，支持多环境配置文件加载（如.env.development.local、.env），
 *    并通过`load`参数加载自定义配置工厂（数据库、认证、租户等）。
 *
 * 3. MikroOrmModule：异步方式初始化数据库ORM，支持依赖注入和配置解耦。
 *
 * 4. ThrottlerModule：全局限流模块，防止接口被恶意刷请求，配置通过throttleConfig异步加载。
 *
 * 5. LoggerModule：集成pino高性能日志，异步加载配置，提升日志结构化和性能。
 *
 * 6. AuthModule、UsersModule、TenantModule、OrganizationsModule、CaslModule、ValidatorsModule：
 *    分别负责认证、用户、租户、组织、权限（CASL）、自定义校验器等领域功能的模块化拆分。
 *
 * 7. providers:
 *    - AppService：主服务逻辑。
 *    - APP_GUARD（JwtAuthGuard）：全局JWT认证守卫，保护所有路由，未认证请求将被拦截。
 *    - APP_GUARD（ThrottlerGuard）：全局限流守卫，所有路由自动应用限流策略。
 *      多个APP_GUARD会按顺序依次执行，确保认证和限流都生效。
 */
@Module({
  imports: [
    // 全局上下文存储，支持请求级别数据隔离
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
    // 全局配置模块，支持多环境和自定义配置工厂
    ConfigModule.forRoot({
      envFilePath: ['.env.development.local', '.env'],
      isGlobal: true,
      load: [pinoLoggerConfig],
    }),
    // 日志模块
    LoggerModule.forRootAsync(pinoLoggerConfig.asProvider()),
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule { }


