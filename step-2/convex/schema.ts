import { defineSchema, defineTable } from "convex/schema";
import { v } from "convex/values";

export default defineSchema({
  chapters: defineTable({
    pageNumber: v.number(),
    content: v.string(),
    image: v.union(
      v.null(),
      v.object({
        url: v.string(),
        prompt: v.string(),
      })
    ),
  }).index("by_pageNumber", ["pageNumber"]),
  version: defineTable({
    version: v.number(),
  }),
});
