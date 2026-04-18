import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PropostaFlow = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Obter o Lote pré-selecionado (se houver) via state do Router ou do LocalStorage
    const [selectedLotId, setSelectedLotId] = useState(location.state?.lotId || '');
    const [lotDetails, setLotDetails] = useState(null);
    const [allLots, setAllLots] = useState([]);

    // Step management
    const [step, setStep] = useState(1);
    
    // CONFIGURAÇÕES DO ADMIN
    const [config, setConfig] = useState({
        taxaAnual: 0.06,
        entradaMinima: 8500,
        descontoAvista: 10,
        maxParcelas: 100
    });

    // DADOS PESSOAIS
    const [formData, setFormData] = useState({
        nome: '',
        cpf: '',
        rg: '',
        orgaoEmissor: '',
        nascimento: '',
        estadoCivil: 'Solteiro(a)',
        regimeBens: '',
        profissao: '',
        renda: '',
        empresa: '',
        tempoServico: '',
        // Conjuge
        conjugeNome: '',
        conjugeCpf: '',
        // Endereco
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: '',
        // Contato
        telefone: '',
        email: ''
    });

    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    // SIMULAÇÃO (Mesma lógica do Simulator.jsx)
    const [entry, setEntry] = useState(0);
    const [months, setMonths] = useState(60);
    const [simResult, setSimResult] = useState(null);

    useEffect(() => {
        // Carregar Predefinições do Admin
        const savedInfo = localStorage.getItem('db_sim_config');
        if (savedInfo) {
            const parsedConfig = JSON.parse(savedInfo);
            setConfig(parsedConfig);
            setEntry(parsedConfig.entradaMinima);
        }

        const savedLots = JSON.parse(localStorage.getItem('db_lots') || '[]');
        setAllLots(savedLots);
        if (selectedLotId) {
            const l = savedLots.find(x => x.id === selectedLotId);
            setLotDetails(l);
        }
    }, [selectedLotId]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calcularSimulacao = () => {
        if (!lotDetails) return;
        
        const basePrice = lotDetails.price;
        const saldo = basePrice - entry;
        const parcelaInicial = saldo > 0 ? saldo / months : 0;
        const anos = Math.ceil(months / 12);
        const parcelaFinalEstimada = parcelaInicial * Math.pow(1 + config.taxaAnual, anos);
        
        // Cálculo do total pago (reajuste ANUAL)
        let totalPagoParcelas = 0;
        let parcelaAtual = parcelaInicial;
        for (let i = 0; i < anos; i++) {
            let mesesNoAno = (i === anos - 1 && months % 12 !== 0) ? months % 12 : 12;
            totalPagoParcelas += parcelaAtual * mesesNoAno;
            parcelaAtual = parcelaAtual * (1 + config.taxaAnual);
        }
        const totalPagoGeral = entry + totalPagoParcelas;
        
        setSimResult({
            saldo,
            parcelaInicial,
            parcelaFinalEstimada,
            totalPagoGeral,
            anos
        });
    };

    // Estilos modulares
    const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px 0', border: '1px solid #ccc', borderRadius: '5px' };
    const labelStyle = { fontWeight: 'bold', fontSize: '0.9rem', color: '#444' };

    const renderStepSimulacao = () => (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <h3 style={{ color: 'var(--color-forest)', marginBottom: '20px' }}>1. Simulação de Pagamento e Lote</h3>
            
            <label style={labelStyle}>Lote Desejado *</label>
            <select style={{...inputStyle, padding:'15px', fontSize:'1.1rem'}} value={selectedLotId} onChange={(e) => {
                setSelectedLotId(e.target.value);
                setSimResult(null);
            }}>
                <option value="">-- Selecione seu lote --</option>
                {allLots.filter(l => l.status === 'Disponível').map(l => (
                    <option key={l.id} value={l.id}>{l.id} - Área: {l.size} - R$ {l.price.toLocaleString('pt-BR')}</option>
                ))}
            </select>

            {lotDetails && (
                <div style={{ background: '#f5f5f5', padding: '30px', borderRadius: '15px', marginTop: '20px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.2fr', gap: '30px' }}>
                        <div>
                            <h4 style={{marginBottom: '20px', color: 'var(--color-forest)'}}><i className="fas fa-sliders-h"></i> Ajuste as Condições</h4>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                                    Valor de Entrada:
                                    <span style={{ color: 'var(--color-forest)' }}>{entry.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </label>
                                <input 
                                    type="range" min={config.entradaMinima} max={lotDetails.price * 0.9} step="500"
                                    value={entry} 
                                    onChange={e => { setEntry(Number(e.target.value)); setSimResult(null); }} 
                                    style={{ width: '100%', height: '6px', background: '#ddd', borderRadius: '5px', outline: 'none', margin: '15px 0' }}
                                />
                                <small style={{ color: '#999' }}>Mínimo obrigatório: {config.entradaMinima.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</small>
                            </div>
                            
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                                    Prazo de Parcelamento:
                                    <span style={{ color: 'var(--color-river)' }}>{months} Meses</span>
                                </label>
                                <input 
                                    type="range" min="12" max={config.maxParcelas} step="12"
                                    value={months} 
                                    onChange={e => { setMonths(Number(e.target.value)); setSimResult(null); }} 
                                    style={{ width: '100%', height: '6px', background: '#ddd', borderRadius: '5px', outline: 'none', margin: '15px 0' }}
                                />
                            </div>
                            
                            <button className="btn btn-primary" style={{width: '100%', padding: '15px', background: 'var(--color-forest)', color: 'white'}} onClick={calcularSimulacao}>Confirmar Simulação Financeira</button>
                        </div>
                        
                        <div style={{ background: 'var(--color-forest)', color: 'white', padding: '25px', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', opacity: 0.1, right: '-20px', top: '-20px', fontSize: '10rem' }}>
                                <i className="fas fa-file-invoice-dollar"></i>
                            </div>
                            <h4 style={{marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px'}}>Resumo da Proposta</h4>
                            {simResult ? (
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Valor da 1ª Parcela (Ano 1):</p>
                                    <h2 style={{ fontSize: '2.5rem', margin: '5px 0 15px 0', fontFamily: 'serif' }}>{simResult.parcelaInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
                                    
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                                        <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <span>Saldo do Lote:</span>
                                            <strong>{simResult.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                                        </p>
                                        <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <span>Correção Anual:</span>
                                            <strong>{config.taxaAnual * 100}% a.a.</strong>
                                        </p>
                                        <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <span>Última Parcela (Est.):</span>
                                            <strong>~{simResult.parcelaFinalEstimada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                                        </p>
                                    </div>
                                    
                                    <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Investimento Total a Prazo:</p>
                                        <strong style={{ fontSize: '1.4rem' }}>{simResult.totalPagoGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '60px', position: 'relative', zIndex: 1 }}>
                                    <i className="fas fa-calculator" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
                                    <p>Configure os sliders e clique em Confirmar.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                <button className="btn btn-primary" disabled={!simResult} onClick={() => setStep(2)}>Avançar para Seus Dados <i className="fas fa-arrow-right"></i></button>
            </div>
        </div>
    );

    const renderStepDadosPessoais = () => (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <h3 style={{ color: 'var(--color-forest)', marginBottom: '20px' }}>2. Dados Pessoais do Comprador</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
                <div><label style={labelStyle}>Nome Completo *</label><input required name="nome" value={formData.nome} onChange={handleInputChange} style={inputStyle} type="text" /></div>
                <div><label style={labelStyle}>CPF *</label><input required name="cpf" value={formData.cpf} onChange={handleInputChange} style={inputStyle} type="text" placeholder="000.000.000-00"/></div>
                <div><label style={labelStyle}>Data de Nasc.</label><input name="nascimento" value={formData.nascimento} onChange={handleInputChange} style={inputStyle} type="date" /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
                <div><label style={labelStyle}>RG</label><input name="rg" value={formData.rg} onChange={handleInputChange} style={inputStyle} type="text" /></div>
                <div><label style={labelStyle}>Órgão Emissor</label><input name="orgaoEmissor" value={formData.orgaoEmissor} onChange={handleInputChange} style={inputStyle} type="text" placeholder="SSP/SP"/></div>
                <div>
                    <label style={labelStyle}>Estado Civil</label>
                    <select name="estadoCivil" value={formData.estadoCivil} onChange={handleInputChange} style={inputStyle}>
                        <option value="Solteiro(a)">Solteiro(a)</option>
                        <option value="Casado(a)">Casado(a)</option>
                        <option value="Divorciado(a)">Divorciado(a)</option>
                        <option value="Viúvo(a)">Viúvo(a)</option>
                    </select>
                </div>
                <div><label style={labelStyle}>Profissão</label><input name="profissao" value={formData.profissao} onChange={handleInputChange} style={inputStyle} type="text" /></div>
            </div>

            {formData.estadoCivil === 'Casado(a)' && (
                <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '20px', borderLeft: '4px solid var(--color-river)' }}>
                    <h4 style={{marginBottom: '10px', color: 'var(--color-dark)'}}>Composição de Cônjuge</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
                        <div><label style={labelStyle}>Nome do Cônjuge</label><input name="conjugeNome" value={formData.conjugeNome} onChange={handleInputChange} style={inputStyle} type="text" /></div>
                        <div><label style={labelStyle}>CPF do Cônjuge</label><input name="conjugeCpf" value={formData.conjugeCpf} onChange={handleInputChange} style={inputStyle} type="text" /></div>
                        <div>
                            <label style={labelStyle}>Regime de Bens</label>
                            <select name="regimeBens" value={formData.regimeBens} onChange={handleInputChange} style={inputStyle}>
                                <option value="">Selecione...</option>
                                <option value="Comunhão Parcial">Comunhão Parcial</option>
                                <option value="Comunhão Universal">Comunhão Universal</option>
                                <option value="Separação Total">Separação Total</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            <h3 style={{ color: 'var(--color-forest)', margin: '30px 0 20px 0' }}>Endereço e Contato</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr 1fr 1fr', gap: '15px' }}>
                <div><label style={labelStyle}>CEP</label><input name="cep" value={formData.cep} onChange={handleInputChange} style={inputStyle} type="text" /></div>
                <div><label style={labelStyle}>Logradouro</label><input name="logradouro" value={formData.logradouro} onChange={handleInputChange} style={inputStyle} type="text" /></div>
                <div><label style={labelStyle}>Número</label><input name="numero" value={formData.numero} onChange={handleInputChange} style={inputStyle} type="text" /></div>
                <div><label style={labelStyle}>Complemento</label><input name="complemento" value={formData.complemento} onChange={handleInputChange} style={inputStyle} type="text" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '15px' }}>
                <div style={{gridColumn: '1 / 3'}}><label style={labelStyle}>Bairro</label><input name="bairro" value={formData.bairro} onChange={handleInputChange} style={inputStyle} type="text" /></div>
                <div style={{gridColumn: '3 / 5'}}><label style={labelStyle}>Cidade</label><input name="cidade" value={formData.cidade} onChange={handleInputChange} style={inputStyle} type="text" /></div>
                <div><label style={labelStyle}>UF</label><input name="uf" value={formData.uf} onChange={handleInputChange} style={inputStyle} type="text" /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={labelStyle}>E-mail</label><input name="email" value={formData.email} onChange={handleInputChange} style={inputStyle} type="email" /></div>
                <div><label style={labelStyle}>Telefone / WhatsApp *</label><input name="telefone" value={formData.telefone} onChange={handleInputChange} style={inputStyle} type="text" /></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                <button className="btn btn-secondary" onClick={() => setStep(1)}>Voltar</button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>Prosseguir para Contrato <i className="fas fa-arrow-right"></i></button>
            </div>
        </div>
    );

    const renderStepContrato = () => {
        // Obter data atual para contrato
        const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

        return (
            <div style={{ animation: 'fadeIn 0.5s' }}>
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ color: 'var(--color-forest)' }}>3. Geração Automática de Contrato</h3>
                    <div>
                        <button className="btn btn-secondary" style={{ marginRight: '10px' }} onClick={() => setStep(2)}>Voltar Edição</button>
                        <button className="btn btn-primary" onClick={() => window.print()}><i className="fas fa-print"></i> Imprimir/Salvar PDF</button>
                    </div>
                </div>

                <div className="no-print" style={{ background: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '5px', marginBottom: '20px', fontSize: '0.9rem' }}>
                    <strong>Atenção:</strong> Revise os termos antes de gerar o PDF. Ao clicar em Imprimir, esta tela será formatada nos padrões de Margem e Fonte exigidos por Cartórios (Times New Roman 12, justificado).
                </div>

                {/* AREA PDF CARTORIO */}
                <div className="cartorio-document" style={{ 
                    background: 'white', padding: '80px 100px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', 
                    fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: 1.5,
                    textAlign: 'justify', color: 'black'
                }}>
                    <h2 style={{ textAlign: 'center', textTransform: 'uppercase', marginBottom: '30px', fontWeight: 'bold' }}>CONTRATO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE IMÓVEL<br/>(ALIENAÇÃO FIDUCIÁRIA)</h2>
                    
                    <p>
                        Pelo presente instrumento particular, de um lado, na qualidade de <strong>PROMITENTE VENDEDORA</strong>, <strong>IADATA LTDA</strong> (Nome Fantasia: IATEK ME), inscrita no CNPJ sob o nº 44.921.307/0001-91, Sociedade Empresária Limitada, com sede na Rua Conceição Cipriano Tavares, nº 30, Bairro Parque das Acácias, Conselheiro Lafaiete – MG, CEP: 36.407-078, telefone: (16) 98121-1082, e-mail: veraguimaraessiqueira@hotmail.com, e de outro lado, na qualidade de <strong>PROMISSÁRIO COMPRADOR</strong>:
                    </p>

                    <p style={{ marginLeft: '40px' }}>
                        <strong>{formData.nome || 'NOME DO COMPRADOR'}</strong>, brasileiro(a), {formData.estadoCivil || 'ESTADO CIVIL'}, {formData.profissao || 'PROFISSÃO'}, portador(a) da Cédula de Identidade RG nº {formData.rg || 'XX'} SSP/{formData.orgaoEmissor || 'XX'} e inscrito(a) no CPF/MF sob o nº {formData.cpf || 'XX'}, residente e domiciliado(a) na {formData.logradouro || 'ENDEREÇO COMPLETO'}, nº {formData.numero}, Bairro {formData.bairro}, Cidade de {formData.cidade}/{formData.uf}, CEP {formData.cep}.
                        {formData.estadoCivil === 'Casado(a)' && ` Casado sob o regime de ${formData.regimeBens} com ${formData.conjugeNome}, CPF ${formData.conjugeCpf}.`}
                    </p>

                    <p>Têm entre si justo e contratado o presente instrumento particular, mediante as cláusulas e condições seguintes:</p>

                    <h4 style={{ textTransform: 'uppercase', marginTop: '20px', textDecoration: 'underline' }}>Cláusula Primeira – Do Objeto</h4>
                    <p>
                        A VENDEDORA é legítima proprietária e possuidora do imóvel denominado <strong>{lotDetails?.id || 'LOTE XX'}</strong>, com área total de <strong>{lotDetails?.size || 'XX m²'}</strong>, devidamente aprovado pelos órgãos competentes. A VENDEDORA promete vender e o COMPRADOR promete comprar o referido lote no estado em que se encontra.
                    </p>

                    <h4 style={{ textTransform: 'uppercase', marginTop: '20px', textDecoration: 'underline' }}>Cláusula Segunda – Do Preço e Condições de Pagamento</h4>
                    <p>
                        O preço certo e ajustado para a presente Promessa de Compra e Venda é de <strong>R$ {lotDetails?.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}</strong>, a serem pagos pelo COMPRADOR da seguinte forma:
                    </p>
                    <ul style={{ listStyleType: 'lower-alpha' }}>
                        <li><strong>Sinal/Entrada:</strong> {entry.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, pago na assinatura deste instrumento.</li>
                        <li><strong>Saldo Restante:</strong> {simResult?.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, pagos em <strong>{months || 'XX'} parcelas mensais e sucessivas</strong> de <strong>{simResult?.parcelaInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> sujeitas a correção monetária pré-fixada anual de {config.taxaAnual * 100}% ou índices oficiais previstos em lei.</li>
                    </ul>

                    <h4 style={{ textTransform: 'uppercase', marginTop: '20px', textDecoration: 'underline' }}>Cláusula Terceira – Correção e Inadimplência</h4>
                    <p>
                        O não pagamento pontual de qualquer parcela implicará na incidência de juros moratórios de 1% (um por cento) ao mês e multa compensatória de 2% (dois por cento) sobre o valor do débito atualizado. O atraso superior a 90 dias configura quebra de contrato sob o regime da Lei 9.514/97.
                    </p>

                    <h4 style={{ textTransform: 'uppercase', marginTop: '20px', textDecoration: 'underline' }}>Cláusula Quarta – Da Posse e Transferência</h4>
                    <p>
                        O COMPRADOR será imitido na posse precária do imóvel, assumindo a partir desta data todos os impostos (IPTU), taxas e obrigações incidentes sobre o lote. A Escritura Pública definitiva será outorgada somente após a quitação integral do saldo devedor.
                    </p>

                    <h4 style={{ textTransform: 'uppercase', marginTop: '20px', textDecoration: 'underline' }}>Cláusula Quinta – Do Foro</h4>
                    <p>
                        Para dirimir quaisquer questões decorrentes deste contrato, as partes elegem o foro da Comarca de domicílio do Empreendimento, com renúncia expressa a qualquer outro.
                    </p>
                    
                    <br/><br/>
                    <p style={{ textAlign: 'center' }}>E por estarem assim justas e contratadas, assinam o presente em 02 (duas) vias de igual teor.</p>
                    
                    <p style={{ textAlign: 'right', marginTop: '30px', marginBottom: '50px' }}>Cidade da Sede, {today}.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', textAlign: 'center', marginTop: '80px' }}>
                        <div>
                            <hr style={{borderTop: '1px solid black'}}/>
                            <p><strong>Empreendimentos Reserva do Rio LTDA</strong><br/>Promitente Vendedora</p>
                        </div>
                        <div>
                            <hr style={{borderTop: '1px solid black'}}/>
                            <p><strong>{formData.nome || 'PROMISSÁRIO COMPRADOR'}</strong><br/>CPF: {formData.cpf}</p>
                        </div>
                    </div>
                </div>

                <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                    <button className="btn btn-primary" onClick={() => setStep(4)}>Estou de Acordo - Prosseguir para Envio <i className="fas fa-arrow-right"></i></button>
                </div>
            </div>
        );
    };

    const renderStepFinalizacao = () => {
        const handleFinalSubmit = () => {
            if(senha !== confirmarSenha || senha.length < 4) {
                return alert("As senhas não conferem ou são muito curtas!");
            }

            const pendingUsers = JSON.parse(localStorage.getItem('pending_users') || '[]');
            pendingUsers.push({
                id: Date.now(),
                name: formData.nome,
                cpf: formData.cpf,
                email: formData.email,
                telefone: formData.telefone,
                loteId: lotDetails?.id,
                status: 'Aguardando Aprovação',
                docsUploaded: true,
                senha: senha,
                simulation: simResult,
                totalParcelas: months,
                price: simResult?.totalSaldo || lotDetails?.price,
                startDate: new Date().toLocaleDateString('pt-BR')
            });
            localStorage.setItem('pending_users', JSON.stringify(pendingUsers));

            alert('Proposta ENVIADA COM SUCESSO! Você receberá a confirmação em breve.');
            navigate('/cliente');
        };

        return (
            <div style={{ animation: 'fadeIn 0.5s' }}>
                <h3 style={{ color: 'var(--color-forest)', marginBottom: '20px' }}>4. Criação de Acesso Cliente e Envio</h3>
                <p style={{ color: '#666', marginBottom: '30px' }}>A proposta de compra do lote <strong>{lotDetails?.id}</strong> está pronta! Crie uma senha abaixo para acompanhar sua aprovação.</p>

                <div style={{ background: '#f5f5f5', padding: '30px', borderRadius: '10px', maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ background: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
                        <i className="fas fa-exclamation-triangle"></i> <strong>Atenção às Comunicações Oficiais:</strong><br/>
                        A aprovação final e os próximos passos serão enviados para o seu e-mail (<strong>{formData.email || 'Não informado'}</strong>).<br/>
                        Você também receberá no seu WhatsApp (<strong>{formData.telefone || 'Não informado'}</strong>) o convite formal para o Grupo do Loteamento Oficial ao ser aprovado!
                    </div>

                    <h4 style={{ marginBottom: '20px', textAlign: 'center' }}><i className="fas fa-lock"></i> Credenciais de Acesso</h4>
                    
                    <label style={labelStyle}>Seu Login (CPF)</label>
                    <input disabled value={formData.cpf || 'Preencha no Passo 1'} style={{...inputStyle, background: '#eee'}} type="text" />

                    <label style={labelStyle}>Crie uma Senha *</label>
                    <input value={senha} onChange={e => setSenha(e.target.value)} style={inputStyle} type="password" placeholder="Mínimo 4 caracteres" />

                    <label style={labelStyle}>Confirme a Senha *</label>
                    <input value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} style={inputStyle} type="password" />

                    <button 
                        className="btn btn-primary" 
                        onClick={handleFinalSubmit} 
                        style={{ 
                            width: '100%', 
                            marginTop: '20px', 
                            padding: '15px', 
                            background: 'var(--color-forest)', 
                            color: 'white', 
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        ENVIAR PROPOSTA E CRIAR CONTA <i className="fas fa-paper-plane" style={{ marginLeft: '10px' }}></i>
                    </button>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button className="btn btn-secondary" onClick={() => setStep(3)} style={{ flex: 1 }}>
                            Revisar Contrato
                        </button>
                        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ flex: 1, borderColor: '#ccc', color: '#666' }}>
                            <i className="fas fa-home"></i> Cancelar e Voltar à Tela Principal
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ background: '#f4f6F8', minHeight: '100vh' }}>
            <div className="no-print" style={{ background: 'var(--color-dark)', padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                <div className="logo" style={{ color: 'white' }}>Reserva do Rio <span style={{fontSize: '0.8rem', color: 'var(--color-sand)'}}>| CHECKOUT DE LOTE</span></div>
                <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                    Cancelar e Voltar ao Site
                </button>
            </div>

            {/* Stepper Visual */}
            <div className="no-print" style={{ maxWidth: '1000px', margin: '40px auto 20px auto', display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '2px', background: '#ddd', zIndex: 0 }}></div>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ 
                        position: 'relative', zIndex: 1, background: step >= i ? 'var(--color-river)' : '#ddd', 
                        color: 'white', width: '30px', height: '30px', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' 
                    }}>
                        {i}
                    </div>
                ))}
            </div>

            <div style={{ maxWidth: step === 3 ? '1000px' : '900px', margin: '0 auto', padding: '20px 5% 60px 5%' }}>
                <div style={{ 
                    // Se for step 3, removemos fundo pra facilitar impressao visual
                    background: step === 3 ? 'transparent' : 'white', 
                    borderRadius: '10px', 
                    padding: step === 3 ? '0' : '40px', 
                    boxShadow: step === 3 ? 'none' : '0 10px 30px rgba(0,0,0,0.1)' 
                }}>
                    {step === 1 && renderStepSimulacao()}
                    {step === 2 && renderStepDadosPessoais()}
                    {step === 3 && renderStepContrato()}
                    {step === 4 && renderStepFinalizacao()}
                </div>
            </div>

            {/* Injetando estilos de impressão diretamente aqui no componente */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    html, body { background: white; margin: 0; padding: 0; height: auto !important; overflow: visible !important; }
                    .cartorio-document { 
                        box-shadow: none !important; 
                        padding: 0 !important; 
                        font-family: "Times New Roman", serif !important;
                    }
                    @page { margin: 2cm; }
                }
            `}</style>
        </div>
    );
};

export default PropostaFlow;
