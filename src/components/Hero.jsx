import React from 'react';

const Hero = () => {
    return (
        <section className="hero">
            <div className="hero-content">
                <h1>Onde o Rio Abraça<br/>o seu Descanso</h1>
                <p>Lotes de 1.000m² com escritura imediata e acesso exclusivo ao rio.</p>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <a href="#mapa" className="btn btn-primary">Escolher meu lote</a>
                    <a href="#pagamento" className="btn btn-secondary" style={{ color: 'white', borderColor: 'white' }}>Simular Parcelas</a>
                </div>
            </div>
            
            <div className="wave-divider">
                <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
                </svg>
            </div>
        </section>
    );
};

export default Hero;
