import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, kz, hora, type Frete } from '../lib/api';

const CORES: Record<string, string> = {
  oferecido: '#F4A261',
  aceito: '#264653',
  recolhido: '#2A9D8F',
  entregue: '#2A9D8F',
  avaria: '#9B2226',
};

export default function Fretes() {
  const [filtro, setFiltro] = useState('');
  const [fretes, setFretes] = useState<Frete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.fretes(filtro ? `?status=${filtro}` : '')
      .then((r) => setFretes(r.fretes))
      .finally(() => setLoading(false));
  }, [filtro]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card">
        <strong style={{ fontSize: 20 }}>Fretes Fechados</strong>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {['', 'oferecido', 'aceito', 'recolhido', 'entregue'].map((s) => (
            <button
              key={s || 'todos'}
              onClick={() => setFiltro(s)}
              style={{
                padding: '10px 14px', borderRadius: 20, border: '2px solid #F4F1DE', cursor: 'pointer',
                background: filtro === s ? '#E63946' : '#fff', color: filtro === s ? '#fff' : '#8B4513', fontWeight: 700,
              }}
            >
              {s === '' ? 'Todos' : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <><div className="skeleton" style={{ height: 120 }} /><div className="skeleton" style={{ height: 120 }} /></>
      ) : fretes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>🚚</div>
          <p><strong>Ainda sem fretes aqui.</strong> Crie cargas e force o cruzamento no Admin.</p>
          <Link to="/admin"><button className="btn-primary">Ir ao Admin</button></Link>
        </div>
      ) : (
        fretes.map((f) => (
          <Link key={f.codigo} to={`/fretes/${f.codigo}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ borderLeft: `8px solid ${CORES[f.status] ?? '#ccc'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 18 }}>Caminhão #{f.codigo}</strong>
                <span style={{ background: CORES[f.status] ?? '#ccc', color: '#fff', padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
                  {f.status.toUpperCase()}
                </span>
              </div>
              <div style={{ marginTop: 6 }}>
                {f.total_kg.toLocaleString('pt-AO')}kg / 3500kg ({Math.round((f.total_kg / 3500) * 100)}% cheio) · {f.rota.replace('-', ' → ')}
              </div>
              <div style={{ color: '#2A9D8F', fontWeight: 800, marginTop: 4 }}>Economia {kz(f.economia_kz)} · {hora(f.created_at)}</div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
