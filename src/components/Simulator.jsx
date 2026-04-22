import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLots } from '../services/lotsService';
import { getConfig } from '../services/configService';

const Simulator = ({ baseLot = { id: 'Nenhum', price: 120000 } }) => {
    const [config, setConfig] = useState({
        taxaAnual: 0.06,
        entradaMinima: 8500,
        descontoAvista: 10,
        maxParcelas: 100
    });

    const [availableLots, setAvailableLots] = useState([]);
    const [activeLot, setActiveLot] = useState(baseLot);
    const [mainBroker, setMainBroker] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const savedInfo = await getConfig('sim_config');
                if (savedInfo) setConfig(savedInfo);
                
                const allLots = await getLots();
                const disp = allLots.filter(l => l.status === 'Disponível');
                setAvailableLots(disp);

                // If currently active lot is 'Nenhum', pick the first available one
                if (baseLot.id === 'Nenhum' && disp.length > 0) {
                    setActiveLot(disp[0]);
                }
                // Load Brokers
                const brokersList = await getConfig('brokers_list');
                if (brokersList && brokersList.length > 0) {
                    setMainBroker(brokersList[0]);
                }
            } catch (err) {
                console.error("Error loading simulator data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [baseLot.id]);

    // Sync activeLot when map click changes the prop
    useEffect(() => {
        if(baseLot && baseLot.id !== 'Nenhum') setActiveLot(baseLot);
    }, [baseLot]);

    const [entry, setEntry] = useState(0);
    const [months, setMonths] = useState(60);

    useEffect(() => {
        setEntry(config.entradaMinima);
    }, [config.entradaMinima]);

    // Opções de simulação baseadas no Lote Ativo
    const basePrice = activeLot?.price || 120000;
    const saldo = basePrice - entry;
    const parcelaInicial = saldo > 0 ? saldo / months : 0;
    const anos = Math.ceil(months / 12);
    const parcelaFinalEstimada = parcelaInicial * Math.pow(1 + config.taxaAnual, anos);
    
    // Cálculo do total pago (reajuste ANUAL, não mensal)
    let totalPagoParcelas = 0;
    let parcelaAtual = parcelaInicial;
    for (let i = 0; i < anos; i++) {
        let mesesNoAno = (i === anos - 1 && months % 12 !== 0) ? months % 12 : 12;
        totalPagoParcelas += parcelaAtual * mesesNoAno;
        parcelaAtual = parcelaAtual * (1 + config.taxaAnual);
    }
    const totalPagoGeral = entry + totalPagoParcelas;

    const valorAVista = basePrice * (1 - (config.descontoAvista / 100));

    const formatar = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Export e Whatsapp
    const [clientName, setClientName] = useState('');
    const [clientContact, setClientContact] = useState('');
    const [showDocument, setShowDocument] = useState(false);

    const sendWhatsapp = () => {
        const targetPhone = mainBroker ? mainBroker.phone.replace(/\D/g, '') : '31992554019'; // Fallback se não cadastrar nada
        const msg = `Olá! Acabei de fazer uma simulação no site Reserva do Rio:\n\nLote: ${activeLot?.id}\nValor Base: ${formatar(basePrice)}\nEntrada: ${formatar(entry)}\nParcelas: ${months}x de ${formatar(parcelaInicial)}\nEstimativa do Total Pago: ${formatar(totalPagoGeral)}\n\nGostaria de falar com um corretor sobre este plano.`;
        window.open(`https://wa.me/55${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleGenerateProposal = () => {
        navigate('/proposta', { state: { lotId: activeLot?.id } });
    };

    return (
        <section id="pagamento" className="simulator-section" style={{ background: 'var(--color-dark)', padding: '60px 5%' }}>
            
            {/* OVERLAY DE IMPRESSÃO - DOCUMENTO DE DEMONSTRATIVO */}
            {showDocument && (
                <div className="simulator-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, overflowY: 'auto', padding: '20px' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '20px', borderRadius: '10px' }} className="no-print">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ color: 'var(--color-forest)' }}>Exportar Demonstrativo</h3>
                            <div>
                                <button className="btn btn-secondary" onClick={() => setShowDocument(false)} style={{ marginRight: '10px' }}>Fechar</button>
                                <button className="btn btn-primary" onClick={() => window.print()}><i className="fas fa-file-pdf"></i> Gerar PDF / DOC</button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <input type="text" placeholder="Nome do Cliente (Opcional)" value={clientName} onChange={e => setClientName(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '100%' }} />
                            <input type="text" placeholder="Telefone/WhatsApp" value={clientContact} onChange={e => setClientContact(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '100%' }} />
                        </div>
                    </div>

                    <div className="printable-document" style={{ 
                        background: 'white', 
                        maxWidth: '850px', 
                        margin: '20px auto', 
                        padding: '50px 70px', 
                        fontFamily: '"Helvetica", "Arial", sans-serif', 
                        color: '#333',
                        boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                        lineHeight: '1.5'
                    }}>
                        {/* HEADER DO DOCUMENTO */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid var(--color-forest)', paddingBottom: '20px', marginBottom: '40px' }}>
                            <div>
                                <h1 style={{ color: 'var(--color-forest)', fontSize: '24px', margin: 0, letterSpacing: '2px' }}>RESERVA DO RIO</h1>
                                <p style={{ color: '#666', fontSize: '12px', margin: '5px 0 0 0' }}>Loteamento Residencial Premium</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h2 style={{ fontSize: '16px', margin: 0, color: '#333' }}>DEMONSTRATIVO DE SIMULAÇÃO</h2>
                                <p style={{ fontSize: '12px', color: '#888', margin: '5px 0 0 0' }}>Data: {new Date().toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>

                        {/* SEÇÃO 1: VENDEDOR E CLIENTE */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                            <div>
                                <h4 style={{ fontSize: '14px', color: 'var(--color-forest)', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>INCORPORADORA</h4>
                                <p style={{ fontSize: '13px', margin: '2px 0' }}><strong>IADATA LTDA</strong></p>
                                <p style={{ fontSize: '13px', margin: '2px 0' }}>CNPJ: 44.921.307/0001-91</p>
                                <p style={{ fontSize: '13px', margin: '2px 0' }}>(16) 98121-1082</p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '14px', color: 'var(--color-forest)', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>DADOS DO CLIENTE</h4>
                                <p style={{ fontSize: '13px', margin: '2px 0' }}><strong>Nome:</strong> {clientName || '________________________________'}</p>
                                <p style={{ fontSize: '13px', margin: '2px 0' }}><strong>Contato:</strong> {clientContact || '________________________________'}</p>
                            </div>
                        </div>

                        {/* SEÇÃO 2: OBJETO */}
                        <div style={{ background: '#f9fbf9', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                            <h4 style={{ fontSize: '14px', color: 'var(--color-forest)', marginBottom: '15px' }}>DESCRIÇÃO DO IMÓVEL</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                                <div>
                                    <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>IDENTIFICAÇÃO</span>
                                    <strong style={{ fontSize: '15px' }}>Lote {activeLot?.id}</strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>ÁREA TOTAL</span>
                                    <strong style={{ fontSize: '15px' }}>{activeLot?.size}</strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>VALOR DE TABELA</span>
                                    <strong style={{ fontSize: '15px' }}>{formatar(basePrice)}</strong>
                                </div>
                            </div>
                        </div>

                        {/* SEÇÃO 3: CONDIÇÕES DE PAGAMENTO */}
                        <div style={{ marginBottom: '30px' }}>
                            <h4 style={{ fontSize: '14px', color: 'var(--color-forest)', marginBottom: '15px' }}>PLANO DE PAGAMENTO SIMULADO</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                                    <p style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', fontSize: '13px' }}>
                                        <span>Entrada:</span>
                                        <strong>{formatar(entry)}</strong>
                                    </p>
                                    <p style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', fontSize: '13px' }}>
                                        <span>Saldo a Financiar:</span>
                                        <strong>{formatar(saldo)}</strong>
                                    </p>
                                    <p style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', fontSize: '13px' }}>
                                        <span>Prazo:</span>
                                        <strong>{months} Meses</strong>
                                    </p>
                                </div>
                                <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                                    <p style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', fontSize: '13px' }}>
                                        <span>Correção Anual (Projetada):</span>
                                        <strong>{config.taxaAnual * 100}% a.a.</strong>
                                    </p>
                                    <p style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', fontSize: '13px' }}>
                                        <span>Parcela Inicial:</span>
                                        <strong>{formatar(parcelaInicial)}</strong>
                                    </p>
                                    <p style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', fontSize: '13px' }}>
                                        <span>Última Parcela (Est.):</span>
                                        <strong>{formatar(parcelaFinalEstimada)}</strong>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* RESUMO DE INVESTIMENTO */}
                        <div style={{ background: 'var(--color-forest)', color: 'white', padding: '25px', borderRadius: '8px', marginBottom: '30px', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Estimativa de Investimento Total a Prazo</span>
                            <h2 style={{ color: 'white', fontSize: '32px', margin: '10px 0' }}>{formatar(totalPagoGeral)}</h2>
                            <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>Valor para pagamento à vista com {config.descontoAvista}% desc: {formatar(valorAVista)}</p>
                        </div>

                        {/* NOTAS LEGAIS */}
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
                            <h5 style={{ fontSize: '12px', margin: '0 0 10px 0', color: '#666' }}>OBSERVAÇÕES IMPORTANTES:</h5>
                            <ul style={{ paddingLeft: '20px', fontSize: '10px', color: '#888', lineHeight: '1.6' }}>
                                <li>As parcelas serão reajustadas anualmente pelo índice de {config.taxaAnual * 100}% (conforme simulação).</li>
                                <li>Este demonstrativo é uma estimativa de fluxo financeiro e não garante a reserva do lote.</li>
                                <li>A validade desta proposta é de 7 dias a partir da data de emissão.</li>
                                <li>Sujeito a aprovação de crédito e disponibilidade de estoque.</li>
                            </ul>
                        </div>
                        
                        <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '11px', color: '#aaa' }}>
                            <p>Plataforma Digital Reserva do Rio - www.reservadorio.com.br</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h2 style={{ color: 'white', fontSize: '2.5rem', fontFamily: "'Playfair Display'" }}>Simulador de Pagamento</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem' }}>Transparência total: veja a estimativa de evolução das parcelas.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
                    {/* CONTROLES */}
                    <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                        <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px', marginBottom: '20px', color: 'var(--color-dark)' }}><i className="fas fa-sliders-h"></i> Ajuste sua Proposta</h3>
                        
                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#555', marginBottom: '10px' }}>
                                Lote Escolhido:
                            </label>
                            <select 
                                value={activeLot.id} 
                                onChange={(e) => {
                                    const l = availableLots.find(lot => lot.id === e.target.value);
                                    if(l) setActiveLot(l);
                                }}
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-forest)' }}
                            >
                                {availableLots.map(l => (
                                    <option key={l.id} value={l.id}>{l.id} - {l.size} ({formatar(l.price)})</option>
                                ))}
                            </select>
                        </div>
                        
                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#555', marginBottom: '10px' }}>
                                Valor de Entrada:
                                <span style={{ color: 'var(--color-forest)' }}>{formatar(entry)}</span>
                            </label>
                            <input
                                type="range"
                                min={config.entradaMinima}
                                max={basePrice * 0.9}
                                step="1000"
                                value={entry}
                                onChange={(e) => setEntry(Number(e.target.value))}
                                style={{ width: '100%', height: '6px', background: '#ddd', outline: 'none', borderRadius: '5px' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                                <span>Mín: {formatar(config.entradaMinima)}</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#555', marginBottom: '10px' }}>
                                Parcelamento em:
                                <span style={{ color: 'var(--color-river)' }}>{months} Meses</span>
                            </label>
                            <input
                                type="range"
                                min="12"
                                max={config.maxParcelas}
                                step="12"
                                value={months}
                                onChange={(e) => setMonths(Number(e.target.value))}
                                style={{ width: '100%', height: '6px', background: '#ddd', outline: 'none', borderRadius: '5px' }}
                            />
                        </div>

                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '2px dashed #ddd' }}>
                            <h4 style={{ color: '#444', marginBottom: '5px' }}>Opção Pagamento à Vista</h4>
                            <p style={{ fontSize: '1.8rem', color: 'var(--color-forest)', fontWeight: 'bold', margin: '10px 0' }}>{formatar(valorAVista)}</p>
                            <span style={{ background: '#ffecb3', color: '#f57f17', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>Com {config.descontoAvista}% de Desconto</span>
                        </div>
                    </div>

                    {/* RESULTADOS */}
                    <div style={{ background: 'var(--color-forest)', color: 'white', padding: '30px', borderRadius: '15px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', opacity: 0.1, right: '-50px', top: '-50px', fontSize: '15rem' }}>
                            <i className="fas fa-file-contract"></i>
                        </div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '20px' }}>Simulação Oficial</h3>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <span>Valor de Tabela do Lote:</span>
                                <strong>{formatar(basePrice)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <span>Valor do Saldo Financiado:</span>
                                <strong>{formatar(saldo)}</strong>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
                                <p style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '5px' }}>1ª Parcela (Ano 1):</p>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: "'Playfair Display'" }}>{formatar(parcelaInicial)}</div>
                                
                                {months > 12 && (
                                    <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                                        <p style={{ fontSize: '0.8rem', color: '#bbb' }}><i className="fas fa-chart-line"></i> Evolução Estimada (Índice de {config.taxaAnual*100}% a.a.)</p>
                                        <p style={{ fontSize: '1.2rem', marginTop: '5px' }}>Última parcela: approx. <strong>{formatar(parcelaFinalEstimada)}</strong></p>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: '#ccc' }}>Estimativa Total a Prazo:</p>
                                    <strong style={{ fontSize: '1.2rem' }}>{formatar(totalPagoGeral)}</strong>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '10px', flexWrap: 'wrap' }}>
                                    <button className="btn btn-secondary" onClick={() => setShowDocument(true)} style={{ flex: 1, minWidth: '150px', background: 'white', color: 'var(--color-dark)', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                        <i className="fas fa-file-pdf"></i> PDF
                                    </button>
                                    <button className="btn btn-primary" onClick={sendWhatsapp} style={{ flex: 1, minWidth: '150px', background: '#25D366', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                        <i className="fab fa-whatsapp"></i> Enviar
                                    </button>
                                </div>
                                <button className="btn" onClick={handleGenerateProposal} style={{ width: '100%', marginTop: '10px', background: 'var(--color-sand)', color: 'var(--color-forest)', border: 'none', padding: '15px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    Gerar Proposta e Contrato <i className="fas fa-file-signature"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Simulator;
