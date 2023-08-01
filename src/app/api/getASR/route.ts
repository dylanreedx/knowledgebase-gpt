import {HfInference} from '@huggingface/inference';
import {readFileSync} from 'fs';

const Hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function POST() {
  // get audio from video

  const arrayBuffer = getAudioBuffer();
  try {
    const text = Hf.automaticSpeechRecognition({
      model: 'jonatasgrosman/wav2vec2-large-xlsr-53-english',
      data: arrayBuffer,
    });

    text
      .then((text) => {
        console.log('text: -------', text);
      })
      .catch((err) => {
        console.log('error: -------', err);
      });
  } catch (error) {
    console.log(error);
  }
}

function getAudioBuffer() {
  const buffer = readFileSync('audio.mp3');
  const arrayBuffer = Uint8Array.from(buffer).buffer;
  return arrayBuffer;
}
