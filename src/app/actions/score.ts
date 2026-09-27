"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCORING_RUBRIC = `あなたはプロのファッションスタイリストです。写真に写っているコーディネートを、以下の3つの観点で採点してください。観点ごとに配点（満点）が異なります。各観点には点数帯ごとの基準があります。必ずこの基準に沿って、実際の写真の内容と照らし合わせながら採点してください（基準に当てはまらない場合は最も近い点数帯を選び、その中で微調整すること）。3観点の合計が100点満点になります。

【配色 color_score（30点満点）】色相・彩度・明度の組み合わせ、差し色の使い方を評価する。
- 27〜30点: 色相・彩度・明度のバランスが理論的に優れ、差し色まで含めて統一感がある。
- 21〜26点: 大きな破綻はないが、配色の意図や工夫がやや弱い、または色数がやや多い。
- 15〜20点: 無難だが工夫が少なく、印象に残らない配色。
- 9〜14点: 色同士がぶつかる、または雑多で統一感がない。
- 0〜8点: 配色に一貫性が感じられない。

【全体バランス balance_score（30点満点）】トップス・ボトムス・小物・靴を含めた分量バランスとシルエットを評価する。
- 27〜30点: 縦横の分量バランス（Iライン/Aライン/Yラインなど）が意図的に作られ、小物まで含めて完成度が高い。
- 21〜26点: 大きな破綻はないが、着丈やサイズ感にやや惜しい部分がある。
- 15〜20点: バランスは無難だが工夫が少なく平坦な印象。
- 9〜14点: サイズ感の不一致や着崩れ感が目立つ。
- 0〜8点: 全体のシルエットに統一感がない。

【スタイリングの調和度 suitability_score（40点満点）】服の色・素材・シルエットの選び方が、写真全体の雰囲気（髪型・小物・ポーズなどのスタイリング全体）とどれだけ調和しているかを評価する。体型・体重・顔立ちなど個人の身体的特徴そのものは評価対象にせず、あくまで服のスタイリング上の選択が全体の雰囲気を引き立てているかどうかのみを見ること。
- 36〜40点: 色味や素材の選択が全体の雰囲気と高いレベルで調和し、コーディネートの魅力を最大限に引き出せている。
- 28〜35点: おおむね調和しているが、色味や素材の選び方でさらに高められる余地がある。
- 20〜27点: 悪くはないが、スタイリングと全体の雰囲気がやや噛み合っていない部分がある。
- 12〜19点: 色味やスタイルの選択が全体の雰囲気とミスマッチしている。
- 0〜11点: スタイリングの選択が全体の魅力を活かせていない。

採点が終わったら、良かった点を日本語で1文、次回に活かせる改善点を日本語で1文、それぞれ簡潔に述べてください。改善点は上記3観点のうち最もスコアが低かった観点に関連する具体的な内容にしてください。`;

const SCORE_TOOL = {
  name: "submit_score",
  description: "コーディネートの採点結果を送信する",
  input_schema: {
    type: "object" as const,
    properties: {
      color_score: {
        type: "number",
        description: "配色の評価。0〜30の整数。ルーブリックの点数帯に従うこと。",
      },
      balance_score: {
        type: "number",
        description: "全体バランスの評価。0〜30の整数。ルーブリックの点数帯に従うこと。",
      },
      suitability_score: {
        type: "number",
        description:
          "スタイリングの調和度の評価。0〜40の整数。ルーブリックの点数帯に従うこと。体型・外見そのものは評価に含めない。",
      },
      good_point: {
        type: "string",
        description: "このコーディネートで良かった点を、日本語で1文で述べる。",
      },
      improvement_point: {
        type: "string",
        description:
          "次回に活かせる改善点を、日本語で1文で述べる。最もスコアが低かった観点に関連させること。",
      },
    },
    required: [
      "color_score",
      "balance_score",
      "suitability_score",
      "good_point",
      "improvement_point",
    ],
  },
};

function clamp(value: number, max: number) {
  return Math.min(Math.max(Math.round(value), 0), max);
}

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
              text: SCORING_RUBRIC,
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
      good_point: string;
      improvement_point: string;
    };

    const colorScore = clamp(input.color_score, 30);
    const balanceScore = clamp(input.balance_score, 30);
    const suitabilityScore = clamp(input.suitability_score, 40);
    const scoreTotal = colorScore + balanceScore + suitabilityScore;

    const comment = `良い点: ${input.good_point}\n改善点: ${input.improvement_point}`;

    const { error } = await supabase
      .from("outfits")
      .update({
        score_total: scoreTotal,
        score_breakdown: {
          color: colorScore,
          balance: balanceScore,
          suitability: suitabilityScore,
        },
        comment,
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
