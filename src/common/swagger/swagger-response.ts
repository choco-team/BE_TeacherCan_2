import { ApiResponse } from "@nestjs/swagger";

export const SwaggerSuccess = (description: string, dataExample: any) => ({
  status: 200,
  description,
  schema: {
    example: {
      success: true,
      statusCode: 200,
      data: dataExample,
      message: description,
      timestamp: new Date().toISOString(),
    },
  },
});