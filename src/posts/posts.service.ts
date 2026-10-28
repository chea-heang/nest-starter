import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper accessor for Prisma models before/after schema generation
  private get db(): any {
    return this.prisma;
  }

  /**
   * Helper to slugify a title into a URL-friendly string.
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Create a new blog post for the authenticated user.
   */
  async create(userId: string, dto: CreatePostDto) {
    let slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);
    if (!slug) {
      slug = `post-${Date.now()}`;
    }

    // Ensure unique slug
    const existingSlug = await this.db.post.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    return this.db.post.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content,
        summary: dto.summary,
        published: dto.published ?? false,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });
  }

  /**
   * Get all posts with filtering, search, and pagination.
   */
  async findAll(query: QueryPostDto) {
    const { search, published, authorId, page = 1, limit = 10 } = query;
    const where: any = {};

    if (published !== undefined) {
      where.published = published;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, posts] = await Promise.all([
      this.db.post.count({ where }),
      this.db.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
    ]);

    return {
      posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all posts belonging to the authenticated user (including drafts).
   */
  async findMyPosts(userId: string, query: QueryPostDto) {
    return this.findAll({
      ...query,
      authorId: userId,
    });
  }

  /**
   * Find a single post by ID or Slug.
   */
  async findOne(idOrSlug: string) {
    const post = await this.db.post.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post '${idOrSlug}' not found`);
    }

    return post;
  }

  /**
   * Update an existing post. Only the author can update their post.
   */
  async update(postId: string, userId: string, dto: UpdatePostDto) {
    const post = await this.db.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You are not allowed to update this post');
    }

    let updatedSlug = post.slug;
    if (dto.slug && dto.slug !== post.slug) {
      updatedSlug = this.slugify(dto.slug);
      const conflict = await this.db.post.findUnique({
        where: { slug: updatedSlug },
      });
      if (conflict && conflict.id !== postId) {
        throw new ConflictException(`Slug '${updatedSlug}' is already taken`);
      }
    }

    return this.db.post.update({
      where: { id: postId },
      data: {
        ...dto,
        ...(dto.slug ? { slug: updatedSlug } : {}),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });
  }

  /**
   * Delete a post. Only the author can delete their post.
   */
  async remove(postId: string, userId: string) {
    const post = await this.db.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You are not allowed to delete this post');
    }

    await this.db.post.delete({ where: { id: postId } });

    return {
      message: `Post with ID ${postId} has been deleted successfully`,
      id: postId,
    };
  }

  /**
   * Add a comment to a specific post and save to Prisma.
   */
  async addComment(postId: string, userId: string, content: string) {
    const post = await this.db.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    return this.db.comment.create({
      data: {
        content,
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
   * Get all comments for a specific post.
   */
  async getComments(postId: string) {
    const post = await this.db.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    return this.db.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
