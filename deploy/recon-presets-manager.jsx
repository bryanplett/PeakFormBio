/* PeakFormBio Admin — Calculator Guide editor.
   Edit the recommendations the client Reconstitution Calculator shows
   (BAC water, dose, syringe, frequency, cycle). Saved to app_settings 'recon_presets'. */
(function () {
  const { useState, useEffect } = React;
  const rpCell = { padding: '8px 6px', borderBottom: '1px solid rgba(255,255,255,0.06)', verticalAlign: 'middle' };
  const rpHead = { ...rpCell, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.4)', textAlign: 'left', whiteSpace: 'nowrap' };
  const rpInput = { width: '100%', minWidth: 0, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#f5f5f7', font: 'inherit', fontSize: 13, padding: '7px 8px' };
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const withDose = (p) => { const d = window.reconDoseOf(p); return { ...p, doseAmt: d.amt, doseUnit: d.unit }; };

  const ReconPresetsManager = ({ onBack }) => {
    const [rows, setRows] = useState(() => (window.RECON_PRESETS || []).map(withDose));
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const [dirty, setDirty] = useState(false);

    useEffect(() => { if (window.loadReconPresets) window.loadReconPresets().then(l => l && setRows(l.map(withDose))); }, []);

    const upd = (id, patch) => { setRows(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r)); setDirty(true); };
    const remove = (id) => { if (confirm('Remove this product from the calculator?')) { setRows(rs => rs.filter(r => r.id !== id)); setDirty(true); } };
    const add = () => {
      const name = prompt('Product name and vial size, e.g. "BPC — 10mg" or "HCG — 5000IU"');
      if (!name) return;
      const m = name.match(/([\d.,]+)\s*(mg|iu)/i);
      if (!m) { alert('Include the vial amount, e.g. "— 10mg".'); return; }
      const vialUnit = m[2].toUpperCase() === 'IU' ? 'IU' : 'mg';
      const p = { id: slug(name), name: name.trim(), category: '', vial: parseFloat(m[1].replace(/,/g, '')), vialUnit, bac: 2, units: 10, doseText: '', frequency: '', cycle: '', syringe: 0.3 };
      setRows(rs => [withDose(p), ...rs]); setDirty(true);
    };

    const save = async () => {
      setStatus('Saving…');
      const out = rows.map(r => {
        const units = window.reconUnitsFor(+r.vial, r.vialUnit, +r.bac, +r.doseAmt, r.doseUnit);
        return { ...r, vial: +r.vial, bac: +r.bac, doseAmt: +r.doseAmt, syringe: +r.syringe, units: +units.toFixed(2) };
      });
      try {
        const res = await fetch('/api/admin/recon-presets', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('_pfb_token') },
          body: JSON.stringify({ presets: out }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Save failed');
        window.RECON_PRESETS = out; setRows(out); setDirty(false); setStatus('Saved. Clients see the new recommendations now.');
      } catch (e) { setStatus('Could not save: ' + e.message); }
    };

    const shown = rows.filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {onBack && <button className="btn-ghost" onClick={onBack}>← Back</button>}
            <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: '#f5f5f7' }}>Calculator Guide</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={add}>+ Add product</button>
            <button className="btn-primary" onClick={save} disabled={!dirty} style={{ opacity: dirty ? 1 : 0.5 }}>Save changes</button>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginBottom: 16, lineHeight: 1.5 }}>These are the recommendations clients see in the Reconstitution Calculator. Draw units are worked out for you. Syringe is the preferred size; if the dose won't fit, the calculator suggests the next size up.</p>
        {status && <div style={{ fontSize: 13, color: status.startsWith('Could') ? '#ff453a' : '#30d158', marginBottom: 12 }}>{status}</div>}
        <input className="field-input" placeholder="Search products…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 320, marginBottom: 12 }} />
        <div className="card" style={{ padding: 8, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead><tr>
              <th style={rpHead}>Product</th><th style={rpHead}>BAC water (mL)</th><th style={rpHead}>Dose</th><th style={rpHead}>Draw</th>
              <th style={rpHead}>Syringe</th><th style={rpHead}>Frequency</th><th style={rpHead}>Cycle</th><th style={rpHead}></th>
            </tr></thead>
            <tbody>
              {shown.map(r => {
                const units = window.reconUnitsFor(+r.vial, r.vialUnit, +r.bac, +r.doseAmt, r.doseUnit);
                const fits = units <= +r.syringe * 100;
                return (
                  <tr key={r.id}>
                    <td style={{ ...rpCell, fontSize: 13.5, color: '#f5f5f7', fontWeight: 500, whiteSpace: 'nowrap' }}>{r.name}</td>
                    <td style={{ ...rpCell, width: 100 }}><input style={rpInput} type="number" step="0.1" value={r.bac} onChange={e => upd(r.id, { bac: e.target.value })} /></td>
                    <td style={{ ...rpCell, width: 160 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input style={rpInput} type="number" step="any" value={r.doseAmt} onChange={e => upd(r.id, { doseAmt: e.target.value })} />
                        {r.vialUnit === 'IU' ? <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', alignSelf: 'center', padding: '0 4px' }}>IU</span>
                          : <select style={{ ...rpInput, width: 64 }} value={r.doseUnit} onChange={e => upd(r.id, { doseUnit: e.target.value })}><option value="mcg">mcg</option><option value="mg">mg</option></select>}
                      </div>
                    </td>
                    <td style={{ ...rpCell, fontSize: 13, whiteSpace: 'nowrap', color: fits ? 'rgba(255,255,255,0.75)' : '#ff9f0a' }}>{units ? `${+units.toFixed(1)} u` : '—'}</td>
                    <td style={{ ...rpCell, width: 96 }}>
                      <select style={rpInput} value={r.syringe} onChange={e => upd(r.id, { syringe: +e.target.value })}>
                        <option value={0.3}>0.3 mL</option><option value={0.5}>0.5 mL</option><option value={1}>1 mL</option>
                      </select>
                    </td>
                    <td style={rpCell}><input style={rpInput} value={r.frequency || ''} onChange={e => upd(r.id, { frequency: e.target.value })} /></td>
                    <td style={rpCell}><input style={rpInput} value={r.cycle || ''} onChange={e => upd(r.id, { cycle: e.target.value })} /></td>
                    <td style={{ ...rpCell, width: 36 }}><button onClick={() => remove(r.id)} title="Remove" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16, padding: 6 }}>×</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  window.ReconPresetsManager = ReconPresetsManager;
})();
