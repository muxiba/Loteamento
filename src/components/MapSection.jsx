import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import mapaPlanta from '../assets/planta.jpg';
import { useLotsSummary } from '../hooks/useLots';
import { getMappedLots } from '../services/mapService';
import { getConfig } from '../services/configService';

const MapSection = ({ onSelectLotPrice }) => {
    const [selectedLot, setSelectedLot] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [mappedLots, setMappedLots] = useState([]);

    const navigate = useNavigate();
    const { lots, loading: lotsLoading } = useLotsSummary();

    useEffect(() => {
        const loadMapData = async () => {
            try {
                const mapped = await getMappedLots();
                setMappedLots(mapped);
            } catch (err) {
                console.error("Error loading map data:", err);
            }
        };
        loadMapData();
    }, []);

    // Auto select first available lot when lots or mappedLots change
    useEffect(() => {
        if (lots.length > 0 && mappedLots.length > 0 && !selectedLot) {
            for (let m of mappedLots) {
                const officialData = lots.find(l => l.id === m.id);
                if (officialData && officialData.status !== 'Vendido') {
                    const enriched = {
                        ...officialData,
                        name: officialData.id,
                        type: (officialData.price || 0) > 150000 ? 'premium' : 'standard'
                    };
                    setSelectedLot(enriched);
                    if (onSelectLotPrice) onSelectLotPrice(enriched);
                    break;
                }
            }
        }
    }, [lots, mappedLots]);

    const handleLotClick = (lotRect) => {
        const officialData = lots.find(l => l.id === lotRect.id);
        if (officialData) {
            const enriched = {
                ...officialData,
                name: officialData.id,
                type: (officialData.price || 0) > 150000 ? 'premium' : 'standard'
            };
            setSelectedLot(enriched);
            if (enriched.status !== 'Vendido' && onSelectLotPrice) {
                onSelectLotPrice(enriched);
            }
        }
    };

    const scrollToProposta = () => {
        // Redireciona o cliente para Módulo de Cadastro completo levando o ID do lote
        navigate('/proposta', { state: { lotId: selectedLot?.id } });
    };

    const [mapImageUrl, setMapImageUrl] = useState(mapaPlanta);

    useEffect(() => {
        const loadMapImage = async () => {
            const saved = await getConfig('map_custom_url');
            if (saved) setMapImageUrl(saved);
        };
        loadMapImage();
    }, []);

    return (
        <section id="mapa" className="map-section" style={{ padding: '80px 5%', background: '#f9f7f2' }}>
            <h2 className="section-title" style={{ textAlign: 'center', fontSize: '2.5rem', color: 'var(--color-forest)', fontFamily: "'Playfair Display', serif" }}>Mapa de Disponibilidade</h2>
            <p className="section-subtitle" style={{ textAlign: 'center', color: '#666', maxWidth: '600px', margin: '0 auto 3rem auto' }}>Explore a planta. Os blocos coloridos foram mapeados pela administração. Clique neles para ver detalhes da disponibilidade.</p>
            
            <div className="map-container" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px', background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', padding: '20px' }}>
                
                {/* Esquerda: Mapa Visual com a Planta Real e os Desenhados pelo Admin */}
                <div style={{ position: 'relative', width: '100%', minHeight: '800px', backgroundColor: '#e8f5e9', borderRadius: '15px', overflow: 'hidden', border: '2px solid #ddd' }}>
                    
                    {/* BOTÃO AMPLIAR MAPA */}
                    <button 
                        onClick={() => setIsExpanded(true)}
                        style={{
                            position: 'absolute', top: '20px', right: '20px', zIndex: 20,
                            background: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.2)', cursor: 'pointer', fontWeight: 'bold',
                            color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                        <i className="fas fa-expand-arrows-alt"></i> Ampliar Planta
                    </button>

                    {/* IMAGEM DE FUNDO DA PLANTA */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url(${mapImageUrl})`, 
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                    }}></div>

                    {/* Blocos Desenhados puxados do sistema do Admin */}
                    {mappedLots.length === 0 && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.9)', padding: '20px', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                            Aguardando o Administrador entrar no Painel e "desenhar" os lotes sobre o mapa.
                        </div>
                    )}

                    {/* BARRA DE SUCESSO DE VENDAS */}
                    {lots.length > 0 && (
                        <div style={{ 
                            position: 'absolute', bottom: '20px', left: '20px', zIndex: 20, 
                            background: 'rgba(255,255,255,0.95)', padding: '15px 25px', borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid var(--color-forest)',
                            maxWidth: '300px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-dark)' }}>SUCESSO DE VENDAS</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-forest)' }}>
                                    {Math.round((lots.filter(l => l.status === 'Vendido').length / lots.length) * 100)}% Vendido
                                </span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ 
                                    width: `${(lots.filter(l => l.status === 'Vendido').length / lots.length) * 100}%`, 
                                    height: '100%', background: 'var(--color-forest)', transition: 'width 1s ease-out' 
                                }}></div>
                            </div>
                            <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '8px', margin: '8px 0 0 0' }}>
                                Restam apenas <strong>{lots.filter(l => l.status === 'Disponível').length}</strong> lotes disponíveis!
                            </p>
                        </div>
                    )}

                    {mappedLots.map((lot, idx) => {
                        const official = lots.find(l => l.id === lot.id);
                        const isSelected = selectedLot?.id === lot.id;
                        const isVendido = official?.status === 'Vendido';
                        const isReservado = official?.status === 'Reservado';

                        // Cores dinâmicas
                        let bgColor = 'rgba(107, 154, 196, 0.5)'; // Padrão
                        let borderColor = 'rgba(255,255,255,0.5)';
                        
                        if (isVendido) {
                            bgColor = 'rgba(0, 0, 0, 0.65)';
                            borderColor = '#333';
                        } else if (isReservado) {
                            bgColor = 'rgba(255, 152, 0, 0.6)';
                            borderColor = '#ff9800';
                        } else {
                            // Disponível
                            bgColor = isSelected ? 'rgba(46, 125, 50, 0.9)' : 'rgba(76, 175, 80, 0.5)';
                            borderColor = isSelected ? '#fff' : '#2e7d32';
                        }

                        let tooltipText = `Lote ${lot.id} - Disponível! Clique para simular.`;
                        if (isVendido) tooltipText = `Lote ${lot.id} - Já Comercializado`;
                        if (isReservado) tooltipText = `Lote ${lot.id} - Reservado (Em análise)`;

                        return (
                            <div 
                                key={idx} 
                                title={tooltipText}
                                onClick={() => handleLotClick(lot)}
                                style={{
                                    position: 'absolute',
                                    left: `${lot.left}%`,
                                    top: `${lot.top}%`,
                                    width: `${lot.width}%`,
                                    height: `${lot.height}%`,
                                    backgroundColor: bgColor,
                                    border: isSelected ? '3px solid white' : `2px solid ${borderColor}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                    cursor: isVendido ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    zIndex: isSelected ? 10 : 1,
                                    boxShadow: isSelected ? '0 0 20px rgba(0,0,0,0.3)' : 'none'
                                }}
                            >
                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                                    <span style={{ 
                                        fontSize: isSelected ? '0.9rem' : '0.75rem', 
                                        textAlign: 'center',
                                        background: isSelected ? 'white' : (isVendido ? '#333' : 'rgba(255,255,255,0.85)'),
                                        color: isSelected ? 'var(--color-forest)' : (isVendido ? 'white' : '#333'),
                                        padding: '2px 8px',
                                        borderRadius: '5px',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                        pointerEvents: 'none', 
                                        whiteSpace: 'nowrap',
                                        fontWeight: 'bold',
                                        border: isSelected ? '2px solid var(--color-forest)' : '1px solid #ccc'
                                    }}>
                                        {lot.id}
                                    </span>
                                    {isVendido && (
                                        <span style={{ fontSize: '0.6rem', color: '#ff4d4f', fontWeight: '900', marginTop: '2px', textShadow:'0 1px 2px #000' }}>VENDIDO</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* MODAL DO MAPA EXPANDIDO */}
                {isExpanded && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(0,0,0,0.9)', zIndex: 20000,
                        display: 'flex', flexDirection: 'column', padding: '20px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ color: 'white', margin: 0 }}>Planta Técnica - Explore as dimensões</h3>
                            <button 
                                onClick={() => setIsExpanded(false)}
                                style={{ background: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                                <i className="fas fa-times"></i> Fechar e Ver Memorial
                            </button>
                        </div>
                        
                        <div style={{ flex: 1, position: 'relative', background: '#fff', borderRadius: '15px', overflow: 'hidden' }}>
                            <div style={{
                                position: 'absolute', inset: 0,
                                backgroundImage: `url(${localStorage.getItem('mapa_customizado') || mapaPlanta})`, 
                                backgroundSize: '100% 100%',
                            }}></div>
                            
                            {mappedLots.map((lot, idx) => {
                                const allLots = JSON.parse(localStorage.getItem('db_lots') || '[]');
                                const official = allLots.find(l => l.id === lot.id);
                                const isSelected = selectedLot?.id === lot.id;
                                const isVendido = official?.status === 'Vendido';

                                return (
                                    <div 
                                        key={`exp-${idx}`} 
                                        onClick={() => {
                                            handleLotClick(lot);
                                            setIsExpanded(false); // Fecha ao escolher
                                        }}
                                        style={{
                                            position: 'absolute',
                                            left: `${lot.left}%`,
                                            top: `${lot.top}%`,
                                            width: `${lot.width}%`,
                                            height: `${lot.height}%`,
                                            backgroundColor: isVendido ? 'rgba(0,0,0,0.5)' : (isSelected ? 'rgba(46, 125, 50, 0.7)' : 'rgba(76, 175, 80, 0.3)'),
                                            border: isSelected ? '4px solid white' : '1px solid rgba(255,255,255,0.3)',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <span style={{ 
                                            background: '#fff', color: '#000', padding: '5px 12px', borderRadius: '20px', 
                                            fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                                        }}>
                                            {lot.id}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Direita: Detalhes do Lote */}
                <div className="lot-details" style={{ padding: '20px', background: '#f9f7f2', borderRadius: '10px' }}>
                    {!selectedLot ? (
                        <div style={{ textAlign: 'center', color: '#999', marginTop: '100px' }}>
                            <i className="fas fa-hand-pointer" style={{ fontSize: '3rem', marginBottom: '20px' }}></i>
                            <p>Clique nas áreas mapeadas para ver o descritivo e iniciar a Proposta.</p>
                        </div>
                    ) : (
                        <div style={{ animation: 'fadeIn 0.5s' }}>
                            <span style={{ 
                                fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700',
                                color: selectedLot.status === 'Vendido' ? '#999' : selectedLot.type === 'premium' ? 'var(--color-river)' : 'var(--color-sand)'
                            }}>
                                {selectedLot.status} • {selectedLot.type === 'premium' ? 'Planta Especial' : 'Padrão'}
                            </span>
                            
                            <h3 style={{ fontSize: '2.5rem', marginTop: '10px', color: 'var(--color-forest)', fontFamily: "'Playfair Display', serif" }}>
                                {selectedLot.name}
                            </h3>
                            <p style={{ color: '#666', fontSize: '1.2rem', fontWeight: 'bold' }}>Área: {selectedLot.size}</p>
                            
                            <hr style={{ border: 0, borderTop: '1px solid #ddd', margin: '20px 0' }} />
                            
                            <p style={{ color: '#666' }}>Valor à vista da Tabela Oficial</p>
                            <div style={{ fontSize: '2.2rem', color: 'var(--color-forest)', fontWeight: '700', fontFamily: "'Playfair Display'" }}>
                                {selectedLot.status === 'Vendido' ? 'Indisponível' : selectedLot.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                            
                            <div style={{ background: 'white', padding: '15px', borderRadius: '8px', marginTop: '20px', borderLeft: '4px solid var(--color-sand)' }}>
                                <p style={{ fontSize: '0.9rem', color: '#555' }}>
                                    <i className="fas fa-info-circle"></i> {selectedLot.desc}
                                </p>
                            </div>

                            {selectedLot.status !== 'Vendido' ? (
                                <>
                                    <button onClick={scrollToProposta} className="btn btn-primary" style={{ width: '100%', padding: '15px', borderRadius: '5px', background: 'var(--color-forest)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '20px' }}>Gerar Proposta e Contrato Agora <i className="fas fa-arrow-right"></i></button>
                                </>
                            ) : (
                                <div style={{ background: '#eee', padding: '15px', borderRadius: '8px', textAlign: 'center', color: '#666', marginTop: '20px', fontWeight: 'bold' }}>
                                    Este lote já foi comercializado.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabela Resumo de Lotes */}
            {!lotsLoading && lots.length > 0 && (
                <div style={{ marginTop: '60px', animation: 'fadeIn 1s ease-out' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '2rem', color: 'var(--color-forest)', fontFamily: "'Playfair Display', serif" }}>Quadro de Disponibilidade</h3>
                        <p style={{ color: '#666' }}>Lista completa para consulta rápida de metragens e valores.</p>
                    </div>
                    
                    <div style={{ overflowX: 'auto', background: 'white', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', padding: '5px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                                    <th style={{ padding: '20px', color: 'var(--color-forest)', fontWeight: 'bold' }}>LOTE</th>
                                    <th style={{ padding: '20px', color: 'var(--color-forest)', fontWeight: 'bold' }}>STATUS</th>
                                    <th style={{ padding: '20px', color: 'var(--color-forest)', fontWeight: 'bold' }}>ÁREA (m²)</th>
                                    <th style={{ padding: '20px', color: 'var(--color-forest)', fontWeight: 'bold' }}>VALOR À VISTA</th>
                                    <th style={{ padding: '20px', color: 'var(--color-forest)', fontWeight: 'bold' }}>DIMENSÕES / DETALHES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...lots].sort((a, b) => {
                                    const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
                                    const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
                                    return numA - numB;
                                }).map((lot, idx) => {
                                    const isVendido = lot.status === 'Vendido';
                                    const isReservado = lot.status === 'Reservado';
                                    
                                    return (
                                        <tr key={idx} style={{ 
                                            borderBottom: '1px solid #f0f0f0', 
                                            transition: 'background 0.2s',
                                            cursor: isVendido ? 'default' : 'pointer'
                                        }}
                                        onMouseEnter={(e) => { if(!isVendido) e.currentTarget.style.background = '#fcfbf7'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        onClick={() => {
                                            if(!isVendido) {
                                                const mapped = mappedLots.find(m => m.id === lot.id);
                                                if(mapped) handleLotClick(mapped);
                                                window.scrollTo({ top: document.getElementById('mapa').offsetTop, behavior: 'smooth' });
                                            }
                                        }}>
                                            <td style={{ padding: '20px', fontWeight: '700', color: 'var(--color-dark)' }}>{lot.id}</td>
                                            <td style={{ padding: '20px' }}>
                                                <span style={{ 
                                                    padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase',
                                                    background: isVendido ? '#ffebee' : (isReservado ? '#fff3e0' : '#e8f5e9'),
                                                    color: isVendido ? '#c62828' : (isReservado ? '#e65100' : '#2e7d32'),
                                                    display: 'inline-flex', alignItems: 'center', gap: '5px'
                                                }}>
                                                    <i className={`fas ${isVendido ? 'fa-times-circle' : (isReservado ? 'fa-clock' : 'fa-check-circle')}`}></i>
                                                    {lot.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '20px', fontWeight: '500' }}>{lot.size}</td>
                                            <td style={{ padding: '20px', fontWeight: '700', color: isVendido ? '#999' : 'var(--color-river)' }}>
                                                {isVendido ? 'Indisponível' : lot.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                            <td style={{ padding: '20px', fontSize: '0.85rem', color: '#666', maxWidth: '300px' }}>
                                                {lot.desc || 'Consulte o memorial descritivo para vértices.'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
};

export default MapSection;
