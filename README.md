# コーデ採点ゲーム

自分のコーディネートをカメラで撮影すると、AIがプロのスタイリスト視点で採点し、フラットカラーのイラストに変換してくれるWebアプリです。採点結果はランキングで他のユーザーと比較できます。

## 使用技術

- **フレームワーク**: [Next.js](https://nextjs.org) 16 (App Router) / React 19 / TypeScript
- **スタイリング**: Tailwind CSS 4
- **認証・DB・ストレージ**: [Supabase](https://supabase.com)（匿名認証、Postgres、Storage）
- **AI採点**: [Anthropic API](https://www.anthropic.com)（Claude）— 配色・バランス・似合い度の3観点でコーディネートを採点
- **AIイラスト生成**: [Google Gemini API](https://ai.google.dev)（`gemini-2.5-flash-image`）— 撮影写真をフラットカラーのイラスト風に変換
- **デプロイ**: [Vercel](https://vercel.com)

## 遊び方

1. **ログイン**: `/login` でニックネーム（任意）を入力し「ゲストとして始める」を押すと、メール登録なしですぐに遊べます。
2. **撮影**: `/outfits/new` でカメラを起動し、今日のコーディネートを撮影（またはアルバムから写真を選択）します。
3. **保存・採点**: 「保存する」を押すと写真がアップロードされ、AIが以下の3項目を自動採点します。
   - 配色のバランス
   - 全体のシルエット・アイテムバランス
   - 本人への似合い度
   同時に、写真をもとにしたフラットカラーのイラストも生成されます。
4. **コレクション**: `/collection` でこれまで撮影したコーデ一覧と、それぞれのスコア・AIコメントを確認できます。
5. **ランキング**: `/ranking` でスコア上位100件のコーデを閲覧できます。タップするとイラストを確認できます。

## 開発環境のセットアップ

```bash
npm install
```

`.env.local` に以下の環境変数を設定してください。

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

開発サーバーを起動します（`http://localhost:3001` で起動します）。

```bash
npm run dev
```
