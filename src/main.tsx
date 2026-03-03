import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import EditorPage from './pages/EditorPage';
import PrompterPage from './pages/PrompterPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/prompter" element={<PrompterPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
