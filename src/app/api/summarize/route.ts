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

  // run the summarization chain and combine the summaries
  try {
    console.log('Summarizing...');
    if (!fullTranscription)
      throw new Error('No transcription found' + fullTranscription);
    const summary = await summaryChain.run(fullTranscription);

    console.log('summary', summary);
    const combinedSummary = summary;
    console.log(combinedSummary);

    // write the combined summary to a text file
    fs.writeFileSync('summary.txt', combinedSummary);
  } catch (error) {
    console.log(error);
  }
}
