import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const prefix = config.get<string>('apiPrefix')!;
  app.setGlobalPrefix(prefix);

  // Global input validation: strips unknown props, coerces types, rejects extras.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({ origin: config.get<string>('corsOrigin'), credentials: true });

  // Swagger UI at /<prefix>/docs
  const swagger = new DocumentBuilder()
    .setTitle('Barber Dashboard API')
    .setDescription('Salon-owner dashboard backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(`${prefix}/docs`, app, SwaggerModule.createDocument(app, swagger));

  const port = config.get<number>('port')!;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API ready on http://localhost:${port}/${prefix} (docs at /${prefix}/docs)`);
}
bootstrap();
