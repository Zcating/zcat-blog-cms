import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

import { createResult, ResultCode } from '@backend/model';

@Catch(HttpException)
export class HttpExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    if (!isZodValidationException(exception)) {
      super.catch(exception, host);
      return;
    }

    const zodError = exception.getZodError();
    if (!isZodError(zodError)) {
      super.catch(exception, host);
      return;
    }

    this.logger.error(`ZodSerializationException: ${zodError.message}`);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    response.status(200).json(
      createResult({
        code: ResultCode.ValidationError,
        message: zodError.issues.map((issue) => issue.message).join(', '),
      }),
    );
  }
}

function isZodValidationException(
  exception: HttpException,
): exception is ZodValidationException {
  return exception instanceof ZodValidationException;
}

function isZodError(error: any): error is ZodError {
  return error instanceof ZodError;
}
