"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface PeerRatingFormProps {
  sessionId: string;
  toUserId: string;
  onSubmitted: () => void;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill={(hovered || value) >= star ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "transition-colors",
              (hovered || value) >= star ? "text-amber-400" : "text-muted-foreground/40"
            )}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function PeerRatingForm({ sessionId, toUserId, onSubmitted }: PeerRatingFormProps) {
  const [rating, setRating] = useState(0);
  const [positiveFeedback, setPositiveFeedback] = useState("");
  const [improvementFeedback, setImprovementFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Pilih rating bintang dulu");
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/api/sessions/${sessionId}/peer-rating`, {
        toUserId,
        rating,
        positiveFeedback: positiveFeedback.trim() || null,
        improvementFeedback: improvementFeedback.trim() || null,
      });
      toast.success("Rating berhasil dikirim!");
      onSubmitted();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mengirim rating");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium">Rating untuk partner kamu</label>
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && (
          <p className="text-xs text-muted-foreground">
            {["", "Kurang memuaskan", "Cukup", "Bagus", "Sangat bagus", "Luar biasa!"][rating]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="positive">
          Yang bagus dari partner kamu...
        </label>
        <textarea
          id="positive"
          value={positiveFeedback}
          onChange={(e) => setPositiveFeedback(e.target.value)}
          placeholder="Komunikasi yang jelas, responsif, ide-ide bagus..."
          rows={3}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="improvement">
          Yang bisa diperbaiki...
        </label>
        <textarea
          id="improvement"
          value={improvementFeedback}
          onChange={(e) => setImprovementFeedback(e.target.value)}
          placeholder="Bisa lebih aktif mendengar, perlu lebih jelas dalam penjelasan..."
          rows={3}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || rating === 0}
        className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        {isLoading ? "Mengirim..." : "Kirim Rating"}
      </button>
    </form>
  );
}
