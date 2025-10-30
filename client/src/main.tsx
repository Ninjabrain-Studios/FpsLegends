import React from 'react';
import ReactDOM from 'react-dom/client';
import { MainMenu } from './ui/MainMenu';

// Main entry point
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainMenu />
  </React.StrictMode>
);
