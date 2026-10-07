import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { Camera, Check, Minus, Plus } from 'lucide-react';
import { api } from '../lib/api';

const PRODUTOS = [
  { id: 'tomate', nome: 'Tomate', emoji: '🍅' },
  { id: 'cebola', nome: 'Cebola', emoji: '🧅' },
  { id: 'batata', nome: 'Batata', emoji: '🥔' },
  { id: 'repolho', nome: 'Repolho', emoji: '🥬' },
  { id: 'cenoura', nome: 'Cenoura', emoji: '🥕' },
  { id: 'pimento', nome: 'Pimento', emoji: '🫑' },
  { id: 'banana', nome: 'Banana', emoji: '🍌' },
  { id: 'manga', nome: 'Manga', emoji: '🥭' },
];

const ROTAS = ['Caxito-Talatona', 'Caxito-30', 'Caxito-Kikolo', 'Caxito-Zango'];

export default function NovaCarga() {
  const nav = useNavigate();
  const [passo, setPasso] = useState(1);
  const [produto, setProduto] = useState('tomate');
  const [qtd, setQtd] = useState(800);
  const [rota, setRota] = useState('Caxito-Talatona');
  const [telefone, setTelefone] = useState('923000001');
  const [nome, setNome] = useState('Tia Esperança');
  const [foto, setFoto] = useState<string | undefined>();
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  async function onFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const comp = await imageCompression(f, { maxSizeMB: 0.15, maxWidthOrHeight: 800, useWebWorker: true });
      const reader = new FileReader();
      reader.onload = () => setFoto(String(reader.result));
      reader.readAsDataURL(comp);
    } catch {
      setErro('Não consegui comprimir a foto. Tente outra.');
    }
  }

  async function criar() {
    setErro('');
    setOk('');
    setAEnviar(true);
    try {
      const r = await api.criarOferta({ produto, qtd, rota, agregadora_id: telefone, nome, foto_base64: foto });
      // Guarda telefone para "minhas cargas"
      localStorage.setItem('kolha_tel', telefone);
      setOk(`Carga criada! Você é a ${r.fila_posicao}ª na fila (${r.fila_kg}kg juntos). Faltam ${r.falta_para_fechar}kg para fechar.`);
      setTimeout(() => nav('/minhas-cargas'), 1600);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falhou. Sem rede? A carga ficou salva aqui.');
      // Offline: guarda local
      try {
        const pend = JSON.parse(localStorage.getItem('kolha_pendentes') ?? '[]');
        pend.push({ produto, qtd, rota, agregadora_id: telefone, nome, criado: Date.now() });
        localStorage.setItem('kolha_pendentes', JSON.stringify(pend));
      } catch { /* ignora */ }
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 20 }}>Criar Carga — passo {passo} de 3</strong>
          <button onClick={() => nav(-1)} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {[1, 2, 3].map((p) => (
            <div key={p} style={{ flex: 1, height: 8, borderRadius: 6, background: p <= passo ? '#E63946' : '#e7e0c8' }} />
          ))}
        </div>
      </div>

      {passo === 1 && (
        <div className="card">
          <strong>1. Qual é o produto?</strong>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            {PRODUTOS.map((p) => (
              <button
                key={p.id}
                onClick={() => { setProduto(p.id); setPasso(2); }}
                style={{
                  padding: 16, borderRadius: 12, border: produto === p.id ? '3px solid #E63946' : '2px solid #F4F1DE',
                  background: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', minHeight: 64,
                }}
              >
                <span style={{ fontSize: 26 }}>{p.emoji}</span> {p.nome}
              </button>
            ))}
          </div>
          {(produto === 'banana' || produto === 'manga') && (
            <p style={{ color: '#9B2226', marginTop: 10 }}>Fruta só viaja com fruta — vamos fazer um caminhão só de fruta. 🍌</p>
          )}
        </div>
      )}

      {passo === 2 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <strong>2. Quantos kg?</strong>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '16px 0' }}>
            <button onClick={() => setQtd((q) => Math.max(50, q - 100))} style={{ width: 56, height: 56, borderRadius: 12, fontSize: 24, border: '2px solid #F4F1DE', background: '#fff', cursor: 'pointer' }}><Minus /></button>
            <div style={{ fontSize: 40, fontWeight: 800, minWidth: 160 }}>{qtd}kg</div>
            <button onClick={() => setQtd((q) => Math.min(3500, q + 100))} style={{ width: 56, height: 56, borderRadius: 12, fontSize: 24, border: '2px solid #F4F1DE', background: '#fff', cursor: 'pointer' }}><Plus /></button>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
            {[100, 500, 1000].map((v) => (
              <button key={v} onClick={() => setQtd(v)} style={{ padding: '10px 16px', borderRadius: 10, border: '2px solid #F4F1DE', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>{v}kg</button>
            ))}
          </div>
          <div style={{ fontSize: 13, color: '#264653' }}>Mínimo por carga: 50kg · Caminhão leva 3500kg</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn-primary btn-borda" onClick={() => setPasso(1)}>Voltar</button>
            <button className="btn-primary btn-folha" onClick={() => setPasso(3)}>Continuar</button>
          </div>
        </div>
      )}

      {passo === 3 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <strong>3. Rota + seus dados</strong>
          {ROTAS.map((r) => (
            <button
              key={r}
              onClick={() => setRota(r)}
              style={{
                padding: 14, borderRadius: 12, textAlign: 'left', fontWeight: 700, fontSize: 16,
                border: rota === r ? '3px solid #2A9D8F' : '2px solid #F4F1DE', background: '#fff', cursor: 'pointer',
              }}
            >
              📍 {r.replace('-', ' → ')} {rota === r && <Check style={{ display: 'inline' }} size={16} />}
            </button>
          ))}
          <label style={{ fontSize: 14, fontWeight: 600 }}>Seu telefone (é o seu login)</label>
          <input className="input-grande" value={telefone} onChange={(e) => setTelefone(e.target.value)} inputMode="tel" placeholder="923000001" />
          <label style={{ fontSize: 14, fontWeight: 600 }}>Seu nome</label>
          <input className="input-grande" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Tia Esperança" />
          <label style={{ fontSize: 14, fontWeight: 600 }}>Foto da carga (opcional)</label>
          <label style={{ border: '2px dashed #F4A261', borderRadius: 12, padding: 16, textAlign: 'center', cursor: 'pointer' }}>
            <Camera style={{ display: 'inline' }} size={20} /> {foto ? 'Foto pronta ✓ — trocar' : 'Tirar foto / escolher'}
            <input type="file" accept="image/*" capture="environment" hidden onChange={onFoto} />
          </label>
          {foto && <img src={foto} alt="carga" style={{ width: '100%', borderRadius: 12 }} />}
          {erro && <div style={{ color: '#9B2226', fontWeight: 600 }}>{erro}</div>}
          {ok && <div style={{ color: '#2A9D8F', fontWeight: 700, fontSize: 18 }}>🎉 {ok}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary btn-borda" onClick={() => setPasso(2)}>Voltar</button>
            <button className="btn-primary" disabled={aEnviar} onClick={criar}>
              {aEnviar ? 'A criar...' : `Criar Minha Carga de ${qtd}kg`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
