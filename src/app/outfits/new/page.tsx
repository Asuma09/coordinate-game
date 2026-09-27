"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { scoreOutfit } from "@/app/actions/score";
import { illustrateOutfit } from "@/app/actions/illustrate";
import { BottomNav } from "@/components/bottom-nav";
import { CameraIcon, PhotoIcon, RefreshIcon } from "@/components/icons";

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.85;

// 画像をcanvasで最大辺1280pxに縮小し、JPEG(quality 0.85)に再エンコードして
// アップロード容量とAI採点・イラスト生成にかかる時間を抑える。
async function compressImage(source: Blob): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(source);
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return source;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    return blob ?? source;
  } catch {
    return source;
  }
}

export default function NewOutfitPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState<
    "idle" | "saving" | "scoring" | "error"
  >("idle");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      const metaNickname = user?.user_metadata?.nickname;
      if (typeof metaNickname === "string" && metaNickname.trim()) {
        setNickname(metaNickname);
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setCameraError(true);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight),
    );
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const compressed = await compressImage(file);
      setCapturedBlob(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  }

  function handleRetake() {
    setCapturedBlob(null);
    setPreviewUrl(null);
    setStatus("idle");
  }

  async function handleSave() {
    if (!capturedBlob) return;
    setStatus("saving");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("error");
      return;
    }

    const path = `${user.id}/${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("outfit-photos")
      .upload(path, capturedBlob, { contentType: "image/jpeg" });

    if (uploadError) {
      setStatus("error");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("outfit-photos").getPublicUrl(path);

    const trimmedNickname = nickname.trim() || "ゲスト";

    const { data: inserted, error: insertError } = await supabase
      .from("outfits")
      .insert({
        user_id: user.id,
        photo_url: publicUrl,
        nickname: trimmedNickname,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      setStatus("error");
      return;
    }

    setStatus("scoring");
    // 採点が終わり次第すぐコレクションに遷移する。イラスト生成は裏側で継続し、
    // コレクション側でポーリングして完成次第反映する（体感速度優先）。
    await scoreOutfit(inserted.id);
    illustrateOutfit(inserted.id).catch(() => {});

    router.push("/collection");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-6 py-8 pb-24">
      <h1 className="text-xl font-bold text-gray-800">コーデを撮影</h1>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="nickname" className="text-sm text-gray-600">
          表示名（このコーデ用）
        </label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          maxLength={20}
          placeholder="例: あすま"
          className="rounded-2xl border border-purple-100 bg-white/80 px-4 py-2.5 text-sm shadow-sm focus:border-purple-300 focus:outline-none"
        />
      </div>

      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-white/60 bg-sky-50 shadow-md shadow-purple-100">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="撮影したコーデ"
            className="h-full w-full object-cover"
          />
        ) : cameraError ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-500">
            カメラにアクセスできませんでした。下のボタンから写真を選択してください。
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!previewUrl && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCapture}
            disabled={cameraError}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-orange-300 px-3 py-2.5 font-semibold text-white shadow-md shadow-pink-200 disabled:opacity-30"
          >
            <CameraIcon className="h-4 w-4" />
            撮影する
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center justify-center gap-1.5 rounded-full border border-purple-100 bg-white/80 px-3 py-2.5 text-sm text-gray-600 shadow-sm disabled:opacity-50"
          >
            <PhotoIcon className="h-4 w-4" />
            {isProcessing ? "処理中..." : "写真を選択"}
          </button>
        </div>
      )}

      {previewUrl && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRetake}
            className="flex items-center justify-center gap-1.5 rounded-full border border-purple-100 bg-white/80 px-3 py-2.5 text-sm text-gray-600 shadow-sm"
          >
            <RefreshIcon className="h-4 w-4" />
            撮り直す
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving" || status === "scoring"}
            className="flex-1 rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-orange-300 px-3 py-2.5 font-semibold text-white shadow-md shadow-pink-200 disabled:opacity-50"
          >
            {status === "saving"
              ? "保存中..."
              : status === "scoring"
                ? "AIが採点中..."
                : "保存する"}
          </button>
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600">
          保存に失敗しました。もう一度お試しください。
        </p>
      )}
      <BottomNav />
    </main>
  );
}
