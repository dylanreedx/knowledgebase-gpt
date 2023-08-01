import fs from 'fs';
import {LLMChain} from 'langchain/chains';
import {OpenAI} from 'langchain/llms/openai';
import {PromptTemplate} from 'langchain/prompts';
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';

const openai = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-3.5-turbo-16k-0613',
  maxTokens: 100,
});

export async function POST() {
  // read the transcription file
  const fullTranscription = fs.readFileSync('transcription.txt', 'utf-8');

  // split the transcription into chunks of 10000 characters
  const textSplitter = new RecursiveCharacterTextSplitter({
    separators: ['\n\n', '\n'],
    chunkSize: 10000,
    chunkOverlap: 500,
  });
  const docs = await textSplitter.createDocuments([fullTranscription]);

  // define the summarization prompt
  const summarizationPromptTemplate = new PromptTemplate({
    template:
      'Read the following text and provide a brief summary:\n"{content}"\nSUMMARY:',
    inputVariables: ['content'],
  });

  // create the LLMChain for summarization
  const summaryChain = new LLMChain({
    llm: openai,
    prompt: summarizationPromptTemplate,
  });

  console.log('Summarizing...');

  // run the summarization chain for each chunk and combine the summaries
  let combinedSummary = '';
  for (const doc of docs) {
    const summary = await summaryChain.run(doc.pageContent);
    combinedSummary += summary + '\n';
  }

  console.log(combinedSummary);

  // write the combined summary to a text file
  fs.writeFileSync('summary.txt', combinedSummary);
}
