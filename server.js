const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

// Хранилище комнат в памяти сервера
const rooms = new Map();

function applyDotPatch(target, patch) {
  const clone = JSON.parse(JSON.stringify(target || {}));
  for (const [dotPath, value] of Object.entries(patch || {})) {
    const parts = dotPath.split('.');
    let cursor = clone;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!cursor[part] || typeof cursor[part] !== 'object') {
        cursor[part] = {};
      }
      cursor = cursor[part];
    }
    cursor[parts[parts.length - 1]] = value;
  }
  return clone;
}

// Получить данные комнаты
app.get('/api/rooms/:code', (req, res) => {
  const code = String(req.params.code || '').toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ exists: false });
  }
  res.json({ exists: true, data: room });
});

// Создать комнату
app.post('/api/rooms/:code', (req, res) => {
  const code = String(req.params.code || '').toUpperCase();
  const data = req.body || {};
  data._updatedAt = Date.now();
  rooms.set(code, data);
  res.json({ ok: true, data });
});

// Точечное обновление полей комнаты (игроки не перезатирают друг друга)
app.patch('/api/rooms/:code', (req, res) => {
  const code = String(req.params.code || '').toUpperCase();
  const existing = rooms.get(code);
  if (!existing) {
    return res.status(404).json({ ok: false, error: 'Room not found' });
  }
  const updated = applyDotPatch(existing, req.body || {});
  updated._updatedAt = Date.now();
  rooms.set(code, updated);
  res.json({ ok: true, data: updated });
});

// Отдача главной страницы игры
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ТОП ПОТОКА сервер запущен на порту ${PORT}`);
});
