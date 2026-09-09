import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import AppV2 from './AppV2.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppV2 />
  </React.StrictMode>,
);
