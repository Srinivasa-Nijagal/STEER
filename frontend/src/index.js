import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Make sure it points to .jsx

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);