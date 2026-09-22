"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { scoreOutfit } from "@/app/actions/score";

export default function NewOutfitPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "saving" | "scoring" | "error"
  >("idle");

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
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

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.9,
    );
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCapturedBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
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

    const { data: inserted, error: insertError } = await supabase
      .from("outfits")
      .insert({
        user_id: user.id,
        photo_url: publicUrl,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      setStatus("error");
      return;
    }

    setStatus("scoring");
    await scoreOutfit(inserted.id);

    window.location.href = "/collection";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-6 py-8">
      <h1 className="text-xl font-bold">コーデを撮影</h1>

      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
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
            className="flex-1 rounded-md bg-black px-3 py-2 text-white disabled:opacity-30"
          >
            撮影する
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            写真を選択
          </button>
        </div>
      )}

      {previewUrl && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRetake}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            撮り直す
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving" || status === "scoring"}
            className="flex-1 rounded-md bg-black px-3 py-2 text-white disabled:opacity-50"
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
    </main>
  );
}
