"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCORE_TOOL = {
  name: "submit_score",
  description: "コーディネートの採点結果を送信する",
  input_schema: {
    type: "object" as const,
    properties: {
      color_score: {
        type: "number",
        description: "配色のバランスの評価。0〜100の整数。",
      },
      balance_score: {
        type: "number",
        description: "全体のシルエット・アイテムバランスの評価。0〜100の整数。",
      },
      suitability_score: {
        type: "number",
        description: "写っている本人に似合っているかの評価。0〜100の整数。",
      },
      comment: {
        type: "string",
        description: "日本語での短い講評（2〜3文）。",
      },
    },
    required: [
      "color_score",
      "balance_score",
      "suitability_score",
      "comment",
    ],
  },
};

export async function scoreOutfit(outfitId: string) {
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
    const mediaType = (imageResponse.headers.get("content-type") ||
      "image/jpeg") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      tools: [SCORE_TOOL],
      tool_choice: { type: "tool", name: "submit_score" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: "この写真の服装(コーディネート)を、プロのファッションスタイリストとして採点してください。配色のバランス・全体のバランス・写っている本人に似合っているかの3観点でそれぞれ0〜100点で評価し、日本語で短い講評を付けてください。",
            },
          ],
        },
      ],
    });

    const toolUse = message.content.find(
      (block) => block.type === "tool_use" && block.name === "submit_score",
    );

    if (!toolUse || toolUse.type !== "tool_use") {
      return { error: "scoring_failed" as const };
    }

    const input = toolUse.input as {
      color_score: number;
      balance_score: number;
      suitability_score: number;
      comment: string;
    };

    const scoreTotal = Math.round(
      (input.color_score + input.balance_score + input.suitability_score) /
        3,
    );

    const { error } = await supabase
      .from("outfits")
      .update({
        score_total: scoreTotal,
        score_breakdown: {
          color: input.color_score,
          balance: input.balance_score,
          suitability: input.suitability_score,
        },
        comment: input.comment,
      })
      .eq("id", outfitId);

    if (error) {
      return { error: "update_failed" as const };
    }

    return { success: true as const };
  } catch {
    return { error: "scoring_failed" as const };
  }
}
