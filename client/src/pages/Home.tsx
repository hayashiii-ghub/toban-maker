import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { NewScheduleModal } from "@/components/NewScheduleModal";
import { SettingsModal } from "@/components/SettingsModal";
import { useAutoSync } from "@/hooks/useAutoSync";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useScheduleManager } from "@/hooks/useScheduleManager";
import { useShareFlow } from "@/hooks/useShareFlow";
import { safeGetItem, safeSetItem } from "@/lib/storage";
import { OnboardingOverlay } from "@/components/OnboardingOverlay";
import { DesignThemeProvider } from "@/contexts/DesignThemeContext";
import { ANIMATION_DURATION_MS, ONBOARDING_STORAGE_KEY, STORAGE_KEY, TEMPLATES } from "@/rotation/constants";
import { computeAssignments, getEffectiveRotation, normalizeRotation } from "@/rotation/utils";
import { AssignmentsGrid } from "@/features/home/AssignmentsGrid";
import { RotationControls } from "@/features/home/RotationControls";
import { RotationQuickTable } from "@/features/home/RotationQuickTable";
import { RotationCalendar } from "@/features/home/RotationCalendar";
import { ViewTabs, type ViewTabValue } from "@/features/home/ViewTabs";
import { ScheduleHeader } from "@/features/home/ScheduleHeader";
import { ScheduleTabs } from "@/features/home/ScheduleTabs";
import { TodayBanner } from "@/features/home/TodayBanner";
import { ShareModal } from "@/components/ShareModal";
import { InstallPrompt } from "@/components/InstallPrompt";
import "./home.css";

export default function Home() {
  const {
    state, setState, activeSchedule, updateActiveSchedule,
    handleAddSchedule, handleDeleteSchedule, handleDuplicateSchedule,
    handleSaveSettings, selectSchedule, handleTabDrop, addScheduleFromTemplateIndex,
    saveState,
  } = useScheduleManager();

  const { syncStatus, prepareForManualSave } = useAutoSync(activeSchedule, updateActiveSchedule);
  const { isSharing, showShare, setShowShare, handleShare } = useShareFlow({ activeSchedule, prepareForManualSave, updateActiveSchedule });

  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [showSettings, setShowSettings] = useState(false);
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewTab, setViewTab] = useState<ViewTabValue>(() => {
    const saved = safeGetItem("toban-view-tab");
    if (saved === "cards" || saved === "table" || saved === "calendar") return saved;
    return "cards";
  });
  const animationTimeoutRef = useRef<number | null>(null);

  const groups = activeSchedule?.groups ?? [];
  const members = activeSchedule?.members ?? [];
  const effectiveRotation = useMemo(
    () => (activeSchedule ? getEffectiveRotation(activeSchedule) : 0),
    [activeSchedule],
  );
  const isDateMode = activeSchedule?.rotationConfig?.mode === "date";
  const assignments = useMemo(
    () => activeSchedule ? computeAssignments(groups, members, effectiveRotation, activeSchedule.assignmentMode) : [],
    [groups, members, effectiveRotation, activeSchedule],
  );

  useBodyScrollLock(showSettings || showNewSchedule || showShare || confirmDelete !== null);

  useEffect(() => { saveState(state); }, [state]);

  useEffect(() => {
    return () => { if (animationTimeoutRef.current !== null) window.clearTimeout(animationTimeoutRef.current); };
  }, []);

  useEffect(() => {
    const cleanupPrintState = () => {
      delete document.body.dataset.printMode;
      document.getElementById("print-orientation")?.remove();
    };
    window.addEventListener("afterprint", cleanupPrintState);
    return () => { window.removeEventListener("afterprint", cleanupPrintState); cleanupPrintState(); };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateParam = params.get("template");
    if (templateParam !== null) {
      const idx = parseInt(templateParam, 10);
      if (addScheduleFromTemplateIndex(idx, TEMPLATES)) {
        setShowNewSchedule(false);
      }
    } else if (safeGetItem(STORAGE_KEY) === null) {
      setShowNewSchedule(true);
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  useEffect(() => {
    const onboardingDone = safeGetItem(ONBOARDING_STORAGE_KEY) === "true";
    if (onboardingDone || showNewSchedule || showSettings || showShare || confirmDelete !== null || !activeSchedule) return;
    const timer = window.setTimeout(() => setShowOnboarding(true), 800);
    return () => window.clearTimeout(timer);
  }, [activeSchedule, confirmDelete, showNewSchedule, showSettings, showShare]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    safeSetItem(ONBOARDING_STORAGE_KEY, "true");
  }, []);

  const handleRotate = useCallback((nextDirection: "forward" | "backward") => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(nextDirection);
    setState((prev) => {
      const schedule = prev.schedules.find((item) => item.id === prev.activeScheduleId);
      if (!schedule) return prev;
      const activeMembers = schedule.members.filter(m => !m.skipped);
      if (activeMembers.length === 0) return prev;
      const nextRotation = nextDirection === "forward" ? schedule.rotation + 1 : schedule.rotation - 1;
      return {
        ...prev,
        schedules: prev.schedules.map((item) =>
          item.id === prev.activeScheduleId
            ? { ...item, rotation: normalizeRotation(nextRotation, activeMembers.length) }
            : item,
        ),
      };
    });
    if (animationTimeoutRef.current !== null) window.clearTimeout(animationTimeoutRef.current);
    animationTimeoutRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      animationTimeoutRef.current = null;
    }, ANIMATION_DURATION_MS);
  }, [isAnimating, setState]);

  const onAddSchedule = useCallback((template: Parameters<typeof handleAddSchedule>[0]) => {
    handleAddSchedule(template);
    setShowNewSchedule(false);
  }, [handleAddSchedule]);

  const onDeleteSchedule = useCallback((scheduleId: string) => {
    handleDeleteSchedule(scheduleId);
    setConfirmDelete(null);
  }, [handleDeleteSchedule]);

  const onDuplicateSchedule = useCallback(() => {
    handleDuplicateSchedule();
    setShowSettings(false);
  }, [handleDuplicateSchedule]);

  const onSaveSettings = useCallback((...args: Parameters<typeof handleSaveSettings>) => {
    handleSaveSettings(...args);
    setShowSettings(false);
  }, [handleSaveSettings]);

  const onTabDrop = useCallback((targetId: string) => {
    setDraggedTabId((currentDraggedId) => {
      if (currentDraggedId) handleTabDrop(currentDraggedId, targetId);
      return null;
    });
    setDragOverTabId(null);
  }, [handleTabDrop]);

  if (!activeSchedule) {
    return (
      <DesignThemeProvider themeId={undefined}>
        <main className="rotation-page min-h-screen" style={{ backgroundColor: "var(--dt-page-bg)" }}>
          <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
            <p className="text-lg font-bold" style={{ color: "var(--dt-text)" }}>当番表がありません</p>
            <p className="text-sm" style={{ color: "var(--dt-text-secondary)" }}>新しい当番表を作成してください。</p>
            <button
              type="button"
              className="theme-border px-6 py-3 font-bold theme-hover-lift transition-all duration-150"
              style={{ backgroundColor: "var(--dt-button-bg)", borderRadius: "var(--dt-border-radius-sm)", color: "var(--dt-text)" }}
              onClick={() => setShowNewSchedule(true)}
            >
              当番表を作成
            </button>
          </div>
          {createPortal(
            <AnimatePresence>
              {showNewSchedule && <NewScheduleModal onSelect={onAddSchedule} onClose={() => setShowNewSchedule(false)} />}
            </AnimatePresence>,
            document.body,
          )}
          {showOnboarding && <OnboardingOverlay onComplete={handleOnboardingComplete} />}
          <InstallPrompt />
        </main>
      </DesignThemeProvider>
    );
  }

  const rotationLabel = effectiveRotation === 0 ? "初期" : `${effectiveRotation}回目`;

  return (
    <DesignThemeProvider themeId={activeSchedule.designThemeId}>
    <main className="rotation-page min-h-screen" style={{ backgroundColor: "var(--dt-page-bg)" }}>
      <ScheduleHeader scheduleName={activeSchedule.name} rotationLabel={rotationLabel} />

      <RotationControls
        rotation={effectiveRotation}
        rotationLabel={rotationLabel}
        isSharing={isSharing}
        isDateMode={isDateMode}
        isAnimating={isAnimating}
        onPrint={() => {
          document.body.dataset.printMode = viewTab;
          const orientation = viewTab === "calendar" ? "portrait" : "landscape";
          const style = document.createElement("style");
          style.id = "print-orientation";
          style.textContent = `@page { size: A4 ${orientation}; }`;
          document.head.appendChild(style);
          window.print();
        }}
        onOpenSettings={() => setShowSettings(true)}
        onShare={handleShare}
        onRotateForward={() => handleRotate("forward")}
        onRotateBackward={() => handleRotate("backward")}
        syncStatus={syncStatus}
        hasSlug={!!activeSchedule.slug}
      />

      {isDateMode && (
        <TodayBanner groups={groups} members={members} rotation={effectiveRotation} assignmentMode={activeSchedule.assignmentMode} />
      )}

      <ScheduleTabs
        schedules={state.schedules}
        activeScheduleId={state.activeScheduleId}
        draggedTabId={draggedTabId}
        dragOverTabId={dragOverTabId}
        onSelectSchedule={selectSchedule}
        onAddSchedule={() => setShowNewSchedule(true)}
        onDragStart={(event, scheduleId) => { setDraggedTabId(scheduleId); event.dataTransfer.effectAllowed = "move"; }}
        onDragOver={(event, scheduleId) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDragOverTabId(scheduleId); }}
        onDrop={(event, scheduleId) => { event.preventDefault(); onTabDrop(scheduleId); }}
        onDragEnd={() => { setDraggedTabId(null); setDragOverTabId(null); }}
      />

      <ViewTabs viewTab={viewTab} onChangeTab={(tab) => {
        startTransition(() => setViewTab(tab));
        safeSetItem("toban-view-tab", tab);
      }} />

      {viewTab === "cards" && (
        <AssignmentsGrid
          assignments={assignments} direction={direction} rotation={effectiveRotation}
          groupCount={groups.length} scheduleId={activeSchedule.id} stagger={isAnimating}
          assignmentMode={activeSchedule.assignmentMode}
        />
      )}
      {viewTab === "table" && (
        <RotationQuickTable groups={groups} members={members} rotation={effectiveRotation} assignmentMode={activeSchedule.assignmentMode} />
      )}
      {viewTab === "calendar" && (
        <RotationCalendar groups={groups} members={members} rotation={effectiveRotation} rotationConfig={activeSchedule.rotationConfig} assignmentMode={activeSchedule.assignmentMode} />
      )}

      {createPortal(
        <AnimatePresence>
          {showNewSchedule && <NewScheduleModal onSelect={onAddSchedule} onClose={() => setShowNewSchedule(false)} />}
        </AnimatePresence>,
        document.body,
      )}
      {createPortal(
        <AnimatePresence>
          {confirmDelete && (
            <ConfirmDeleteDialog
              scheduleName={state.schedules.find((schedule) => schedule.id === confirmDelete)?.name ?? ""}
              onConfirm={() => onDeleteSchedule(confirmDelete)}
              onCancel={() => setConfirmDelete(null)}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
      {createPortal(
        <AnimatePresence>
          {showSettings && (
            <SettingsModal
              scheduleName={activeSchedule.name} groups={groups} members={members}
              rotationConfig={activeSchedule.rotationConfig} pinned={activeSchedule.pinned}
              assignmentMode={activeSchedule.assignmentMode} designThemeId={activeSchedule.designThemeId}
              canDelete={state.schedules.length > 1}
              onSave={onSaveSettings} onDuplicate={onDuplicateSchedule}
              onDelete={() => { setShowSettings(false); setConfirmDelete(activeSchedule.id); }}
              onClose={() => setShowSettings(false)}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
      {createPortal(
        <AnimatePresence>
          {showShare && activeSchedule.slug && activeSchedule.editToken && (
            <ShareModal slug={activeSchedule.slug} editToken={activeSchedule.editToken} scheduleName={activeSchedule.name} onClose={() => setShowShare(false)} />
          )}
        </AnimatePresence>,
        document.body,
      )}
      {showOnboarding && <OnboardingOverlay onComplete={handleOnboardingComplete} />}
      <InstallPrompt />
    </main>
    </DesignThemeProvider>
  );
}
