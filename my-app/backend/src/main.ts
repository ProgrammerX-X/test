import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser(process.env.TOKEN_PARSER));
  app.enableCors({
    origin: 'http://localhost:3000',  // Дозволяємо фронтенд
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });
  //   app.enableCors({
  //   origin: 'http://localhost:3000', // Дозволяємо фронтенд
  //   credentials: true, // Дозволяємо куки
  //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  //   allowedHeaders: ['Content-Type', 'Authorization'],
  // });

  const startPort = 3001;
  const maxAttempts = 20;
  
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    try {
      await app.listen(port);
      console.log(`
      ╔══════════════════════════════════════╗
      ║  ✅ NestJS УСПІШНО СТАРТУВАВ!       ║
      ║  📍 Порт: ${port}                   ║
      ║  🔗 http://localhost:${port}        ║
      ╚══════════════════════════════════════╝
      `);
      
      process.env.NESTJS_PORT = port.toString();
      return;
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️ Порт ${port} зайнятий, спробуємо ${port + 1}...`);
        continue;
      } else {
        throw error;
      }
    }
  }

  console.error('❌ Немає вільних портів!');
  process.exit(1);
}
bootstrap();


// nest generate module workers
// nest generate controller workers
// nest generate service workers