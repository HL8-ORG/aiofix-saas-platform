import { FastifyRequest } from 'fastify';
// import { User } from 'src/entities/user.entity';
import pino from 'pino';
import { REQUEST_ID_HEADER } from 'src/common/constants';

/**
 * @constant pinoDevConfig
 * @description
 * Pino 日志库在开发环境下的配置对象。该配置用于定制日志的输出格式、内容和行为，便于开发调试和问题追踪。
 * 
 * 主要原理与机制如下：
 * 1. level: 日志级别，优先读取环境变量LOG_LEVEL，默认为'debug'，便于开发时输出详细日志。
 * 2. transport: 配置pino-pretty插件，将日志美化为易读格式，并自定义时间格式（SYS:dd-mm-yyyy HH:MM:ss）。
 * 3. stream: 指定日志输出目标文件，优先读取环境变量LOGS_FILE_NAME，默认为'./logs/app.log'，并采用异步写入（sync: false），提升性能。
 * 4. serializers: 自定义序列化器，格式化请求(req)和响应(res)对象，便于日志中展示关键请求信息。
 *    - req序列化器：提取请求ID、方法、URL、User-Agent、语言、IP、body、query、params等信息，方便定位请求上下文。
 *    - res序列化器：仅输出响应状态码，简化日志内容。
 * 5. customProps: 自定义属性注入函数，将当前请求的用户信息（如id、用户名、邮箱、角色）添加到日志中，便于追踪用户操作。
 * 6. quietReqLogger: 设为true，关闭pino-http的默认请求日志，避免重复输出，由自定义日志逻辑接管。
 * 
 * 该配置通过pinoHttp插件集成到Fastify/NestJS应用中，实现结构化、可追溯的开发环境日志。
 */
export const pinoDevConfig: { pinoHttp: any } = {
  pinoHttp: {
    // 日志级别，优先读取环境变量
    level: process.env.LOG_LEVEL || 'debug',
    // 开发环境使用pretty格式
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
        colorize: true,
      },
    },
    // 生产环境使用JSON格式，便于日志分析
    // stream: pino.destination({
    //   dest: process.env.LOGS_FILE_NAME || './logs/app.log',
    //   sync: false,
    //   // 生产环境可以添加压缩
    //   // compress: true,
    //   // 添加格式化配置
    //   formatters: {
    //     level: (label) => ({ level: label }),
    //     log: (object) => object,
    //   },
    // }),
    stream: pino.destination({
      dest: process.env.LOGS_FILE_NAME || './logs/app.log',
      sync: false,
      // 自定义格式化
      formatters: {
        level: (label) => ({ level: label.toUpperCase() }),
        log: (object) => {
          // 自定义日志格式
          return {
            timestamp: new Date().toISOString(),
            level: object.level,
            message: object.msg,
            requestId: object.reqId,
            method: object.req?.method,
            url: object.req?.url,
            statusCode: object.res?.statusCode,
            userAgent: object.req?.userAgent,
            ip: object.req?.ip,
          };
        },
      },
    }),
    // 自定义序列化器，格式化请求(req)和响应(res)对象，便于日志中展示关键请求信息
    serializers: {
      /**
       * @function req
       * @description
       * 请求对象序列化器。提取并格式化请求的关键信息，便于日志追踪。
       */
      req: (req: {
        id: any;
        method: any;
        url: any;
        headers: { [x: string]: any };
        ip: any;
        body: any;
        query: any;
        params: any;
      }) => {
        return {
          [REQUEST_ID_HEADER]: req.id,
          method: req.method,
          url: req.url,
          userAgent: req.headers['user-agent'],
          language: req.headers['accept-language'],
          ip: req.ip,
          body: req.body,
          query: req.query,
          params: req.params,
        };
      },
      /**
       * @function res
       * @description
       * 响应对象序列化器，仅输出状态码，简化日志内容。
       */
      res: (res: { statusCode: any }) => {
        return {
          statusCode: res.statusCode,
        };
      },
    },
    /**
     * @function customProps
     * @description
     * 自定义日志属性，将当前请求的用户信息注入到日志中，便于追踪用户操作。
     * 
     * @param req FastifyRequest & { user?: User }
     * @returns 包含用户信息的对象
     */
    // customProps(req: FastifyRequest & { user?: User }) {
    //   const user = req.user as User;
    //   return {
    //     user: user
    //       ? {
    //         id: user.id,
    //         username: user.username,
    //         email: user.email,
    //         role: user.role ? user.role.name : 'unknown',
    //       }
    //       : {},
    //   };
    // },
    // 关闭默认请求日志，由自定义日志逻辑接管，避免重复输出
    quietReqLogger: true,
  },
};