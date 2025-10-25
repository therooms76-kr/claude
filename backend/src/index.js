const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/env');
const db = require('./config/database');

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, '../../frontend')));

// 라우트
const callRoutes = require('./routes/callRoutes');
app.use('/api/calls', callRoutes);

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 서버 시작
app.listen(config.port, () => {
  console.log(`서버가 포트 ${config.port}에서 실행 중입니다.`);
  console.log(`http://localhost:${config.port}`);
});

module.exports = app;
