# AI Storybook

An example project showing how to make a full-stack app that integrates elements of generative AI.

![](https://i.ytimg.com/vi/4DEFIEHbC_s/maxresdefault.jpg)

These project feature the following platforms and frameworks:

- [Replicate](https://replicate.com)
- [OpenAI](https://openai.com)
- [LangChain.js](https://github.com/hwchase17/langchainjs)
- [Convex](https://convex.dev)

## Video

This project was coded on a live stream. The video, which introduces the concepts gradually and explains how the project was built, is found on YouTube here:

[https://www.youtube.com/watch?v=4DEFIEHbC_s](https://www.youtube.com/watch?v=4DEFIEHbC_s)

## Steps

The project is broken up an initial state, and then three steps/stages of development that are completed during the video. The end result of each step is a separate subdirectly in this repository.

- Step 0 (The initial state): A simple, frontend-only React app that shows a caurosel view with each cell representing a page in a children's book. The left side of the cell is the _text_ of the page of the book, which can be edited by clicking the text and typing in the resultant textarea. The right side of the cell is reserved for an eventual AI-generated image to accompany the page contents. For now this will show a simple spinner. This basic React app will be more of less unchanged as we develop the rest of the project on the backend. The page state is driven by an in-app `useState` React state variable, but that will soon change.
- Step 1: A full-stack app, where we've swapped out the React state for a [Convex](https://convex.dev) backend. We'll replace `useState` with `useQuery`, and do the other plumbing necessary to make our app state stored in the backend.
- Step 2: Initial generative AI. We'll create a background task that fetches an image to represent the illustration for each page from a [Replicate](https://replicate.com) model using the LangChain.js library. The prompt for any given page will just be the page contents.
- Step 3: Richer, prompt-tuned generative AI. We'll introduce using "chaining" from LangChain.js, and we'll utilize it to both improve our prompts, and to connect ChatGPT to our app to further refine our storybook illustrations.

## Running each step of the project

For step-0, which is only a react app:

    cd step-0
    npm i
    npm run dev

For step-1, a full stack app:

    cd step-1
    npm i
    npx convex dev
    # Finally, in a separate terminal run the frontend:
    npm run dev

For step-2, a full stack app using Replicate:

    # Get a replicate.com API key and put it in your Convex backend's environment
    # named REPLICATE_API_KEY.
    cd step-2
    npm i
    npx convex dev
    # Finally, in a separate terminal run the frontend:
    npm run dev

For step-3, a full stack app using Replicate and OpenAI:

    # Get a replicate.com API key and put it in your Convex backend's environment
    # named REPLICATE_API_KEY.
    # Get a platform.openai.com API key and put it in your Convex backend's environment
    # named OPENAI_API_KEY.
    cd step-3
    npm i
    npx convex dev
    # Finally, in a separate terminal run the frontend:
    npm run dev
