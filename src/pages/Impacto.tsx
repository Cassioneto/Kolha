import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { api, kz, hora, type Impacto } from '../lib/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function Impacto() {
  const [d, setD] = useState<Impacto | null>(null);

  useEffect(() => {
    api.impacto().then(setD).catch(() => {});
  }, []);

  if (!d) return <><div className="skeleton" style={{ height: 120 }} /><div className="skeleton" style={{ height: 220 }} /></>;

  const cards = [
    { nome: 'Caminhões Otimizados', valor: String(d.caminhoes), extra: 'cruzamentos feitos' },
    { nome: 'Ocupação Média', valor: `${d.ocupacao_media}%`, extra: `meta ${d.meta_ocupacao}%` },
    { nome: 'Economia Total', valor: kz(d.economia_total), extra: 'frete dividido' },
    { nome: 'Espera Média', valor: `${d.tempo_medio_espera_h}h`, extra: 'da carga ao frete' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card" style={{ background: '#264653', color: '#fff', borderColor: '#264653' }}>
        <strong style={{ fontSize: 20 }}>Impacto real — menos camião vazio</strong>
        <div style={{ opacity: 0.85, fontSize: 14 }}>Ocupação média, economia e rotas. Dados vivos da base.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cards.map((k) => (
          <div key={k.nome} className="card">
            <div style={{ fontSize: 12, color: '#264653' }}>{k.nome}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#E63946' }}>{k.valor}</div>
            <div style={{ fontSize: 12, color: '#264653' }}>{k.extra}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <strong>Ocupação por dia (%)</strong>
        {d.por_dia.length ? (
          <Line
            data={{
              labels: d.por_dia.map((p) => p.dia),
              datasets: [{ label: 'Ocupação %', data: d.por_dia.map((p) => p.ocupacao), borderColor: '#2A9D8F', backgroundColor: '#2A9D8F' }],
            }}
            options={{ plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }}
          />
        ) : (
          <p style={{ fontSize: 14 }}>Ainda sem histórico — feche o primeiro frete no Admin.</p>
        )}
      </div>

      <div className="card">
        <strong>Economia por rota</strong>
        {d.por_rota.length ? (
          <Bar
            data={{
              labels: d.por_rota.map((p) => p.rota),
              datasets: [{ label: 'Economia Kz', data: d.por_rota.map((p) => p.economia), backgroundColor: '#E63946' }],
            }}
            options={{ plugins: { legend: { display: false } } }}
          />
        ) : (
          <p style={{ fontSize: 14 }}>Sem dados por rota ainda.</p>
        )}
      </div>

      <div className="card">
        <strong>Fretes recentes</strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {d.recentes.map((f) => (
            <Link key={f.codigo} to={`/fretes/${f.codigo}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F4F1DE', paddingBottom: 6 }}>
                <span>#{f.codigo} {f.rota} · {hora(f.created_at)}</span>
                <strong style={{ color: '#2A9D8F' }}>+{kz(f.economia_kz)}</strong>
              </div>
            </Link>
          ))}
          {d.recentes.length === 0 && <span style={{ fontSize: 14 }}>Nenhum frete ainda.</span>}
        </div>
      </div>
    </div>
  );
}
