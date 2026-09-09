import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import AppV3 from './AppV3.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppV3 />
  </React.StrictMode>,
);
