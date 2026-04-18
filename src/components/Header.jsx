import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
    return (
        <header>
            <div className="logo">Reserva do Rio</div>
            <nav>
                <ul style={{ display: 'flex', gap: '20px', listStyle: 'none', margin: 0, padding: 0 }}>
                    <li><a href="#sobre" style={{ textDecoration: 'none', color: 'white', fontWeight: '500' }}>O Empreendimento</a></li>
                    <li><a href="#mapa" style={{ textDecoration: 'none', color: 'white', fontWeight: '500' }}>Lotes</a></li>
                    <li><a href="#galeria" style={{ textDecoration: 'none', color: 'white', fontWeight: '500' }}>Imagens/Vídeos</a></li>
                    <li><a href="#pagamento" style={{ textDecoration: 'none', color: 'white', fontWeight: '500' }}>Simulador</a></li>
                </ul>
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
