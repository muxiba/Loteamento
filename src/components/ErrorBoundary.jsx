import { Component } from 'react';
export default class ErrorBoundary extends Component {
 state = { failed: false };
 static getDerivedStateFromError() { return { failed: true }; }
 componentDidCatch(error) { console.error('Falha ao exibir a aplica��o:', error); }
 render() {
  if (this.state.failed) return <main className="data-message"><h1>N�o foi poss�vel abrir esta p�gina.</h1><p>Recarregue a p�gina para tentar novamente.</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Recarregar</button></main>;
  return this.props.children;
 }
}
