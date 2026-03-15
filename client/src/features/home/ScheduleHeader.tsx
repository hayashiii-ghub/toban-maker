import { motion } from "framer-motion";

interface ScheduleHeaderProps {
  scheduleName: string;
  rotationLabel: string;
}

export function ScheduleHeader({
  scheduleName,
  rotationLabel,
}: ScheduleHeaderProps) {
  return (
    <header className="rotation-print-header pt-6 sm:pt-8 pb-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight rotation-no-print"
            style={{ color: "#1a1a1a" }}
          >
            {scheduleName}
          </h1>
          <div
            className="rotation-print-only text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight"
            style={{ color: "#1a1a1a" }}
            aria-hidden="true"
          >
            {scheduleName}
          </div>

          <div className="rotation-print-only mt-2 text-sm font-bold" style={{ color: "#666" }}>
            ローテーション: {rotationLabel} ／ 印刷日: {new Date().toLocaleDateString("ja-JP")}
          </div>
        </motion.div>
      </div>
    </header>
  );
}
