import React, { useState, useEffect } from 'react';
import { getConfig } from '../services/configService';

const BrokersList = () => {
    const [brokers, setBrokers] = useState([]);

    useEffect(() => {
        const loadBrokers = async () => {
            const list = await getConfig('brokers_list');
            if (list) setBrokers(list);
        };
        loadBrokers();
    }, []);

    if (brokers.length === 0) return null;

    return (
        <section style={{ padding: '60px 5%', background: '#fff' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{ color: 'var(--color-dark)', fontSize: '2rem', marginBottom: '10px' }}>Nossa Equipe de Corretores</h2>
                <p style={{ color: '#666' }}>Profissionais prontos para ajudar você a conquistar seu lote no Reserva do Rio.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
                {brokers.map((broker, idx) => (
                    <div key={idx} style={{ 
                        background: '#fcfcfc', 
                        padding: '30px', 
                        borderRadius: '20px', 
                        textAlign: 'center', 
                        border: '1px solid #eee',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                        transition: 'transform 0.3s'
                    }}>
                        <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: 'var(--color-sand)', 
                            borderRadius: '50%', 
                            margin: '0 auto 20px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            color: 'white'
                        }}>
                            <i className="fas fa-user-tie"></i>
                        </div>
                        <h3 style={{ color: 'var(--color-dark)', marginBottom: '5px' }}>{broker.name}</h3>
                        <p style={{ color: '#999', fontSize: '0.8rem', marginBottom: '20px' }}>Corretor Autorizado</p>
                        
                        <a href={`https://wa.me/55${broker.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ 
                            background: '#25D366', 
                            color: 'white', 
                            textDecoration: 'none', 
                            padding: '10px 20px', 
                            borderRadius: '30px', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '10px',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}>
                            <i className="fab fa-whatsapp"></i> Falar pelo WhatsApp
                        </a>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default BrokersList;
