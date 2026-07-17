/**
 * AILOS Swagger 配置 v2.0.0
 * 自动生成 API 文档
 */
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('AILOS API')
    .setDescription('AILOS 语言学习平台 API 文档 v2.0.0')
    .setVersion('2.0.0')
    .addBearerAuth()
    .addTag('Users', '用户注册与认证')
    .addTag('Auth', '身份认证')
    .addTag('Gateway', 'AI 网关')
    .addTag('Entitlement', '权益中心')
    .addTag('Learning', '学习引擎')
    .addTag('Companion', 'AI 陪伴引擎')
    .addTag('Asset Center', '知识资产中心')
    .addTag('Community', '社区模块')
    .addTag('Marketing', '营销模块')
    .addTag('Developer', '开发者中心')
    .addTag('Admin', '管理后台')
    .addTag('Plugins', '插件框架')
    .addServer('http://localhost:3000', '开发环境')
    .addServer('https://api.ailos.com', '生产环境')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
