import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

/**
 * Root controller — health check & basic utility endpoints
 * GET  /api/v1
 * POST /api/v1/upload
 */
@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      app: 'NestJS Starter API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      routes: {
        health: 'GET    /api/v1',
        upload: 'POST   /api/v1/upload',
        // Auth
        register:      'POST   /api/v1/auth/register',
        login:         'POST   /api/v1/auth/login',
        profile:       'GET    /api/v1/auth/profile   🔒',
        updateProfile: 'PATCH  /api/v1/auth/profile   🔒',
        // Items CRUD
        getItems:    'GET    /api/v1/items',
        getItem:     'GET    /api/v1/items/:id',
        createItem:  'POST   /api/v1/items',
        updateItem:  'PATCH  /api/v1/items/:id',
        deleteItem:  'DELETE /api/v1/items/:id',
        // Blog Posts
        getPosts:    'GET    /api/v1/posts',
        getMyPosts:  'GET    /api/v1/posts/my-posts 🔒',
        getPost:     'GET    /api/v1/posts/:idOrSlug',
        createPost:  'POST   /api/v1/posts          🔒',
        updatePost:  'PATCH  /api/v1/posts/:id      🔒',
        deletePost:  'DELETE /api/v1/posts/:id      🔒',
        // Blog Comments
        getComments:   'GET    /api/v1/posts/:postId/comments',
        createComment: 'POST   /api/v1/posts/:postId/comments 🔒',
        updateComment: 'PATCH  /api/v1/comments/:id           🔒',
        deleteComment: 'DELETE /api/v1/comments/:id           🔒',
      },
    };
  }

  /**
   * Upload a file saved to public/uploads/
   * POST /api/v1/upload
   * Expects multipart/form-data with key 'file'
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided. Please attach a file with key "file".');
    }

    return {
      message: 'File uploaded successfully!',
      file: {
        originalName: file.originalname,
        savedAs: file.filename,
        url: `http://localhost:3001/uploads/${file.filename}`,
        mimeType: file.mimetype,
        size: `${(file.size / 1024).toFixed(2)} KB`,
      },
    };
  }
}


