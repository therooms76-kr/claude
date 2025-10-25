const API_BASE_URL = '/api';

const recorder = new AudioRecorder();
let currentAudioBlob = null;
let currentAudioFile = null;

// DOM 요소
const startRecordingBtn = document.getElementById('startRecording');
const stopRecordingBtn = document.getElementById('stopRecording');
const playRecordingBtn = document.getElementById('playRecording');
const recordingStatus = document.getElementById('recordingStatus');
const audioPlayback = document.getElementById('audioPlayback');
const audioFileInput = document.getElementById('audioFile');
const uploadFileBtn = document.getElementById('uploadFile');
const processAutoBtn = document.getElementById('processAuto');
const refreshListBtn = document.getElementById('refreshList');
const progressSection = document.getElementById('progressSection');
const progressLog = document.getElementById('progressLog');
const resultSection = document.getElementById('resultSection');
const resultContent = document.getElementById('resultContent');
const callsList = document.getElementById('callsList');

// 녹음 시작
startRecordingBtn.addEventListener('click', async () => {
  try {
    await recorder.start();
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = false;
    playRecordingBtn.disabled = true;
    processAutoBtn.disabled = true;

    recordingStatus.textContent = '🔴 녹음 중...';
    recordingStatus.className = 'status recording';
  } catch (error) {
    alert(error.message);
  }
});

// 녹음 중지
stopRecordingBtn.addEventListener('click', async () => {
  const blob = await recorder.stop();

  if (blob) {
    currentAudioBlob = blob;
    startRecordingBtn.disabled = false;
    stopRecordingBtn.disabled = true;
    playRecordingBtn.disabled = false;
    processAutoBtn.disabled = false;

    recordingStatus.textContent = '✅ 녹음 완료! 재생하거나 자동 처리를 시작하세요.';
    recordingStatus.className = 'status success';
  }
});

// 녹음 재생
playRecordingBtn.addEventListener('click', () => {
  const url = recorder.getAudioURL();
  if (url) {
    audioPlayback.src = url;
    audioPlayback.style.display = 'block';
    audioPlayback.play();
  }
});

// 파일 선택
audioFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    currentAudioFile = e.target.files[0];
    currentAudioBlob = null; // 녹음 대신 파일 사용
    processAutoBtn.disabled = false;
  }
});

// 자동 처리
processAutoBtn.addEventListener('click', async () => {
  const audioToProcess = currentAudioBlob || currentAudioFile;

  if (!audioToProcess) {
    alert('녹음하거나 파일을 선택해주세요.');
    return;
  }

  processAutoBtn.disabled = true;
  progressSection.style.display = 'block';
  resultSection.style.display = 'none';
  progressLog.innerHTML = '';

  try {
    addProgressItem('파일 업로드 중...', 'loading');

    const formData = new FormData();
    const fileName = currentAudioFile ? currentAudioFile.name : `recording-${Date.now()}.webm`;
    formData.append('audio', audioToProcess, fileName);

    const response = await fetch(`${API_BASE_URL}/calls/process`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('처리 중 오류가 발생했습니다.');
    }

    const result = await response.json();

    addProgressItem('✅ 파일 업로드 완료', 'success');
    addProgressItem('✅ STT 변환 완료', 'success');
    addProgressItem('✅ 청약 프로세스 검증 완료', 'success');
    addProgressItem('✅ 관리자 이메일 발송 완료', 'success');

    displayResult(result);
    loadCallsList();

    // 초기화
    currentAudioBlob = null;
    currentAudioFile = null;
    audioFileInput.value = '';
    recordingStatus.className = 'status';
    audioPlayback.style.display = 'none';
    processAutoBtn.disabled = true;

  } catch (error) {
    addProgressItem(`❌ 오류: ${error.message}`, 'error');
    alert(`처리 중 오류가 발생했습니다: ${error.message}`);
  } finally {
    processAutoBtn.disabled = false;
  }
});

// 목록 새로고침
refreshListBtn.addEventListener('click', loadCallsList);

// 진행 상황 추가
function addProgressItem(text, type) {
  const item = document.createElement('div');
  item.className = `progress-item ${type}`;
  item.textContent = text;
  progressLog.appendChild(item);
}

// 결과 표시
function displayResult(result) {
  resultSection.style.display = 'block';

  const validation = result.validationResult;
  const statusClass = validation.status === '정상' ? 'normal' : 'abnormal';

  let html = `
    <div class="result-status ${statusClass}">
      ${validation.status === '정상' ? '✅' : '⚠️'} ${validation.status}
    </div>

    <div class="result-section">
      <h4>파일 정보</h4>
      <p><strong>파일명:</strong> ${result.fileName}</p>
      <p><strong>Call ID:</strong> ${result.callId}</p>
    </div>
  `;

  if (validation.missing_steps && validation.missing_steps.length > 0) {
    html += `
      <div class="result-section">
        <h4>누락된 단계</h4>
        <ul>
          ${validation.missing_steps.map(step => `<li>${step}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (validation.issues && validation.issues.length > 0) {
    html += `
      <div class="result-section">
        <h4>발견된 문제점</h4>
        <ul>
          ${validation.issues.map(issue => `<li>${issue}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  html += `
    <div class="result-section">
      <h4>전체 평가</h4>
      <p>${validation.summary}</p>
    </div>

    <div class="result-section">
      <h4>통화 내용 (전사)</h4>
      <pre>${result.transcription}</pre>
    </div>
  `;

  resultContent.innerHTML = html;
}

// 통화 목록 로드
async function loadCallsList() {
  try {
    const response = await fetch(`${API_BASE_URL}/calls`);
    const data = await response.json();

    if (data.calls.length === 0) {
      callsList.innerHTML = '<div class="empty-state">아직 통화 기록이 없습니다.</div>';
      return;
    }

    let html = '';
    data.calls.forEach(call => {
      let statusBadge = '<span class="badge pending">처리 대기</span>';

      if (call.validation_status) {
        const badgeClass = call.validation_status === '정상' ? 'normal' : 'abnormal';
        statusBadge = `<span class="badge ${badgeClass}">${call.validation_status}</span>`;
      }

      html += `
        <div class="call-item">
          <h4>${call.file_name}</h4>
          <p><strong>업로드:</strong> ${new Date(call.uploaded_at).toLocaleString('ko-KR')}</p>
          ${call.transcribed_at ? `<p><strong>STT 변환:</strong> ${new Date(call.transcribed_at).toLocaleString('ko-KR')}</p>` : ''}
          ${call.validated_at ? `<p><strong>검증 완료:</strong> ${new Date(call.validated_at).toLocaleString('ko-KR')}</p>` : ''}
          ${call.email_sent ? `<p><strong>이메일 발송:</strong> ${new Date(call.email_sent_at).toLocaleString('ko-KR')}</p>` : ''}
          ${statusBadge}
        </div>
      `;
    });

    callsList.innerHTML = html;
  } catch (error) {
    console.error('목록 로드 오류:', error);
    callsList.innerHTML = '<div class="empty-state">목록을 불러오는 중 오류가 발생했습니다.</div>';
  }
}

// 페이지 로드 시 목록 로드
loadCallsList();
