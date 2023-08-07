import {OpenAIStream, StreamingTextResponse} from 'ai';
import {Configuration, OpenAIApi} from 'openai-edge';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export const runtime = 'edge';

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const {messages, transcript} = await req.json();
  console.log('messages', messages);
  const fullMessages = [
    {role: 'system', content: `The transcript of the video is: ${transcript}`},
    ...messages,
  ];

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages: fullMessages,
  });
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  console.log('stream', new StreamingTextResponse(stream));
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
