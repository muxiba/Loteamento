import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
const ClientArea = lazy(() => import('./pages/ClientArea'));
const AdminArea = lazy(() => import('./pages/AdminArea'));
const PropostaFlow = lazy(() => import('./pages/PropostaFlow'));
import { isPreview } from './lib/previewData';

const PreviewNotice = () => <main className="preview-notice"><h1>Prévia do novo Reserva do Rio</h1><p>Cadastros, propostas e acessos serão habilitados após a migração e a configuração da autenticação.</p><a className="btn btn-primary" href="/">Voltar ao empreendimento</a></main>;

function App() {
  return (
    <Router>
      {isPreview && <div className="preview-banner" role="status">PRÉVIA LOCAL · Dados do backup · Cadastros e alterações desabilitados</div>}
      <Suspense fallback={<main className="data-message" role="status">Carregando página…</main>}><Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/cliente" element={isPreview ? <PreviewNotice /> : <ClientArea />} />
        <Route path="/admin" element={isPreview ? <PreviewNotice /> : <AdminArea />} />
        <Route path="/proposta" element={isPreview ? <PreviewNotice /> : <PropostaFlow />} />
        <Route path="*" element={<main className="preview-notice"><h1>Página não encontrada</h1><a className="btn btn-primary" href="/">Voltar ao início</a></main>} />
      </Routes></Suspense>
    </Router>
  );
}

export default App;
