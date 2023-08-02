import {supabaseClient} from '@/utils/supabase';
import {LLMChain} from 'langchain/chains';
import {OpenAI} from 'langchain/llms/openai';
import {PromptTemplate} from 'langchain/prompts';
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';
import {NextResponse} from 'next/server';

const openai = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-3.5-turbo-16k-0613',
  maxTokens: 100,
});

export async function POST(req: Request) {
  const {videoId, token} = await req.json();
  const supabase = await supabaseClient(token);

  // try to download the summary file
  const {data: summaryDownloadData, error: summaryDownloadError} =
    await supabase.storage.from('summaries').download(`${videoId}/summary.txt`);

  console.log('summaryDownloadError', summaryDownloadError);

  if (summaryDownloadError) {
    if (summaryDownloadError.message === 'Object not found') {
      // if the summary file does not exist, generate a new summary

      // download the transcription file
      const {data: downloadData, error: downloadError} = await supabase.storage
        .from('transcriptions')
        .download(`${videoId}/transcription.txt`);

      if (downloadError) throw downloadError;

      // convert Blob to text
      const fullTranscription = await downloadData.text();

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
          'Read the following text and provide a brief summary with the biggest key points which could be elaborated on further:\n"{content}"\nSUMMARY:',
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

      // upload the combined summary to Supabase
      const {error: uploadError} = await supabase.storage
        .from('summaries')
        .upload(`${videoId}/summary.txt`, new Blob([combinedSummary]));

      if (uploadError) throw uploadError;

      // send message when done
      return NextResponse.json({message: 'done', summary: combinedSummary});
    } else {
      // if there is another error, throw it
      throw summaryDownloadError;
    }
  } else {
    // if the summary file exists, return the summary
    const summary = await summaryDownloadData.text();
    return NextResponse.json({message: 'Summary already exists', summary});
  }
}
