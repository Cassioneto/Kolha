import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, Check } from 'lucide-react';
import { api, kz, type FreteDetalhe } from '../lib/api';
import TruckBar from '../components/TruckBar';

export default function FreteDetalhe() {
  const { codigo } = useParams();
  const [f, setF] = useState<FreteDetalhe | null>(null);
  const [erro, setErro] = useState('');
  const [msgOk, setMsgOk] = useState('');

  useEffect(() => {
    if (codigo) api.frete(codigo).then(setF).catch((e) => setErro(e.message));
  }, [codigo]);

  async function confirmar() {
    if (!codigo) return;
    try {
      const r = await api.confirmar(codigo, { telefone: localStorage.getItem('kolha_tel') ?? '923000001' });
      setMsgOk(r.mensagem);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falhou');
    }
  }

  if (erro) return <div className="card" style={{ color: '#9B2226' }}>{erro}</div>;
  if (!f) return <div className="skeleton" style={{ height: 300 }} />;

  const cheio = f.status !== 'oferecido';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card" style={{ background: f.total_kg >= 2975 ? '#2A9D8F' : '#E63946', color: '#fff', borderColor: 'transparent' }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>#{f.codigo} {f.status === 'oferecido' ? 'FECHADO' : f.status.toUpperCase()} — {Math.round((f.total_kg / 3500) * 100)}% CHEIO</div>
        <div style={{ margin: '4px 0 10px' }}>{f.total_kg.toLocaleString('pt-AO')}kg / 3500kg · Grupo {f.grupo} · {f.itens.length} cargas de {f.agregadoras.length} tias</div>
        <div className="confete"><span>🎉</span> <span>🚚</span> <span>🎉</span></div>
        <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: 12, padding: 12, marginTop: 8 }}>
          <div>Economia do grupo: <strong>{kz(f.economia_kz)}</strong> (sozinhas {kz((f.agregadoras.length) * 45000)} → juntas 45.000Kz)</div>
        </div>
      </div>

      <div className="card">
        <TruckBar kg={f.total_kg} />
        <div style={{ marginTop: 8, fontSize: 14 }}>📍 {f.rota.replace('-', ' → ')} · Saída amanhã 07:30</div>
      </div>

      <div className="card">
        <strong>Quem vai neste caminhão</strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {f.itens.map((it) => (
            <div key={it.id} style={{ display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid #F4F1DE', paddingBottom: 8 }}>
              <div style={{ fontSize: 28 }}>🍅</div>
              <div style={{ flex: 1 }}>
                <div><strong>{it.qtd}kg {it.produto}</strong> — {it.agregadora_nome ?? it.agregadora_id}</div>
                <div style={{ fontSize: 13, color: '#264653' }}>{it.agregadora_tel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <strong>Rateio (só informativo)</strong>
        {f.rateio.map((r) => (
          <div key={r.agregadora_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F4F1DE' }}>
            <span>{r.qtd}kg</span>
            <span><strong>{kz(r.valor_proporcional)}</strong> <span style={{ color: '#2A9D8F' }}>(poupa {kz(r.economia_individual)})</span></span>
          </div>
        ))}
      </div>

      {!cheio || f.status === 'aceito' ? (
        <div className="card">
          <strong>É a tia? Confirme com foto da balança</strong>
          <p style={{ fontSize: 14 }}>Quando o camionista chegar, tire foto da balança como prova.</p>
          <button className="btn-primary btn-folha" onClick={confirmar}><Camera size={20} /> CONFIRMO com foto da balança</button>
          {msgOk && <div style={{ color: '#2A9D8F', fontWeight: 700, marginTop: 8 }}><Check size={16} /> {msgOk}</div>}
        </div>
      ) : null}

      <div className="card" style={{ fontSize: 14 }}>
        <span className="sms-mono">Camionista: envie ACEITO {f.codigo} por SMS para ficar com este frete.</span>
      </div>
    </div>
  );
}
