import { NavLink, Outlet } from 'react-router-dom';
import { Home, PackagePlus, Truck, BarChart3, Settings } from 'lucide-react';

const links = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/nova', label: 'Nova Carga', icon: PackagePlus },
  { to: '/fretes', label: 'Fretes', icon: Truck },
  { to: '/impacto', label: 'Impacto', icon: BarChart3 },
  { to: '/admin', label: 'Admin', icon: Settings },
];

export default function Layout() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', minHeight: '100vh', background: '#F4F1DE', paddingBottom: 84 }}>
      <header style={{ background: '#fff', borderBottom: '2px solid #F4F1DE', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🚚</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#8B4513' }}>Kolha</div>
            <div style={{ fontSize: 12, color: '#264653' }}>Carga junta, frete barato — Caxito → Luanda</div>
          </div>
        </div>
      </header>
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
      <nav
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff',
          borderTop: '2px solid #F4F1DE', display: 'flex', zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', width: '100%' }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              style={({ isActive }) => ({
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '10px 4px', textDecoration: 'none', fontSize: 11, fontWeight: 600,
                color: isActive ? '#E63946' : '#264653',
              })}
            >
              <l.icon size={20} />
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
