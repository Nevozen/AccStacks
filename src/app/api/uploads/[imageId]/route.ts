import { readAccountImage } from "@/services/images";
import { getSessionUser } from "@/server/session";

export async function GET(_request: Request, { params }: { params: Promise<{ imageId: string }> }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { imageId } = await params;
  const image = await readAccountImage(user.id, imageId);
  if (!image) return Response.json({ error: "Image not found" }, { status: 404 });

  return new Response(image.bytes, {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": String(image.bytes.length),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
      "Content-Disposition": "inline",
    },
  });
}
