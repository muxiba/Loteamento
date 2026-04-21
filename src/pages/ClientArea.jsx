import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getConfig } from '../services/configService';
import { updateLotPayments } from '../services/lotsService';

const ClientArea = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [viewRequested, setViewRequested] = useState(false);
    const [awaitingApproval, setAwaitingApproval] = useState(false);

    const [cpf, setCpf] = useState('');
    const [senha, setSenha] = useState('');
    const [activeTab, setActiveTab] = useState('financeiro');
    
    const [userData, setUserData] = useState(null); // Guardar dados do usuário logado
    const [userLot, setUserLot] = useState(null);
    const [pixKey, setPixKey] = useState('carregando...');
    const [lots, setLots] = useState([]);

    useEffect(() => {
        const loadLots = async () => {
            const { data } = await supabase.from('lots').select('*');
            if (data) setLots(data);
        };
        loadLots();
    }, []);

    const handleViewContract = (user) => {
        const sim = user.simulation || {};
        const profile = user.profile || {};
        const lotDetails = lots.find(l => l.id === (user.lote_id || user.loteId));
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><title>Contrato - ${user.name}</title>
            <style>
                body{font-family:'Times New Roman', Times, serif; padding:50px; color:#000; line-height:1.6; text-align:justify;}
                .contract-paper{max-width:850px; margin:0 auto; background:white;}
                h1{font-size:18px; text-align:center; text-transform:uppercase; text-decoration:underline; margin-bottom:30px;}
                .clause-title{font-weight:bold; margin-top:20px; display:block;}
                .signatures{margin-top:60px; display:grid; grid-template-columns:1fr 1fr; gap:50px; text-align:center;}
                .sig-line{border-top:1px solid #000; margin-top:40px; padding-top:5px;}
            </style>
            </head><body>
                <div class="contract-paper">
                    <h1>CONTRATO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE IMÓVEL<br/>(ALIENAÇÃO FIDUCIÁRIA)</h1>

                    <p>
                        Pelo presente instrumento particular, de um lado, na qualidade de <strong>PROMITENTE VENDEDORA</strong>, 
                        <strong>IADATA LTDA (Nome Fantasia: IATEK ME)</strong>, inscrita no CNPJ sob o nº 44.921.307/0001-91, 
                        Sociedade Empresária Limitada, com sede na Rua Conceição Cipriano Tavares, nº 30, Bairro Parque das Acácias, 
                        Conselheiro Lafaiete – MG, CEP: 36.407-078, telefone: (16) 98121-1082, e-mail: veraguimaraessiqueira@hotmail.com, 
                        e de outro lado, na qualidade de <strong>PROMISSÁRIO COMPRADOR</strong>:
                    </p>

                    <p>
                        <strong>${user.name}</strong>, brasileiro(a), ${profile.estadoCivil || '---'}, ${profile.profissao || '---'}, 
                        portador(a) da Cédula de Identidade RG nº ${profile.rg || '---'} e inscrito(a) no CPF/MF sob o nº <strong>${user.cpf}</strong>, 
                        residente e domiciliado(a) na ${profile.logradouro || '---'}, nº ${profile.numero || 's/n'}, 
                        Bairro ${profile.bairro || '---'}, Cidade de ${profile.cidade || '---'}/${profile.uf || '--'}, CEP ${profile.cep || '---'}.
                    </p>

                    <p>Têm entre si justo e contratado o presente instrumento particular, mediante as cláusulas e condições seguintes:</p>

                    <span class="clause-title">Cláusula Primeira – Do Objeto</span>
                    <p>
                        A VENDEDORA é legítima proprietária e possuidora do imóvel denominado <strong>${user.lote_id || '---'}</strong>, 
                        com área total de <strong>${lotDetails?.size || '---'}</strong>, devidamente aprovado pelos órgãos competentes. 
                        A VENDEDORA promete vender e o COMPRADOR promete comprar o referido lote no estado em que se encontra.
                    </p>

                    <span class="clause-title">Cláusula Segunda – Do Preço e Condições de Pagamento</span>
                    <p>
                        O preço certo e ajustado para a presente Promessa de Compra e Venda é de 
                        <strong>R$ ${Number(sim.totalPagoGeral || user.price || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong>, 
                        a serem pagos pelo COMPRADOR da seguinte forma:
                    </p>
                    <ul>
                        <li><strong>Sinal/Entrada:</strong> R$ ${Number(sim.entrada || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}, pago na assinatura deste instrumento.</li>
                        <li><strong>Saldo Restante:</strong> R$ ${Number((sim.totalPagoGeral || 0) - (sim.entrada || 0)).toLocaleString('pt-BR', {minimumFractionDigits:2})}, pagos em ${user.total_parcelas || 120} parcelas mensais e sucessivas de R$ ${Number(sim.parcelaInicial || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})} sujeitas a correção monetária pré-fixada anual de ${(sim.taxa * 100) || 6}% ou índices oficiais previstos em lei.</li>
                    </ul>

                    <span class="clause-title">Cláusula Terceira – Correção e Inadimplência</span>
                    <p>
                        O não pagamento pontual de qualquer parcela implicará na incidência de juros moratórios de 1% (um por cento) ao mês e multa compensatória de 2% (dois por cento) sobre o valor do débito atualizado. O atraso superior a 90 dias configura quebra de contrato sob o regime da Lei 9.514/97.
                    </p>

                    <span class="clause-title">Cláusula Quinta – Do Foro</span>
                    <p>
                        Para dirimir quaisquer questões decorrentes deste contrato, as partes elegem o foro da Comarca de domicílio do Empreendimento, com renúncia expressa a qualquer outro.
                    </p>

                    <p style="margin-top:40px;">Cidade da Sede, ${new Date().toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'})}.</p>

                    <div class="signatures">
                        <div>
                            <div class="sig-line">
                                <strong>Empreendimentos Reserva do Rio LTDA</strong><br/>Promitente Vendedora
                            </div>
                        </div>
                        <div>
                            <div class="sig-line">
                                <strong>${user.name}</strong><br/>CPF: ${user.cpf}
                            </div>
                        </div>
                    </div>
                </div>
                <script>window.print();</script>
            </body></html>
        `);
        printWindow.document.close();
    };

    const handleLogin = async () => {
        try {
            const { data: dbUser, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('cpf', cpf)
                .eq('password', senha)
                .single();

            if (userError || !dbUser) {
                alert('Acesso Negado. Verifique seu CPF e senha.');
                return;
            }

            if (dbUser.status === 'pending') {
                setAwaitingApproval(true);
                return;
            }

            setUserData(dbUser);

            // Aprovado, buscar lote
            const { data: lotData, error: lotError } = await supabase
                .from('lots')
                .select('*')
                .eq('id', dbUser.lote_id)
                .single();

            if (lotData) {
                setUserLot(lotData);
            } else {
                setUserLot({ id: dbUser.lote_id || 'Pendente', client: dbUser.name, payments: [], status: 'Vendido' });
            }
            
            setIsLoggedIn(true);
        } catch (err) {
            console.error("Login error:", err);
            alert("Erro ao tentar acessar o servidor.");
        }
    };

    if (!isLoggedIn) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-dark)', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '15px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
                    <div className="logo" style={{ color: 'var(--color-forest)', marginBottom: '20px' }}>Reserva do Rio</div>
                    
                    {awaitingApproval ? (
                        <>
                            <i className="fas fa-hourglass-half" style={{ fontSize: '3rem', color: 'var(--color-sand)', marginBottom: '15px' }}></i>
                            <h3 style={{ marginBottom: '10px' }}>Aprovação Pendente</h3>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>A administração já recebeu sua solicitação. Assim que seu cadastro for validado com o contrato, o acesso será liberado.</p>
                            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setAwaitingApproval(false)}>Voltar ao Login</button>
                        </>
                    ) : (
                        <>
                            <h3 style={{ marginBottom: '10px' }}>Portal do Cliente</h3>
                            <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.9rem' }}>Acesse boletos, memorial e acompanhe sua obra.</p>
                            <input type="text" placeholder="CPF (Teste: 123)" style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '8px' }} value={cpf} onChange={e => setCpf(e.target.value)} />
                            <input type="password" placeholder="Senha" style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '8px' }} value={senha} onChange={e => setSenha(e.target.value)} />
                            <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={handleLogin}>Acessar Portal</button>
                            <a href="/#mapa" style={{ display: 'block', marginTop: '20px', color: 'var(--color-river)', fontWeight: 'bold', textDecoration: 'none', cursor: 'pointer' }}>Primeiro acesso? Escolha seu lote aqui.</a>
                            <Link to="/" style={{ display: 'block', marginTop: '15px', color: '#999', fontSize: '0.8rem', textDecoration: 'none' }}>Voltar ao Site</Link>
                        </>
                    )}
                </div>
            </div>
        );
    }

    const renderContent = () => {
        if (activeTab === 'financeiro') {
            const total = userLot.total_parcelas || userLot.totalParcelas || 120;
            const pagamentos = typeof userLot.payments !== 'undefined' ? userLot.payments : [];
            const pagas = pagamentos.filter(p => p && p.quitado).length;
            const percent = Math.round((pagas / total) * 100) || 0;
            
            // Calculando valores baseados no contrato (simulados)
            const valorTotal = userLot.price || 0;
            const entrada = userLot.simulation?.entrada || (valorTotal * 0.1); // Assumindo 10% se não houver
            const saldoDevedor = valorTotal - entrada;
            const valorParcelaBase = (saldoDevedor / total) || 0;

            const toggleQuitar = async (index) => {
                const updatedPayments = [...pagamentos];
                if (!updatedPayments[index]) updatedPayments[index] = {};
                updatedPayments[index].quitado = !updatedPayments[index].quitado;
                
                try {
                    const updatedLot = await updateLotPayments(userLot.id, updatedPayments);
                    setUserLot(updatedLot);
                } catch (err) {
                    alert("Erro ao atualizar pagamento.");
                }
            };

            const gerarRecibo = (numParcela) => {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <html><head><title>Recibo Parcela ${numParcela}</title>
                    <style>body{font-family:sans-serif; padding:50px; line-height: 1.6;} .box{border:2px solid #ccc; padding:30px; border-radius:10px;}</style>
                    </head><body>
                        <div class="box">
                            <h2 style="color: #2e7d32;">RECIBO DE QUITAÇÃO - Reserva do Rio</h2>
                            <p><strong>Lote / Unidade:</strong> ${userLot.id}</p>
                            <p><strong>Comprador:</strong> ${userLot.client} - CPF: ${userLot.clientCpf || cpf}</p>
                            <hr/>
                            <p><strong>Referente à Parcela:</strong> ${numParcela} de ${total}</p>
                            <p><strong>Valor Quitado:</strong> ${valorParcelaBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            <p><strong>Data de Emissão do Recibo:</strong> ${new Date().toLocaleDateString('pt-BR')} (Automático pelo Sistema)</p>
                            <br/><br/><p style="text-align:center;">Assinatura Digital IADATA LTDA (IATEK ME)</p>
                        </div>
                        <script>window.print();</script>
                    </body></html>
                `);
                printWindow.document.close();
            };

            return (
                <>
                    <div style={{ background: 'white', borderRadius: '15px', padding: '25px', marginBottom: '30px', boxShadow: 'var(--shadow)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: 'var(--color-dark)' }}><i className="fas fa-file-signature"></i> Resumo do Contrato: {userLot.id}</h3>
                            <button 
                                onClick={() => handleViewContract(userData)}
                                style={{ background: 'var(--color-river)', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                                <i className="fas fa-file-pdf"></i> Ver Meu Contrato
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', background: '#fcfcfc', padding: '20px', borderRadius: '10px', border: '1px solid #eee' }}>
                            <div>
                                <small style={{ color: '#666' }}>Início do Contrato</small>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{userLot.startDate || '10/04/2026'}</div>
                            </div>
                            <div>
                                <small style={{ color: '#666' }}>Entrada Paga</small>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-forest)' }}>{entrada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                            </div>
                            <div>
                                <small style={{ color: '#666' }}>Plano Escolhido</small>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{total} Parcelas Mensais</div>
                            </div>
                            <div>
                                <small style={{ color: '#666' }}>Saldo a Quitar (Estimado)</small>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#d32f2f' }}>{saldoDevedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: 'var(--shadow)' }}>
                        <h3>Cronograma de Pagamentos</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>Efetue seus pagamentos via PIX abaixo e anexe o comprovante, ou marque manualmente como quitado.</p>
                        
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #eee', color: '#666', background: '#f9f9f9' }}>
                                        <th style={{ padding: '15px', borderRadius: '10px 0 0 0' }}>Parcela</th>
                                        <th style={{ padding: '15px' }}>Valor (R$)</th>
                                        <th style={{ padding: '15px' }}>Boleto (Mês)</th>
                                        <th style={{ padding: '15px' }}>Seu Comprovante</th>
                                        <th style={{ padding: '15px' }}>Status</th>
                                        <th style={{ padding: '15px', borderRadius: '0 10px 0 0', textAlign: 'center' }}>Recibo (Final)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: total }).map((_, idx) => {
                                        const num = idx + 1;
                                        const paymentData = pagamentos[idx] || {};
                                        const isQuitado = paymentData.quitado || false;
                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid #f5f5f5', background: isQuitado ? '#f6fff8' : 'white' }}>
                                                <td style={{ padding: '15px' }}>
                                                    <strong>{num.toString().padStart(2, '0')}/{total}</strong>
                                                </td>
                                                <td style={{ padding: '15px', fontWeight: 'bold' }}>
                                                    {valorParcelaBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    {paymentData.boletoUrl ? (
                                                        paymentData.boletoUrl === '#' ? (
                                                            <button onClick={() => alert("O arquivo do boleto está salvo na Nuvem Segura e requer sincronização extra nesta versão de testes local. Peça para atualizar pela central.")} style={{ background: 'none', border: 'none', color: 'var(--color-river)', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}>
                                                                <i className="fas fa-barcode"></i> Boleto Físico
                                                            </button>
                                                        ) : (
                                                            <a href={paymentData.boletoUrl} download={paymentData.boletoName || `Boleto_Parcela_${num}`} style={{ color: 'var(--color-river)', fontWeight: 'bold', textDecoration: 'none' }}>
                                                                <i className="fas fa-barcode"></i> Baixar Boleto
                                                            </a>
                                                        )
                                                    ) : (
                                                        <span style={{ color: '#999', fontSize: '0.8rem' }}>Pendente</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    {paymentData.comprovanteUrl && paymentData.comprovanteUrl !== '#' ? (
                                                        <span style={{ color: 'var(--color-forest)', fontSize: '0.85rem' }}><i className="fas fa-check-circle"></i> Enviado</span>
                                                    ) : (
                                                        <input type="file" onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if(!file) return;
                                                            const reader = new FileReader();
                                                            reader.onload = async () => {
                                                                const updatedPayments = [...pagamentos];
                                                                if (!updatedPayments[idx]) updatedPayments[idx] = {};
                                                                updatedPayments[idx].comprovanteUrl = reader.result;
                                                                updatedPayments[idx].comprovanteName = file.name;
                                                                
                                                                try {
                                                                    const updatedLot = await updateLotPayments(userLot.id, updatedPayments);
                                                                    setUserLot(updatedLot);
                                                                    alert(`Comprovante da parcela ${num} enviado para o administrador!`);
                                                                } catch(err) {
                                                                    alert('Erro ao enviar comprovante.');
                                                                }
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }} style={{ width: '150px', fontSize: '0.7rem' }} disabled={isQuitado} />
                                                    )}
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    {isQuitado ? (
                                                        <span style={{ color: 'var(--color-forest)', fontWeight: 'bold' }}><i className="fas fa-check-double"></i> Quitado</span>
                                                    ) : paymentData.comprovanteUrl && paymentData.comprovanteUrl !== '#' ? (
                                                        <span style={{ color: '#f57f17', fontWeight: 'bold' }}><i className="fas fa-hourglass-half"></i> Em Validação</span>
                                                    ) : (
                                                        <span style={{ color: '#666', fontWeight: 'bold' }}>Aberto</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    {isQuitado ? (
                                                        <button 
                                                            onClick={() => gerarRecibo(num)}
                                                            style={{ background: 'var(--color-river)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                            <i className="fas fa-print"></i> Gerar Recibo
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: '#ccc', fontSize: '0.8rem' }}>-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            );
        }

        if (activeTab === 'documentos') {
            const adminDocs = userLot.adminDocs || {};
            
            const handleClientUpload = (e) => {
                const file = e.target.files[0];
                if(!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    const clientDocs = userLot.clientDocs || [];
                    const newDoc = { name: file.name, url: reader.result };
                    const updatedLot = { ...userLot, clientDocs: [...clientDocs, newDoc] };
                    
                    try {
                        const allLots = JSON.parse(localStorage.getItem('db_lots') || '[]');
                        const newLots = allLots.map(l => l.uid === userLot.uid ? updatedLot : l);
                        localStorage.setItem('db_lots', JSON.stringify(newLots));
                        setUserLot(updatedLot);
                        alert('Upload de documento enviado à administração com sucesso!');
                    } catch(err) {
                        // Fallback gracefully if database quota exceeded
                        newDoc.url = '#';
                        const fallbackLot = { ...userLot, clientDocs: [...clientDocs, newDoc] };
                        const allLots = JSON.parse(localStorage.getItem('db_lots') || '[]');
                        const newLots = allLots.map(l => l.uid === userLot.uid ? fallbackLot : l);
                        localStorage.setItem('db_lots', JSON.stringify(newLots));
                        setUserLot(fallbackLot);
                        alert('O arquivo excedeu a memória local segura, simulamos o envio da sua ID apenas em texto!');
                    }
                };
                reader.readAsDataURL(file);
            };

            return (
                <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: 'var(--shadow)' }}>
                    <h3 style={{ color: 'var(--color-dark)' }}>Documentos Oficiais</h3>
                    <p style={{ color: '#666', marginBottom: '30px' }}>Arquivos anexados pela administração referentes ao lote <strong>{userLot.id}</strong>.</p>
                    
                    <div style={{ display: 'grid', gap: '15px', marginBottom: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: '#f9f9f9', borderRadius: '10px', alignItems: 'center' }}>
                            <div><strong><i className="fas fa-file-contract"></i> Contrato de Compra e Venda Assinado</strong></div>
                            {adminDocs.contrato && adminDocs.contrato.url !== '#' ? (
                                <a href={adminDocs.contrato.url} download={adminDocs.contrato.name} className="btn btn-primary" style={{ textDecoration: 'none' }}>Fazer Download</a>
                            ) : (
                                <span style={{ color: '#999', fontSize: '0.9rem' }}>Ainda não disponibilizado</span>
                            )}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: '#f9f9f9', borderRadius: '10px', alignItems: 'center' }}>
                            <div><strong><i className="fas fa-map-marked"></i> Planta e Memorial Descritivo Completo</strong></div>
                            {adminDocs.memorial && adminDocs.memorial.url !== '#' ? (
                                <a href={adminDocs.memorial.url} download={adminDocs.memorial.name} className="btn btn-primary" style={{ textDecoration: 'none' }}>Fazer Download</a>
                            ) : (
                                <span style={{ color: '#999', fontSize: '0.9rem' }}>Ainda não disponibilizado</span>
                            )}
                        </div>
                    </div>

                    <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '10px', background: '#f0f4f8' }}>
                        <h4 style={{ marginBottom: '15px', color: 'var(--color-river)' }}><i className="fas fa-cloud-upload-alt"></i> Enviar Arquivos para a Administração</h4>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>Envie seus documentos de identificação, certidões ou comprovantes avulsos para que o administrador aprove.</p>
                        <input type="file" onChange={handleClientUpload} style={{ width: '100%', padding: '10px', background: 'white', border: '1px solid #ccc', borderRadius: '5px' }} />
                        
                        {(userLot.clientDocs && userLot.clientDocs.length > 0) && (
                            <div style={{ marginTop: '20px' }}>
                                <strong>Enviados por você:</strong>
                                <ul style={{ marginTop: '10px', paddingLeft: '20px', fontSize: '0.9rem' }}>
                                    {userLot.clientDocs.map((doc, i) => (
                                        <li key={i}>{doc.name}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (activeTab === 'obras') {
            return (
                <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: 'var(--shadow)' }}>
                    <h3>Evolução da Obra</h3>
                    <div style={{ background: '#eee', height: '300px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', backgroundImage: 'url(https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80)', backgroundSize: 'cover' }}>
                        <i className="fas fa-play-circle" style={{ fontSize: '4rem', color: 'white', opacity: 0.8 }}></i>
                    </div>
                    <div style={{ borderLeft: '3px solid var(--color-forest)', paddingLeft: '20px' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <strong>Janeiro 2026:</strong> Terraplanagem Concluída.
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <strong>Março 2026:</strong> Demarcação das Quadras.
                        </div>
                        <div style={{ color: 'var(--color-river)', fontWeight: 'bold' }}>
                            Fase Atual: Instalação Hidráulica (60% Concluído).
                        </div>
                    </div>
                </div>
            );
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f4f7f6' }}>
            <div style={{ background: 'var(--color-forest)', padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}>Reserva do Rio <small style={{fontSize:'0.7rem', opacity:0.7}}>CLIENTE</small></Link>
                <button onClick={() => setIsLoggedIn(false)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>Sair</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: '30px', maxWidth: '1400px', margin: '30px auto', padding: '0 5%' }}>
                <aside style={{ background: 'white', padding: '30px', borderRadius: '15px', height: 'fit-content', boxShadow: 'var(--shadow)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <div style={{ width: '80px', height: '80px', background: 'var(--color-sand)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '2rem' }}>
                            <i className="fas fa-user-circle"></i>
                        </div>
                        <h4 style={{ margin: 0 }}>{userLot?.client || 'Proprietário'}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-forest)', fontWeight: 'bold' }}>{userLot?.id}</span>
                    </div>

                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button onClick={() => setActiveTab('financeiro')} style={{ textAlign: 'left', padding: '12px 15px', border: 'none', background: activeTab === 'financeiro' ? '#f0f9f4' : 'transparent', borderRadius: '8px', cursor: 'pointer', color: activeTab === 'financeiro' ? 'var(--color-forest)' : '#666', fontWeight: 'bold' }}>
                            <i className="fas fa-file-invoice-dollar" style={{width: '25px'}}></i> Meu Financeiro
                        </button>
                        <button onClick={() => setActiveTab('documentos')} style={{ textAlign: 'left', padding: '12px 15px', border: 'none', background: activeTab === 'documentos' ? '#f0f9f4' : 'transparent', borderRadius: '8px', cursor: 'pointer', color: activeTab === 'documentos' ? 'var(--color-forest)' : '#666', fontWeight: 'bold' }}>
                            <i className="fas fa-folder-open" style={{width: '25px'}}></i> Documentos
                        </button>
                        <button onClick={() => setActiveTab('obras')} style={{ textAlign: 'left', padding: '12px 15px', border: 'none', background: activeTab === 'obras' ? '#f0f9f4' : 'transparent', borderRadius: '8px', cursor: 'pointer', color: activeTab === 'obras' ? 'var(--color-forest)' : '#666', fontWeight: 'bold' }}>
                            <i className="fas fa-helmet-safety" style={{width: '25px'}}></i> Minha Obra
                        </button>
                    </nav>
                </aside>

                <main>{renderContent()}</main>
            </div>
        </div>
    );
};

export default ClientArea;
