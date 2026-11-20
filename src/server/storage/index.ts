import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env, features } from "@/config/env";
import { createSupabaseAdminClient } from "@/server/supabase/server";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

export const LOCAL_UPLOAD_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "uploads");

/**
 * Stores a product image and returns its public URL.
 * Supabase Storage when configured; otherwise the local ./.data/uploads folder
 * (served by the /uploads route) so the admin works in demo mode.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new Error("Formato não suportado. Envie JPG, PNG, WebP ou AVIF.");
  if (file.size > MAX_BYTES) throw new Error("A imagem deve ter no máximo 5 MB.");
  const name = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (features.supabaseStorage) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from(env.supabaseStorageBucket).upload(name, bytes, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Falha no upload: ${error.message}`);
    return supabase.storage.from(env.supabaseStorageBucket).getPublicUrl(name).data.publicUrl;
  }

  const target = path.join(LOCAL_UPLOAD_DIR, name);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  return `/uploads/${name}`;
}
