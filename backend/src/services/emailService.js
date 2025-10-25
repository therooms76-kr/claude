const nodemailer = require('nodemailer');
const config = require('../config/env');

// 이메일 전송기 설정
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false, // TLS
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

/**
 * 검증 결과 이메일 발송
 * @param {Object} callData - 통화 데이터
 * @param {Object} validationResult - 검증 결과
 */
async function sendValidationEmail(callData, validationResult) {
  try {
    const isNormal = validationResult.status === '정상';
    const subject = isNormal
      ? `[정상] 보험 청약 프로세스 완료 - ${callData.file_name}`
      : `[비정상] 보험 청약 프로세스 경고 - ${callData.file_name}`;

    const htmlContent = `
      <h2>보험 청약 통화 검증 결과</h2>
      <hr>
      <h3>통화 정보</h3>
      <ul>
        <li><strong>파일명:</strong> ${callData.file_name}</li>
        <li><strong>업로드 시간:</strong> ${callData.uploaded_at}</li>
        <li><strong>검증 시간:</strong> ${new Date().toISOString()}</li>
      </ul>

      <h3>검증 결과</h3>
      <p><strong>상태:</strong> <span style="color: ${isNormal ? 'green' : 'red'}; font-weight: bold;">${validationResult.status}</span></p>

      ${validationResult.missing_steps && validationResult.missing_steps.length > 0 ? `
        <h4>누락된 단계:</h4>
        <ul>
          ${validationResult.missing_steps.map(step => `<li>${step}</li>`).join('')}
        </ul>
      ` : ''}

      ${validationResult.issues && validationResult.issues.length > 0 ? `
        <h4>발견된 문제점:</h4>
        <ul>
          ${validationResult.issues.map(issue => `<li>${issue}</li>`).join('')}
        </ul>
      ` : ''}

      <h4>전체 평가:</h4>
      <p>${validationResult.summary}</p>

      <hr>
      <h3>통화 내용 (전사)</h3>
      <pre style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${callData.transcription}</pre>
    `;

    const info = await transporter.sendMail({
      from: `"보험 청약 시스템" <${config.email.user}>`,
      to: config.email.adminEmail,
      subject: subject,
      html: htmlContent
    });

    console.log('이메일 발송 완료:', info.messageId);
    return info;
  } catch (error) {
    console.error('이메일 발송 오류:', error);
    throw new Error(`이메일 발송 실패: ${error.message}`);
  }
}

module.exports = {
  sendValidationEmail
};
