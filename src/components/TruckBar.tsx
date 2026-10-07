import { Truck } from 'lucide-react';

// Barra de lotação do caminhão: 0-49 cinza, 50-84 laranja, 85-100 verde + confete
export default function TruckBar({ kg, capacidade = 3500 }: { kg: number; capacidade?: number }) {
  const pct = Math.min(100, Math.round((kg / capacidade) * 100));
  const cor = pct >= 85 ? '#2A9D8F' : pct >= 50 ? '#F4A261' : '#9aa5ad';
  const falta = Math.max(0, capacidade - kg);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Truck size={22} color="#8B4513" />
        <div style={{ flex: 1, height: 18, background: '#e7e0c8', borderRadius: 10, overflow: 'hidden' }}>
          <div
            style={{
              width: `${pct}%`, height: '100%', background: cor, borderRadius: 10,
              transition: 'width .6s', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            }}
          />
        </div>
        <strong style={{ minWidth: 44, textAlign: 'right' }}>{pct}%</strong>
      </div>
      <div style={{ fontSize: 14, color: '#264653' }}>
        {kg.toLocaleString('pt-AO')}kg de {capacidade.toLocaleString('pt-AO')}kg
        {falta > 0 ? (
          <> · <strong>Faltam {falta.toLocaleString('pt-AO')}kg para fechar! Chama mais uma tia!</strong></>
        ) : (
          <> · <strong style={{ color: '#2A9D8F' }}>Caminhão cheio! 🎉</strong></>
        )}
      </div>
    </div>
  );
}
