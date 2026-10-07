import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, hora } from '../lib/api';

export default function MatcherLogs() {
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof api.matcherLogs>>['logs']>([]);

  useEffect(() => {
    api.matcherLogs(100).then((r) => setLogs(r.logs)).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card">
        <strong style={{ fontSize: 20 }}>Cérebro — cruzamentos</strong>
        <div style={{ fontSize: 14, color: '#264653' }}>Cada linha é um caminhão fechado pelo algoritmo First Fit Decreasing.</div>
      </div>
      {logs.length === 0 && <div className="card">Sem cruzamentos ainda.</div>}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {logs.map((l) => (
          <Link key={l.id} to={`/fretes/${l.frete_codigo}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #F4F1DE', fontSize: 14 }}>
              <span><strong>#{l.frete_codigo}</strong> {l.rota} G{l.grupo} · {l.total_kg}kg · {l.qtd_agregadoras} tias</span>
              <span style={{ color: '#264653' }}>{l.duracao_ms}ms · {hora(l.created_at)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
