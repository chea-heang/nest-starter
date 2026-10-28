import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * Create a new post
   * POST /api/v1/posts
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(userId, createPostDto);
  }

  /**
   * Get all public posts (supports pagination, search, published filter)
   * GET /api/v1/posts
   */
  @Get()
  findAll(@Query() query: QueryPostDto) {
    return this.postsService.findAll(query);
  }

  /**
   * Get all posts of the authenticated user (including drafts)
   * GET /api/v1/posts/my-posts
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-posts')
  findMyPosts(
    @CurrentUser('id') userId: string,
    @Query() query: QueryPostDto,
  ) {
    return this.postsService.findMyPosts(userId, query);
  }

  /**
   * Get a single post by ID or Slug (with author and comments)
   * GET /api/v1/posts/:idOrSlug
   */
  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.postsService.findOne(idOrSlug);
  }

  /**
   * Update a post (author only)
   * PATCH /api/v1/posts/:id
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, userId, updatePostDto);
  }

  /**
   * Delete a post (author only)
   * DELETE /api/v1/posts/:id
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.remove(id, userId);
  }

  /**
   * Add a comment to a specific post and save to Prisma
   * POST /api/v1/posts/:id/comments
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  addComment(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.addComment(postId, userId, dto.content);
  }

  /**
   * Get all comments for a specific post
   * GET /api/v1/posts/:id/comments
   */
  @Get(':id/comments')
  getComments(@Param('id') postId: string) {
    return this.postsService.getComments(postId);
  }
}
