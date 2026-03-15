import { useState, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { X, Copy, Check, AlertTriangle } from "lucide-react";
import QRCode from "react-qr-code";
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

          <div className="flex justify-center py-2">
            <div className="brutal-border p-3" style={{ borderRadius: "12px", backgroundColor: "#fff" }}>
              <QRCode value={currentUrl} size={160} level="M" />
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="brutal-border brutal-shadow-sm w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm text-white transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a]"
            style={{ backgroundColor: "#1a1a1a", borderRadius: "10px" }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "コピーしました" : "URLをコピー"}
          </button>

          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(currentUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="brutal-border w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm text-white transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px]"
            style={{ backgroundColor: "#06C755", borderRadius: "10px" }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            LINEで共有
          </a>

          {activeTab === "edit" && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "#FEF3C7" }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#D97706" }} />
              <p className="text-xs" style={{ color: "#92400E" }}>
                このURLを知っている人は当番表を編集できます。信頼できる相手にのみ共有してください。
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
