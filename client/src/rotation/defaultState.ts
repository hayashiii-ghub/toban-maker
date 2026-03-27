import type { AppState } from "./types";

/**
 * ローカルストレージが空のときに使うデフォルト状態。
 * 「現在の状態をデフォルトに設定」でコピーしたJSONをここに反映すると、
 * 次回からの初回表示がその状態になります。
 */
export const DEFAULT_APP_STATE: AppState = {
  schedules: [
    {
      id: "s_default_1",
      name: "はじめてガイド",
      rotation: 0,
      assignmentMode: "task",
      designThemeId: "chalkboard",
      groups: [
        { id: "g1", tasks: ["テンプレートから選ぶ", "「テンプレート」ボタンから好きな当番表を選ぼう"], emoji: "📋" },
        { id: "g2", tasks: ["メンバー・タスクを編集", "名前やタスクをタップして自由に変更できるよ"], emoji: "✏️" },
        { id: "g3", tasks: ["ローテーションを回す", "◀ ▶ ボタンで担当者を切り替えよう"], emoji: "🔄" },
        { id: "g4", tasks: ["印刷 or 共有する", "完成したら印刷・PDF保存・URL共有ができるよ"], emoji: "🖨️" },
      ],
      members: [
        { id: "m1", name: "ステップ1", color: "#3B82F6", bgColor: "#DBEAFE", textColor: "#1E3A5F" },
        { id: "m2", name: "ステップ2", color: "#10B981", bgColor: "#D1FAE5", textColor: "#064E3B" },
        { id: "m3", name: "ステップ3", color: "#F97316", bgColor: "#FED7AA", textColor: "#7C2D12" },
        { id: "m4", name: "ステップ4", color: "#8B5CF6", bgColor: "#EDE9FE", textColor: "#4C1D95" },
      ],
    },
  ],
  activeScheduleId: "s_default_1",
};
