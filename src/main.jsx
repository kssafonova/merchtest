import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './patch.css';
import ClickableSlotBuilderPrototype from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClickableSlotBuilderPrototype />
  </React.StrictMode>,
);
