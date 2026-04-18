import React, { useState, useEffect } from 'react';
import { loadGalleryDB } from '../utils/db';

const GallerySection = () => {
    const [mediaItems, setMediaItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const loadGallery = async () => {
            const items = await loadGalleryDB();
            if (items && items.length > 0) {
                setMediaItems(items.sort((a,b) => b.id - a.id));
            } else {
                // Mock items if DB is empty
                setMediaItems([
                    { id: 1, type: 'image', url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800' },
                    { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800' },
                    { id: 3, type: 'video', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
                ]);
            }
        };

        loadGallery();
        window.addEventListener('storage', loadGallery);
    }, []);

    const renderMedia = (item, isModal = false) => {
        if (item.type === 'video') {
            return (
                <iframe 
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    src={item.url} 
                    title="YouTube video" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                ></iframe>
            );
        }

        if (item.type === 'localVideo') {
            return (
                <video 
                    src={item.url} 
                    controls 
                    playsInline
                    autoPlay={isModal}
                    style={{ width: '100%', height: '100%', objectFit: isModal ? 'contain' : 'cover', background: '#000' }}
                >
                    Seu navegador não suporta este vídeo.
                </video>
            );
        }

        if (item.type === 'pdf') {
            return (
                <div style={{ 
                    width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--color-river), var(--color-forest))', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                    color: 'white', padding: '20px', textAlign: 'center' 
                }}>
                    <i className="fas fa-file-pdf" style={{ fontSize: isModal ? '5rem' : '3.5rem', marginBottom: '15px' }}></i>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>{item.name || 'Projeto Condomínio'}</h4>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ 
                        background: 'white', color: 'var(--color-river)', padding: '12px 25px', 
                        borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold'
                    }}>
                        Abrir Documento
                    </a>
                </div>
            );
        }

        return (
            <div style={{
                width: '100%', height: '100%',
                backgroundImage: `url(${item.url})`,
                backgroundSize: isModal ? 'contain' : 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                transition: 'transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)'
            }} className="gallery-img"></div>
        );
    };

    return (
        <section id="galeria" style={{ padding: '100px 5%', background: '#fff' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ textAlign: 'center', fontSize: '2.8rem', color: 'var(--color-forest)', fontFamily: "'Playfair Display', serif", marginBottom: '15px' }}>
                    Galeria de Mídias
                </h2>
                <div style={{ width: '80px', height: '4px', background: 'var(--color-sand)', margin: '0 auto 30px auto', borderRadius: '2px' }}></div>
                
                <p style={{ textAlign: 'center', color: '#666', maxWidth: '700px', margin: '0 auto 50px auto', fontSize: '1.1rem' }}>
                    Clique nas imagens abaixo para ampliar ou assistir aos vídeos exclusivos.
                </p>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
                    gap: '30px'
                }}>
                    {mediaItems.map((item, idx) => (
                        <div key={item.id || idx} 
                            style={{ 
                                borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', 
                                height: '280px', background: '#fcfcfc', border: '1px solid #f0f0f0', cursor: 'pointer'
                            }} 
                            className="gallery-card"
                            onClick={() => setSelectedItem(item)}
                        >
                            {renderMedia(item)}
                        </div>
                    ))}
                </div>
            </div>

            {/* LIGHTBOX MODAL */}
            {selectedItem && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
                    background: 'rgba(0,0,0,0.95)', zIndex: 100000, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5%' 
                }} onClick={() => setSelectedItem(null)}>
                    <button style={{ 
                        position: 'absolute', top: '30px', right: '30px', background: 'transparent', 
                        border: 'none', color: 'white', fontSize: '3rem', cursor: 'pointer' 
                    }}>&times;</button>
                    <div style={{ width: '90%', height: '80%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ flex: 1, width: '100%' }}>
                            {renderMedia(selectedItem, true)}
                        </div>
                        
                        {/* Download Button */}
                        {selectedItem.type !== 'video' && selectedItem.type !== 'pdf' && (
                            <a 
                                href={selectedItem.url} 
                                download={`reserva-do-rio-media-${selectedItem.id || 'download'}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                    marginTop: '20px', background: 'var(--color-sand)', color: 'var(--color-dark)', 
                                    padding: '12px 30px', borderRadius: '30px', textDecoration: 'none', 
                                    fontWeight: 'bold', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '10px'
                                }}
                            >
                                <i className="fas fa-download"></i> Fazer Download Mídia
                            </a>
                        )}
                        {selectedItem.type === 'video' && (
                            <p style={{color: 'white', marginTop: '15px'}}><i className="fas fa-info-circle"></i> Vídeos do YouTube não podem ser baixados diretamente devido à política de direitos.</p>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .gallery-card:hover { transform: translateY(-10px); }
                .gallery-img:hover { transform: scale(1.05); }
            `}</style>
        </section>
    );
};

export default GallerySection;
