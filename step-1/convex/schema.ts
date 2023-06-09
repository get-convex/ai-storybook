import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chapters: defineTable({
    pageNumber: v.number(),
    content: v.string(),
    image: v.null(),
  }).index("by_pageNumber", ["pageNumber"]),
});
