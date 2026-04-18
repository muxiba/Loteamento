import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadGalleryDB, saveGalleryDB } from '../utils/db';
import mapaPlanta from '../assets/planta.jpg';
import { defaultCopy } from '../components/About';

const AdminArea = () => {
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [activeTab, setActiveTab] = useState('crm');
    const [editingLotUid, setEditingLotUid] = useState(null);
    const [isCreatingLot, setIsCreatingLot] = useState(false); 
    const [newLotForm, setNewLotForm] = useState({ id: '', price: '', size: '', desc: '' }); 

    const [loginUser, setLoginUser] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [financeSubView, setFinanceSubView] = useState(null);

    const [pixKey, setPixKey] = useState(() => localStorage.getItem('db_pix_key') || 'chave@pix.com');
    const savePixKey = (key) => {
        setPixKey(key);
        localStorage.setItem('db_pix_key', key);
    };

    const [galleryItems, setGalleryItems] = useState([]);
    
    useEffect(() => {
        loadGalleryDB().then(items => {
            // Se o IndexedDB estiver vazio, tentamos migrar do localStorage (loteamento antigo)
            if (items.length === 0) {
                const legacy = JSON.parse(localStorage.getItem('db_gallery') || '[]');
                if (legacy.length > 0) {
                    saveGalleryDB(legacy);
                    setGalleryItems(legacy);
                }
            } else {
                setGalleryItems(items.sort((a,b) => b.id - a.id));
            }
        });
    }, []);

    const updateGallery = async (items) => {
        try {
            await saveGalleryDB(items);
            setGalleryItems(items);
        } catch (e) {
            console.error("Erro ao salvar no IndexedDB:", e);
            alert("Erro crítico ao salvar mídia. Certifique-se de que há espaço em disco.");
        }
    };

    // --- BANCO DE DADOS LOCAL SIMULADO ---
    const defaultLots = [
        { id: 'Lote 01', status: 'Disponível', client: '-', paymentStatus: '-', price: 150000, size: '563,59m²', desc: 'Lote padrão, excelente localização.', parcelasPagas: 0, totalParcelas: 120 },
        { id: 'Lote 11', status: 'Vendido', client: 'Carlos Eduardo', paymentStatus: 'Atrasado', price: 180000, size: '378,24m²', desc: 'Próximo à área limítrofe.', parcelasPagas: 5, totalParcelas: 120 },
        { id: 'Lote 32', status: 'Disponível', client: '-', paymentStatus: '-', price: 160000, size: '571,99m²', desc: 'Lote gigante na parte superior.', parcelasPagas: 0, totalParcelas: 60 }
    ];

    const [lots, setLots] = useState(() => {
        const saved = localStorage.getItem('db_lots');
        const data = saved ? JSON.parse(saved) : defaultLots;
        // Garantir que cada lote tenha um UID único interno que nunca muda
        return data.map((l, i) => ({ ...l, uid: l.uid || `lot-${i}-${Date.now()}` }));
    });

    useEffect(() => {
        try {
            localStorage.setItem('db_lots', JSON.stringify(lots));
        } catch(e) {
            console.error("Storage Error:", e);
            alert("Atenção: O limite de armazenamento de arquivos foi atingido! O último envio falhou ou foi bloqueado.");
        }
    }, [lots]);

    const [pendingUsers, setPendingUsers] = useState(() => {
        return JSON.parse(localStorage.getItem('pending_users') || '[]');
    });

    const [approvedUsers, setApprovedUsers] = useState(() => {
        return JSON.parse(localStorage.getItem('db_approved_users') || '[]');
    });

    const approveUser = (userId) => {
        const currentUser = pendingUsers.find(u => u.id === userId);
        const filtered = pendingUsers.filter(u => u.id !== userId);
        
        const newApproved = [...approvedUsers, { ...currentUser, approvedAt: new Date().toISOString() }];
        
        setPendingUsers(filtered);
        setApprovedUsers(newApproved);
        
        localStorage.setItem('pending_users', JSON.stringify(filtered));
        localStorage.setItem('db_approved_users', JSON.stringify(newApproved));
        
        alert(`O acesso do cliente ${currentUser?.name || ''} foi liberado! Ele agora pode logar na Área do Cliente.`);
    };

    const handleCreateLot = () => {
        const newLot = {
            uid: `lot-${Date.now()}`,
            id: newLotForm.id || `Lote ${lots.length + 1}`,
            status: 'Disponível',
            client: '-',
            paymentStatus: '-',
            price: Number(newLotForm.price) || 0,
            size: newLotForm.size || '0m²',
            desc: newLotForm.desc || '',
            parcelasPagas: 0,
            totalParcelas: 120
        };
        setLots([...lots, newLot]);
        setIsCreatingLot(false);
        setNewLotForm({ id: '', price: '', size: '', desc: '' });
    };

    // --- LÓGICA DE DESENHO NO MAPA ---
    const [drawnLots, setDrawnLots] = useState(() => {
        const saved = localStorage.getItem('db_mapped');
        return saved ? JSON.parse(saved) : [];
    });
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawModeActive, setDrawModeActive] = useState(true);
    const [startPt, setStartPt] = useState(null);
    const [currRect, setCurrRect] = useState(null);
    const [pendingPoly, setPendingPoly] = useState(null); // Segura o retangulo antes de vincular

    useEffect(() => {
        localStorage.setItem('db_mapped', JSON.stringify(drawnLots));
    }, [drawnLots]);

    const handleMapMouseDown = (e) => {
        if (!drawModeActive) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setStartPt({x, y});
        setIsDrawing(true);
        setCurrRect({ left: x, top: y, width: 0, height: 0 });
    };

    const handleMapMouseMove = (e) => {
        if (!isDrawing) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const currentX = ((e.clientX - rect.left) / rect.width) * 100;
        const currentY = ((e.clientY - rect.top) / rect.height) * 100;
        
        const newLeft = Math.min(startPt.x, currentX);
        const newTop = Math.min(startPt.y, currentY);
        const newWidth = Math.abs(currentX - startPt.x);
        const newHeight = Math.abs(currentY - startPt.y);
        
        setCurrRect({ left: newLeft, top: newTop, width: newWidth, height: newHeight });
    };

    const handleMapMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        
        if (currRect && currRect.width > 1 && currRect.height > 1) {
            setPendingPoly(currRect); // Dispara o modal de seleção
        }
        setCurrRect(null);
    };

    const linkPolygonToLot = (lotId) => {
        const newLots = [...drawnLots, { id: lotId, ...pendingPoly }];
        setDrawnLots(newLots);
        setPendingPoly(null);
        alert(`Sucesso! Área vinculada ao ${lotId} no mapa.`);
    };

    const clearMap = () => {
        if(window.confirm("Apagar todas as demarcações do mapa? Os lotes no CRM não serão afetados.")) {
            setDrawnLots([]);
        }
    }

    const getPaymentBadge = (status) => {
        if (status === 'Em Dia') return <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Em Dia</span>;
        if (status === 'Atrasado') return <span style={{ background: '#ffebee', color: '#c62828', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Atrasado</span>;
        if (status === 'Aguardando Entrada') return <span style={{ background: '#fff8e1', color: '#f57f17', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Aguardando</span>;
        return <span style={{ color: '#ccc' }}>-</span>;
    };

    const editingLot = lots.find(l => l.uid === editingLotUid);

    if (!isAdminLoggedIn) {
        const handleAdminLogin = () => {
            if (loginUser === 'admin' && loginPass === 'admin123') {
                setIsAdminLoggedIn(true);
            } else {
                alert('Credenciais incorretas! (Dica: admin / admin123)');
            }
        };

        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-dark)', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '15px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
                    <div className="logo" style={{ color: 'var(--color-dark)', marginBottom: '10px' }}>Reserva do Rio <span style={{fontSize: '0.9rem', color: 'red'}}>ADMIN</span></div>
                    <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.9rem' }}>Acesso restrito à gestão do Loteamento.</p>
                    
                    <input type="text" placeholder="Login de Administrador" value={loginUser} onChange={e => setLoginUser(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '8px' }} />
                    <input type="password" placeholder="Senha" value={loginPass} onChange={e => setLoginPass(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '8px' }} />
                    
                    <button className="btn btn-secondary" style={{ width: '100%', marginTop: '20px', background: 'var(--color-dark)', color: 'white' }} onClick={handleAdminLogin}>Validar Acesso</button>
                    <Link to="/" style={{ display: 'block', marginTop: '20px', color: '#999', fontSize: '0.8rem', textDecoration: 'none' }}>Voltar à Tela Principal</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f4f6F8' }}>
            {/* Header */}
            <div style={{ background: 'var(--color-dark)', padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                <Link to="/" className="logo" style={{ color: 'white', textDecoration: 'none' }}>Rio <span style={{fontSize: '0.8rem'}}>ADMIN</span></Link>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button onClick={() => { setActiveTab('crm'); setEditingLotUid(null); setIsCreatingLot(false); }} style={{ background: 'none', border: 'none', color: activeTab === 'crm' ? 'white' : '#999', fontWeight: activeTab === 'crm' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}>
                        1. Painel de Lotes (CRM)
                    </button>
                    <button onClick={() => { setActiveTab('approvals'); setEditingLotUid(null); setIsCreatingLot(false); }} style={{ background: 'none', border: 'none', color: activeTab === 'approvals' ? 'var(--color-sand)' : '#999', fontWeight: activeTab === 'approvals' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}>
                        2. Liberar Cadastros
                    </button>
                    <button onClick={() => { setActiveTab('site'); setEditingLotUid(null); setIsCreatingLot(false); }} style={{ background: 'none', border: 'none', color: activeTab === 'site' ? 'white' : '#999', fontWeight: activeTab === 'site' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}>
                        3. Mapa e Site Público
                    </button>
                    <button onClick={() => { setActiveTab('galeria'); setEditingLotUid(null); setIsCreatingLot(false); }} style={{ background: 'none', border: 'none', color: activeTab === 'galeria' ? 'white' : '#999', fontWeight: activeTab === 'galeria' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}>
                        4. Galeria
                    </button>
                    <button onClick={() => { setActiveTab('copywriting'); setEditingLotUid(null); setIsCreatingLot(false); }} style={{ background: 'none', border: 'none', color: activeTab === 'copywriting' ? 'white' : '#999', fontWeight: activeTab === 'copywriting' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}>
                        5. Textos e Copy
                    </button>
                    <button onClick={() => { setActiveTab('simconfig'); setEditingLotUid(null); setIsCreatingLot(false); }} style={{ background: 'none', border: 'none', color: activeTab === 'simconfig' ? 'var(--color-sand)' : '#999', fontWeight: activeTab === 'simconfig' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}>
                        6. Matriz Financeira
                    </button>
                    <button onClick={() => { setActiveTab('finance'); setEditingLotUid(null); setIsCreatingLot(false); }} style={{ background: 'none', border: 'none', color: activeTab === 'finance' ? '#4caf50' : '#999', fontWeight: activeTab === 'finance' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}>
                        7. Receita Geral
                    </button>
                    <button onClick={() => { setActiveTab('boletos'); setEditingLotUid(null); setIsCreatingLot(false); }} style={{ background: 'none', border: 'none', color: activeTab === 'boletos' ? 'var(--color-river)' : '#999', fontWeight: activeTab === 'boletos' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}>
                        8. Lançar Boletos
                    </button>
                    <Link to="/" className="btn btn-secondary" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', padding: '8px 20px', fontSize: '0.8rem', marginLeft: '20px', textDecoration: 'none' }}><i className="fas fa-home"></i> TELA PRINCIPAL</Link>
                    <button onClick={() => setIsAdminLoggedIn(false)} className="btn btn-secondary" style={{ borderColor: 'red', color: 'red', padding: '8px 20px', fontSize: '0.8rem', marginLeft: '10px' }}>Sair</button>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 5%' }}>
                
                {/* --- LOTE EDITOR (CRM INTERNO DAQUELE LOTE) --- */}
                {editingLot && (
                    <div key={editingLot.id} style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)', animation: 'fadeIn 0.3s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <button onClick={() => setEditingLotUid(null)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontWeight: 'bold' }}>
                                <i className="fas fa-arrow-left"></i> Voltar para tabela
                            </button>
                            <button className="btn btn-primary" onClick={() => { alert('Salvo!'); setEditingLotUid(null); }}>Salvar Lote {editingLot.id}</button>
                        </div>
                        <h2>Dados Oficiais: <span style={{ color: 'var(--color-forest)' }}>{editingLot.id}</span></h2>
                        <hr style={{margin: '20px 0', borderTop: 'none', borderBottom: '1px solid #eee'}}/>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                            <div>
                                <h4 style={{marginBottom: '10px'}}><i className="fas fa-tag"></i> Classificação do Lote (Banco de Dados)</h4>
                                
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Nome / Identificação do Lote (Ex: Lote 01):</label>
                                <input 
                                    type="text" 
                                    defaultValue={editingLot.id} 
                                    onBlur={e => {
                                        const newId = e.target.value;
                                        if (newId === editingLot.id || !newId) return;
                                        
                                        // Busca pelo UID garante que alteramos APENAS esse objeto físico, 
                                        // independente se o ID de texto for duplicado ou mudar.
                                        const newLots = lots.map(l => l.uid === editingLot.uid ? {...l, id: newId} : l);
                                        setLots(newLots);
                                        
                                        // Atualiza o vínculo no mapa também usando o novo ID de texto
                                        const newMapped = drawnLots.map(d => d.id === editingLot.id ? {...d, id: newId} : d);
                                        setDrawnLots(newMapped);
                                    }} 
                                    style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', fontWeight: 'bold', color: 'var(--color-river)' }} 
                                />

                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Status Operacional:</label>
                                <select 
                                    value={editingLot.status} 
                                    onChange={e => {
                                        const newStatus = e.target.value;
                                        const newLots = lots.map(l => l.uid === editingLot.uid ? {...l, status: newStatus} : l);
                                        setLots(newLots);
                                    }}
                                    style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc'}}>
                                    <option value="Disponível">Disponível para Compra</option>
                                    <option value="Reservado">Reservado (Em análise)</option>
                                    <option value="Vendido">Vendido / Comprado</option>
                                </select>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Área (Metragem. Ex: 450.00):</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    defaultValue={parseFloat((editingLot.size || '0').replace(',', '.').replace(/[^\d.]/g, '')).toFixed(2)} 
                                    onChange={e => {
                                        const area = parseFloat(e.target.value);
                                        const simConfig = JSON.parse(localStorage.getItem('db_sim_config') || '{"valorBaseM2": 250}');
                                        const valorM2 = simConfig.valorBaseM2 || 250;
                                        
                                        const newLots = lots.map(l => l.id === editingLot.id ? {
                                            ...l, 
                                            size: !isNaN(area) ? area.toFixed(2).replace('.', ',') + 'm²' : '', 
                                            price: !isNaN(area) ? area * valorM2 : l.price
                                        } : l);
                                        setLots(newLots);
                                        localStorage.setItem('db_lots', JSON.stringify(newLots));
                                    }} 
                                    style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc' }} 
                                />
                                
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Preço Final de Venda (R$):</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="number" 
                                        value={editingLot.price} 
                                        onChange={e => {
                                            const newLots = lots.map(l => l.id === editingLot.id ? {...l, price: Number(e.target.value)} : l);
                                            setLots(newLots);
                                            localStorage.setItem('db_lots', JSON.stringify(newLots));
                                        }} 
                                        style={{ width: '100%', padding: '10px', marginBottom: '5px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '1.1rem', fontWeight: 'bold' }} 
                                    />
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-forest)', fontWeight: 'bold', marginBottom: '15px' }}>
                                        Valor Formatado: R$ {editingLot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <small style={{ color: '#999', display: 'block', marginBottom: '15px' }}>* Mudar a Área aciona a multiplicação automática pela Tabela Base Mestre, mas você pode sobrescrever o valor livremente aqui.</small>

                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Descritivo Promocional (Site Público):</label>
                                <textarea 
                                    defaultValue={editingLot.desc} 
                                    onChange={e => {
                                        const newLots = lots.map(l => l.id === editingLot.id ? {...l, desc: e.target.value} : l);
                                        setLots(newLots);
                                    }} 
                                    rows="3" 
                                    placeholder="Ex: Lote plano, próximo à portaria..."
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontFamily: 'inherit', fontSize: '0.9rem' }}
                                ></textarea>
                            </div>
                            
                            <div style={{background: '#fcfcfc', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--color-river)'}}>
                                <h4 style={{marginBottom: '10px'}}><i className="fas fa-user-lock"></i> Gestão do Comprador e Documentações</h4>
                                
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>CPF do Comprador (Vincular ao Portal):</label>
                                <input type="text" defaultValue={editingLot.clientCpf || ''} onChange={e => {
                                    const newLots = lots.map(l => l.id === editingLot.id ? {...l, clientCpf: e.target.value} : l);
                                    setLots(newLots);
                                }} style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc'}} placeholder="Ex: 123.456.789-00" />
                                
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Nome do Cliente:</label>
                                <input type="text" defaultValue={editingLot.client || ''} onChange={e => {
                                    const newLots = lots.map(l => l.id === editingLot.id ? {...l, client: e.target.value} : l);
                                    setLots(newLots);
                                }} style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc'}} />

                                <div style={{ background: '#f0f4f8', padding: '15px', borderRadius: '8px', border: '1px solid #dce4ec', marginTop: '20px' }}>
                                    <h4 style={{fontSize: '0.9rem', color: 'var(--color-dark)', marginBottom: '15px'}}><i className="fas fa-folder-open"></i> Documentos da Administração</h4>
                                    
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '3px' }}>Contrato Oficial Assinado (PDF/Imagem):</label>
                                    <input type="file" onChange={(e) => {
                                        const file = e.target.files[0];
                                        if(!file) return;
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            const adminDocs = editingLot.adminDocs || {};
                                            adminDocs['contrato'] = { name: file.name, url: reader.result };
                                            const newLots = lots.map(l => l.id === editingLot.id ? {...l, adminDocs} : l);
                                            try {
                                                localStorage.setItem('db_lots', JSON.stringify(newLots));
                                                setLots(newLots);
                                                alert('Upload do Contrato concluído!');
                                            } catch(err) {
                                                adminDocs['contrato'].url = '#';
                                                const fallback = lots.map(l => l.id === editingLot.id ? {...l, adminDocs} : l);
                                                localStorage.setItem('db_lots', JSON.stringify(fallback));
                                                setLots(fallback);
                                                alert('Arquivo grande. Referência do Contrato salva!');
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                    }} style={{ width: '100%', fontSize: '0.8rem', marginBottom: '10px' }} />

                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '3px' }}>Memorial Descritivo do Lote:</label>
                                    <input type="file" onChange={(e) => {
                                        const file = e.target.files[0];
                                        if(!file) return;
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            const adminDocs = editingLot.adminDocs || {};
                                            adminDocs['memorial'] = { name: file.name, url: reader.result };
                                            const newLots = lots.map(l => l.id === editingLot.id ? {...l, adminDocs} : l);
                                            try {
                                                localStorage.setItem('db_lots', JSON.stringify(newLots));
                                                setLots(newLots);
                                                alert('Upload do Memorial concluído!');
                                            } catch(err) {
                                                adminDocs['memorial'].url = '#';
                                                const fallback = lots.map(l => l.id === editingLot.id ? {...l, adminDocs} : l);
                                                localStorage.setItem('db_lots', JSON.stringify(fallback));
                                                setLots(fallback);
                                                alert('Arquivo grande. Referência salva!');
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                    }} style={{ width: '100%', fontSize: '0.8rem', marginBottom: '10px' }} />

                                    <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                                        <h4 style={{fontSize: '0.9rem', color: 'var(--color-dark)', marginBottom: '10px'}}><i className="fas fa-inbox"></i> Documentos Enviados pelo Cliente</h4>
                                        {editingLot.clientDocs && editingLot.clientDocs.length > 0 ? (
                                            <ul style={{ paddingLeft: '20px', fontSize: '0.85rem' }}>
                                                {editingLot.clientDocs.map((doc, idx) => (
                                                    <li key={idx} style={{ marginBottom: '5px' }}>
                                                        <a href={doc.url} download={doc.name} style={{ color: 'var(--color-river)', fontWeight: 'bold' }}>{doc.name}</a>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p style={{ color: '#999', fontSize: '0.8rem' }}>Nenhum documento recebido do cliente ainda.</p>
                                        )}
                                    </div>
                                </div>




                                <button 
                                    className="btn btn-secondary" 
                                    style={{ borderColor: 'red', color: 'red', width: '100%', marginTop: '30px', fontWeight: 'bold' }}
                                    onClick={() => {
                                        if (window.confirm(`TEM CERTEZA que deseja EXCLUIR o ${editingLot.id}? Esta ação é irreversível.`)) {
                                            const newLots = lots.filter(l => l.uid !== editingLot.uid);
                                            setLots(newLots);
                                            const newMapped = drawnLots.filter(d => d.id !== editingLot.id);
                                            setDrawnLots(newMapped);
                                            setEditingLotUid(null);
                                        }
                                    }}
                                >
                                    <i className="fas fa-trash"></i> Excluir Lote Definitivamente
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 1. CRM DE LOTES --- */}
                {activeTab === 'crm' && !editingLotUid && !isCreatingLot && (
                    <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3>Gerenciamento Mestre (CRM)</h3>
                                <p style={{ color: '#666', fontSize: '0.9rem' }}>Passo 1: Este é o banco de dados. Cadastre fisicamente os lotes aqui.</p>
                            </div>
                            <button onClick={() => setIsCreatingLot(true)} className="btn btn-primary" style={{ padding: '10px 20px', background: 'var(--color-forest)', color: 'white' }}>
                                <i className="fas fa-plus"></i> Novo Lote Oficial
                            </button>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f9f9f9', color: '#666' }}>
                                    <th style={{ padding: '15px 10px' }}>ID / Banco Dados</th>
                                    <th style={{ padding: '15px 10px' }}>Status Base</th>
                                    <th style={{ padding: '15px 10px' }}>Cliente Vinculado</th>
                                    <th style={{ padding: '15px 10px' }}>Preço/Área</th>
                                    <th style={{ padding: '15px 10px', textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...lots].sort((a, b) => {
                                    const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
                                    const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
                                    return numA - numB;
                                }).map((lot, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '15px 10px', fontWeight: 'bold', color: 'var(--color-dark)' }}>{lot.id}</td>
                                        <td style={{ padding: '15px 10px' }}>{lot.status}</td>
                                        <td style={{ padding: '15px 10px' }}>{lot.client}</td>
                                        <td style={{ padding: '15px 10px' }}>R$ {Number(lot.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <br/><small style={{color:'#999'}}>{lot.size}</small></td>
                                        <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                            <button onClick={() => setEditingLotUid(lot.uid)} style={{ border: '1px solid var(--color-river)', background: 'transparent', color: 'var(--color-river)', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Editar / Financeiro</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TELA DE CRIAR NOVO LOTE NO BD */}
                {isCreatingLot && (
                    <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)', maxWidth: '600px', margin: '0 auto' }}>
                        <h3>Cadastrar Lote no Banco de Dados Central</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>Defina a fundação deste imóvel.</p>
                        
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Identificação (Ex: Lote 05)</label>
                        <input type="text" value={newLotForm.id} onChange={e => setNewLotForm({...newLotForm, id: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }} />
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Área (m²)</label>
                                <input type="number" onChange={e => {
                                    const area = Number(e.target.value);
                                    const simConfig = JSON.parse(localStorage.getItem('db_sim_config') || '{"valorBaseM2": 250}');
                                    setNewLotForm({
                                        ...newLotForm, 
                                        size: area ? area + 'm²' : '', 
                                        price: area * (simConfig.valorBaseM2 || 250)
                                    });
                                }} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Preço Calc. (R$)</label>
                                <input type="number" value={newLotForm.price} onChange={e => setNewLotForm({...newLotForm, price: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }} />
                            </div>
                        </div>
                        
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Descritivo Promocional</label>
                        <textarea value={newLotForm.desc || ''} onChange={e => setNewLotForm({...newLotForm, desc: e.target.value})} placeholder="Vantagens de relevo, proximidade com a entrada, etc." rows="3" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px', fontFamily: 'inherit' }}></textarea>

                        <div style={{ background: '#f0f4f8', padding: '15px', borderRadius: '8px', border: '1px solid #dce4ec', marginBottom: '20px' }}>
                            <h4 style={{fontSize: '0.9rem', color: 'var(--color-dark)', marginBottom: '15px'}}><i className="fas fa-folder-open"></i> Anexar Documentação Inicial</h4>
                            
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '3px' }}>Planta / Memorial Descritivo:</label>
                            <input type="file" onChange={(e) => {
                                if(e.target.files[0]) { alert('Upload inicial de: ' + e.target.files[0].name); }
                            }} style={{ width: '100%', fontSize: '0.8rem', marginBottom: '10px' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setIsCreatingLot(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleCreateLot}>Criar no Banco de Dados</button>
                        </div>
                    </div>
                )}

                {/* --- 2. APROVAÇÕES DE NOVOS CLIENTES --- */}
                {activeTab === 'approvals' && (
                    <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                        <h3>2. Triagem e Liberação de Cadastros</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>Libere o acesso dos usuários que se cadastraram pelo site.</p>
                        
                        {pendingUsers.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#999', background: '#f9f9f9', borderRadius: '10px' }}>
                                Nenhum cliente pendente de aprovação.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <tbody>
                                    {pendingUsers.map(user => (
                                        <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '15px 10px', fontWeight: 'bold' }}>{user.name}<br/><small style={{color:'#666'}}>{user.cpf}</small></td>
                                            <td style={{ padding: '15px 10px' }}>
                                                <button style={{background:'none', border:'none', color:'var(--color-river)', cursor:'pointer', textDecoration:'underline'}} onClick={() => alert('Download simulado dos documentos enviados pelo cliente.')}>
                                                    <i className="fas fa-file-pdf" style={{color: 'red'}}></i> Baixar Docs Anexados
                                                </button>
                                            </td>
                                            <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                                <button onClick={() => approveUser(user.id)} style={{ background: 'var(--color-forest)', color: 'white', padding: '8px 15px', borderRadius: '5px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginRight: '10px' }}>Aprovar Acesso</button>
                                                <button style={{ background: 'transparent', color: '#c62828', padding: '8px 15px', borderRadius: '5px', border: '1px solid #c62828', fontWeight: 'bold', cursor: 'pointer' }}>Recusar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <div style={{ marginTop: '50px', borderTop: '2px solid #eee', paddingTop: '30px' }}>
                            <h3 style={{ color: 'var(--color-forest)' }}>Acessos Liberados (Histórico)</h3>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>Clientes que já possuem permissão de login. Veja CPF e Senha abaixo.</p>
                            
                            {approvedUsers.length === 0 ? (
                                <p style={{ color: '#999', textAlign: 'center' }}>Nenhum acesso liberado ainda.</p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fcfcfc', borderRadius: '10px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #ddd', color: '#333' }}>
                                            <th style={{ padding: '15px' }}>Nome / Lote</th>
                                            <th>CPF (Login)</th>
                                            <th>E-mail</th>
                                            <th>Senha</th>
                                            <th>Documentos</th>
                                            <th style={{ textAlign: 'right', paddingRight: '15px' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {approvedUsers.map(user => (
                                            <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '15px' }}>
                                                    <strong>{user.name}</strong><br/>
                                                    <small style={{ color: 'var(--color-river)' }}>{user.loteId || 'Cadastro Site'}</small>
                                                </td>
                                                <td style={{ fontWeight: 'bold' }}>{user.cpf}</td>
                                                <td>{user.email || user.emailClient || '-'}</td>
                                                <td style={{ color: '#d32f2f', fontWeight: 'bold' }}>{user.senha || user.password || '123456'}</td>
                                                <td>
                                                    <button style={{background:'none', border:'none', color:'var(--color-forest)', cursor:'pointer', textDecoration:'underline'}} onClick={() => alert('Download do Contrato Assinado / Docs anexados do usuário simulado.')}>
                                                        <i className="fas fa-download"></i> Baixar Contrato e Docs
                                                    </button>
                                                </td>
                                                <td style={{ textAlign: 'right', paddingRight: '15px' }}>
                                                    <button 
                                                        onClick={() => {
                                                            const updated = approvedUsers.filter(u => u.id !== user.id);
                                                            setApprovedUsers(updated);
                                                            localStorage.setItem('db_approved_users', JSON.stringify(updated));
                                                        }}
                                                        style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                        Revogar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* --- 3. MAPEAMENTO E VÍNCULO (SITE PÚBLICO) --- */}
                {activeTab === 'site' && (
                    <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)', marginBottom: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3><i className="fas fa-map-marked-alt" style={{color:'var(--color-forest)'}}></i> 3. Vitrine: Conectar Polígonos na Planta</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                                    {drawnLots.map((l, idx) => (
                                        <span key={idx} style={{ background: '#eee', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {l.id} 
                                            <i className="fas fa-times" style={{ color: 'red', cursor: 'pointer' }} onClick={() => setDrawnLots(drawnLots.filter(x => x.id !== l.id))}></i>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button onClick={clearMap} className="btn btn-secondary" style={{ borderColor: 'red', color: 'red', padding: '5px 15px', fontSize: '0.8rem' }}>Apagar Tudo</button>
                        </div>
                        
                        <div 
                            onMouseDown={handleMapMouseDown}
                            onMouseMove={handleMapMouseMove}
                            onMouseUp={handleMapMouseUp}
                            style={{ 
                                position: 'relative', 
                                width: '100%', 
                                minHeight: '800px', 
                                background: `url(${localStorage.getItem('mapa_customizado') || mapaPlanta})`, 
                                backgroundSize: '100% 100%', 
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center', 
                                borderRadius: '10px', 
                                overflow: 'hidden', 
                                border: '3px solid var(--color-river)',
                                cursor: 'crosshair',
                                userSelect: 'none'
                            }}
                        >
                            {/* LOTES DESENHADOS */}
                            {drawnLots.map((mappedLot, idx) => {
                                const fullData = lots.find(l => l.id === mappedLot.id);
                                const isVendido = fullData?.status === 'Vendido';
                                const isReservado = fullData?.status === 'Reservado';

                                return (
                                    <div key={idx} style={{
                                        position: 'absolute', left: `${mappedLot.left}%`, top: `${mappedLot.top}%`, width: `${mappedLot.width}%`, height: `${mappedLot.height}%`,
                                        backgroundColor: isVendido ? 'rgba(74, 74, 74, 0.5)' : 
                                                        isReservado ? 'rgba(255, 193, 7, 0.5)' : 
                                                        'rgba(46, 125, 50, 0.4)', 
                                        border: isVendido ? '1px solid #333' : 
                                                isReservado ? '2px solid #ff8f00' :
                                                '2px solid #2e7d32',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                        color: isVendido ? '#eee' : '#fff', 
                                        fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.8)', fontSize: '0.7rem',
                                        pointerEvents: 'none', transition: '0.3s'
                                    }}>
                                        {mappedLot.id}
                                    </div>
                                );
                            })}
                            {currRect && (
                                <div style={{
                                    position: 'absolute', left: `${currRect.left}%`, top: `${currRect.top}%`, width: `${currRect.width}%`, height: `${currRect.height}%`,
                                    backgroundColor: 'rgba(255, 255, 255, 0.4)', border: '2px dashed #000', pointerEvents: 'none'
                                }} />
                            )}
                        </div>

                        {pendingPoly && (
                            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ background: 'white', padding: '30px', borderRadius: '15px', maxWidth: '400px', width: '90%' }}>
                                    <h3>Vincular a qual Lote?</h3>
                                    <select id="linkLotSelect" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', fontSize: '1rem' }}>
                                        <option value="">-- Selecione --</option>
                                        {lots.map(l => (
                                            <option key={l.uid} value={l.id}>{l.id}</option>
                                        ))}
                                    </select>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                                            const val = document.getElementById('linkLotSelect').value;
                                            if(val) linkPolygonToLot(val);
                                        }}>Salvar</button>
                                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPendingPoly(null)}>Descartar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- 4. GALERIA --- */}
                {activeTab === 'galeria' && (
                    <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                        <h3>4. Gerenciamento de Galeria</h3>
                        <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
                            <input type="file" multiple accept="image/*,video/mp4" onChange={(e) => {
                                const files = Array.from(e.target.files);
                                files.forEach(file => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        const type = file.type.includes('video') ? 'localVideo' : 'image';
                                        const newItem = { type, url: reader.result, name: file.name, id: Date.now() + Math.random() };
                                        updateGallery([newItem, ...galleryItems]);
                                    };
                                    reader.readAsDataURL(file);
                                });
                            }}/>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                            {galleryItems.map(item => (
                                <div key={item.id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{ height: '100px', background: '#000' }}>
                                        {item.type === 'image' && <img src={item.url} style={{width:'100%', height:'100%', objectFit:'cover'}}/>}
                                        {item.type === 'localVideo' && <video src={item.url} style={{width:'100%', height:'100%', objectFit:'cover'}} muted/>}
                                    </div>
                                    <button onClick={() => updateGallery(galleryItems.filter(i => i.id !== item.id))} style={{width:'100%', background:'#fee', color:'red', border:'none', padding:'5px', cursor:'pointer'}}>Remover</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- 5. TEXTOS --- */}
                {activeTab === 'copywriting' && (
                    <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                        <h3>5. Editor de Textos</h3>
                        <textarea id="copyEditor" defaultValue={localStorage.getItem('db_about_text') || defaultCopy} style={{width:'100%', height:'300px', padding:'15px', borderRadius:'8px', border:'1px solid #ddd'}}/>
                        <button className="btn btn-primary" style={{marginTop:'20px'}} onClick={() => {
                            localStorage.setItem('db_about_text', document.getElementById('copyEditor').value);
                            alert('Atualizado!');
                        }}>Salvar Textos</button>
                    </div>
                )}

                {/* --- 6. CONFIGURADOR DO SIMULADOR --- */}
                {activeTab === 'simconfig' && (() => {
                    const savedInfo = JSON.parse(localStorage.getItem('db_sim_config') || '{"taxaAnual":0.06,"entradaMinima":8500,"descontoAvista":10,"maxParcelas":100,"valorBaseM2":250}');
                    return (
                        <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                            <h3>6. Configurações Financeiras Globais (Simulador)</h3>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '30px' }}>
                                Defina as diretrizes matemáticas que controlam o "Simulador Sem Surpresas" da sua Vitrine.
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--color-river)', gridColumn: '1 / 3' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold' }}>Valor Base Global do Metro Quadrado (R$/m²)</label>
                                    <input id="cfg_valorm2" type="number" defaultValue={savedInfo.valorBaseM2 || 250} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-forest)' }} />
                                    <small style={{ color: '#999' }}>Ao cadastrar um lote informando sua Área (m²), o sistema calculará automaticamente o preço oficial multiplicando a área por este valor.</small>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold' }}>Índice de Correção Anual (%)</label>
                                    <input id="cfg_taxa" type="number" defaultValue={savedInfo.taxaAnual * 100} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }} />
                                    <small style={{ color: '#999' }}>Ex: 6 para 6% a.a de correção na fórmula.</small>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold' }}>Entrada Mínima (Reais)</label>
                                    <input id="cfg_entrada" type="number" defaultValue={savedInfo.entradaMinima} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }} />
                                    <small style={{ color: '#999' }}>Impede preenchimentos com entradas fictícias.</small>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold' }}>Desconto Especial À Vista (%)</label>
                                    <input id="cfg_desconto" type="number" defaultValue={savedInfo.descontoAvista} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }} />
                                    <small style={{ color: '#999' }}>Bônus mostrado caso o pagamento seja cash (Ex: 10).</small>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold' }}>Máximo de Parcelas (Meses)</label>
                                    <input id="cfg_maxparc" type="number" defaultValue={savedInfo.maxParcelas} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }} />
                                    <small style={{ color: '#999' }}>Limite superior do slider. (Default 100).</small>
                                </div>
                            </div>
                            
                            <button className="btn btn-primary" style={{ marginTop: '30px', width: '100%' }} onClick={() => {
                                const newConf = {
                                    valorBaseM2: Number(document.getElementById('cfg_valorm2').value),
                                    taxaAnual: Number(document.getElementById('cfg_taxa').value) / 100,
                                    entradaMinima: Number(document.getElementById('cfg_entrada').value),
                                    descontoAvista: Number(document.getElementById('cfg_desconto').value),
                                    maxParcelas: Number(document.getElementById('cfg_maxparc').value)
                                };
                                localStorage.setItem('db_sim_config', JSON.stringify(newConf));
                                
                                // ATUALIZAÇÃO EM MASSA: Recalcular preços de todos os lotes com base no novo m2
                                const updatedLots = lots.map(l => {
                                    const areaNum = parseFloat(l.size.replace(',', '.').replace(/[^\d.]/g, ''));
                                    if (!isNaN(areaNum)) {
                                        return { ...l, price: areaNum * newConf.valorBaseM2 };
                                    }
                                    return l;
                                });
                                
                                setLots(updatedLots);
                                localStorage.setItem('db_lots', JSON.stringify(updatedLots));
                                
                                alert("Parâmetros do simulador e preços de todos os lotes atualizados com sucesso!");
                            }}>Salvar Matriz Financeira</button>
                        </div>
                    );
                })()}

                {/* --- 7. GESTÃO DE RECEBÍVEIS (DASHBOARD FINANCEIRO) --- */}
                {activeTab === 'finance' && (() => {
                    const soldLots = lots.filter(l => l.status === 'Vendido');
                    const availableLots = lots.filter(l => l.status === 'Disponível');
                    
                    const totalVendido = soldLots.reduce((acc, l) => acc + (l.price || 0), 0);
                    const totalDisponivel = availableLots.reduce((acc, l) => acc + (l.price || 0), 0);
                    const totalProjeto = totalVendido + totalDisponivel;
                    
                    const inadimplentes = soldLots.filter(l => l.paymentStatus === 'Atrasado');
                    const emDia = soldLots.filter(l => l.paymentStatus === 'Em Dia');
                    const totalAtrasado = inadimplentes.length;
                    
                    const monthlyProjection = soldLots.reduce((acc, l) => {
                        const parcela = (l.price * 0.9) / 120; // Estimativa simples: 90% parcelado em 120x
                        return acc + parcela;
                    }, 0);

                    return (
                        <div style={{ animation: 'fadeIn 0.5s' }}>
                            {financeSubView ? (
                                <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                                    <button onClick={() => setFinanceSubView(null)} style={{ background: 'none', border: 'none', color: 'var(--color-river)', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>
                                        <i className="fas fa-arrow-left"></i> Voltar ao Dashboard Geral
                                    </button>
                                    <h3>Gerenciamento de Mensalidades - {lots.find(l => l.uid === financeSubView)?.id}</h3>
                                    <p style={{ color: '#666', marginBottom: '20px' }}>Lote de <strong>{lots.find(l => l.uid === financeSubView)?.client}</strong>. Faça upload do boleto (PDF) para os meses requeridos e confira o comprovante enviado pelo cliente.</p>
                                    
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #eee', background: '#f9f9f9' }}>
                                                <th style={{ padding: '15px' }}>Mês/Parcela</th>
                                                <th style={{ padding: '15px' }}>Boleto (Você Envia)</th>
                                                <th style={{ padding: '15px' }}>Comprovante (Cliente)</th>
                                                <th style={{ padding: '15px' }}>Validação (Admin)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const currentLot = lots.find(l => l.uid === financeSubView) || {};
                                                const total = currentLot.totalParcelas || 120;
                                                const pagamentos = currentLot.payments || [];
                                                
                                                return Array.from({ length: total }).map((_, idx) => {
                                                    const num = idx + 1;
                                                    const pData = pagamentos[idx] || {};
                                                    const isQuitado = pData.quitado || false;
                                                    
                                                                                    const savePaymentUpdate = (newPData) => {
                                                        const updatedPayments = [...pagamentos];
                                                        updatedPayments[idx] = { ...pData, ...newPData };
                                                        const updatedLot = { ...currentLot, payments: updatedPayments };
                                                        const newLots = lots.map(l => l.uid === currentLot.uid ? updatedLot : l);
                                                        
                                                        try {
                                                            localStorage.setItem('db_lots', JSON.stringify(newLots));
                                                            setLots(newLots);
                                                        } catch(e) {
                                                            if (newPData.boletoUrl) {
                                                                updatedPayments[idx].boletoUrl = '#'; // Fallback
                                                                const fallbackLot = { ...currentLot, payments: updatedPayments };
                                                                const fallbackLots = lots.map(l => l.uid === currentLot.uid ? fallbackLot : l);
                                                                localStorage.setItem('db_lots', JSON.stringify(fallbackLots));
                                                                setLots(fallbackLots);
                                                                alert('Boleto muito pesado para armazenamento local. Apenas a marcação do mês foi lançada.');
                                                            }
                                                        }
                                                    };

                                                    return (
                                                        <tr key={idx} style={{ borderBottom: '1px solid #eee', background: isQuitado ? '#f6fff8' : 'white' }}>
                                                            <td style={{ padding: '15px' }}><strong>{num.toString().padStart(2, '0')}/{total}</strong></td>
                                                            <td style={{ padding: '15px' }}>
                                                                {pData.boletoUrl && pData.boletoUrl !== '#' ? (
                                                                    <div style={{color: 'var(--color-forest)'}}>Enviado</div>
                                                                ) : (
                                                                    <input type="file" onChange={(e) => {
                                                                        const f = e.target.files[0];
                                                                        if(!f) return;
                                                                        const reader = new FileReader();
                                                                        reader.onload = () => savePaymentUpdate({ boletoUrl: reader.result, boletoName: f.name });
                                                                        reader.readAsDataURL(f);
                                                                    }} style={{ width: '150px', fontSize: '0.7rem' }} />
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '15px' }}>
                                                                {pData.comprovanteUrl && pData.comprovanteUrl !== '#' ? (
                                                                    <a href={pData.comprovanteUrl} download={pData.comprovanteName || "comprovante"} style={{ color: 'var(--color-river)', textDecoration: 'none', fontWeight: 'bold' }}>
                                                                        <i className="fas fa-eye"></i> Ver Comprovante
                                                                    </a>
                                                                ) : (
                                                                    <span style={{ color: '#999' }}>Aguardando Cliente</span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '15px' }}>
                                                                <button 
                                                                    onClick={() => savePaymentUpdate({ quitado: !isQuitado })}
                                                                    style={{ background: isQuitado ? 'var(--color-forest)' : '#eee', color: isQuitado ? 'white' : '#333', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                                    {isQuitado ? 'Dever Quitado' : 'Marcar Quitado'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: 'var(--shadow)', borderLeft: '5px solid var(--color-forest)' }}>
                                    <small style={{ color: '#999', fontWeight: 'bold' }}>VALOR TOTAL EM VENDAS</small>
                                    <h3 style={{ fontSize: '1.5rem', color: 'var(--color-forest)', marginTop: '5px' }}>{totalVendido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                                    <p style={{ fontSize: '0.8rem', color: '#999' }}>{soldLots.length} Lotes Vendidos</p>
                                </div>
                                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: 'var(--shadow)', borderLeft: '5px solid var(--color-river)' }}>
                                    <small style={{ color: '#999', fontWeight: 'bold' }}>POTENCIAL À VENDA</small>
                                    <h3 style={{ fontSize: '1.5rem', color: 'var(--color-river)', marginTop: '5px' }}>{totalDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                                    <p style={{ fontSize: '0.8rem', color: '#999' }}>{availableLots.length} Lotes Disponíveis</p>
                                </div>
                                <div style={{ background: 'var(--color-dark)', padding: '20px', borderRadius: '15px', boxShadow: 'var(--shadow)', borderLeft: '5px solid var(--color-sand)', color: 'white' }}>
                                    <small style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>VGV (VALOR GLOBAL DO PROJETO)</small>
                                    <h3 style={{ fontSize: '1.6rem', color: 'white', marginTop: '5px' }}>{totalProjeto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Retorno Máximo Estimado</p>
                                </div>
                                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: 'var(--shadow)', borderLeft: '5px solid #f44336' }}>
                                    <small style={{ color: '#999', fontWeight: 'bold' }}>ÍNDICE DE INADIMPLÊNCIA</small>
                                    <h3 style={{ fontSize: '1.5rem', color: '#f44336', marginTop: '5px' }}>{soldLots.length > 0 ? ((totalAtrasado / soldLots.length) * 100).toFixed(1) : 0}%</h3>
                                    <p style={{ fontSize: '0.8rem', color: '#999' }}>{totalAtrasado} lotes em atraso</p>
                                </div>
                            </div>


                            <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)', marginBottom: '30px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3>Configuração Global de Pagamento</h3>
                                </div>
                                <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px', display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.8rem' }}>Sua Chave PIX (Aparecerá no portal do cliente)</label>
                                        <input 
                                            type="text" 
                                            value={pixKey} 
                                            onChange={(e) => savePixKey(e.target.value)}
                                            placeholder="Ex: CNPJ ou E-mail"
                                            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} 
                                        />
                                    </div>
                                    <button className="btn btn-primary" onClick={() => alert('Chave PIX atualizada para todos os clientes!')}>Salvar Configuração</button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                                <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                                    <h3>Relatório Detalhado de Cobrança</h3>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                                <th style={{ padding: '15px 10px' }}>Lote / Cliente</th>
                                                <th style={{ padding: '15px 10px' }}>Status</th>
                                                <th style={{ padding: '15px 10px' }}>Próx. Vencimento</th>
                                                <th style={{ padding: '15px 10px' }}>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {soldLots.map(l => (
                                                <tr key={l.uid} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                    <td style={{ padding: '15px 10px' }}>
                                                        <strong>{l.id}</strong><br/>
                                                        <small style={{ color: '#666' }}>{l.client}</small>
                                                    </td>
                                                    <td style={{ padding: '15px 10px' }}>{getPaymentBadge(l.paymentStatus)}</td>
                                                    <td style={{ padding: '15px 10px' }}>10/{new Date().getMonth() + 2}/{new Date().getFullYear()}</td>
                                                    <td style={{ padding: '15px 10px' }}>
                                                        <button 
                                                            onClick={() => { setFinanceSubView(l.uid); }}
                                                            style={{ background: 'none', border: '1px solid #ddd', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                            Gerenciar Mensalidades
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                                    <h3>Notificações</h3>
                                    <div style={{ marginTop: '20px' }}>
                                        {inadimplentes.map(l => (
                                            <div key={l.uid} style={{ padding: '15px', background: '#fff1f0', borderRadius: '10px', marginBottom: '10px', borderLeft: '4px solid #f5222d' }}>
                                                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>PAGAMENTO ATRASADO</p>
                                                <p style={{ margin: '5px 0', fontSize: '0.8rem' }}>{l.client} ({l.id}) está com parcelas pendentes.</p>
                                                <button style={{ background: '#f5222d', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Cobrar via WhatsApp</button>
                                            </div>
                                        ))}
                                        {soldLots.length === 0 && <p style={{ color: '#999', textAlign: 'center' }}>Nenhuma venda registrada.</p>}
                                    </div>
                                </div>
                                </div>
                                </>
                            )}
                        </div>
                    );
                })()}
                {/* --- 8. BOLETOS E MENSALIDADES --- */}
                {activeTab === 'boletos' && (() => {
                    const soldLots = lots.filter(l => l.status === 'Vendido' || l.client);
                    return (
                        <div style={{ animation: 'fadeIn 0.5s' }}>
                            {financeSubView ? (
                                <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                                    <button onClick={() => setFinanceSubView(null)} style={{ background: 'none', border: 'none', color: 'var(--color-river)', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>
                                        <i className="fas fa-arrow-left"></i> Voltar à Lista de Lotes Vendidos
                                    </button>
                                    <h3>Lançamento de Boletos - {lots.find(l => l.uid === financeSubView)?.id}</h3>
                                    <p style={{ color: '#666', marginBottom: '20px' }}>Lote de <strong>{lots.find(l => l.uid === financeSubView)?.client}</strong>. Faça upload do boleto (PDF) para os meses requeridos e confira o comprovante enviado pelo cliente.</p>
                                    
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #eee', background: '#f9f9f9' }}>
                                                <th style={{ padding: '15px' }}>Mês/Parcela</th>
                                                <th style={{ padding: '15px' }}>Boleto (Você Envia)</th>
                                                <th style={{ padding: '15px' }}>Comprovante (Cliente)</th>
                                                <th style={{ padding: '15px' }}>Validação (Admin)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const currentLot = lots.find(l => l.uid === financeSubView) || {};
                                                const total = currentLot.totalParcelas || 120;
                                                const pagamentos = currentLot.payments || [];
                                                
                                                return Array.from({ length: total }).map((_, idx) => {
                                                    const num = idx + 1;
                                                    const pData = pagamentos[idx] || {};
                                                    const isQuitado = pData.quitado || false;
                                                    
                                                    const savePaymentUpdate = (newPData) => {
                                                        const updatedPayments = [...pagamentos];
                                                        updatedPayments[idx] = { ...pData, ...newPData };
                                                        const updatedLot = { ...currentLot, payments: updatedPayments };
                                                        const newLots = lots.map(l => l.uid === currentLot.uid ? updatedLot : l);
                                                        
                                                        try {
                                                            localStorage.setItem('db_lots', JSON.stringify(newLots));
                                                            setLots(newLots);
                                                        } catch(e) {
                                                            if (newPData.boletoUrl) {
                                                                updatedPayments[idx].boletoUrl = '#'; // Fallback
                                                                const fallbackLot = { ...currentLot, payments: updatedPayments };
                                                                const fallbackLots = lots.map(l => l.uid === currentLot.uid ? fallbackLot : l);
                                                                localStorage.setItem('db_lots', JSON.stringify(fallbackLots));
                                                                setLots(fallbackLots);
                                                                alert('Boleto muito pesado para armazenamento local. Apenas a marcação do mês foi lançada.');
                                                            }
                                                        }
                                                    };

                                                    return (
                                                        <tr key={idx} style={{ borderBottom: '1px solid #eee', background: isQuitado ? '#f6fff8' : 'white' }}>
                                                            <td style={{ padding: '15px' }}><strong>{num.toString().padStart(2, '0')}/{total}</strong></td>
                                                            <td style={{ padding: '15px' }}>
                                                                {pData.boletoUrl && pData.boletoUrl !== '#' ? (
                                                                    <div style={{color: 'var(--color-forest)'}}>Enviado</div>
                                                                ) : (
                                                                    <input type="file" onChange={(e) => {
                                                                        const f = e.target.files[0];
                                                                        if(!f) return;
                                                                        const reader = new FileReader();
                                                                        reader.onload = () => savePaymentUpdate({ boletoUrl: reader.result, boletoName: f.name });
                                                                        reader.readAsDataURL(f);
                                                                    }} style={{ width: '150px', fontSize: '0.7rem' }} />
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '15px' }}>
                                                                {pData.comprovanteUrl && pData.comprovanteUrl !== '#' ? (
                                                                    <a href={pData.comprovanteUrl} download={pData.comprovanteName || "comprovante"} style={{ color: 'var(--color-river)', textDecoration: 'none', fontWeight: 'bold' }}>
                                                                        <i className="fas fa-eye"></i> Ver Comprovante
                                                                    </a>
                                                                ) : (
                                                                    <span style={{ color: '#999' }}>Aguardando Cliente</span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '15px' }}>
                                                                <button 
                                                                    onClick={() => savePaymentUpdate({ quitado: !isQuitado })}
                                                                    style={{ background: isQuitado ? 'var(--color-forest)' : '#eee', color: isQuitado ? 'white' : '#333', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                                    {isQuitado ? 'Dever Quitado' : 'Marcar Quitado'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                                    <h3>Lotes Vendidos - Selecione para Lançar Boletos</h3>
                                    <p style={{ color: '#666', marginBottom: '20px' }}>Abaixo estão os lotes vendidos ou com clientes atrelados. Clique em Lançar Mensalidades para enviar os boletos mês a mês.</p>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                                <th style={{ padding: '15px 10px' }}>Lote / Cliente</th>
                                                <th style={{ padding: '15px 10px' }}>Status Atual</th>
                                                <th style={{ padding: '15px 10px' }}>Próx. Vencimento</th>
                                                <th style={{ padding: '15px 10px', textAlign: 'right' }}>Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {soldLots.map(l => (
                                                <tr key={l.uid} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                    <td style={{ padding: '15px 10px' }}>
                                                        <strong>{l.id}</strong><br/>
                                                        <small style={{ color: '#666' }}>{l.client}</small>
                                                    </td>
                                                    <td style={{ padding: '15px 10px' }}> <span style={{ color: '#4caf50', fontWeight: 'bold' }}>Em Andamento</span> </td>
                                                    <td style={{ padding: '15px 10px' }}>10/{new Date().getMonth() + 2}/{new Date().getFullYear()}</td>
                                                    <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                                        <button 
                                                            onClick={() => { setFinanceSubView(l.uid); }}
                                                            style={{ background: 'var(--color-river)', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                            Lançar Mensalidades
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {soldLots.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>Nenhum lote vendido ainda.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })()}

            </div>
        </div>
    );
};

export default AdminArea;
