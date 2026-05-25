import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { mkdirSync } from 'fs'
import { join } from 'path'

async function bootstrap() {
  const uploadsDir = join(process.cwd(), 'uploads', 'photos')
  mkdirSync(uploadsDir, { recursive: true })

  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  })
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' })
  await app.listen(process.env.PORT ?? 3000)
  console.log(`API → http://localhost:${process.env.PORT ?? 3000}/api`)
}
bootstrap()
