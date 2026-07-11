class ApiError extends Error {
  public readonly statusCode: number;
  public readonly success = false;
  public readonly errors: unknown[];
  public readonly data: unknown;
  public readonly isOperational = true;

  constructor(
    statusCode: number,
    message = 'Something went wrong',
    errors: unknown[] = [],
    data: unknown = null,
    stack?: string
  ) {
    super(message);

    this.statusCode = statusCode;
    this.errors = errors;
    this.data = data;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
