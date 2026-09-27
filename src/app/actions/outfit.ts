"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const STORAGE_BUCKET = "outfit-photos";

function extractStoragePath(publicUrl: string): string | null {
  const marker = `/object/public/${STORAGE_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(publicUrl.slice(index + marker.length));
}

export async function deleteOutfit(outfitId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" as const };
  }

  const { data: outfit } = await supabase
    .from("outfits")
    .select("id, photo_url, illustration_url")
    .eq("id", outfitId)
    .eq("user_id", user.id)
    .single();

  if (!outfit) {
    return { error: "not_found" as const };
  }

  const { error } = await supabase
    .from("outfits")
    .delete()
    .eq("id", outfitId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "delete_failed" as const };
  }

  const storagePaths = [outfit.photo_url, outfit.illustration_url]
    .filter((url): url is string => !!url)
    .map(extractStoragePath)
    .filter((path): path is string => !!path);

  if (storagePaths.length > 0) {
    // ベストエフォート: 失敗してもDBの削除自体は成功として扱う
    await supabase.storage.from(STORAGE_BUCKET).remove(storagePaths);
  }

  revalidatePath("/collection");

  return { success: true as const };
}
