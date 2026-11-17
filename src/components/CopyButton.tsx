"use client";

import { useState } from "react";

export default function CopyButton({ text, label, share }: { text: string; label: string; share?: boolean }) {
  const [done, setDone] = useState(false);
  async function onClick() {
    try {
      if (share && navigator.share) {
        await navigator.share({ title: "정금농원 토마토 주문", url: text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* 사용자가 공유를 취소한 경우 */
    }
  }
  return (
    <button type="button" className="btn-sub" onClick={onClick}>
      {done ? "복사했습니다" : label}
    </button>
  );
}
