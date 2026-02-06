/*
 * 掃除当番ローテーション表
 * Design: Neo-Brutalism
 * - 太い黒ボーダー (3px) + オフセットシャドウ
 * - 鮮やかな色面: 田中=ブルー, 松丸=オレンジ, 山下=グリーン
 * - M PLUS Rounded 1c フォント
 * - クリーム背景 (#FFF8E7)
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCw, RotateCcw, ChevronRight, Sparkles } from "lucide-react";

// タスク定義
const TASKS = [
  { id: "floor", label: "床（掃除機）", emoji: "🧹" },
  { id: "wiper", label: "クイックルワイパー", emoji: "🪣" },
  { id: "toilet", label: "トイレ/加湿器", emoji: "🚽" },
  { id: "trash", label: "ゴミ捨て", emoji: "🗑️" },
  { id: "office", label: "事務所（そうじ機）", emoji: "🏢" },
  { id: "water", label: "水まわり", emoji: "💧" },
];

// 担当者定義
const MEMBERS = [
  { id: "tanaka", name: "田中", color: "#3B82F6", bgColor: "#DBEAFE", textColor: "#1E3A5F" },
  { id: "matsumaru", name: "松丸", color: "#F97316", bgColor: "#FED7AA", textColor: "#7C2D12" },
  { id: "yamashita", name: "山下", color: "#10B981", bgColor: "#D1FAE5", textColor: "#064E3B" },
];

// 初期割り当て（元のグラフから）
// 田中: 床, クイックルワイパー → index 0,1
// 松丸: トイレ/加湿器, ゴミ捨て → index 2,3
// 山下: 事務所, 水まわり → index 4,5
const INITIAL_ROTATION = 0;

export default function Home() {
  const [rotation, setRotation] = useState(INITIAL_ROTATION);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  // ローテーションに基づいてタスクの割り当てを計算
  const getAssignments = useCallback((rot: number) => {
    const tasksPerPerson = 2;
    const totalMembers = MEMBERS.length;
    const assignments: { member: typeof MEMBERS[0]; tasks: typeof TASKS[number][] }[] = [];

    for (let i = 0; i < totalMembers; i++) {
      const memberIndex = ((i - rot) % totalMembers + totalMembers) % totalMembers;
      const member = MEMBERS[memberIndex];
      const memberTasks = TASKS.slice(i * tasksPerPerson, (i + 1) * tasksPerPerson);
      assignments.push({ member, tasks: memberTasks });
    }

    return assignments;
  }, []);

  const assignments = getAssignments(rotation);

  const handleRotate = (dir: "forward" | "backward") => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(dir);
    if (dir === "forward") {
      setRotation((prev) => (prev + 1) % MEMBERS.length);
    } else {
      setRotation((prev) => (prev - 1 + MEMBERS.length) % MEMBERS.length);
    }
    setTimeout(() => setIsAnimating(false), 500);
  };

  const rotationLabel = rotation === 0 ? "初期" : `${rotation}回目`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF8E7" }}>
      {/* ヘッダー */}
      <header className="pt-8 pb-4 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 mb-3">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <span className="text-sm font-bold tracking-wider uppercase" style={{ color: "#666" }}>
                Cleaning Rotation
              </span>
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: "#1a1a1a" }}>
              掃除当番表
            </h1>
            <p className="mt-2 text-lg font-medium" style={{ color: "#666" }}>
              ボタンを押してローテーションを回そう
            </p>
          </motion.div>
        </div>
      </header>

      {/* ローテーション制御 */}
      <div className="px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="brutal-border brutal-shadow p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ backgroundColor: "#FBBF24", borderRadius: "12px" }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <div
                className="brutal-border w-12 h-12 flex items-center justify-center font-extrabold text-xl"
                style={{ backgroundColor: "#fff", borderRadius: "50%" }}
              >
                {rotation}
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: "#1a1a1a" }}>
                  現在のローテーション
                </div>
                <div className="text-xs font-medium" style={{ color: "#7C5E00" }}>
                  {rotationLabel}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleRotate("backward")}
                disabled={isAnimating}
                className="brutal-border brutal-shadow-sm flex items-center gap-2 px-4 py-2.5 font-bold text-sm transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1a1a1a] disabled:opacity-50"
                style={{ backgroundColor: "#fff", borderRadius: "8px" }}
              >
                <RotateCcw className="w-4 h-4" />
                戻す
              </button>
              <button
                onClick={() => handleRotate("forward")}
                disabled={isAnimating}
                className="brutal-border brutal-shadow-sm flex items-center gap-2 px-5 py-2.5 font-bold text-sm text-white transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1a1a1a] disabled:opacity-50"
                style={{ backgroundColor: "#1a1a1a", borderRadius: "8px" }}
              >
                次へ回す
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 担当者カード */}
      <div className="px-4 py-4 pb-12">
        <div className="max-w-3xl mx-auto flex flex-col gap-5">
          <AnimatePresence mode="wait">
            {assignments.map(({ member, tasks }, groupIndex) => (
              <motion.div
                key={`${member.id}-${rotation}`}
                className="brutal-border brutal-shadow overflow-hidden"
                style={{ borderRadius: "16px", backgroundColor: "#fff" }}
                initial={{
                  x: direction === "forward" ? 60 : -60,
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  x: 0,
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  duration: 0.4,
                  delay: groupIndex * 0.1,
                  type: "spring",
                  stiffness: 200,
                  damping: 25,
                }}
              >
                {/* 担当者ヘッダー */}
                <div
                  className="px-5 py-3.5 flex items-center gap-3"
                  style={{ backgroundColor: member.color }}
                >
                  <div
                    className="brutal-border w-11 h-11 flex items-center justify-center font-extrabold text-lg"
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: "50%",
                      color: member.color,
                    }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <span className="text-xl font-extrabold text-white tracking-wide">
                    {member.name}
                  </span>
                  <div className="ml-auto flex items-center gap-1 text-white/80 text-sm font-bold">
                    <span>{tasks.length}件</span>
                  </div>
                </div>

                {/* タスクリスト */}
                <div className="p-4 flex flex-col gap-3">
                  {tasks.map((task, taskIndex) => (
                    <motion.div
                      key={task.id}
                      className="brutal-border brutal-shadow-sm flex items-center gap-3 px-4 py-3 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a]"
                      style={{
                        backgroundColor: member.bgColor,
                        borderRadius: "10px",
                      }}
                      initial={{ x: 30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{
                        delay: groupIndex * 0.1 + taskIndex * 0.08 + 0.2,
                        duration: 0.3,
                      }}
                    >
                      <span className="text-2xl">{task.emoji}</span>
                      <span
                        className="font-bold text-base"
                        style={{ color: member.textColor }}
                      >
                        {task.label}
                      </span>
                      <ChevronRight
                        className="w-4 h-4 ml-auto"
                        style={{ color: member.color }}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ローテーション一覧（フッター） */}
      <div className="px-4 pb-10">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="brutal-border brutal-shadow-sm p-5"
            style={{ backgroundColor: "#fff", borderRadius: "12px" }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <h2 className="text-sm font-extrabold mb-3 tracking-wider uppercase" style={{ color: "#999" }}>
              ローテーション早見表
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3 font-extrabold" style={{ color: "#1a1a1a" }}>
                      回
                    </th>
                    {TASKS.map((task) => (
                      <th
                        key={task.id}
                        className="text-center py-2 px-2 font-bold text-xs"
                        style={{ color: "#666" }}
                      >
                        {task.emoji}
                        <br />
                        <span className="text-[10px]">{task.label.length > 5 ? task.label.slice(0, 5) + "…" : task.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2].map((rot) => {
                    const rowAssignments = getAssignments(rot);
                    const isCurrentRotation = rot === rotation;
                    return (
                      <tr
                        key={rot}
                        className="transition-colors"
                        style={{
                          backgroundColor: isCurrentRotation ? "#FBBF24" : "transparent",
                          fontWeight: isCurrentRotation ? 800 : 500,
                        }}
                      >
                        <td className="py-2 px-3 font-bold" style={{ borderTop: "2px solid #1a1a1a" }}>
                          {rot === 0 ? "初期" : `${rot}回目`}
                          {isCurrentRotation && " ◀"}
                        </td>
                        {TASKS.map((task, taskIdx) => {
                          const groupIdx = Math.floor(taskIdx / 2);
                          const assignedMember = rowAssignments[groupIdx].member;
                          return (
                            <td
                              key={task.id}
                              className="text-center py-2 px-2 font-bold text-xs"
                              style={{
                                borderTop: "2px solid #1a1a1a",
                                color: assignedMember.color,
                              }}
                            >
                              {assignedMember.name}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
