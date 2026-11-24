export class AppError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "CONFLICT" | "FORBIDDEN" | "BAD_REQUEST",
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
