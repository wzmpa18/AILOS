import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { GlobalResponseInterceptor } from './common/interceptors/global-response.interceptor';
import { GlobalLoggingInterceptor } from './infrastructure/logging/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new GlobalResponseInterceptor(), new GlobalLoggingInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AILOS API')
    .setDescription('AILOS Language Learning Platform API v2.0.0')
    .setVersion('2.0.0')
    .addBearerAuth()
    .addTag('Gateway', 'AI Gateway')
    .addTag('Entitlement', 'Entitlement Center')
    .addTag('Learning', 'Learning Engine')
    .addTag('Companion', 'Companion Engine')
    .addTag('Asset Center', 'Data Asset Center')
    .addTag('Community', 'Community')
    .addTag('Marketing', 'Marketing')
    .addTag('Developer', 'Developer Center')
    .addTag('Admin', 'Admin Panel')
    .addTag('Health', 'Health Check')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log('AILOS Server: http://localhost:3000');
  console.log('Swagger: http://localhost:3000/api/docs');
}
bootstrap();
