import {HfInference} from '@huggingface/inference';
import {readFileSync, writeFileSync, readdirSync} from 'fs';
import path from 'path';

const Hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function POST() {
  // get audio from video
  const chunksDir = path.join('chunks');
  const files = readdirSync(chunksDir).sort(); // sort files by name

  let fullTranscription = '';

  for (const file of files) {
    const arrayBuffer = getAudioBuffer(path.join(chunksDir, file));
    try {
      const text = await Hf.automaticSpeechRecognition({
        model: 'jonatasgrosman/wav2vec2-large-xlsr-53-english',
        data: arrayBuffer,
      });

      fullTranscription += text.text + '\n';
    } catch (error) {
      console.log(error);
    }
  }

  // write full transcription to a text file
  writeFileSync('transcription.txt', fullTranscription);
}

function getAudioBuffer(filePath: string) {
  const buffer = readFileSync(filePath);
  const arrayBuffer = Uint8Array.from(buffer).buffer;
  return arrayBuffer;
}
