// portal-access.jsx — Admin controls for which client portal a client sees
// (peptide store / TRT-HRT program / both) and their hormone protocol text.

const PORTAL_TYPES = [
  { value: 'peptides', label: 'Peptide store' },
  { value: 'hormone',  label: 'TRT / HRT' },
  { value: 'both',     label: 'Both' },
];

const paSelectStyle = {
  background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8,
  padding: '6px 28px 6px 10px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', appearance: 'none',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23ffffff' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
};

const ProtocolModal = ({ sb, client, onClose, onSaved }) => {
  const [text, setText] = React.useState(client.hormone_protocol || '');
  const [busy, setBusy] = React.useState(false);
  const save = async () => {
    setBusy(true);
    const { error } = await sb.from('clients').update({ hormone_protocol: text }).eq('id', client.id);
    setBusy(false);
    if (error) { alert('Could not save: ' + error.message); return; }
    onSaved && onSaved(text); onClose();
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, width: '100%', maxWidth: 560, padding: 28, color: '#f5f5f7' }}>
        <div style={{ fontSize: 12, color: '#2997ff', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Hormone protocol</div>
        <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>{client.name || client.email}</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Shown on the client's "My protocol" section. Enter what their provider prescribed.</p>
        <textarea className="field-input" rows={8} value={text} onChange={e => setText(e.target.value)} style={{ width: '100%', resize: 'vertical' }}
          placeholder={'Medication & strength:\nDose:\nFrequency / days:\nInjection site:\nNext labs due:'} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save protocol'}</button>
        </div>
      </div>
    </div>
  );
};

// Table cell: portal dropdown + "Protocol" button for hormone clients.
const PortalAccessCell = ({ sb, client, onChanged }) => {
  const [value, setValue] = React.useState(client.portal_type || 'peptides');
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { setValue(client.portal_type || 'peptides'); }, [client.portal_type]);
  const change = async (v) => {
    const prev = value; setValue(v); setBusy(true);
    const { error } = await sb.from('clients').update({ portal_type: v }).eq('id', client.id);
    setBusy(false);
    if (error) { setValue(prev); alert('Could not update portal: ' + error.message); return; }
    onChanged && onChanged({ ...client, portal_type: v });
  };
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
      <select value={value} disabled={busy} onChange={e => change(e.target.value)} title="Which client portal this client sees"
        style={{ ...paSelectStyle, opacity: busy ? 0.6 : 1 }}>
        {PORTAL_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {value !== 'peptides' && (
        <button type="button" onClick={() => setOpen(true)} title="Edit hormone protocol"
          style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#2997ff', background: 'rgba(41,151,255,0.1)', border: '1px solid rgba(41,151,255,0.3)', borderRadius: 999, padding: '5px 11px', cursor: 'pointer' }}>
          {client.hormone_protocol ? 'Protocol ✓' : 'Protocol'}
        </button>
      )}
      {open && <ProtocolModal sb={sb} client={client} onClose={() => setOpen(false)} onSaved={(t) => onChanged && onChanged({ ...client, hormone_protocol: t })} />}
    </div>
  );
};

Object.assign(window, { PORTAL_TYPES, PortalAccessCell, ProtocolModal, paSelectStyle });
