import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  /**
   * Add a comment to a specific post.
   */
  async create(postId: string, userId: string, dto: CreateCommentDto) {
    // Verify post exists
    const post = await this.db.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    return this.db.comment.create({
      data: {
        content: dto.content,
        postId,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Get all comments across all posts.
   */
  async findAll() {
    return this.db.comment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        post: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  /**
   * Get all comments for a specific post.
   */
  async findByPost(postId: string) {
    const post = await this.db.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    return this.db.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Update a comment. Only the comment author can update it.
   */
  async update(commentId: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.db.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You are not allowed to edit this comment');
    }

    return this.db.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Delete a comment. Either the comment author or the post owner can delete it.
   */
  async remove(commentId: string, userId: string) {
    const comment = await this.db.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: { authorId: true },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    const isCommentAuthor = comment.authorId === userId;
    const isPostAuthor = comment.post.authorId === userId;

    if (!isCommentAuthor && !isPostAuthor) {
      throw new ForbiddenException(
        'You are not authorized to delete this comment',
      );
    }

    await this.db.comment.delete({ where: { id: commentId } });

    return {
      message: `Comment with ID ${commentId} has been deleted successfully`,
      id: commentId,
    };
  }
}
