import { Controller, Get } from '@nestjs/common';

/**
 * Root controller — health check endpoint
 * GET /api/v1
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
}
