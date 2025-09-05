import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiSuccessResponse(description?: string) {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: description || 'Success',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
        },
      },
    }),
  );
}

export function ApiErrorResponse(description?: string) {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: description || 'Error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'number', example: 400 },
          message: { type: 'string' },
          error: { type: 'string' },
        },
      },
    }),
  );
}