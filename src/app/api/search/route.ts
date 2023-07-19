// import {} from 'ai';
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';
import {LLMChain} from 'langchain/chains';
import axios from 'axios';
import {OpenAI} from 'langchain/llms/openai';
import {PromptTemplate} from 'langchain/prompts';

// @ts-ignore
import JSSoup from 'jssoup';

async function search(query: string) {
  const serperApiKey = process.env.SERP_API_KEY;
  const url = 'https://google.serper.dev/search';

  const payload = {
    q: query,
  };

  const headers = {
    'X-API-KEY': serperApiKey,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.post(url, payload, {headers: headers});
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

async function scrapeWebsite(objective: string, url: string) {
  const headers = {
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
  };
  const data = {
    url: url,
  };

  const post_url = `https://chrome.browserless.io/content?token=${process.env.BROWSERLESS_API_KEY}`;

  const response = await axios.post(post_url, data, {headers: headers});

  if (response.status === 200) {
    const soup = new JSSoup(response.data);

    // Remove all script and style tags
    const scripts = soup.findAll('script');
    scripts.forEach((script: any) => script.extract());

    const styles = soup.findAll('style');
    styles.forEach((style: any) => style.extract());
    const text = soup.text; // Use the 'text' property to get the text

    console.log(text);

    if (text.length > 10000) {
      const output = await summary(objective, text);
      return output;
    } else {
      return text;
    }
  } else {
    console.log(`HTTP request failed with status code ${response.status}`);
  }
}

async function summary(objective: string, content: string) {
  const llm = new OpenAI({
    temperature: 0,
    modelName: 'gpt-3.5-turbo-16k-0613',
  });

  const textSplitter = new RecursiveCharacterTextSplitter({
    separators: ['\n\n', '\n'],
    chunkSize: 10000,
    chunkOverlap: 500,
  });
  const docs = textSplitter.createDocuments([content]);
  const mapPrompt = `
    Write a summary of the following text for ${objective}:
    "${content}"
    SUMMARY:
    `;
  const combinePromptTemplate = 'Combine prompt: {input}';

  const mapPromptTemplate = new PromptTemplate({
    template: mapPrompt,
    inputVariables: ['objective', 'content'],
  });

  const combinePrompt = new PromptTemplate({
    template: combinePromptTemplate,
    inputVariables: ['input'],
  });

  const loadSummarizeChain = (
    llm: OpenAI,
    chainType: string,
    mapPrompt: PromptTemplate,
    combinePrompt: PromptTemplate,
    verbose: boolean
  ) => {
    const chain = new LLMChain({llm, prompt: mapPrompt});
    return chain;
  };

  const summaryChain = loadSummarizeChain(
    llm,
    'map_reduce',
    mapPromptTemplate,
    combinePrompt,
    true
  );

  const output = await summaryChain.run(docs);

  console.log('summary', output);
}

export async function GET(req: Request) {
  console.log(await search('Why is threads so popular so fast?'));

  console.log(
    await scrapeWebsite(
      'Why is threads so popular so fast?',
      'https://www.yieldcode.blog/post/why-engineers-should-write/'
    )
  );
}
