import { z } from "zod"

function isBrowserFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File
}

export const optionalUploadValueSchema = z.custom<File | string | undefined>(
  (value) => value === undefined || value === "" || typeof value === "string" || isBrowserFile(value),
  {
    message: "Invalid upload value.",
  }
)
