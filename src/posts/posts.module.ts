import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
