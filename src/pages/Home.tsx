import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PackagePlus, Truck } from 'lucide-react';
import { api, kz } from '../lib/api';
import TruckBar from '../components/TruckBar';

export default function Home() {
  const [rotas, setRotas] = useState<Awaited<ReturnType<typeof api.rotas>>['rotas']>([]);
  const [impacto, setImpacto] = useState<{ economia_total: number; ocupacao_media: number; caminhoes: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.rotas().catch(() => ({ rotas: [] })), api.impacto().catch(() => null)]).then(
      ([r, i]) => {
        setRotas(r.rotas);
        if (i) setImpacto({ economia_total: i.economia_total, ocupacao_media: i.ocupacao_media, caminhoes: i.caminhoes });
        setLoading(false);
      },
    );
  }, []);

  const destaque = rotas.find((r) => r.rota === 'Caxito-Talatona') ?? rotas[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card" style={{ background: '#E63946', borderColor: '#E63946', color: '#fff' }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Junte a sua carga, pague menos frete</div>
        <div style={{ margin: '6px 0 12px', opacity: 0.95 }}>
          {impacto ? (
            <>Já poupámos {kz(impacto.economia_total)} em {impacto.caminhoes} caminhões cheios. Economize até 40% agrupando com outras tias.</>
          ) : (
            <>Economize até 40% agrupando a sua carga com outras tias no mesmo caminhão.</>
          )}
        </div>
        <Link to="/nova" style={{ textDecoration: 'none' }}>
          <button className="btn-primary btn-branco" style={{ maxWidth: 400 }}>
            <PackagePlus size={20} /> Criar Minha Carga
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 140 }} />
      ) : destaque ? (
        <div className="card">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <Truck size={20} />
            <strong style={{ fontSize: 18 }}>{destaque.rota.replace('-', ' → ')}</strong>
          </div>
          <TruckBar kg={destaque.kg_acumulado} />
          <div style={{ marginTop: 8, fontSize: 14, color: '#264653' }}>
            {destaque.kg_acumulado.toLocaleString('pt-AO')}kg acumulados · {destaque.qtd_tias} tias na fila · {destaque.qtd_ofertas} cargas
          </div>
          <Link to="/minhas-cargas" style={{ textDecoration: 'none' }}>
            <button className="btn-primary btn-borda" style={{ marginTop: 12 }}>Ver cargas na fila</button>
          </Link>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>🚚</div>
          <p><strong>Nenhuma carga hoje em Caxito-Talatona. Seja a primeira tia!</strong></p>
          <Link to="/nova" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ marginTop: 8 }}>Criar Minha Carga</button>
          </Link>
        </div>
      )}

      <div className="card">
        <strong>Como funciona (3 cliques)</strong>
        <ol style={{ paddingLeft: 20, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>Crie a carga: produto + kg + rota + foto</li>
          <li>A Kolha junta com outras tias até encher o caminhão</li>
          <li>Receba o frete fechado e pague só a sua parte</li>
        </ol>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Link to="/impacto" style={{ flex: 1, textDecoration: 'none' }}>
            <button className="btn-primary btn-folha">Ver impacto</button>
          </Link>
          <Link to="/fretes" style={{ flex: 1, textDecoration: 'none' }}>
            <button className="btn-primary btn-borda">Ver fretes</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
