import React, { useState } from 'react';
import Header from '../components/SiteHeader';
import Hero from '../components/HeroSection';
import About from '../components/About';
import MapSection from '../components/LotExplorer';
import GallerySection from '../components/MediaGallery';
import Simulator from '../components/Simulator';
import BrokersList from '../components/BrokersList';
import SiteFooter from '../components/SiteFooter';

const LandingPage = () => {
    const [selectedLot, setSelectedLot] = useState({ id: 'Nenhum', price: 120000 });

    return (
        <>
            <Header />
            <main id="conteudo">
            <Hero />
            <About />
            <MapSection onSelectLotPrice={setSelectedLot} />
            <GallerySection />
            <BrokersList />
            <Simulator baseLot={selectedLot} />
            </main>
            <SiteFooter />
        </>
    );
};

export default LandingPage;
