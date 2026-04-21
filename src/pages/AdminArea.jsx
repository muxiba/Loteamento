import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadGalleryDB, saveGalleryDB } from '../utils/db';
import mapaPlanta from '../assets/planta.jpg';
import { defaultCopy } from '../components/About';
import { useLots } from '../hooks/useLots';
import { getUsers, updateUserStatus } from '../services/userService';
import { getMappedLots, saveMappedLots, clearAllMappedLots, deleteMappedLot } from '../services/mapService';
import { getConfig, setConfig } from '../services/configService';
import { getGalleryItems, uploadGalleryFile, addGalleryItem, deleteGalleryItem } from '../services/galleryService';

const AdminArea = () => {
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [activeTab, setActiveTab] = useState('crm');
    const [editingLotUid, setEditingLotUid] = useState(null);
    const [isCreatingLot, setIsCreatingLot] = useState(false);
    const [newLotForm, setNewLotForm] = useState({ id: '', price: '', size: '', desc: '' });

    const [loginUser, setLoginUser] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [financeSubView, setFinanceSubView] = useState(null);

    const { lots, loading: lotsLoading, error: lotsError, addLot, editLot, removeLot, reload: reloadLots } = useLots();
    
    const [pixKey, setPixKey] = useState('chave@pix.com');
    const [simConfig, setSimConfig] = useState({ taxaAnual: 0.06, entradaMinima: 8500, descontoAvista: 10, maxParcelas: 100, valorBaseM2: 250 });

    const [galleryItems, setGalleryItems] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [approvedUsers, setApprovedUsers] = useState([]);
    const [drawnLots, setDrawnLots] = useState([]);
    const [mapImageUrl, setMapImageUrl] = useState(mapaPlanta);

    // Load Initial Data from Supabase
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Config
                const savedPix = await getConfig('pix_key');
                if (savedPix) setPixKey(savedPix);
                
                const savedSim = await getConfig('sim_config');
                if (savedSim) setSimConfig(savedSim);

                const savedMap = await getConfig('map_custom_url');
                if (savedMap) setMapImageUrl(savedMap);

                // Users
                const pending = await getUsers('pending');
                setPendingUsers(pending);
                const approved = await getUsers('approved');
                setApprovedUsers(approved);

                // Map
                const mapped = await getMappedLots();
                setDrawnLots(mapped);

                // Gallery
                const items = await getGalleryItems();
                setGalleryItems(items);
            } catch (err) {
                console.error("Error loading initial data:", err);
            }
        };

        loadInitialData();
    }, []);

    const savePixKey = async (key) => {
        setPixKey(key);
        await setConfig('pix_key', key);
    };


    const approveUser = async (userId) => {
        try {
            const currentUser = pendingUsers.find(u => u.id === userId);
            await updateUserStatus(userId, 'approved');
            
            setPendingUsers(prev => prev.filter(u => u.id !== userId));
            setApprovedUsers(prev => [...prev, { ...currentUser, status: 'approved', approvedAt: new Date().toISOString() }]);

            alert(`O acesso do cliente ${currentUser?.name || ''} foi liberado! Ele agora pode logar na Área do Cliente.`);
        } catch (err) {
            alert(`Erro ao aprovar usuário: ${err.message || "Erro desconhecido"}`);
        }
    };

    const handleCreateLot = async () => {
        try {
            const newLot = {
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
            await addLot(newLot);
            setIsCreatingLot(false);
            setNewLotForm({ id: '', price: '', size: '', desc: '' });
        } catch (err) {
            alert("Erro ao criar lote");
        }
    };

    // --- LÓGICA DE DESENHO NO MAPA ---
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawModeActive, setDrawModeActive] = useState(true);
    const [startPt, setStartPt] = useState(null);
    const [currRect, setCurrRect] = useState(null);
    const [pendingPoly, setPendingPoly] = useState(null);

    const handleMapMouseDown = (e) => {
        if (!drawModeActive) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setStartPt({ x, y });
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
            setPendingPoly(currRect);
        }
        setCurrRect(null);
    };

    const linkPolygonToLot = async (lotId) => {
        try {
            const newMapped = { id: lotId, ...pendingPoly };
            await saveMappedLots([newMapped]);
            setDrawnLots(prev => [...prev, newMapped]);
            setPendingPoly(null);
            alert(`Sucesso! Área vinculada ao ${lotId} no mapa.`);
        } catch (err) {
            alert("Erro ao salvar mapeamento");
        }
    };

    const clearMap = async () => {
        if (window.confirm("Apagar todas as demarcações do mapa? Os lotes no CRM não serão afetados.")) {
            try {
                await clearAllMappedLots();
                setDrawnLots([]);
            } catch (err) {
                alert("Erro ao limpar mapa");
            }
        }
    }

    const getPaymentBadge = (status) => {
        if (status === 'Em Dia') return <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Em Dia</span>;
        if (status === 'Atrasado') return <span style={{ background: '#ffebee', color: '#c62828', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Atrasado</span>;
        if (status === 'Aguardando Entrada') return <span style={{ background: '#fff8e1', color: '#f57f17', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Aguardando</span>;
        return <span style={{ color: '#ccc' }}>-</span>;
    };

    const editingLot = lots.find(l => l.uid === editingLotUid || l.id === editingLotUid);

    if (!isAdminLoggedIn) {
        const handleAdminLogin = () => {
            if (loginUser === '@dm1n' && loginPass === '@dm1n123$') {
                setIsAdminLoggedIn(true);
            } else {
                alert('Credenciais incorretas!');
            }
        };

        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-dark)', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '15px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
                    <div className="logo" style={{ color: 'var(--color-dark)', marginBottom: '10px' }}>Reserva do Rio <span style={{ fontSize: '0.9rem', color: 'red' }}>ADMIN</span></div>
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
                <Link to="/" className="logo" style={{ color: 'white', textDecoration: 'none' }}>Rio <span style={{ fontSize: '0.8rem' }}>ADMIN</span></Link>
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

                {editingLot && (
                    <div key={editingLot.id} style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)', animation: 'fadeIn 0.3s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <button onClick={() => setEditingLotUid(null)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontWeight: 'bold' }}>
                                <i className="fas fa-arrow-left"></i> Voltar para tabela
                            </button>
                            <button className="btn btn-primary" onClick={() => { setEditingLotUid(null); }}>Concluir Edição</button>
                        </div>
                        <h2>Dados Oficiais: <span style={{ color: 'var(--color-forest)' }}>{editingLot.id}</span></h2>
                        <hr style={{ margin: '20px 0', borderTop: 'none', borderBottom: '1px solid #eee' }} />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                            <div>
                                <h4 style={{ marginBottom: '10px' }}><i className="fas fa-tag"></i> Classificação do Lote (Banco de Dados)</h4>

                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Nome / Identificação do Lote (Ex: Lote 01):</label>
                                <input
                                    type="text"
                                    defaultValue={editingLot.id}
                                    onBlur={async (e) => {
                                        const newId = e.target.value;
                                        if (newId === editingLot.id || !newId) return;
                                        try {
                                            await editLot(editingLot.id, { id: newId });
                                            const newMapped = drawnLots.map(d => d.id === editingLot.id ? { ...d, id: newId } : d);
                                            setDrawnLots(newMapped);
                                            alert("Identificação atualizada!");
                                        } catch (err) {
                                            alert("Erro ao mudar ID");
                                        }
                                    }}
                                    style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', fontWeight: 'bold', color: 'var(--color-river)' }}
                                />

                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Status Operacional:</label>
                                <select
                                    value={editingLot.status}
                                    onChange={async (e) => {
                                        try {
                                            await editLot(editingLot.id, { status: e.target.value });
                                            alert("Status atualizado!");
                                        } catch (err) {
                                            alert("Erro ao atualizar status");
                                        }
                                    }}
                                    style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc' }}>
                                    <option value="Disponível">Disponível para Compra</option>
                                    <option value="Reservado">Reservado (Em análise)</option>
                                    <option value="Vendido">Vendido / Comprado</option>
                                </select>

                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Área (Metragem. Ex: 450.00):</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    defaultValue={parseFloat((editingLot.size || '0').replace(',', '.').replace(/[^\d.]/g, '')).toFixed(2)}
                                    onBlur={async (e) => {
                                        const area = parseFloat(e.target.value);
                                        const valorM2 = simConfig.valorBaseM2 || 250;
                                        if (isNaN(area)) return;
                                        try {
                                            await editLot(editingLot.id, { 
                                                size: area.toFixed(2).replace('.', ',') + 'm²',
                                                price: area * valorM2
                                            });
                                            alert("Área e Preço recalculados!");
                                        } catch (err) {
                                            alert("Erro ao salvar área");
                                        }
                                    }}
                                    style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc' }}
                                />

                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Preço Final de Venda (R$):</label>
                                <input
                                    type="number"
                                    defaultValue={editingLot.price}
                                    onBlur={async (e) => {
                                        try {
                                            await editLot(editingLot.id, { price: Number(e.target.value) });
                                            alert("Preço de venda atualizado!");
                                        } catch (err) {
                                            alert("Erro ao salvar preço");
                                        }
                                    }}
                                    style={{ width: '100%', padding: '10px', marginBottom: '5px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '1.1rem', fontWeight: 'bold' }}
                                />
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-forest)', fontWeight: 'bold', marginBottom: '15px' }}>
                                    Valor Formatado: R$ {Number(editingLot.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <small style={{ color: '#999', display: 'block', marginBottom: '15px' }}>* Mudar a Área aciona a multiplicação automática, mas você pode sobrescrever o valor livremente aqui.</small>

                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Descritivo Promocional (Site Público):</label>
                                <textarea
                                    defaultValue={editingLot.desc}
                                    onBlur={async (e) => {
                                        try {
                                            await editLot(editingLot.id, { desc: e.target.value });
                                        } catch (err) {
                                            console.error(err);
                                        }
                                    }}
                                    rows="3"
                                    placeholder="Ex: Lote plano, próximo à portaria..."
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontFamily: 'inherit', fontSize: '0.9rem' }}
                                ></textarea>
                            </div>

                            <div style={{ background: '#fcfcfc', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--color-river)' }}>
                                <h4 style={{ marginBottom: '10px' }}><i className="fas fa-user-lock"></i> Gestão do Comprador e Documentações</h4>

                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>CPF do Comprador (Vincular ao Portal):</label>
                                <input 
                                    type="text" 
                                    defaultValue={editingLot.clientCpf || ''} 
                                    onBlur={async (e) => {
                                        try {
                                            await editLot(editingLot.id, { client_cpf: e.target.value });
                                        } catch (err) {
                                            alert("Erro ao salvar CPF");
                                        }
                                    }}
                                    style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc' }} 
                                />

                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Nome do Cliente:</label>
                                <input 
                                    type="text" 
                                    defaultValue={editingLot.client || ''} 
                                    onBlur={async (e) => {
                                        try {
                                            await editLot(editingLot.id, { client: e.target.value });
                                        } catch (err) {
                                            alert("Erro ao salvar nome");
                                        }
                                    }}
                                    style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc' }} 
                                />

                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Status de Pagamento (Visual):</label>
                                <select 
                                    value={editingLot.paymentStatus || '-'} 
                                    onChange={async (e) => {
                                        try {
                                            await editLot(editingLot.id, { paymentStatus: e.target.value });
                                        } catch (err) {
                                            alert("Erro ao salvar status pagto");
                                        }
                                    }}
                                    style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc' }}>
                                    <option value="-">- Selecione -</option>
                                    <option value="Em Dia">Em Dia</option>
                                    <option value="Atrasado">Atrasado</option>
                                    <option value="Aguardando Entrada">Aguardando Entrada / Docs</option>
                                    <option value="Quitado">Totalmente Quitado</option>
                                </select>

                                <div style={{ background: '#f0f4f8', padding: '15px', borderRadius: '8px', border: '1px solid #dce4ec', marginTop: '20px' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--color-dark)', marginBottom: '15px' }}><i className="fas fa-folder-open"></i> Documentos da Administração</h4>

                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '3px' }}>Contrato Oficial Assinado (PDF/Imagem):</label>
                                    <input type="file" onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        alert("Upload de contrato em desenvolvimento com Storage Cloud...");
                                    }} style={{ width: '100%', fontSize: '0.8rem', marginBottom: '10px' }} />

                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '3px' }}>Memorial Descritivo do Lote:</label>
                                    <input type="file" onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        alert('Funcionalidade de upload para nuvem sendo vinculada ao Storage...');
                                    }} style={{ width: '100%', fontSize: '0.8rem', marginBottom: '10px' }} />

                                    <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-dark)', marginBottom: '10px' }}><i className="fas fa-inbox"></i> Documentos Enviados pelo Cliente</h4>
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
                                    onClick={async () => {
                                        if (window.confirm(`TEM CERTEZA que deseja EXCLUIR o ${editingLot.id}? Esta ação é irreversível.`)) {
                                            try {
                                                await removeLot(editingLot.id);
                                                await deleteMappedLot(editingLot.id);
                                                setDrawnLots(prev => prev.filter(d => d.id !== editingLot.id));
                                                setEditingLotUid(null);
                                            } catch (err) {
                                                alert("Erro ao excluir lote");
                                            }
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

                        {lotsLoading ? <p>Carregando banco de dados...</p> : (
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
                                        <td style={{ padding: '15px 10px' }}>R$ {Number(lot.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <br /><small style={{ color: '#999' }}>{lot.size}</small></td>
                                        <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                            <button onClick={() => setEditingLotUid(lot.id)} style={{ border: '1px solid var(--color-river)', background: 'transparent', color: 'var(--color-river)', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Editar / Financeiro</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        )}
                    </div>
                )}

                {/* TELA DE CRIAR NOVO LOTE NO BD */}
                {isCreatingLot && (
                    <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)', maxWidth: '600px', margin: '0 auto' }}>
                        <h3>Cadastrar Lote no Banco de Dados Central</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>Defina a fundação deste imóvel.</p>

                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Identificação (Ex: Lote 05)</label>
                        <input type="text" value={newLotForm.id} onChange={e => setNewLotForm({ ...newLotForm, id: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }} />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Área (m²)</label>
                                <input type="number" onChange={e => {
                                    const area = Number(e.target.value);
                                    setNewLotForm({
                                        ...newLotForm,
                                        size: area ? area + 'm²' : '',
                                        price: area * (simConfig.valorBaseM2 || 250)
                                    });
                                }} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Preço Calc. (R$)</label>
                                <input type="number" value={newLotForm.price} onChange={e => setNewLotForm({ ...newLotForm, price: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }} />
                            </div>
                        </div>

                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Descritivo Promocional</label>
                        <textarea value={newLotForm.desc || ''} onChange={e => setNewLotForm({ ...newLotForm, desc: e.target.value })} placeholder="Vantagens de relevo, proximidade com a entrada, etc." rows="3" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px', fontFamily: 'inherit' }}></textarea>

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
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: '#f5f5f5', color: '#666', fontSize: '0.8rem' }}>
                                            <th style={{ padding: '10px' }}>Cliente</th>
                                            <th style={{ padding: '10px' }}>Contatos</th>
                                            <th style={{ padding: '10px' }}>Lote Intenção</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingUsers.map(user => (
                                            <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '15px 10px' }}>
                                                    <strong>{user.name}</strong><br />
                                                    <small>{user.cpf}</small>
                                                </td>
                                                <td style={{ padding: '15px 10px', fontSize: '0.9rem' }}>
                                                    <i className="fab fa-whatsapp" style={{ color: '#25D366' }}></i> {user.telefone || '-'}<br />
                                                    <i className="far fa-envelope"></i> {user.email || '-'}
                                                </td>
                                                <td style={{ padding: '15px 10px' }}>
                                                    <span style={{ background: 'var(--color-river)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                        {user.lote_id || 'N/A'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                                    <button 
                                                        onClick={() => {
                                                            const printWindow = window.open('', '_blank');
                                                            printWindow.document.write(`
                                                                <html><head><title>Proposta - ${user.name}</title>
                                                                <style>body{font-family:sans-serif; padding:40px; color:#333; line-height:1.6;} .doc{border:1px solid #ccc; padding:40px; border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.1);} h2{color:#2d5a27; border-bottom:2px solid #2d5a27; padding-bottom:10px;} .grid{display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;} .label{font-size:12px; color:#666; display:block;}</style>
                                                                </head><body>
                                                                    <div class="doc">
                                                                        <div style="text-align:right; font-size:12px;">Data da Proposta: ${new Date(user.created_at).toLocaleDateString('pt-BR')}</div>
                                                                        <h2>RESERVA DO RIO - PROPOSTA DE COMPRA</h2>
                                                                        <div class="grid">
                                                                            <div><span class="label">COMPRADOR:</span><strong>${user.name}</strong></div>
                                                                            <div><span class="label">CPF:</span><strong>${user.cpf}</strong></div>
                                                                        </div>
                                                                        <div class="grid">
                                                                            <div><span class="label">TELEFONE:</span><strong>${user.telefone}</strong></div>
                                                                            <div><span class="label">E-MAIL:</span><strong>${user.email}</strong></div>
                                                                        </div>
                                                                        <hr/>
                                                                        <div class="grid">
                                                                            <div><span class="label">LOTE PRETENDIDO:</span><strong>${user.lote_id}</strong></div>
                                                                            <div><span class="label">PRAZO PAGAMENTO:</span><strong>${user.total_parcelas} meses</strong></div>
                                                                        </div>
                                                                        <div style="background:#f9f9f9; padding:20px; border-radius:8px;">
                                                                            <h4>VALORES DA PROPOSTA</h4>
                                                                            <p>Entrada Informada: R$ ${user.simulation?.entrada?.toLocaleString('pt-BR', {minimumFractionDigits:2}) || '---'}</p>
                                                                            <p>Parcela Inicial: R$ ${user.simulation?.primeiraParcela?.toLocaleString('pt-BR', {minimumFractionDigits:2}) || '---'}</p>
                                                                            <p>Total do Investimento (Est.): R$ ${user.simulation?.totalGeral?.toLocaleString('pt-BR', {minimumFractionDigits:2}) || '---'}</p>
                                                                        </div>
                                                                        <br/><br/>
                                                                        <p style="font-size:12px; color:#999; text-align:center;">Assinado Digitalmente por IP: Portal Reserva do Rio</p>
                                                                    </div>
                                                                    <script>window.print();</script>
                                                                </body></html>
                                                            `);
                                                            printWindow.document.close();
                                                        }}
                                                        style={{ background: '#f0f4f8', color: 'var(--color-river)', padding: '8px 12px', borderRadius: '5px', border: '1px solid var(--color-river)', fontWeight: 'bold', cursor: 'pointer', marginRight: '10px' }}
                                                    >
                                                        <i className="fas fa-file-pdf"></i> Ver Proposta
                                                    </button>
                                                    <button onClick={() => approveUser(user.id)} style={{ background: 'var(--color-forest)', color: 'white', padding: '8px 15px', borderRadius: '5px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginRight: '10px' }}>Aprovar Acesso</button>
                                                    <button style={{ background: 'transparent', color: '#c62828', padding: '8px 15px', borderRadius: '5px', border: '1px solid #c62828', fontWeight: 'bold', cursor: 'pointer' }}>Recusar</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div style={{ marginTop: '50px', borderTop: '2px solid #eee', paddingTop: '30px' }}>
                            <h3 style={{ color: 'var(--color-forest)' }}>Acessos Liberados (Histórico)</h3>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>Clientes que já possuem permissão de login.</p>

                            {approvedUsers.length === 0 ? (
                                <p style={{ color: '#999', textAlign: 'center' }}>Nenhum acesso liberado ainda.</p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fcfcfc', borderRadius: '10px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #ddd', color: '#333' }}>
                                                <th style={{ padding: '15px' }}>Nome / Lote</th>
                                                <th>CPF (Login)</th>
                                                <th>E-mail</th>
                                                <th style={{ textAlign: 'right', paddingRight: '15px' }}>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {approvedUsers.map(user => (
                                                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '15px' }}>
                                                        <strong>{user.name}</strong><br />
                                                        <small style={{ color: 'var(--color-river)' }}>{user.lote_id || 'Cadastro Site'}</small>
                                                    </td>
                                                <td style={{ fontWeight: 'bold' }}>{user.cpf}</td>
                                                <td>{user.email || '-'}</td>
                                                <td style={{ textAlign: 'right', paddingRight: '15px' }}>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await updateUserStatus(user.id, 'pending');
                                                                setApprovedUsers(prev => prev.filter(u => u.id !== user.id));
                                                                setPendingUsers(prev => [...prev, { ...user, status: 'pending' }]);
                                                            } catch (err) {
                                                                alert("Erro ao revogar acesso");
                                                            }
                                                        }}
                                                        style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                        Revogar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* --- 3. MAPEAMENTO E VÍNCULO (SITE PÚBLICO) --- */}
                {activeTab === 'site' && (
                    <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)', marginBottom: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3><i className="fas fa-map-marked-alt" style={{ color: 'var(--color-forest)' }}></i> 3. Vitrine: Conectar Polígonos na Planta</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                                    {drawnLots.map((l, idx) => (
                                        <span key={idx} style={{ background: '#eee', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {l.id}
                                            <i className="fas fa-times" style={{ color: 'red', cursor: 'pointer' }} onClick={() => setDrawnLots(drawnLots.filter(x => x.id !== l.id))}></i>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={async () => {
                                        const url = prompt("Cole a URL da nova imagem da planta (Hospedada no ImgBB, PostImages ou similar):");
                                        if (url) {
                                            await setConfig('map_custom_url', url);
                                            setMapImageUrl(url);
                                            alert("Mapa atualizado com sucesso!");
                                        }
                                    }}
                                    className="btn btn-secondary"
                                    style={{ padding: '5px 15px', fontSize: '0.8rem' }}
                                >
                                    Trocar JPG da Planta
                                </button>
                                <button onClick={clearMap} className="btn btn-secondary" style={{ borderColor: 'red', color: 'red', padding: '5px 15px', fontSize: '0.8rem' }}>Apagar Tudo</button>
                            </div>
                        </div>

                        <div
                            onMouseDown={handleMapMouseDown}
                            onMouseMove={handleMapMouseMove}
                            onMouseUp={handleMapMouseUp}
                            style={{
                                position: 'relative',
                                width: '100%',
                                minHeight: '800px',
                                background: `url(${mapImageUrl})`,
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
                                            if (val) linkPolygonToLot(val);
                                        }}>Salvar</button>
                                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPendingPoly(null)}>Descartar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'galeria' && (
                    <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                        <h3>4. Gerenciamento de Galeria Cloud</h3>
                        <p style={{ color: '#666', marginBottom: '20px' }}>Arraste ou selecione arquivos para subir para a Web. Imagens e vídeos aparecerão para todos os clientes.</p>
                        
                        <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '10px', marginBottom: '30px', border: '2px dashed #ccc', textAlign: 'center' }}>
                            <input type="file" multiple accept="image/*,video/mp4" onChange={async (e) => {
                                const files = Array.from(e.target.files);
                                for (const file of files) {
                                    try {
                                        const uploaded = await uploadGalleryFile(file);
                                        const newItem = await addGalleryItem(uploaded);
                                        setGalleryItems(prev => [newItem, ...prev]);
                                    } catch (err) {
                                        alert(`Erro ao subir ${file.name}: ${err.message || "Erro desconhecido"}. Verifique o bucket 'gallery'.`);
                                        console.error(err);
                                    }
                                }
                            }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                            {galleryItems.map(item => (
                                <div key={item.id} style={{ border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                    <div style={{ height: '120px', background: '#000' }}>
                                        {item.type === 'image' && <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                        {item.type === 'localVideo' && <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />}
                                    </div>
                                    <div style={{ padding: '10px', display: 'flex', justifyContent: 'center' }}>
                                        <button 
                                            onClick={async () => {
                                                if(confirm("Deseja remover esta mídia da nuvem?")) {
                                                    await deleteGalleryItem(item.id, item.url);
                                                    setGalleryItems(galleryItems.filter(i => i.id !== item.id));
                                                }
                                            }} 
                                            style={{ background: '#fff', color: '#ff4d4f', border: '1px solid #ff4d4f', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            Remover
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- 5. TEXTOS --- */}
                {activeTab === 'copywriting' && (
                    <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                        <h3>5. Editor de Textos</h3>
                        <textarea id="copyEditor" defaultValue={defaultCopy} style={{ width: '100%', height: '300px', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }} />
                        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={async () => {
                            const val = document.getElementById('copyEditor').value;
                            await setConfig('about_text', val);
                            alert('Atualizado!');
                        }}>Salvar Textos</button>
                    </div>
                )}

                {/* --- 6. CONFIGURADOR DO SIMULADOR --- */}
                {activeTab === 'simconfig' && (
                    <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                        <h3>6. Configurações Financeiras Globais (Simulador)</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '30px' }}>
                            Defina as diretrizes matemáticas que controlam o "Simulador Sem Surpresas" da sua Vitrine.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--color-river)', gridColumn: '1 / 3' }}>
                                <label style={{ display: 'block', fontWeight: 'bold' }}>Valor Base Global do Metro Quadrado (R$/m²)</label>
                                <input id="cfg_valorm2" type="number" defaultValue={simConfig.valorBaseM2 || 250} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-forest)' }} />
                                <small style={{ color: '#999' }}>Ao cadastrar um lote informando sua Área (m²), o sistema calculará automaticamente o preço oficial multiplicando a área por este valor.</small>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 'bold' }}>Índice de Correção Anual (%)</label>
                                <input id="cfg_taxa" type="number" defaultValue={simConfig.taxaAnual * 100} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }} />
                                <small style={{ color: '#999' }}>Ex: 6 para 6% a.a de correção na fórmula.</small>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 'bold' }}>Entrada Mínima (Reais)</label>
                                <input id="cfg_entrada" type="number" defaultValue={simConfig.entradaMinima} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }} />
                                <small style={{ color: '#999' }}>Impede preenchimentos com entradas fictícias.</small>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 'bold' }}>Desconto Especial À Vista (%)</label>
                                <input id="cfg_desconto" type="number" defaultValue={simConfig.descontoAvista} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }} />
                                <small style={{ color: '#999' }}>Bônus mostrado caso o pagamento seja cash (Ex: 10).</small>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 'bold' }}>Máximo de Parcelas (Meses)</label>
                                <input id="cfg_maxparc" type="number" defaultValue={simConfig.maxParcelas} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }} />
                                <small style={{ color: '#999' }}>Limite superior do slider. (Default 100).</small>
                            </div>
                        </div>

                        <button className="btn btn-primary" style={{ marginTop: '30px', width: '100%' }} onClick={async () => {
                            const newConf = {
                                valorBaseM2: Number(document.getElementById('cfg_valorm2').value),
                                taxaAnual: Number(document.getElementById('cfg_taxa').value) / 100,
                                entradaMinima: Number(document.getElementById('cfg_entrada').value),
                                descontoAvista: Number(document.getElementById('cfg_desconto').value),
                                maxParcelas: Number(document.getElementById('cfg_maxparc').value)
                            };
                            await setConfig('sim_config', newConf);
                            setSimConfig(newConf);

                            // ATUALIZAÇÃO EM MASSA: Recalcular preços de todos os lotes com base no novo m2
                            lots.forEach(async l => {
                                const areaNum = parseFloat(l.size.replace(',', '.').replace(/[^\d.]/g, ''));
                                if (!isNaN(areaNum)) {
                                    await editLot(l.id, { price: areaNum * newConf.valorBaseM2 });
                                }
                            });

                            alert("Parâmetros do simulador e preços de todos os lotes atualizados com sucesso!");
                        }}>Salvar Matriz Financeira</button>
                    </div>
                )}

                {/* --- 7. GESTÃO DE RECEBÍVEIS (DASHBOARD FINANCEIRO) --- */}
                {activeTab === 'finance' && (
                    <div style={{ animation: 'fadeIn 0.5s' }}>
                        {financeSubView ? (
                            <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                                <button onClick={() => setFinanceSubView(null)} style={{ background: 'none', border: 'none', color: 'var(--color-river)', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>
                                    <i className="fas fa-arrow-left"></i> Voltar ao Dashboard Geral
                                </button>
                                <h3>Gerenciamento de Mensalidades - {lots.find(l => l.id === financeSubView)?.id}</h3>
                                <p style={{ color: '#666', marginBottom: '20px' }}>Lote de <strong>{lots.find(l => l.id === financeSubView)?.client}</strong>.</p>

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
                                            const currentLot = lots.find(l => l.id === financeSubView) || {};
                                            const total = currentLot.totalParcelas || 120;
                                            const pagamentos = currentLot.payments || [];

                                            return Array.from({ length: 12 }).map((_, idx) => { // Showing first 12 for brevity
                                                const num = idx + 1;
                                                const pData = pagamentos[idx] || {};
                                                const isQuitado = pData.quitado || false;

                                                const savePaymentUpdate = async (newPData) => {
                                                    const updatedPayments = [...pagamentos];
                                                    updatedPayments[idx] = { ...pData, ...newPData };
                                                    await editLot(currentLot.id, { payments: updatedPayments });
                                                };

                                                return (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #eee', background: isQuitado ? '#f6fff8' : 'white' }}>
                                                        <td style={{ padding: '15px' }}><strong>{num.toString().padStart(2, '0')}/{total}</strong></td>
                                                        <td style={{ padding: '15px' }}>
                                                            {pData.boletoUrl ? <div style={{ color: 'var(--color-forest)' }}>Enviado</div> : <span style={{color:'#999'}}>Pendente</span>}
                                                        </td>
                                                        <td style={{ padding: '15px' }}>
                                                            {pData.comprovanteUrl ? <a href={pData.comprovanteUrl} target="_blank" rel="noreferrer">Ver</a> : <span style={{ color: '#999' }}>Aguardando</span>}
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
                                        <small style={{ color: '#999', fontWeight: 'bold' }}>VGV VENDIDO</small>
                                        <h3 style={{ fontSize: '1.5rem', color: 'var(--color-forest)', marginTop: '5px' }}>
                                            {lots.filter(l => l.status === 'Vendido').reduce((acc, l) => acc + (l.price || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </h3>
                                    </div>
                                    <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: 'var(--shadow)', borderLeft: '5px solid var(--color-river)' }}>
                                        <small style={{ color: '#999', fontWeight: 'bold' }}>VGV DISPONÍVEL</small>
                                        <h3 style={{ fontSize: '1.5rem', color: 'var(--color-river)', marginTop: '5px' }}>
                                            {lots.filter(l => l.status === 'Disponível').reduce((acc, l) => acc + (l.price || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </h3>
                                    </div>
                                </div>

                                <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)', marginBottom: '30px' }}>
                                    <h3>Configuração Global de Pagamento</h3>
                                    <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px', display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.8rem' }}>Sua Chave PIX</label>
                                            <input
                                                type="text"
                                                value={pixKey}
                                                onChange={(e) => setPixKey(e.target.value)}
                                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                                            />
                                        </div>
                                        <button className="btn btn-primary" onClick={() => savePixKey(pixKey)}>Salvar</button>
                                    </div>
                                </div>

                                <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                                    <h3>Relatório de Cobrança</h3>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                                <th style={{ padding: '15px 10px' }}>Lote / Cliente</th>
                                                <th style={{ padding: '15px 10px' }}>Status</th>
                                                <th style={{ padding: '15px 10px' }}>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lots.filter(l => l.status === 'Vendido').map(l => (
                                                <tr key={l.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                    <td style={{ padding: '15px 10px' }}>
                                                        <strong>{l.id}</strong><br />
                                                        <small style={{ color: '#666' }}>{l.client}</small>
                                                    </td>
                                                    <td style={{ padding: '15px 10px' }}>{getPaymentBadge(l.paymentStatus)}</td>
                                                    <td style={{ padding: '15px 10px' }}>
                                                        <button onClick={() => setFinanceSubView(l.id)} style={{ background: 'none', border: '1px solid #ddd', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                            Gerenciar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* --- 8. BOLETOS E MENSALIDADES --- */}
                {activeTab === 'boletos' && (
                    <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: 'var(--shadow)' }}>
                        <h3>Lotes Vendidos - Lançamento de Boletos</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                    <th style={{ padding: '15px 10px' }}>Lote / Cliente</th>
                                    <th style={{ padding: '15px 10px', textAlign: 'right' }}>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lots.filter(l => l.status === 'Vendido' || l.client !== '-').map(l => (
                                    <tr key={l.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <td style={{ padding: '15px 10px' }}>
                                            <strong>{l.id}</strong><br />
                                            <small style={{ color: '#666' }}>{l.client}</small>
                                        </td>
                                        <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => { setActiveTab('finance'); setFinanceSubView(l.id); }}
                                                style={{ background: 'var(--color-river)', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                Lançar Mensalidades
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminArea;
