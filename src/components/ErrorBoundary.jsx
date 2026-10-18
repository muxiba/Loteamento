import { Component } from 'react';
export default class ErrorBoundary extends Component {
 state = { failed: false };
 static getDerivedStateFromError() { return { failed: true }; }
 componentDidCatch(error) { console.error('Falha ao exibir a aplicação:', error); }
 render() {
  if (this.state.failed) return <main className="data-message"><h1>Não foi possível abrir esta página.</h1><p>Recarregue a página para tentar novamente.</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Recarregar</button></main>;
  return this.props.children;
 }
}
