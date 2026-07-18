"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function FeedbackPage() {
  const [type, setType] = useState("suggestion");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return toast.error("Pesan tidak boleh kosong");
    setSending(true);
    try {
      await api.post("/api/users/feedback", { type, message: message.trim() });
      toast.success("Feedback terkirim! Terima kasih.");
      setMessage("");
      setType("suggestion");
    } catch {
      toast.error("Gagal mengirim feedback");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kirim saran, laporan bug, atau apapun yang ingin kamu sampaikan ke tim Kodeye.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Tipe</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-md border border-input bg-transparent"
          >
            <option value="suggestion">Saran</option>
            <option value="bug_report">Laporan Bug</option>
            <option value="praise">Pujian</option>
            <option value="other">Lainnya</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Pesan</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis pesanmu di sini..."
            rows={5}
            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {sending ? "Mengirim..." : "Kirim Feedback"}
        </button>
      </form>

      <div className="mt-10 p-4 rounded-xl border border-border bg-secondary/10">
        <p className="text-xs text-muted-foreground">
          Setiap feedback yang kamu kirimkan akan kami baca dan pertimbangkan untuk pengembangan Kodeye ke depannya.
        </p>
      </div>
    </div>
  );
}
