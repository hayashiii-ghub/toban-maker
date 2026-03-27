import { ApiError } from "./api";

export type ShareStage = "save" | "publish";

export function getShareErrorMessage(error: unknown, stage: ShareStage): string {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return stage === "publish"
        ? "共有公開のリクエスト内容が不正です"
        : "保存内容に不正な値があります";
    }
    if (error.status === 401 || error.status === 403) {
      return "編集権限の確認に失敗しました。共有リンクを作り直してください";
    }
    if (error.status === 404) {
      return stage === "publish"
        ? "保存先が見つかりません。もう一度共有をやり直してください"
        : "保存先が見つかりません";
    }
    if (error.status >= 500) {
      return stage === "publish"
        ? "保存はできましたが公開に失敗しました。時間をおいて再度お試しください"
        : "サーバーで保存に失敗しました。時間をおいて再度お試しください";
    }
  }

  return stage === "publish"
    ? "保存はできましたが公開に失敗しました"
    : "保存に失敗しました。ネットワーク接続を確認してください";
}
