"use server";

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function illustrateOutfit(outfitId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" as const };
  }

  const { data: outfit } = await supabase
    .from("outfits")
    .select("id, photo_url")
    .eq("id", outfitId)
    .eq("user_id", user.id)
    .single();

  if (!outfit) {
    return { error: "not_found" as const };
  }

  try {
    const imageResponse = await fetch(outfit.photo_url);
    if (!imageResponse.ok) {
      return { error: "image_fetch_failed" as const };
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: base64Image, mimeType } },
            {
              text: "この写真の人物とコーディネートをもとに、フラットカラーのイラスト風に変換してください。服装のシルエット・配色・ポーズはできるだけ保持しつつ、線画とフラットカラーで表現したイラストにしてください。背景はシンプルな単色にしてください。",
            },
          ],
        },
      ],
      config: {
        responseModalities: ["IMAGE"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part) => part.inlineData?.data);

    if (!imagePart?.inlineData?.data) {
      return { error: "illustration_failed" as const };
    }

    const illustrationBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    const illustrationMimeType = imagePart.inlineData.mimeType || "image/png";
    const extension = illustrationMimeType === "image/jpeg" ? "jpg" : "png";
    const path = `${user.id}/illustrations/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("outfit-photos")
      .upload(path, illustrationBuffer, { contentType: illustrationMimeType });

    if (uploadError) {
      return { error: "upload_failed" as const };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("outfit-photos").getPublicUrl(path);

    const { error } = await supabase
      .from("outfits")
      .update({ illustration_url: publicUrl })
      .eq("id", outfitId);

    if (error) {
      return { error: "update_failed" as const };
    }

    return { success: true as const };
  } catch {
    return { error: "illustration_failed" as const };
  }
}
