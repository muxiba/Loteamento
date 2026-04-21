import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getConfig } from '../services/configService';

const Header = () => {
    const [mainBroker, setMainBroker] = useState(null);

    useEffect(() => {
        const loadBroker = async () => {
            const list = await getConfig('brokers_list');
            if (list && list.length > 0) {
                setMainBroker(list[0]);
            }
        };
        loadBroker();
    }, []);

    const whatsappUrl = mainBroker 
        ? `https://wa.me/55${mainBroker.phone.replace(/\D/g, '')}?text=Olá,%20vi%20o%20loteamento%20pelo%20site%20e%20gostaria%20de%20mais%20informações.`
        : '#';

    return (
        <header>
            <div className="logo">Reserva do Rio</div>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                <ul style={{ display: 'flex', gap: '20px', listStyle: 'none', margin: 0, padding: 0 }}>
                    <li><a href="#sobre" style={{ textDecoration: 'none', color: 'white', fontWeight: '500' }}>O Empreendimento</a></li>
                    <li><a href="#mapa" style={{ textDecoration: 'none', color: 'white', fontWeight: '500' }}>Lotes</a></li>
                    <li><a href="#galeria" style={{ textDecoration: 'none', color: 'white', fontWeight: '500' }}>Imagens/Vídeos</a></li>
                    <li><a href="#pagamento" style={{ textDecoration: 'none', color: 'white', fontWeight: '500' }}>Simulador</a></li>
                </ul>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{ 
                    background: '#25D366', 
                    color: 'white', 
                    textDecoration: 'none', 
                    padding: '8px 18px', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <i className="fab fa-whatsapp" style={{ fontSize: '1.1rem' }}></i> Falar com Corretores
                </a>
            </nav>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <Link to="/cliente" className="login-btn" style={{ textDecoration: 'none' }}>
                    Área do Cliente
                </Link>
                <Link to="/admin" style={{ textDecoration: 'none', color: 'white', opacity: 0.6, fontSize: '0.8rem' }}>
                    <i className="fas fa-lock"></i> Admin
                </Link>
            </div>
        </header>
    );
};

export default Header;
