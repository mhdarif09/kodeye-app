"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

const REPORT_REASONS = [
  "Perilaku tidak pantas / kasar",
  "Spam / tidak relevan",
  "Curang / exploiting",
  "AFK / tidak merespons",
  "Lainnya",
];

interface QuickActionsProps {
  onFinish: () => void;
  onReport: (reason: string) => void;
  isSessionStarted: boolean;
}

export function QuickActions({ onFinish, onReport, isSessionStarted }: QuickActionsProps) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);

  const handleReport = () => {
    if (!selectedReason) return;
    onReport(selectedReason);
    setIsReportOpen(false);
    setSelectedReason("");
  };

  const handleFinish = () => {
    onFinish();
    setIsFinishConfirmOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Pause / Extend — disabled, not in scope */}
        <div className="relative">
          <Button variant="secondary" className="opacity-40 cursor-not-allowed" disabled size="sm">
            ⏸ Jeda
          </Button>
        </div>

        {/* Report */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsReportOpen(true)}
          className="text-muted-foreground"
        >
          🚩 Laporkan
        </Button>

        {/* Finish */}
        <Button
          variant="danger"
          size="sm"
          onClick={() => setIsFinishConfirmOpen(true)}
          disabled={!isSessionStarted}
        >
          ✅ Selesai
        </Button>
      </div>

      {/* Finish confirm modal */}
      <Modal isOpen={isFinishConfirmOpen} onClose={() => setIsFinishConfirmOpen(false)} className="max-w-sm">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Selesaikan sesi?</h3>
          <p className="text-sm text-muted-foreground">
            Klik "Selesai" untuk menandai bahwa kamu sudah menyelesaikan peranmu.
            Sesi berakhir saat kedua peserta selesai atau waktu habis.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setIsFinishConfirmOpen(false)}>Batal</Button>
            <Button variant="danger" onClick={handleFinish}>Selesai</Button>
          </div>
        </div>
      </Modal>

      {/* Report modal */}
      <Modal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} className="max-w-sm">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Laporkan masalah</h3>
          <p className="text-sm text-muted-foreground">Pilih alasan laporan:</p>
          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={cn(
                  "w-full text-left px-4 py-2.5 rounded-md border text-sm transition-colors",
                  selectedReason === reason
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border hover:bg-muted text-muted-foreground"
                )}
              >
                {reason}
              </button>
            ))}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setIsReportOpen(false)}>Batal</Button>
            <Button
              variant="primary"
              onClick={handleReport}
              disabled={!selectedReason}
            >
              Kirim Laporan
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
