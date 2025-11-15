"use client";

import { useEffect, useState } from "react";
import ConfessionCard from "@/app/components/ConfessionCard";

type Confession = {
  id: string;
  content: string;
  category: string | null;
  sentiment: number | null;
  createdAt: string;
  anonId: string;
  upvotes: number;
  downvotes: number;
  trendingScore: number;
};

type Category =
  | "LOVE_RELATIONSHIPS"
  | "FAMILY_FRIENDS"
  | "WORK_SCHOOL"
  | "SECRETS_LIES"
  | "REGRETS_MISTAKES"
  | "DREAMS_ASPIRATIONS"
  | "FEARS_ANXIETIES"
  | "GUILT_SHAME"
  | "ANGER_FRUSTRATION"
  | "GRATITUDE_THANKS"
  | "CONFUSION_DOUBT"
  | "LONELINESS_ISOLATION"
  | "SUCCESS_ACHIEVEMENT"
  | "FAILURE_DISAPPOINTMENT"
  | "OTHER";

const SWIPED_IDS_STORAGE = "swiped_confession_ids";

export default function TrendingPage() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load swiped IDs from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SWIPED_IDS_STORAGE);
      if (stored) {
        try {
          const ids = JSON.parse(stored);
          setSwipedIds(new Set(ids));
        } catch (error) {
          console.error("Error loading swiped IDs:", error);
        }
      }
    }
  }, []);

  // Load user's votes from server
  useEffect(() => {
    const loadUserVotes = async () => {
      try {
        const response = await fetch("/api/votes");
        if (response.ok) {
          const data = await response.json();
          const votedConfessionIds = new Set(
            data.votes?.map((v: { confessionId: string }) => v.confessionId) || []
          );
          setVotedIds(votedConfessionIds);
          setSwipedIds((prev) => {
            const combined = new Set([...prev, ...votedConfessionIds]);
            if (typeof window !== "undefined") {
              localStorage.setItem(SWIPED_IDS_STORAGE, JSON.stringify(Array.from(combined)));
            }
            return combined;
          });
        }
      } catch (error) {
        console.error("Error loading user votes:", error);
      }
    };

    loadUserVotes();
  }, []);

  // Load trending confessions
  useEffect(() => {
    const loadTrending = async () => {
      try {
        setLoading(true);
        const categoryParam = selectedCategoryFilter === "all" ? "" : `&category=${selectedCategoryFilter}`;
        const response = await fetch(`/api/trending?limit=50${categoryParam}`);
        const data = await response.json();

        if (response.ok && data.confessions) {
          // Filter out already swiped/voted confessions
          const allSwipedIds = new Set([...swipedIds, ...votedIds]);
          const filtered = data.confessions.filter(
            (c: Confession) => !allSwipedIds.has(c.id)
          );
          setConfessions(filtered);
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error("Error loading trending confessions:", error);
      } finally {
        setLoading(false);
      }
    };

    // Wait a bit to ensure votes are loaded first
    const timer = setTimeout(loadTrending, 100);
    return () => clearTimeout(timer);
  }, [selectedCategoryFilter, swipedIds, votedIds]);

  const handleVote = async (confessionId: string, value: 1 | -1) => {
    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confessionId, value }),
      });

      if (!response.ok) {
        console.error("Failed to record vote");
      }
    } catch (error) {
      console.error("Error recording vote:", error);
    }
  };

  const handleSwipe = (confessionId: string, direction: "left" | "right") => {
    // Record vote before swiping
    const voteValue = direction === "right" ? 1 : -1;
    handleVote(confessionId, voteValue);

    // Mark as swiped and voted
    setSwipedIds((prev) => {
      const updated = new Set(prev).add(confessionId);
      if (typeof window !== "undefined") {
        localStorage.setItem(SWIPED_IDS_STORAGE, JSON.stringify(Array.from(updated)));
      }
      return updated;
    });

    setVotedIds((prev) => new Set(prev).add(confessionId));

    // Move to next confession
    setCurrentIndex((prev) => prev + 1);
  };

  // Get visible confessions (show top 3 for stack effect)
  const visibleConfessions = confessions
    .slice(currentIndex, currentIndex + 3)
    .map((c) => ({
      id: c.id,
      content: c.content,
      category: c.category,
      sentiment: c.sentiment,
      createdAt: c.createdAt,
      anonId: c.anonId,
    }));

  const currentConfession = confessions[currentIndex];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            Trending Confessions
          </h1>
          <a
            href="/"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Feed
          </a>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
            Filter by Category
          </label>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="LOVE_RELATIONSHIPS">Love & Relationships</option>
            <option value="FAMILY_FRIENDS">Family & Friends</option>
            <option value="WORK_SCHOOL">Work & School</option>
            <option value="SECRETS_LIES">Secrets & Lies</option>
            <option value="REGRETS_MISTAKES">Regrets & Mistakes</option>
            <option value="DREAMS_ASPIRATIONS">Dreams & Aspirations</option>
            <option value="FEARS_ANXIETIES">Fears & Anxieties</option>
            <option value="GUILT_SHAME">Guilt & Shame</option>
            <option value="ANGER_FRUSTRATION">Anger & Frustration</option>
            <option value="GRATITUDE_THANKS">Gratitude & Thanks</option>
            <option value="CONFUSION_DOUBT">Confusion & Doubt</option>
            <option value="LONELINESS_ISOLATION">Loneliness & Isolation</option>
            <option value="SUCCESS_ACHIEVEMENT">Success & Achievement</option>
            <option value="FAILURE_DISAPPOINTMENT">Failure & Disappointment</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Trending Confessions */}
        {loading ? (
          <div className="relative h-[600px] bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
            <div className="text-zinc-500 dark:text-zinc-400">Loading trending confessions...</div>
          </div>
        ) : visibleConfessions.length === 0 ? (
          <div className="relative h-[600px] bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
            <div className="text-center text-zinc-500 dark:text-zinc-400">
              <p className="text-lg mb-2">No more trending confessions</p>
              <p className="text-sm">All trending confessions have been viewed</p>
            </div>
          </div>
        ) : (
          <div className="relative h-[600px]">
            {visibleConfessions.map((confession, index) => (
              <ConfessionCard
                key={confession.id}
                confession={confession}
                onSwipe={(direction) => handleSwipe(confession.id, direction)}
                index={index}
              />
            ))}

            {/* Trending Score Display */}
            {currentConfession && (
              <div className="absolute top-4 right-4 z-50 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                Trending: {currentConfession.trendingScore.toFixed(2)}
              </div>
            )}

            {/* Vote Count Display */}
            {currentConfession && (
              <div className="absolute top-4 left-4 z-50 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                <span className="text-green-600 dark:text-green-400">↑ {currentConfession.upvotes}</span>
                <span className="mx-2 text-zinc-400">•</span>
                <span className="text-red-600 dark:text-red-400">↓ {currentConfession.downvotes}</span>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            Showing {currentIndex + 1} of {confessions.length} trending confessions
          </span>
        </div>
      </div>
    </div>
  );
}

