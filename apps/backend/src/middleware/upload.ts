import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(AppError.badRequest('Only JPEG, PNG, WebP or AVIF images are allowed'));
  },
});
