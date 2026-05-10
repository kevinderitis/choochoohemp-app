export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function asyncHandler<T extends (req: any, res: any, next: any) => Promise<unknown>>(fn: T) {
  return (req: any, res: any, next: any) => {
    fn(req, res, next).catch(next);
  };
}

export function errorMiddleware(error: unknown, _req: any, res: any, _next: any) {
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Unexpected error";
  res.status(status).json({ message });
}
