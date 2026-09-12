import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiErrorPayload } from "@lifehub/shared";

export class MobileApiError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string[]>;

  constructor(status: number, code: string, message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export const unauthorized = (message = "Authentication required.") => new MobileApiError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "You don't have access to this resource.") =>
  new MobileApiError(403, "FORBIDDEN", message);
export const notFound = (message = "Not found.") => new MobileApiError(404, "NOT_FOUND", message);
export const badRequest = (message: string, fieldErrors?: Record<string, string[]>) =>
  new MobileApiError(400, "BAD_REQUEST", message, fieldErrors);

/** Every successful mobile API response is `{ data }` — see AGENTS.md-style contract note in src/app/api/mobile/v1/README.md. */
export function mobileJson<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json({ data }, typeof init === "number" ? { status: init } : init);
}

export function mobileErrorResponse(error: unknown): NextResponse<{ error: ApiErrorPayload }> {
  if (error instanceof MobileApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, fieldErrors: error.fieldErrors } },
      { status: error.status }
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Please check your input.",
          fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
        },
      },
      { status: 400 }
    );
  }
  console.error("[mobile-api] unhandled error", error);
  return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } }, { status: 500 });
}

/** Wraps a route handler so any thrown MobileApiError/ZodError becomes the matching JSON error response instead of an unhandled 500. */
export function withMobileErrors<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return mobileErrorResponse(error);
    }
  };
}
