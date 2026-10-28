import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      const color =
        statusCode >= 500
          ? '🔴'
          : statusCode >= 400
            ? '🟡'
            : '🟢';
      this.logger.log(
        `${color} [${method}] ${originalUrl} → ${statusCode} (${duration}ms) [${ip}]`,
      );
    });

    next();
  }
}
