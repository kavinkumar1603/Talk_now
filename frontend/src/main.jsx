import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import LandingPage from './components/LandingPage.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Keeping App as a separate route or for future use if needed, 
            though the prompt implies Focus on LandingPage. 
            I will add a specific route for App to ensure it's accessible if the user wanted it. */}
        <Route path="/app" element={<App />} />
      </Routes>
    </BrowserRouter>
 
);
