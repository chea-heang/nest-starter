import { ThrottlerExceptionFilter } from './throttler-exception.filter';
import { ThrottlerException } from '@nestjs/throttler';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';

describe('ThrottlerExceptionFilter', () => {
  let filter: ThrottlerExceptionFilter;

  beforeEach(() => {
    filter = new ThrottlerExceptionFilter();
  });

  it('should format 429 response according to standard error schema', () => {
    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    const hostMock = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock }),
        getRequest: () => ({ url: '/api/v1/auth/login', method: 'POST' }),
      }),
    } as unknown as ArgumentsHost;

    const exception = new ThrottlerException();

    filter.catch(exception, hostMock);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please slow down and try again later.',
        path: '/api/v1/auth/login',
        method: 'POST',
      }),
    );
  });
});
