import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './core/filter/http-exception/http-exception.filter';
import { TransformInterceptor } from './core/interceptor/transform/transform.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api'); // 设置全局路由前缀
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // 禁用白名单验证
      transform: true, // 自动转换类型
      transformOptions: {
        enableImplicitConversion: true, // 启用隐式转换
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter()); // 使用全局异常过滤器
  app.useGlobalInterceptors(new TransformInterceptor()); // 使用全局拦截器
  const documentConfig = new DocumentBuilder()
    .setTitle('游戏榜单爬虫')
    .setDescription('游戏榜单爬虫接口文档')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, documentConfig);

  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 4125);
}
bootstrap();
