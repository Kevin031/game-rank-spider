import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus() as HttpStatus;
    const exceptionResponse = exception.getResponse() as
      | string
      | { message: string | string[]; error?: string };

    let message = exception.message;
    const code = 0;

    if (status === HttpStatus.BAD_REQUEST) {
      if (
        typeof exceptionResponse === 'object' &&
        Array.isArray(exceptionResponse.message)
      ) {
        message = exceptionResponse.message[0];
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse.message
      ) {
        message =
          typeof exceptionResponse.message === 'string'
            ? exceptionResponse.message
            : exceptionResponse.message[0];
      }
    }

    const errorResponse = {
      data: {},
      message,
      code,
    };

    response.status(status);
    response.header('Content-Type', 'application/json; charset=utf-8');
    response.send(errorResponse);
  }
}
