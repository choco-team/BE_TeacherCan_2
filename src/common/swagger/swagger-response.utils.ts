import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

export const SwaggerSuccess = (
  dtoClass: any,
  message = '요청이 성공적으로 처리되었습니다.',
  statusCode = 200,
) => {
  return applyDecorators(
    ApiExtraModels(dtoClass),
    ApiResponse({
      status: statusCode,
      description: message,
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              statusCode: { type: 'number', example: statusCode },
              data: { $ref: getSchemaPath(dtoClass) },
              message: { type: 'string', example: message },
              timestamp: {
                type: 'string',
                example: new Date().toISOString(),
              },
            },
          },
        ],
      },
    }),
  );
};
