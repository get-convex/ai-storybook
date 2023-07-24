"use node";
import { internal } from "./_generated/api";

import { LLMChain, PromptTemplate } from "langchain";
import { Doc } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { Replicate } from "langchain/llms/replicate";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
import { SequentialChain } from "langchain/chains";
import { v } from "convex/values";

export const populatePageImage = action({
  args: { pageNumber: v.number(), version: v.number() },
  handler: async (ctx, { pageNumber, version }) => {
    console.log(
      `Hello from populatePageImage for page ${pageNumber} at book version ${version}`
    );
    const [currentVersion, book] = await ctx.runQuery(
      internal.chapters.getBookStateWithVersion
    );
    if (currentVersion !== version) {
      console.log("Outdated! Exiting.");
      return;
    }
    if (book[pageNumber].content.trim() === "") {
      return;
    }
    const [prompt, imageUrl] = await getPageImage(book, pageNumber);
    console.log(`Got a result! ${imageUrl}, ${prompt}`);
    await ctx.runMutation(internal.chapters.updateChapterImage, {
      pageNumber,
      version,
      imageUrl,
      prompt,
    });
  },
});

async function getPageImage(
  book: Doc<"chapters">[],
  pageNumber: number
): Promise<[string, string]> {
  const imageChain = getImageChain();
  const summaryChain = getSummarizeChain();
  const overallChain = new SequentialChain({
    chains: [summaryChain, imageChain],
    inputVariables: ["bookParagraphs", "numPages"],
    outputVariables: ["imageUrl", "pageDescription"],
  });

  const subPages = book.slice(0, pageNumber + 1);
  const bookParagraphs = subPages.map(p => p.content).join("\n\n");
  const numPages = subPages.length;
  const response = await overallChain.call({ bookParagraphs, numPages });
  return [response.pageDescription, response.imageUrl];
}

function getImageChain(): LLMChain {
  const promptTemplate = new PromptTemplate({
    template:
      "{pageDescription} in the style of a children's book illustration",
    inputVariables: ["pageDescription"],
  });
  const imageModel = new Replicate({
    model:
      "ai-forever/kandinsky-2:601eea49d49003e6ea75a11527209c4f510a93e2112c969d548fbb45b9c4f19f",
    apiKey: process.env.REPLICATE_API_KEY,
    input: { image_dimensions: "512x512" },
  });
  const imageChain = new LLMChain({
    prompt: promptTemplate,
    llm: imageModel,
    outputKey: "imageUrl",
  });
  return imageChain;
}

function getSummarizeChain(): LLMChain {
  const promptTemplate = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are speaking to an eight year old. Provide your answer in
            simple language using at most one to two sentences.`
    ),
    HumanMessagePromptTemplate.fromTemplate(
      `
I'm going to tell you a story. Each paragraph is a page in a children's book.
There are {numPages} paragraphs in total, representing {numPages} pages.

Here is that story:

{bookParagraphs}

Can you please provide a brief description of the scene that occurs on
on page {numPages} so that an illustrator can draw it?  This illustrator
has not read the book and so they do not have any context on the scenes,
plot, or characters.  Please include details about the appearance of the
characters in this scene so that the illustrator can accurately
represent them.
`
    ),
  ]);
  const summaryModel = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  const summaryChain = new LLMChain({
    prompt: promptTemplate,
    llm: summaryModel,
    outputKey: "pageDescription",
  });
  return summaryChain;
}
