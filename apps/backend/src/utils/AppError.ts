export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }
  static validation(message: string, details?: unknown) {
    return new AppError(422, 'VALIDATION_ERROR', message, details);
  }
  static unauthorized(message = 'Please sign in to continue') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(message = 'You do not have permission to do that') {
    return new AppError(403, 'FORBIDDEN', message);
  }
  static notFound(resource = 'Resource') {
    return new AppError(404, 'NOT_FOUND', `${resource} not found`);
  }
  static conflict(message: string) {
    return new AppError(409, 'CONFLICT', message);
  }
  static unavailable(message: string) {
    return new AppError(503, 'SERVICE_UNAVAILABLE', message);
  }
}
