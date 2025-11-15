import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import Sentiment from "sentiment";
import * as leoProfanity from "leo-profanity";

const sentiment = new Sentiment();

// ✅ Initialize the filter dictionary once
leoProfanity.loadDictionary("en");

export async function POST(req: Request) {
  try {
    const { content, category } = await req.json();

    if (!content || content.trim().length < 5) {
      return Response.json(
        { error: "Confession content too short" },
        { status: 400 }
      );
    }

    // 1️⃣ Run profanity filter
    const isProfane = leoProfanity.check(content);
    const cleanedContent = isProfane ? leoProfanity.clean(content) : content;

    // 2️⃣ Sentiment analysis
    const sentimentResult = sentiment.analyze(cleanedContent);
    const sentimentScore = Math.max(
      -1,
      Math.min(1, sentimentResult.score / 10)
    ); // normalize

    // 3️⃣ Generate anonymous alias + session
    let sessionId = req.headers.get("x-session-id");
    if (!sessionId) sessionId = nanoid(12);

    const alias = `anon_${nanoid(6)}`;

    // 4️⃣ Save to database
    const confession = await prisma.confession.create({
      data: {
        content: cleanedContent,
        category: category || "OTHER",
        sentiment: sentimentScore,
        flags: isProfane ? ["profanity"] : [],
        moderationStatus: isProfane ? "pending" : "approved",
        author: {
          connectOrCreate: {
            where: { alias },
            create: { alias },
          },
        },
      },
    });

    // 5️⃣ Add to moderation queue if necessary
    if (isProfane) {
      await prisma.moderationQueue.create({
        data: {
          confessionId: confession.id,
          reason: "Profanity detected",
        },
      });
    }

    // 6️⃣ Return response
    return Response.json(
      {
        message: "Confession submitted successfully",
        confession,
        sessionId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error posting confession:", error);
    return Response.json(
      { error: "Failed to post confession" },
      { status: 500 }
    );
  }
}
