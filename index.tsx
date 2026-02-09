import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// O React procura o ID 'root' que você colocou no index.html
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  // Isso ajuda a diagnosticar se o HTML está correto
  console.error("Erro: O elemento 'root' não foi encontrado no index.html");
}
