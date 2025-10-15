import { NextResponse } from "next/server";

/**
 * Standard CORS configuration
 */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Error response structure
 */
export interface ErrorResponse {
  ok: boolean;
  error: string;
}

/**
 * Success response structure
 */
export interface SuccessResponse<T = any> {
  ok: boolean;
  data?: T;
  cached?: boolean;
  [key: string]: any;
}

/**
 * Creates CORS-enabled response
 */
export function createCorsResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: CORS_HEADERS,
  });
}

/**
 * Creates standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  includeCors: boolean = true
): NextResponse {
  const response: ErrorResponse = {
    ok: false,
    error: message,
  };

  return NextResponse.json(
    response,
    {
      status,
      headers: includeCors ? CORS_HEADERS : undefined,
    }
  );
}

/**
 * Generic OPTIONS method handler for CORS preflight
 */
export function createOptionsHandler(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
