import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Criamos a conexão com o 'root' do seu index.html
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Não foi possível encontrar o elemento root no seu index.html");
}
