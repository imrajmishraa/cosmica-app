class ApiResponse<T> {
  public readonly statusCode: number;
  public readonly success: boolean;
  public readonly message: string;
  public readonly data: T;

  constructor(statusCode: number, message: string, data: T) {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode <= 400;
    this.data = data;
    this.message = message;
  }
}

export { ApiResponse };
