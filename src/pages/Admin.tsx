import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, kz } from '../lib/api';

export default function Admin() {
  const [rotas, setRotas] = useState<Awaited<ReturnType<typeof api.rotas>>['rotas']>([]);
  const [tel, setTel] = useState('923000100');
  const [msg, setMsg] = useState('ACEITO ');
  const [saida, setSaida] = useState('');
  const [qtdFake, setQtdFake] = useState(3);

  async function recarregar() {
    try {
      setRotas((await api.rotas()).rotas);
    } catch { /* ignora */ }
  }

  useEffect(() => { void recarregar(); }, []);

  async function forcar() {
    setSaida('A cruzar...');
    try {
      const r = await api.forcar({});
      setSaida(r.fechados.length ? `Fechado: ${r.fechados.map((f) => `#${f.codigo}`).join(', ')} 🎉` : 'Ainda falta carga — crie mais ofertas primeiro.');
      await recarregar();
    } catch (e) {
      setSaida(e instanceof Error ? e.message : 'Falhou');
    }
  }

  async function simular() {
    setSaida('A enviar SMS...');
    try {
      const r = await api.simularSms(tel, msg);
      setSaida(r.ok ? `SMS processado: ${r.estado}` : `SMS: ${r.erro}`);
      await recarregar();
    } catch (e) {
      setSaida(e instanceof Error ? e.message : 'Falhou');
    }
  }

  async function fake() {
    setSaida('A criar cargas...');
    try {
      const r = await api.simularOfertas(qtdFake);
      setSaida(`${r.qtd} cargas criadas.`);
      await recarregar();
    } catch (e) {
      setSaida(e instanceof Error ? e.message : 'Falhou');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card" style={{ background: '#264653', color: '#fff', borderColor: '#264653' }}>
        <strong style={{ fontSize: 20 }}>Admin — dono do portfolio</strong>
        <div style={{ fontSize: 14, opacity: 0.85 }}>Force o cruzamento, simule SMS do tio, veja os logs.</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <Link to="/sms-logs" style={{ flex: 1, color: '#fff' }}>SMS logs →</Link>
          <Link to="/matcher-logs" style={{ flex: 1, color: '#fff' }}>Cérebro →</Link>
        </div>
      </div>

      <div className="card">
        <strong>Fila por rota + grupo</strong>
        {rotas.length === 0 && <p style={{ fontSize: 14 }}>Fila vazia. Crie cargas fake abaixo.</p>}
        {rotas.map((r) => (
          <div key={`${r.rota}-${r.grupo}`} style={{ padding: '8px 0', borderBottom: '1px solid #F4F1DE', fontSize: 15 }}>
            <strong>{r.rota}</strong> G{r.grupo} · {r.kg_acumulado}kg · {r.qtd_tias} tias · {r.qtd_ofertas} cargas
            <div style={{ fontSize: 13, color: r.pode_fechar ? '#2A9D8F' : '#264653', fontWeight: 700 }}>
              {r.pode_fechar ? `Pronto a fechar (≥2975kg) ✓` : `Faltam ${r.falta_para_fechar}kg para fechar`}
            </div>
          </div>
        ))}
        <button className="btn-primary" style={{ marginTop: 12 }} onClick={forcar}>Forçar cruzamento agora</button>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <strong>Simular cargas fake</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input-grande" type="number" min={1} max={30} value={qtdFake} onChange={(e) => setQtdFake(Number(e.target.value))} />
          <button className="btn-primary btn-folha" style={{ width: 160 }} onClick={fake}>Criar {qtdFake}</button>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <strong>Simular SMS do camionista (sem telcosms real)</strong>
        <label style={{ fontSize: 14, fontWeight: 600 }}>Telefone</label>
        <input className="input-grande sms-mono" value={tel} onChange={(e) => setTel(e.target.value)} />
        <label style={{ fontSize: 14, fontWeight: 600 }}>Mensagem</label>
        <input className="input-grande sms-mono" value={msg} onChange={(e) => setMsg(e.target.value.toUpperCase())} placeholder="ACEITO 1042" />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['ACEITO', 'RECOLHI', 'ENTREGUE', 'AVARIA'].map((v) => (
            <button key={v} onClick={() => setMsg(`${v} `)} style={{ padding: '8px 12px', borderRadius: 20, border: '2px solid #F4F1DE', background: '#fff', fontWeight: 700, cursor: 'pointer' }} className="sms-mono">{v}</button>
          ))}
        </div>
        <button className="btn-primary" onClick={simular}>Enviar SMS simulado</button>
        <div style={{ fontSize: 13, color: '#264653' }}>Fluxo demo: crie cargas → force cruzamento → copie o código # → simule <span className="sms-mono">ACEITO #codigo</span> com 923000100 → veja o Kanban em Fretes mudar. Economia: {kz(90000)} típica.</div>
      </div>

      {saida && <div className="card" style={{ fontWeight: 700 }}>{saida}</div>}
    </div>
  );
}
