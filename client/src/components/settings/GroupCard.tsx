import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, ArrowUp, ArrowDown, X, Settings2 } from "lucide-react";
import type { Member, TaskGroup } from "@/rotation/types";
import { ColorPalette } from "./ColorPalette";

interface Props {
  group: TaskGroup;
  gIdx: number;
  groupCount: number;
  isTaskMode: boolean;
  ownerMember: Member | undefined;
  activeMembers: Member[];
  activeMemberIds: string[];
  membersById: Map<string, Member>;
  // 詳細展開
  openDetailsKey: string | null;
  onToggleDetails: (key: string) => void;
  // カラーパレット
  openColorKey: string | null;
  onToggleColor: (key: string) => void;
  onColorPreset: (memberId: string, presetIdx: number) => void;
  onColorCustom: (memberId: string, hex: string) => void;
  // メンバー名
  onMemberNameChange: (memberId: string, name: string) => void;
  // グループ操作
  onMoveGroup: (gIdx: number, direction: -1 | 1) => void;
  onRemoveGroup: (idx: number) => void;
  onUpdateEmoji: (gIdx: number, emoji: string) => void;
  // タスク操作
  onAddTask: (gIdx: number) => void;
  onUpdateTask: (gIdx: number, tIdx: number, value: string) => void;
  onRemoveTask: (gIdx: number, tIdx: number) => void;
  onMoveTask: (gIdx: number, tIdx: number, direction: -1 | 1) => void;
  // メンバーグループ操作（タスクモード）
  onRemoveMemberFromGroup: (gIdx: number, memberId: string) => void;
  onAddMemberToGroup: (gIdx: number, memberId: string) => void;
  onAddNewMemberToGroup: (gIdx: number) => void;
  onSetExplicitMembers: (gIdx: number) => void;
  onResetToAllMembers: (gIdx: number) => void;
  onReorderMember: (gIdx: number, mIdx: number, direction: -1 | 1) => void;
  // グループDnD
  isGroupDragging: boolean;
  isGroupDropTarget: boolean;
  onGroupDragStart: (e: React.DragEvent, gIdx: number) => void;
  onGroupDragEnd: () => void;
  onGroupReorderDragOver: (e: React.DragEvent, gIdx: number) => void;
  onGroupReorderDrop: (e: React.DragEvent, gIdx: number) => void;
  dragGroupIdx: number | null;
  // タスクDnD
  dragTask: { gIdx: number; tIdx: number } | null;
  dropTarget: { gIdx: number; tIdx: number } | null;
  onTaskDragStart: (e: React.DragEvent, gIdx: number, tIdx: number) => void;
  onTaskDragOver: (e: React.DragEvent, gIdx: number, tIdx: number) => void;
  onTaskDrop: (e: React.DragEvent, gIdx: number, tIdx: number) => void;
  onTaskDragEnd: () => void;
  onGroupDragOver: (e: React.DragEvent) => void;
  onGroupDropZone: (e: React.DragEvent, gIdx: number) => void;
  // メンバーDnD（タスクモード）
  dragMember: { gIdx: number; mIdx: number } | null;
  dropMemberTarget: { gIdx: number; mIdx: number } | null;
  onMemberDragStart: (e: React.DragEvent, gIdx: number, mIdx: number) => void;
  onMemberDragOver: (e: React.DragEvent, gIdx: number, mIdx: number) => void;
  onMemberDrop: (e: React.DragEvent, gIdx: number, mIdx: number) => void;
  onMemberDragEnd: () => void;
}

export function GroupCard({
  group, gIdx, groupCount, isTaskMode, ownerMember, activeMembers, activeMemberIds, membersById,
  openDetailsKey, onToggleDetails,
  openColorKey, onToggleColor, onColorPreset, onColorCustom,
  onMemberNameChange,
  onMoveGroup, onRemoveGroup, onUpdateEmoji,
  onAddTask, onUpdateTask, onRemoveTask, onMoveTask,
  onRemoveMemberFromGroup, onAddMemberToGroup, onAddNewMemberToGroup,
  onSetExplicitMembers, onResetToAllMembers, onReorderMember,
  isGroupDragging, isGroupDropTarget,
  onGroupDragStart, onGroupDragEnd, onGroupReorderDragOver, onGroupReorderDrop, dragGroupIdx,
  dragTask, dropTarget, onTaskDragStart, onTaskDragOver, onTaskDrop, onTaskDragEnd, onGroupDragOver, onGroupDropZone,
  dragMember, dropMemberTarget, onMemberDragStart, onMemberDragOver, onMemberDrop, onMemberDragEnd,
}: Props) {
  return (
    <div
      className={`theme-border transition-all duration-150 ${
        isGroupDragging ? "opacity-30 scale-[0.98]" : ""
      } ${isGroupDropTarget ? "ring-2 ring-amber-400" : ""}`}
      style={{ borderRadius: "var(--dt-border-radius)", backgroundColor: "#FAFAFA" }}
      onDragOver={(e) => onGroupReorderDragOver(e, gIdx)}
      onDrop={(e) => { if (dragGroupIdx !== null) onGroupReorderDrop(e, gIdx); }}
    >
      {/* グループヘッダー */}
      <div
        className="flex items-center gap-2 px-3 sm:px-4 py-2"
        style={{
          backgroundColor: ownerMember ? `${ownerMember.color}15` : "transparent",
          borderBottom: "1px solid #e5e5e5",
        }}
        draggable
        onDragStart={(e) => onGroupDragStart(e, gIdx)}
        onDragEnd={onGroupDragEnd}
      >
        <div className="flex flex-col shrink-0 sm:hidden">
          <button type="button" onClick={() => onMoveGroup(gIdx, -1)} disabled={gIdx === 0} className="p-0.5 disabled:opacity-20" style={{ color: "#999" }} aria-label="グループを上に移動">
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => onMoveGroup(gIdx, 1)} disabled={gIdx === groupCount - 1} className="p-0.5 disabled:opacity-20" style={{ color: "#999" }} aria-label="グループを下に移動">
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
        <GripVertical className="w-4 h-4 shrink-0 cursor-grab active:cursor-grabbing hidden sm:block" style={{ color: "#bbb" }} aria-hidden="true" />
        <span className="text-lg shrink-0 select-none" aria-label={`グループ${gIdx + 1}の絵文字`}>{group.emoji}</span>

        {isTaskMode ? (
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={group.tasks[0] ?? ""}
              onChange={(e) => onUpdateTask(gIdx, 0, e.target.value)}
              placeholder="タスク名を入力"
              className="w-full theme-border px-2 sm:px-3 py-1.5 sm:py-2 text-sm font-medium"
              style={{ borderRadius: "var(--dt-border-radius-sm)", backgroundColor: "#fff" }}
              aria-label={`タスク${gIdx + 1}の名前`}
            />
          </div>
        ) : (
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {ownerMember && (
              <>
                <div
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shrink-0"
                  style={{ backgroundColor: ownerMember.color }}
                />
                <input
                  type="text"
                  value={ownerMember.name}
                  onChange={(e) => onMemberNameChange(ownerMember.id, e.target.value)}
                  placeholder="名前を入力"
                  className="flex-1 min-w-0 theme-border px-2 sm:px-3 py-1.5 sm:py-2 text-sm font-medium"
                  style={{ borderRadius: "var(--dt-border-radius-sm)", backgroundColor: "#fff" }}
                  aria-label={`担当者${gIdx + 1}の名前`}
                />
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => onToggleDetails(`details-${gIdx}`)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          style={{ color: openDetailsKey === `details-${gIdx}` ? "var(--dt-text)" : "#999" }}
          aria-label="詳細設定"
        >
          <Settings2 className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={() => onRemoveGroup(gIdx)}
          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 shrink-0"
          style={{ color: "#EF4444" }}
          disabled={groupCount <= 1}
          aria-label={`グループ${gIdx + 1}を削除`}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* 詳細設定（絵文字・色変更） */}
      {openDetailsKey === `details-${gIdx}` && (
        <div className="px-3 sm:px-4 py-2 flex flex-col gap-2" style={{ backgroundColor: "#f5f5f5", borderBottom: "1px solid #e5e5e5" }}>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold shrink-0" style={{ color: "var(--dt-text-muted)" }}>絵文字</label>
            <input
              type="text"
              value={group.emoji}
              onChange={(e) => onUpdateEmoji(gIdx, e.target.value)}
              className="w-12 text-center text-lg theme-border px-1 py-0.5"
              style={{ borderRadius: "6px", backgroundColor: "#fff" }}
              aria-label={`グループ${gIdx + 1}の絵文字を変更`}
            />
          </div>
          {!isTaskMode && ownerMember && (
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: "var(--dt-text-muted)" }}>色</label>
              <ColorPalette member={ownerMember} onPresetSelect={onColorPreset} onCustomColor={onColorCustom} />
            </div>
          )}
        </div>
      )}

      {/* タスク一覧 / メンバー一覧 */}
      <div
        className="flex flex-col gap-2 px-3 sm:px-4 pb-3 sm:pb-4 pt-2"
        onDragOver={onGroupDragOver}
        onDrop={(e) => onGroupDropZone(e, gIdx)}
      >
        {isTaskMode ? (
          <TaskModeMembers
            group={group}
            gIdx={gIdx}
            activeMemberIds={activeMemberIds}
            activeMembers={activeMembers}
            membersById={membersById}
            openColorKey={openColorKey}
            onToggleColor={onToggleColor}
            onColorPreset={onColorPreset}
            onColorCustom={onColorCustom}
            onMemberNameChange={onMemberNameChange}
            onRemoveMemberFromGroup={onRemoveMemberFromGroup}
            onAddMemberToGroup={onAddMemberToGroup}
            onAddNewMemberToGroup={onAddNewMemberToGroup}
            onSetExplicitMembers={onSetExplicitMembers}
            onResetToAllMembers={onResetToAllMembers}
            onReorderMember={onReorderMember}
            dragMember={dragMember}
            dropMemberTarget={dropMemberTarget}
            onMemberDragStart={onMemberDragStart}
            onMemberDragOver={onMemberDragOver}
            onMemberDrop={onMemberDrop}
            onMemberDragEnd={onMemberDragEnd}
          />
        ) : (
          <AssigneeModeTaskList
            group={group}
            gIdx={gIdx}
            dragTask={dragTask}
            dropTarget={dropTarget}
            onTaskDragStart={onTaskDragStart}
            onTaskDragOver={onTaskDragOver}
            onTaskDrop={onTaskDrop}
            onTaskDragEnd={onTaskDragEnd}
            onUpdateTask={onUpdateTask}
            onRemoveTask={onRemoveTask}
            onMoveTask={onMoveTask}
            onAddTask={onAddTask}
          />
        )}
      </div>
    </div>
  );
}

// --- タスクモード: メンバー行 ---

function TaskModeMembers({
  group, gIdx, activeMemberIds, activeMembers, membersById,
  openColorKey, onToggleColor, onColorPreset, onColorCustom,
  onMemberNameChange, onRemoveMemberFromGroup, onAddMemberToGroup, onAddNewMemberToGroup,
  onSetExplicitMembers, onResetToAllMembers, onReorderMember,
  dragMember, dropMemberTarget, onMemberDragStart, onMemberDragOver, onMemberDrop, onMemberDragEnd,
}: {
  group: TaskGroup;
  gIdx: number;
  activeMemberIds: string[];
  activeMembers: Member[];
  membersById: Map<string, Member>;
  openColorKey: string | null;
  onToggleColor: (key: string) => void;
  onColorPreset: (memberId: string, presetIdx: number) => void;
  onColorCustom: (memberId: string, hex: string) => void;
  onMemberNameChange: (memberId: string, name: string) => void;
  onRemoveMemberFromGroup: (gIdx: number, memberId: string) => void;
  onAddMemberToGroup: (gIdx: number, memberId: string) => void;
  onAddNewMemberToGroup: (gIdx: number) => void;
  onSetExplicitMembers: (gIdx: number) => void;
  onResetToAllMembers: (gIdx: number) => void;
  onReorderMember: (gIdx: number, mIdx: number, direction: -1 | 1) => void;
  dragMember: { gIdx: number; mIdx: number } | null;
  dropMemberTarget: { gIdx: number; mIdx: number } | null;
  onMemberDragStart: (e: React.DragEvent, gIdx: number, mIdx: number) => void;
  onMemberDragOver: (e: React.DragEvent, gIdx: number, mIdx: number) => void;
  onMemberDrop: (e: React.DragEvent, gIdx: number, mIdx: number) => void;
  onMemberDragEnd: () => void;
}) {
  const isImplicitAll = !group.memberIds;
  const groupMemberIds = group.memberIds ?? activeMemberIds;
  const groupMembers = groupMemberIds
    .map((id) => membersById.get(id))
    .filter((m): m is Member => !!m);
  const unassignedMembers = activeMembers.filter((member) => !groupMemberIds.includes(member.id));

  return (
    <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto">
      {isImplicitAll && activeMembers.length > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#D1FAE5", color: "#064E3B" }}>
            全員が担当
          </span>
          <button
            type="button"
            onClick={() => onSetExplicitMembers(gIdx)}
            className="text-xs font-bold hover:underline"
            style={{ color: "var(--dt-text-muted)" }}
          >
            担当者をえらぶ
          </button>
        </div>
      )}
      {!isImplicitAll && groupMembers.map((member, mIdx) => {
        const isMemberDragging = dragMember?.gIdx === gIdx && dragMember?.mIdx === mIdx;
        const isMemberDropTarget = dropMemberTarget?.gIdx === gIdx && dropMemberTarget?.mIdx === mIdx;
        const colorKey = `task-${gIdx}-${member.id}`;
        return (
          <div key={member.id}>
            <div
              className={`relative flex items-center gap-2 transition-all duration-150 ${isMemberDragging ? "opacity-30 scale-95" : ""}`}
              draggable
              onDragStart={(e) => onMemberDragStart(e, gIdx, mIdx)}
              onDragOver={(e) => onMemberDragOver(e, gIdx, mIdx)}
              onDrop={(e) => onMemberDrop(e, gIdx, mIdx)}
              onDragEnd={onMemberDragEnd}
            >
              {isMemberDropTarget && (
                <div className="absolute left-0 right-0 h-0.5 -top-1.5 rounded-full" style={{ backgroundColor: "var(--dt-current-highlight)" }} />
              )}
              <div className="flex flex-col shrink-0 sm:hidden">
                <button
                  type="button"
                  onClick={() => onReorderMember(gIdx, mIdx, -1)}
                  disabled={mIdx === 0}
                  className="p-0.5 disabled:opacity-20"
                  style={{ color: "#999" }}
                  aria-label="上に移動"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onReorderMember(gIdx, mIdx, 1)}
                  disabled={mIdx === groupMembers.length - 1}
                  className="p-0.5 disabled:opacity-20"
                  style={{ color: "#999" }}
                  aria-label="下に移動"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <GripVertical className="w-4 h-4 shrink-0 cursor-grab active:cursor-grabbing hidden sm:block" style={{ color: "#bbb" }} aria-hidden="true" />
              <button
                type="button"
                onClick={() => onToggleColor(colorKey)}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full shrink-0 theme-border transition-transform hover:scale-110"
                style={{ backgroundColor: member.color, borderWidth: "2px" }}
                aria-label="色を変更"
              />
              <input
                type="text"
                value={member.name}
                onChange={(e) => onMemberNameChange(member.id, e.target.value)}
                placeholder="名前を入力"
                className="flex-1 min-w-0 theme-border px-2 sm:px-3 py-1.5 sm:py-2 text-sm font-medium"
                style={{ borderRadius: "var(--dt-border-radius-sm)", backgroundColor: "#fff" }}
                aria-label="メンバーの名前"
              />
              <button
                onClick={() => onRemoveMemberFromGroup(gIdx, member.id)}
                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors shrink-0 disabled:opacity-30"
                style={{ color: "#EF4444" }}
                disabled={groupMembers.length <= 1}
                aria-label={`${member.name}を除外`}
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="pl-7 sm:pl-[1.75rem]">
              {openColorKey === colorKey && (
                <div className="mt-1.5 mb-1">
                  <ColorPalette member={member} onPresetSelect={onColorPreset} onCustomColor={onColorCustom} />
                </div>
              )}
            </div>
          </div>
        );
      })}
      {!isImplicitAll && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onResetToAllMembers(gIdx)}
            className="text-xs font-bold hover:underline"
            style={{ color: "var(--dt-text-muted)" }}
          >
            全員にもどす
          </button>
          {unassignedMembers.length > 0 && (
            <button
              type="button"
              onClick={() => onAddMemberToGroup(gIdx, unassignedMembers[0].id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold hover:bg-gray-100 rounded-lg transition-colors"
              style={{ color: "var(--dt-text-secondary)" }}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> メンバーを追加
            </button>
          )}
          <button
            type="button"
            onClick={() => onAddNewMemberToGroup(gIdx)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold hover:bg-gray-100 rounded-lg transition-colors"
            style={{ color: "var(--dt-text-secondary)" }}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> 新規メンバー
          </button>
        </div>
      )}
    </div>
  );
}

// --- 担当者モード: タスク一覧 ---

function AssigneeModeTaskList({
  group, gIdx, dragTask, dropTarget,
  onTaskDragStart, onTaskDragOver, onTaskDrop, onTaskDragEnd,
  onUpdateTask, onRemoveTask, onMoveTask, onAddTask,
}: {
  group: TaskGroup;
  gIdx: number;
  dragTask: { gIdx: number; tIdx: number } | null;
  dropTarget: { gIdx: number; tIdx: number } | null;
  onTaskDragStart: (e: React.DragEvent, gIdx: number, tIdx: number) => void;
  onTaskDragOver: (e: React.DragEvent, gIdx: number, tIdx: number) => void;
  onTaskDrop: (e: React.DragEvent, gIdx: number, tIdx: number) => void;
  onTaskDragEnd: () => void;
  onUpdateTask: (gIdx: number, tIdx: number, value: string) => void;
  onRemoveTask: (gIdx: number, tIdx: number) => void;
  onMoveTask: (gIdx: number, tIdx: number, direction: -1 | 1) => void;
  onAddTask: (gIdx: number) => void;
}) {
  return (
    <>
      {group.tasks.map((task, tIdx) => {
        const isDragging = dragTask?.gIdx === gIdx && dragTask?.tIdx === tIdx;
        const isTaskDropTarget = dropTarget?.gIdx === gIdx && dropTarget?.tIdx === tIdx;
        return (
          <div
            key={`${group.id}-t${tIdx}`}
            className={`flex items-center gap-2 transition-all duration-150 ${isDragging ? "opacity-30 scale-95" : ""} ${isTaskDropTarget ? "translate-y-1" : ""}`}
            draggable
            onDragStart={(e) => onTaskDragStart(e, gIdx, tIdx)}
            onDragOver={(e) => onTaskDragOver(e, gIdx, tIdx)}
            onDrop={(e) => { e.stopPropagation(); onTaskDrop(e, gIdx, tIdx); }}
            onDragEnd={onTaskDragEnd}
          >
            {isTaskDropTarget && (
              <div className="absolute left-0 right-0 h-0.5 -top-1.5 rounded-full" style={{ backgroundColor: "var(--dt-current-highlight)" }} />
            )}
            <div className="flex flex-col shrink-0 sm:hidden">
              <button type="button" onClick={() => onMoveTask(gIdx, tIdx, -1)} disabled={tIdx === 0} className="p-0.5 disabled:opacity-20" style={{ color: "#999" }} aria-label="上に移動">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => onMoveTask(gIdx, tIdx, 1)} disabled={tIdx === group.tasks.length - 1} className="p-0.5 disabled:opacity-20" style={{ color: "#999" }} aria-label="下に移動">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <GripVertical className="w-4 h-4 shrink-0 cursor-grab active:cursor-grabbing hidden sm:block" style={{ color: "#bbb" }} aria-hidden="true" />
            <input
              type="text"
              value={task}
              onChange={(e) => onUpdateTask(gIdx, tIdx, e.target.value)}
              placeholder="タスク名を入力"
              className="flex-1 min-w-0 theme-border px-3 py-2 text-sm font-medium"
              style={{ borderRadius: "var(--dt-border-radius-sm)", backgroundColor: "#fff" }}
              aria-label={`グループ${gIdx + 1}のタスク${tIdx + 1}`}
            />
            <button
              onClick={() => onRemoveTask(gIdx, tIdx)}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              style={{ color: "#EF4444" }}
              aria-label={`タスク「${task || "空"}」を削除`}
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
      <button
        onClick={() => onAddTask(gIdx)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold self-start hover:bg-gray-100 rounded-lg transition-colors"
        style={{ color: "var(--dt-text-secondary)" }}
      >
        <Plus className="w-3.5 h-3.5" aria-hidden="true" /> タスクを追加
      </button>
    </>
  );
}
