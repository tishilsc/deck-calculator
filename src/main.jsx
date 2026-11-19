import { registerSW } from 'virtual:pwa-register';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// オフライン用の保存が終わったら知らせる（画面側で表示する）
registerSW({
  immediate: true,
  onOfflineReady() {
    try {
      localStorage.setItem('deckOfflineReady', '1');
    } catch (e) {
      // 保存できない環境では無視
    }
    window.dispatchEvent(new Event('deck-offline-ready'));
  }
});
