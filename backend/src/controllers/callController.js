const db = require('../config/database');
const { transcribeAudio } = require('../services/sttService');
const { validateInsuranceProcess } = require('../services/claudeService');
const { sendValidationEmail } = require('../services/emailService');
const { v4: uuidv4 } = require('uuid');

/**
 * 녹음 파일 업로드
 */
async function uploadRecording(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    const callId = uuidv4();
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // DB에 저장
    const stmt = db.prepare(`
      INSERT INTO calls (id, file_path, file_name)
      VALUES (?, ?, ?)
    `);
    stmt.run(callId, filePath, fileName);

    console.log(`녹음 파일 업로드 완료: ${fileName} (ID: ${callId})`);

    res.json({
      success: true,
      callId: callId,
      fileName: fileName,
      message: '녹음 파일이 성공적으로 업로드되었습니다.'
    });
  } catch (error) {
    console.error('업로드 오류:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 음성을 텍스트로 변환
 */
async function transcribeCall(req, res) {
  try {
    const { callId } = req.params;

    // DB에서 통화 정보 조회
    const call = db.prepare('SELECT * FROM calls WHERE id = ?').get(callId);
    if (!call) {
      return res.status(404).json({ error: '통화 정보를 찾을 수 없습니다.' });
    }

    if (call.transcription) {
      return res.json({
        success: true,
        message: '이미 변환된 텍스트가 있습니다.',
        transcription: call.transcription
      });
    }

    // STT 변환
    const transcription = await transcribeAudio(call.file_path);

    // DB 업데이트
    const stmt = db.prepare(`
      UPDATE calls
      SET transcription = ?, transcribed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(transcription, callId);

    console.log(`STT 변환 완료 (ID: ${callId})`);

    res.json({
      success: true,
      transcription: transcription,
      message: '음성이 성공적으로 텍스트로 변환되었습니다.'
    });
  } catch (error) {
    console.error('STT 변환 오류:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 청약 프로세스 검증
 */
async function validateCall(req, res) {
  try {
    const { callId } = req.params;

    // DB에서 통화 정보 조회
    const call = db.prepare('SELECT * FROM calls WHERE id = ?').get(callId);
    if (!call) {
      return res.status(404).json({ error: '통화 정보를 찾을 수 없습니다.' });
    }

    if (!call.transcription) {
      return res.status(400).json({ error: '먼저 음성을 텍스트로 변환해주세요.' });
    }

    // Claude API로 검증
    const validationResult = await validateInsuranceProcess(call.transcription);

    // DB 업데이트
    const stmt = db.prepare(`
      UPDATE calls
      SET validation_status = ?, validation_result = ?, validated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(validationResult.status, JSON.stringify(validationResult), callId);

    console.log(`프로세스 검증 완료 (ID: ${callId}, 상태: ${validationResult.status})`);

    res.json({
      success: true,
      validationResult: validationResult,
      message: '청약 프로세스 검증이 완료되었습니다.'
    });
  } catch (error) {
    console.error('검증 오류:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 검증 결과 이메일 발송
 */
async function sendEmail(req, res) {
  try {
    const { callId } = req.params;

    // DB에서 통화 정보 조회
    const call = db.prepare('SELECT * FROM calls WHERE id = ?').get(callId);
    if (!call) {
      return res.status(404).json({ error: '통화 정보를 찾을 수 없습니다.' });
    }

    if (!call.validation_result) {
      return res.status(400).json({ error: '먼저 청약 프로세스를 검증해주세요.' });
    }

    const validationResult = JSON.parse(call.validation_result);

    // 이메일 발송
    await sendValidationEmail(call, validationResult);

    // DB 업데이트
    const stmt = db.prepare(`
      UPDATE calls
      SET email_sent = 1, email_sent_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(callId);

    console.log(`이메일 발송 완료 (ID: ${callId})`);

    res.json({
      success: true,
      message: '검증 결과가 관리자에게 이메일로 발송되었습니다.'
    });
  } catch (error) {
    console.error('이메일 발송 오류:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 전체 프로세스 자동 실행 (업로드 -> STT -> 검증 -> 이메일)
 */
async function processRecording(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    const callId = uuidv4();
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // 1. DB에 저장
    const insertStmt = db.prepare(`
      INSERT INTO calls (id, file_path, file_name)
      VALUES (?, ?, ?)
    `);
    insertStmt.run(callId, filePath, fileName);
    console.log(`1/4 녹음 파일 저장 완료: ${fileName}`);

    // 2. STT 변환
    const transcription = await transcribeAudio(filePath);
    const updateTranscriptionStmt = db.prepare(`
      UPDATE calls
      SET transcription = ?, transcribed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateTranscriptionStmt.run(transcription, callId);
    console.log(`2/4 STT 변환 완료`);

    // 3. 검증
    const validationResult = await validateInsuranceProcess(transcription);
    const updateValidationStmt = db.prepare(`
      UPDATE calls
      SET validation_status = ?, validation_result = ?, validated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateValidationStmt.run(validationResult.status, JSON.stringify(validationResult), callId);
    console.log(`3/4 프로세스 검증 완료: ${validationResult.status}`);

    // 4. 이메일 발송
    const call = db.prepare('SELECT * FROM calls WHERE id = ?').get(callId);
    await sendValidationEmail(call, validationResult);
    const updateEmailStmt = db.prepare(`
      UPDATE calls
      SET email_sent = 1, email_sent_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateEmailStmt.run(callId);
    console.log(`4/4 이메일 발송 완료`);

    res.json({
      success: true,
      callId: callId,
      fileName: fileName,
      transcription: transcription,
      validationResult: validationResult,
      message: '모든 프로세스가 성공적으로 완료되었습니다.'
    });
  } catch (error) {
    console.error('프로세스 실행 오류:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 모든 통화 목록 조회
 */
function getAllCalls(req, res) {
  try {
    const calls = db.prepare('SELECT * FROM calls ORDER BY uploaded_at DESC').all();
    res.json({ success: true, calls: calls });
  } catch (error) {
    console.error('조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 특정 통화 정보 조회
 */
function getCallById(req, res) {
  try {
    const { callId } = req.params;
    const call = db.prepare('SELECT * FROM calls WHERE id = ?').get(callId);

    if (!call) {
      return res.status(404).json({ error: '통화 정보를 찾을 수 없습니다.' });
    }

    // validation_result를 JSON으로 파싱
    if (call.validation_result) {
      call.validation_result = JSON.parse(call.validation_result);
    }

    res.json({ success: true, call: call });
  } catch (error) {
    console.error('조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  uploadRecording,
  transcribeCall,
  validateCall,
  sendEmail,
  processRecording,
  getAllCalls,
  getCallById
};
