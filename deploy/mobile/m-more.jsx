/* m-more.jsx — More grid + tool host → window.MMore */
(function () {
  const { Icon } = window.MUI;

  const TOOLS = [
    { key: 'inventory',   name: 'Inventory',       icon: 'inventory' },
    { key: 'coupons',     name: 'Coupons',         icon: 'tag' },
    { key: 'payments',    name: 'Payments',        icon: 'card' },
    { key: 'mealplanner', name: 'Meal Planner',    icon: 'food' },
    { key: 'macros',      name: 'Macros',          icon: 'dollar' },
    { key: 'builder',     name: 'Workout Builder', icon: 'dumbbell' },
    { key: 'recipes',     name: 'Recipes',         icon: 'recipe' },
  ];

  const TOOL_TITLES = {
    inventory: 'Inventory', coupons: 'Coupons', payments: 'Payments',
    mealplanner: 'Meal Planner', macros: 'Macros Calculator',
    builder: 'Workout Builder', recipes: 'Recipes',
  };

  function ToolHost({ tool, sb, clients, onClose }) {
    let body = null;
    if (tool === 'inventory' && window.InventoryManager) body = <window.InventoryManager sb={sb} onBack={onClose} />;
    else if (tool === 'coupons' && window.CouponsManager) body = <window.CouponsManager sb={sb} onBack={onClose} />;
    else if (tool === 'payments' && window.PaymentSettings) body = <window.PaymentSettings sb={sb} onBack={onClose} />;
    else if (tool === 'mealplanner' && window.StandaloneMealPlanner) body = <window.StandaloneMealPlanner sb={sb} clients={clients} onBack={onClose} />;
    else if (tool === 'macros' && window.MacrosCalculator) body = <window.MacrosCalculator sb={sb} clients={clients} onBack={onClose} />;
    else if (tool === 'builder' && window.WorkoutBuilder) body = <window.WorkoutBuilder sb={sb} clients={clients} onBack={onClose} />;
    else if (tool === 'recipes' && window.RecipesDB) body = <window.RecipesDB sb={sb} onBack={onClose} />;
    else body = <div style={{ padding: 28, color: 'var(--ink-45)' }}>This tool failed to load.</div>;

    return (
      <div className="overlay">
        <header className="appbar">
          <button className="iconbtn" onClick={onClose} aria-label="Back"><Icon name="back" /></button>
          <div className="appbar__title">{TOOL_TITLES[tool] || 'Tool'}</div>
        </header>
        <div className="screen" style={{ padding: 14 }}>{body}</div>
      </div>
    );
  }

  function MoreScreen({ user, onTool, onSignOut }) {
    return (
      <div className="fade-in">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div className="avatar" style={{ width: 44, height: 44, flex: '0 0 44px' }}><Icon name="user" size={22} /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Admin</div>
            <div style={{ fontSize: 13, color: 'var(--ink-60)', wordBreak: 'break-all' }}>{user?.email || ''}</div>
          </div>
        </div>

        <div className="section-label">Tools</div>
        <div className="tile-grid">
          {TOOLS.map(t => (
            <button key={t.key} className="tile" onClick={() => onTool(t.key)}>
              <span className="tile__icon"><Icon name={t.icon} size={20} /></span>
              <span className="tile__name">{t.name}</span>
            </button>
          ))}
        </div>

        <div className="section-label" style={{ marginTop: 22 }}>Account</div>
        <div className="stack stack--tight">
          <a className="listcard" href="Admin.html" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="avatar" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--ink-60)' }}><Icon name="external" size={20} /></div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14.5 }}>Open desktop admin</div><div style={{ fontSize: 12.5, color: 'var(--ink-45)' }}>Full web version</div></div>
            <Icon name="chevron" size={18} style={{ color: 'var(--ink-30)' }} />
          </a>
          <button className="listcard" onClick={onSignOut} style={{ textAlign: 'left' }}>
            <div className="avatar" style={{ background: 'rgba(255,69,58,0.12)', color: 'var(--danger)' }}><Icon name="logout" size={20} /></div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--danger)' }}>Sign out</div></div>
          </button>
        </div>

        <div style={{ textAlign: 'center', color: 'var(--ink-30)', fontSize: 11.5, marginTop: 24 }}>
          PeakForm Bio · Mobile Admin
        </div>
      </div>
    );
  }

  window.MMore = { MoreScreen, ToolHost };
})();
