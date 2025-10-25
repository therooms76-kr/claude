const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config/env');

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey
});

/**
 * 보험 청약 프로세스 검증 프롬프트
 */
const INSURANCE_PROCESS_PROMPT = `
당신은 보험 청약 프로세스를 검증하는 전문가입니다.

다음은 정상적인 보험 청약 절차입니다:
1. 고객 신원 확인 (이름, 생년월일, 연락처)
2. 보험 상품 설명 (보험 종류, 보장 내용, 보험료)
3. 건강 상태 확인 (기저질환, 현재 복용 중인 약)
4. 수익자 정보 확인
5. 약관 동의 확인 (개인정보 처리 동의, 보험 약관 동의)
6. 최종 확인 및 청약 완료

제공된 통화 내용을 분석하여 위 절차가 모두 올바르게 진행되었는지 검증하세요.

응답 형식:
{
  "status": "정상" 또는 "비정상",
  "missing_steps": ["누락된 단계들"],
  "issues": ["발견된 문제점들"],
  "summary": "전체 평가 요약"
}

JSON 형식으로만 응답하세요.
`;

/**
 * Claude API를 사용하여 청약 프로세스 검증
 * @param {string} transcription - 통화 텍스트
 * @returns {Promise<Object>} 검증 결과
 */
async function validateInsuranceProcess(transcription) {
  try {
    console.log('Claude API 검증 시작');

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `${INSURANCE_PROCESS_PROMPT}\n\n통화 내용:\n${transcription}`
      }]
    });

    const responseText = message.content[0].text;
    console.log('Claude 응답:', responseText);

    // JSON 파싱
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('유효한 JSON 응답을 받지 못했습니다.');
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log('검증 완료:', result.status);

    return result;
  } catch (error) {
    console.error('Claude API 오류:', error);
    throw new Error(`프로세스 검증 실패: ${error.message}`);
  }
}

module.exports = {
  validateInsuranceProcess
};
