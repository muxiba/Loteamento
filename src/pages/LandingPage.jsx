import React, { useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import MapSection from '../components/MapSection';
import GallerySection from '../components/GallerySection';
import Simulator from '../components/Simulator';

const LandingPage = () => {
    const [selectedLot, setSelectedLot] = useState({ id: 'Nenhum', price: 120000 });

    return (
        <>
            <Header />
            <Hero />
            <About />
            <MapSection onSelectLotPrice={setSelectedLot} />
            <GallerySection />
            <Simulator baseLot={selectedLot} />
            <footer style={{ background: '#1a1a1a', color: 'white', padding: '50px 5%', textAlign: 'center' }}>
                <div className="logo" style={{ marginBottom: '20px' }}>Reserva do Rio</div>
                <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>© 2026 Empreendimentos Ribeirinhos. Todos os direitos reservados.</p>
            </footer>
        </>
    );
};

export default LandingPage;
