import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { api, type Oferta } from '../lib/api';
import TruckBar from '../components/TruckBar';

export default function MinhasCargas() {
  const [tel, setTel] = useState(localStorage.getItem('kolha_tel') ?? '923000001');
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    setLoading(true);
    try {
      const todas = await api.ofertas('?status=todas&limit=200');
      const minhas = todas.ofertas.filter(
        (o) => o.agregadora_tel === tel || o.agregadora_id === tel || o.agregadora_id === `u-${tel}`,
      );
      setOfertas(minhas);
      localStorage.setItem('kolha_tel', tel);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void carregar(); }, []);

  const naFila = ofertas.filter((o) => o.status === 'agregada');
  const kgFila = naFila.reduce((a, o) => a + o.qtd, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card">
        <strong>Minhas Cargas</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input className="input-grande" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Seu telefone" inputMode="tel" />
          <button className="btn-primary" style={{ width: 120 }} onClick={carregar}>Ver</button>
        </div>
      </div>

      {kgFila > 0 && (
        <div className="card" style={{ background: '#FFF7E8', borderColor: '#F4A261' }}>
          <TruckBar kg={kgFila} />
        </div>
      )}

      {loading ? (
        <><div className="skeleton" style={{ height: 110 }} /><div className="skeleton" style={{ height: 110 }} /></>
      ) : ofertas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>📦</div>
          <p><strong>Sem cargas com este telefone.</strong></p>
          <Link to="/nova" style={{ textDecoration: 'none' }}><button className="btn-primary">Criar Minha Carga</button></Link>
        </div>
      ) : (
        ofertas.map((o) => (
          <div key={o.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {o.foto_data ? (
              <img src={o.foto_data} alt={o.produto} style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: 12, background: '#F4F1DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🍅</div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>{o.qtd}kg {o.produto}</div>
              <div style={{ fontSize: 14, color: '#264653' }}>{o.rota.replace('-', ' → ')} · {o.agregadora_nome}</div>
              <div style={{ fontSize: 13 }}>
                <span style={{
                  background: o.status === 'agregada' ? '#F4A261' : '#2A9D8F', color: '#fff',
                  padding: '2px 10px', borderRadius: 20, fontWeight: 700,
                }}>
                  {o.status === 'agregada' ? 'Na fila' : o.status === 'em_frete' ? 'No caminhão' : 'Entregue'}
                </span>
              </div>
            </div>
            {o.status === 'agregada' && (
              <button
                onClick={async () => { await api.apagarOferta(o.id); await carregar(); }}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9B2226' }}
                title="Apagar"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
