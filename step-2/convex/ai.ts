"use node";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { Replicate } from "langchain/llms/replicate";

export const populatePageImage = action(
  async (
    { runQuery, runMutation },
    { pageNumber, version }: { pageNumber: number; version: number }
  ) => {
    console.log(
      `Hello from populatePageImage for page ${pageNumber} at book version ${version}`
    );
    const [currentVersion, book] = await runQuery(
      internal.chapters.getBookStateWithVersion
    );
    if (currentVersion !== version) {
      console.log("Outdated! Exiting.");
      return;
    }
    if (book[pageNumber].content.trim() === "") {
      return;
    }
    const [imageUrl, prompt] = await getPageImage(book, pageNumber);
    console.log(`Got a result! ${imageUrl}, ${prompt}`);
    await runMutation(internal.chapters.updateChapterImage, {
      pageNumber,
      version,
      imageUrl,
      prompt,
    });
  }
);

async function getPageImage(
  book: Doc<"chapters">[],
  pageNumber: number
): Promise<[string, string]> {
  const prompt = book[pageNumber].content;
  const imageModel = new Replicate({
    model:
      "ai-forever/kandinsky-2:601eea49d49003e6ea75a11527209c4f510a93e2112c969d548fbb45b9c4f19f",
    apiKey: process.env.REPLICATE_API_KEY,
    input: { image_dimensions: "512x512" },
  });
  const response = await imageModel.call(prompt);
  return [response, prompt];
}
