import { useEffect, useState } from 'react';
import { api, hora } from '../lib/api';

export default function SmsLogs() {
  const [sms, setSms] = useState<Awaited<ReturnType<typeof api.smsLogs>>['sms']>([]);

  useEffect(() => {
    api.smsLogs(100).then((r) => setSms(r.sms)).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="card">
        <strong style={{ fontSize: 20 }}>SMS — mock telcosms.ao</strong>
        <div style={{ fontSize: 14, color: '#264653' }}>Em portfolio tudo é mock (MODO_PORTFOLIO=true). No real, isto passa pela telcosms.ao.</div>
      </div>
      {sms.length === 0 && <div className="card">Sem mensagens ainda. Feche um frete para ver os SMS.</div>}
      {sms.map((m) => (
        <div
          key={m.id}
          style={{
            maxWidth: '85%', padding: '10px 14px', borderRadius: 14,
            background: m.direcao === 'enviado' ? '#DCF8C6' : '#fff',
            alignSelf: m.direcao === 'enviado' ? 'flex-end' : 'flex-start',
            boxShadow: '0 1px 2px rgba(0,0,0,.1)',
          }}
        >
          <div style={{ fontSize: 12, color: '#264653' }}>
            [{hora(m.created_at)}] {m.direcao === 'enviado' ? '→' : '←'} {m.telefone} · {m.modo}
          </div>
          <div style={{ fontWeight: 600 }}>{m.mensagem}</div>
        </div>
      ))}
    </div>
  );
}
