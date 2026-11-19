import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { Request, Response } from 'express';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
  });

  it('should generate a new UUID if no x-correlation-id header is provided', () => {
    const req = {
      headers: {},
    } as unknown as Request;

    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-correlation-id']).toBeDefined();
    expect(typeof req.headers['x-correlation-id']).toBe('string');
    expect(res.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      req.headers['x-correlation-id'],
    );
    expect(next).toHaveBeenCalled();
  });

  it('should reuse existing x-correlation-id header if provided', () => {
    const customId = 'client-trace-12345';
    const req = {
      headers: {
        'x-correlation-id': customId,
      },
    } as unknown as Request;

    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-correlation-id']).toBe(customId);
    expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', customId);
    expect(next).toHaveBeenCalled();
  });
});
