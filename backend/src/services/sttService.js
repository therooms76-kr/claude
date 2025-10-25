const OpenAI = require('openai');
const fs = require('fs');
const config = require('../config/env');

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

/**
 * 음성 파일을 텍스트로 변환
 * @param {string} filePath - 음성 파일 경로
 * @returns {Promise<string>} 변환된 텍스트
 */
async function transcribeAudio(filePath) {
  try {
    console.log(`STT 변환 시작: ${filePath}`);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
      language: 'ko', // 한국어 지정
      response_format: 'text'
    });

    console.log('STT 변환 완료');
    return transcription;
  } catch (error) {
    console.error('STT 변환 오류:', error);
    throw new Error(`음성 변환 실패: ${error.message}`);
  }
}

module.exports = {
  transcribeAudio
};
