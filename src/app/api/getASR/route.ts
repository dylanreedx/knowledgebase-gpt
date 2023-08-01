import {HfInference} from '@huggingface/inference';
import {createWriteStream} from 'fs';
import {supabaseClient} from '@/utils/supabase';
import {NextResponse} from 'next/server';

const Hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function POST(req: Request) {
  const {videoId, token} = await req.json();
  const supabase = await supabaseClient(token);
  console.log('videoId', videoId);

  // get list of files in the videoId folder
  const {data: list, error: listError} = await supabase.storage
    .from('chunks')
    .list(`chunks/${videoId}`);

  if (listError) throw listError;

  let fullTranscription = '';

  for (const file of list) {
    // download the file
    const {data: downloadData, error: downloadError} = await supabase.storage
      .from('chunks')
      .download(`chunks/${videoId}/${file.name}`);

    if (downloadError) throw downloadError;

    // convert Blob to ArrayBuffer
    const arrayBuffer = await downloadData.arrayBuffer();

    try {
      const text = await Hf.automaticSpeechRecognition({
        model: 'jonatasgrosman/wav2vec2-large-xlsr-53-english',
        data: arrayBuffer,
      });

      fullTranscription += text.text + '\n';
      console.log('Transcription: ', text.text);
    } catch (error) {
      console.log(error);
    }
  }

  // upload full transcription to Supabase
  const {error: uploadError} = await supabase.storage
    .from('transcriptions')
    .upload(`${videoId}/transcription.txt`, new Blob([fullTranscription]));

  if (uploadError) throw uploadError;

  // send message when done
  return NextResponse.json({message: 'done'});
}
