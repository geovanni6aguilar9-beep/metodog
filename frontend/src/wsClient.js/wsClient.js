// frontend/src/wsClient.js
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const wsUrl = process.env.REACT_APP_WS_URL || apiUrl.replace(/^http/, 'ws') + '/ws';

console.log('wsClient cargado, intentando conectar a', wsUrl);
const ws = new WebSocket(wsUrl);

ws.addEventListener('open', () => console.log('WS open', wsUrl));
ws.addEventListener('message', (ev) => console.log('WS msg', ev.data));
ws.addEventListener('close', () => console.log('WS closed'));
ws.addEventListener('error', (err) => console.error('WS error', err));

export default ws;
