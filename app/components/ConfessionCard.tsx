"use client";

import { useState, useEffect, useRef } from "react";

type Confession = {
  id: string;
  content: string;
  category: string | null;
  sentiment: number | null;
  createdAt: string;
  anonId: string;
};

type ConfessionCardProps = {
  confession: Confession;
  onSwipe: (direction: "left" | "right") => void;
  index: number;
};

export default function ConfessionCard({ confession, onSwipe, index }: ConfessionCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [offset, setOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 100; // Minimum distance to trigger swipe
  const ROTATION_FACTOR = 0.1; // Rotation per pixel moved

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setCurrentX(clientX);
    setOffset(diff);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(offset) > SWIPE_THRESHOLD) {
      onSwipe(offset > 0 ? "right" : "left");
    } else {
      // Snap back
      setOffset(0);
      setCurrentX(0);
    }
  };

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const onMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const onTouchEnd = () => {
    handleEnd();
  };

  // Global mouse events for dragging outside card
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleMouseUp = () => handleEnd();

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startX, offset]);

  const rotation = offset * ROTATION_FACTOR;
  const opacity = index === 0 ? 1 : Math.max(0.3, 1 - index * 0.2);
  const scale = index === 0 ? 1 : Math.max(0.85, 1 - index * 0.05);
  const translateY = index * 8;

  const getSentimentEmoji = (sentiment: number | null) => {
    if (sentiment === null) return "😐";
    if (sentiment > 0.3) return "😊";
    if (sentiment < -0.3) return "😢";
    return "😐";
  };

  return (
    <div
      ref={cardRef}
      className="absolute w-full h-full transition-all duration-300 ease-out cursor-grab active:cursor-grabbing"
      style={{
        transform: `translateX(${offset}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale})`,
        opacity,
        zIndex: 100 - index,
        pointerEvents: index === 0 ? "auto" : "none",
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="h-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
              {confession.anonId}
            </span>
            <span className="text-2xl">{getSentimentEmoji(confession.sentiment)}</span>
          </div>
          <div className="text-right">
            {confession.category && (
              <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">
                {confession.category.replace(/_/g, " ")}
              </span>
            )}
            <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              {new Date(confession.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap text-lg leading-relaxed">
            {confession.content}
          </p>
        </div>

        {/* Swipe indicators */}
        {Math.abs(offset) > 50 && (
          <div
            className={`absolute inset-0 flex items-center justify-center text-6xl font-bold rounded-2xl ${
              offset > 0
                ? "bg-green-500/20 text-green-600"
                : "bg-red-500/20 text-red-600"
            }`}
          >
            {offset > 0 ? "👍" : "👎"}
          </div>
        )}

        {/* Vote Buttons - Only show on top card */}
        {index === 0 && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSwipe("left");
              }}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>👎</span>
              <span>Downvote</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSwipe("right");
              }}
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>👍</span>
              <span>Upvote</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

