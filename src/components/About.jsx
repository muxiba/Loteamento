import React, { useState, useEffect } from 'react';

export const defaultCopy = `🌿 **Um refúgio exclusivo com localização estratégica**

A apenas 40 minutos do centro, o empreendimento oferece o equilíbrio ideal entre acessibilidade e qualidade de vida — um verdadeiro escape do ritmo urbano, sem abrir mão da conveniência.

🏡 **Fase 2 – Sucesso comprovado**

Após o sucesso da primeira etapa, apresentamos a Fase 2 com apenas 32 lotes exclusivos, planejados para quem busca segurança, valorização e contato direto com a natureza.

📌 Baixa densidade
📌 Alto potencial de valorização
📌 Oportunidade limitada

🌊 **Mais de 500 metros de margem natural**

O empreendimento conta com extensa faixa de contato com a natureza, ideal para:
✔ Acesso privativo
✔ Lazer náutico
✔ Pesca
✔ Contemplação

Um diferencial raro, que transforma o lote em um verdadeiro patrimônio.

🛡️ **Segurança e tranquilidade**

✔ Portaria estruturada
✔ Monitoramento contínuo
✔ Controle de acesso
Ambiente planejado para garantir tranquilidade para você e sua família.

🌳 **40% de área verde preservada**

Inserido em uma área de 43,56 hectares, o empreendimento mantém grande parte de sua vegetação nativa preservada, proporcionando:
✔ Mais qualidade de vida
✔ Conforto térmico natural
✔ Integração com o meio ambiente

📍 **Localização privilegiada**

Situado no município de Rincão, com acesso pela estrada municipal que conecta a região a Guatapará, o empreendimento está inserido em uma região de forte expansão e valorização.

📑 **Segurança jurídica e regularidade**

O empreendimento está inserido em área devidamente cadastrada junto ao INCRA, com:
✔ CCIR ativo e regular
✔ Matrícula registrada em cartório
✔ Propriedade 100% regularizada
Isso garante mais segurança para o investidor e tranquilidade na aquisição.

💎 **Um investimento inteligente**

Mais do que um lote, você está adquirindo:
✔ Qualidade de vida
✔ Patrimônio real
✔ Potencial de valorização
✔ Segurança jurídica

🚀 **Condições facilitadas**

✔ Parcelamento em até 100x
✔ Correção anual padrão de mercado
✔ Escritura e impostos inclusos
✔ Sem taxas ocultas

🔥 *"Seu refúgio começa aqui. Exclusividade que se valoriza com o tempo. Menos cidade, mais vida. Invista onde a natureza ainda é protagonista."*`;

const About = () => {
    const [aboutText, setAboutText] = useState('');

    useEffect(() => {
        const savedText = localStorage.getItem('db_about_text');
        if (savedText) {
            setAboutText(savedText);
        } else {
            setAboutText(defaultCopy);
        }
    }, []);

    // Função simples para renderizar quebras de linha e negritos simples
    const renderSpacedText = (text) => {
        return text.split('\n').map((line, idx) => {
            if (line.trim() === '') return <br key={idx} />;
            
            // Format Bold Text (**text**)
            const boldRegex = /\*\*(.*?)\*\*/g;
            if (boldRegex.test(line)) {
                const parts = line.split(boldRegex);
                return (
                    <p key={idx} style={{ marginBottom: '10px', fontSize: '1.2rem', lineHeight: '1.6', color: '#444', textAlign: 'center' }}>
                        {parts.map((part, i) => (i % 2 === 1 ? <strong key={i} style={{ color: 'var(--color-dark)', fontSize: '1.3rem' }}>{part}</strong> : part))}
                    </p>
                );
            }

            // Format Italics (*text*)
            const italicRegex = /\*(.*?)\*/g;
            if (italicRegex.test(line)) {
                const parts = line.split(italicRegex);
                return (
                    <p key={idx} style={{ marginBottom: '10px', fontSize: '1.3rem', fontStyle: 'italic', color: 'var(--color-river)', textAlign: 'center', margin: '40px 0', fontWeight: 'bold' }}>
                        {parts.map((part, i) => (i % 2 === 1 ? part : part))}
                    </p>
                );
            }

            return <p key={idx} style={{ marginBottom: '10px', fontSize: '1.1rem', lineHeight: '1.6', color: '#666', textAlign: 'center' }}>{line}</p>;
        });
    };

    return (
        <section id="sobre" className="section" style={{ background: '#f5efe6' }}>
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '40px', fontSize: '2.5rem', color: 'var(--color-forest)' }}>Por que investir no Reserva do Rio?</h2>
                <div style={{ background: 'white', padding: '50px 40px', borderRadius: '15px', boxShadow: 'var(--shadow)' }}>
                    {renderSpacedText(aboutText)}
                </div>
            </div>
        </section>
    );
};

export default About;
