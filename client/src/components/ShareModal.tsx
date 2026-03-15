import { useState, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { X, Copy, Check, AlertTriangle } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { toast } from "sonner";

type ShareTab = "view" | "edit";

interface Props {
  slug: string;
  editToken: string;
  scheduleName: string;
  onClose: () => void;
}

export function ShareModal({ slug, editToken, scheduleName, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<ShareTab>("view");
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<number | null>(null);

  const viewUrl = useMemo(() => {
    return `${window.location.origin}/s/${slug}`;
  }, [slug]);

  const editUrl = useMemo(() => {
    const json = JSON.stringify({ slug, editToken, name: scheduleName });
    const encoded = btoa(unescape(encodeURIComponent(json)));
    return `${window.location.origin}/transfer?data=${encoded}`;
  }, [slug, editToken, scheduleName]);

  const currentUrl = activeTab === "view" ? viewUrl : editUrl;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    toast.success(activeTab === "view" ? "閲覧用URLをコピーしました" : "編集用URLをコピーしました");
    if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
  }, [currentUrl, activeTab]);

  const handleTabChange = (tab: ShareTab) => {
    setActiveTab(tab);
    setCopied(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  useEscapeKey(onClose);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 no-print"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleBackdropClick}
    >
      <motion.div
        ref={modalRef}
        className="brutal-border brutal-shadow w-full max-w-md overflow-hidden sm:rounded-2xl rounded-t-2xl rounded-b-none sm:rounded-b-2xl"
        style={{ backgroundColor: "#fff" }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "3px solid #1a1a1a" }}>
          <h2 className="text-lg font-extrabold" style={{ color: "#1a1a1a" }}>共有</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors" aria-label="閉じる">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* タブ切り替え */}
        <div className="grid grid-cols-2" style={{ borderBottom: "3px solid #1a1a1a" }}>
          <button
            className="py-3 text-sm font-bold transition-colors"
            style={{
              backgroundColor: activeTab === "view" ? "#FBBF24" : "transparent",
              color: "#1a1a1a",
              borderRight: "1.5px solid #1a1a1a",
            }}
            onClick={() => handleTabChange("view")}
          >
            閲覧のみ
          </button>
          <button
            className="py-3 text-sm font-bold transition-colors"
            style={{
              backgroundColor: activeTab === "edit" ? "#FBBF24" : "transparent",
              color: "#1a1a1a",
              borderLeft: "1.5px solid #1a1a1a",
            }}
            onClick={() => handleTabChange("edit")}
          >
            編集権限あり
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm" style={{ color: "#666" }}>
            {activeTab === "view"
              ? `「${scheduleName}」の閲覧用リンクです。このURLを共有すると、誰でも当番表を見ることができます。`
              : `「${scheduleName}」の編集権限付きリンクです。このURLを開くと、編集権限を引き継げます。`}
          </p>

          <div
            className="brutal-border p-3 text-xs font-mono break-all"
            style={{ borderRadius: "8px", backgroundColor: "#FAFAFA", color: "#333" }}
          >
            {currentUrl}
          </div>

          <button
            onClick={handleCopy}
            className="brutal-border brutal-shadow-sm w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm text-white transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a]"
            style={{ backgroundColor: "#1a1a1a", borderRadius: "10px" }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "コピーしました" : "URLをコピー"}
          </button>

          {activeTab === "edit" && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "#FEF3C7" }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#D97706" }} />
              <p className="text-xs" style={{ color: "#92400E" }}>
                このURLには編集トークンが含まれています。信頼できる相手にのみ共有してください。
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
