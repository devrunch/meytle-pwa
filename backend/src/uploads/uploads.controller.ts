import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request } from 'express';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post('photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'photos'),
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only JPEG, PNG, WebP, and HEIC images are allowed'), false);
        }
      },
    }),
  )
  uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ): { url: string } {
    if (!file) throw new BadRequestException('No file uploaded');
    const base =
      process.env.UPLOADS_BASE_URL ??
      `${req.protocol}://${req.get('host')}`;
    return { url: `${base}/uploads/photos/${file.filename}` };
  }
}
