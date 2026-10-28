import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Get all comments
   * GET /api/v1/comments
   */
  @Get()
  findAll() {
    return this.commentsService.findAll();
  }

  /**
   * Update a comment (author only)
   * PATCH /api/v1/comments/:id
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, userId, updateCommentDto);
  }

  /**
   * Delete a comment (comment author or post owner)
   * DELETE /api/v1/comments/:id
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.remove(id, userId);
  }
}
