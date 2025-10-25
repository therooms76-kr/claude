const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const callController = require('../controllers/callController');

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /wav|mp3|m4a|ogg|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('오디오 파일만 업로드 가능합니다. (wav, mp3, m4a, ogg, webm)'));
    }
  }
});

// 라우트 정의
router.get('/', callController.getAllCalls);
router.get('/:callId', callController.getCallById);
router.post('/upload', upload.single('audio'), callController.uploadRecording);
router.post('/process', upload.single('audio'), callController.processRecording);
router.post('/:callId/transcribe', callController.transcribeCall);
router.post('/:callId/validate', callController.validateCall);
router.post('/:callId/email', callController.sendEmail);

module.exports = router;
