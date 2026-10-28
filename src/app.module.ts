import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ItemsModule } from './items/item.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    PrismaModule,   // Global — provides PrismaService everywhere
    ItemsModule,    // CRUD items
    AuthModule,     // Auth: Register, Login, Refresh, Logout, Profile
    PostsModule,    // Blog Posts: CRUD, slug, author relations
    CommentsModule, // Blog Comments: Post comments, permissions
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  // Apply logger middleware to ALL routes
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
