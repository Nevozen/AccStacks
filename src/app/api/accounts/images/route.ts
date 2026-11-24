import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { MAX_IMAGE_BYTES } from "@/lib/image-files";
import { uploadAccountImage } from "@/services/images";
import { getSessionUser } from "@/server/session";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await request.formData();
    const accountId = form.get("accountId");
    const file = form.get("file");
    if (typeof accountId !== "string" || !(file instanceof File)) {
      return NextResponse.json({ error: "Account and image file are required" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image must be at most 3 MB" }, { status: 413 });
    }
    const imageUrl = await uploadAccountImage(user.id, accountId, file);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "NOT_FOUND" ? 404 : 409 },
      );
    }
    if (error instanceof Error && /image|JPEG|PNG|WebP|MB/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Image upload failed", error);
    return NextResponse.json({ error: "Unable to upload image" }, { status: 500 });
  }
}
