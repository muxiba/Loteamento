import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ClientArea from './pages/ClientArea';
import AdminArea from './pages/AdminArea';
import PropostaFlow from './pages/PropostaFlow'; // NEW

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/cliente" element={<ClientArea />} />
        <Route path="/admin" element={<AdminArea />} />
        <Route path="/proposta" element={<PropostaFlow />} />
      </Routes>
    </Router>
  );
}

export default App;
