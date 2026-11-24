import { ZodError } from "zod";
import { AppError } from "./errors";

export type ActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function actionError(
  error: unknown,
  fallback = "The operation could not be completed",
): ActionResult {
  if (error instanceof ZodError) {
    return {
      success: false,
      message: "Please correct the highlighted fields",
      fieldErrors: error.flatten().fieldErrors,
    };
  }
  if (error instanceof AppError) return { success: false, message: error.message };
  if (error instanceof Error && error.message === "You must be signed in") {
    return { success: false, message: error.message };
  }
  console.error("Mutation failed", error);
  return { success: false, message: fallback };
}
