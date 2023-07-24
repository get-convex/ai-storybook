import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import {
  DatabaseWriter,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

async function getOrCreateVersion(db: DatabaseWriter): Promise<Doc<"version">> {
  const versionDoc = await db.query("version").first();
  if (versionDoc !== null) {
    return versionDoc;
  }
  const id = await db.insert("version", {
    version: 0,
  });
  return (await db.get(id))!;
}

async function bumpVersion(db: DatabaseWriter): Promise<number> {
  const versionDoc = await getOrCreateVersion(db);
  const newVersion = versionDoc!.version + 1;
  await db.patch(versionDoc!._id, {
    version: newVersion,
  });
  return newVersion;
}

export const updateChapterContents = mutation({
  args: { pageNumber: v.number(), content: v.string() },
  handler: async (ctx, { pageNumber, content }) => {
    let existing = await ctx.db
      .query("chapters")
      .withIndex("by_pageNumber", q => q.eq("pageNumber", pageNumber))
      .first();
    if (existing !== null) {
      await ctx.db.patch(existing._id, {
        content,
      });
    } else {
      await ctx.db.insert("chapters", {
        pageNumber,
        content,
        image: null,
      });
    }
    const version = await bumpVersion(ctx.db);
    const pages = await ctx.db.query("chapters").collect();
    for (let i = 0; i < pages.length; i++) {
      await ctx.scheduler.runAfter(5000, api.ai.populatePageImage, {
        pageNumber: i,
        version,
      });
      await ctx.db.patch(pages[i]._id, {
        image: null,
      });
    }
  },
});

export const getBookState = query({
  args: {},
  handler: async (ctx): Promise<Doc<"chapters">[]> => {
    const pages = await ctx.db
      .query("chapters")
      .withIndex("by_pageNumber")
      .collect();
    return pages;
  },
});

export const getBookStateWithVersion = internalQuery({
  handler: async (ctx): Promise<[number, Doc<"chapters">[]]> => {
    const pages = await ctx.db
      .query("chapters")
      .withIndex("by_pageNumber")
      .collect();
    const versionDoc = await ctx.db.query("version").first();
    return [versionDoc?.version ?? 0, pages];
  },
});

export const updateChapterImage = internalMutation({
  handler: async (
    ctx,
    {
      pageNumber,
      version,
      imageUrl,
      prompt,
    }: {
      pageNumber: number;
      version: number;
      imageUrl: string;
      prompt: string;
    }
  ) => {
    const versionDoc = await getOrCreateVersion(ctx.db);
    if (version === versionDoc!.version) {
      // It's still the same version of the book. Let's go!
      const existing = await ctx.db
        .query("chapters")
        .withIndex("by_pageNumber", q => q.eq("pageNumber", pageNumber))
        .first();
      await ctx.db.patch(existing!._id, {
        image: {
          url: imageUrl,
          prompt,
        },
      });
    } else {
      console.log(
        "Not updating database. AI action was for outdated book version"
      );
    }
  },
});

export const regenerateImageForPage = mutation({
  args: { pageNumber: v.number() },
  handler: async (ctx, { pageNumber }) => {
    const existing = await ctx.db
      .query("chapters")
      .withIndex("by_pageNumber", q => q.eq("pageNumber", pageNumber))
      .first();
    if (existing !== null) {
      await ctx.db.patch(existing._id, {
        image: null,
      });
      const versionDoc = await getOrCreateVersion(ctx.db);
      const version = versionDoc!.version;
      await ctx.scheduler.runAfter(0, api.ai.populatePageImage, {
        pageNumber,
        version,
      });
    }
  },
});
