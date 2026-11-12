import React, { useState } from 'react';
import { entriesFromCsv, entriesFromJson, planImport, reportToMarkdown } from '../poi/importer.js';
import { TEMPLATE_HEADERS } from '../poi/template.js';
import { toCsv } from '../poi/csv.js';
import { REGIONS } from '../poi/geo.js';
import { newPoiId } from '../poi/schema.js';
import { isStaff } from '../poi/access.js';
import { poiStore, usePoiRuntime, setRole, DEMO_ROLES_ENABLED } from '../poi/runtime.js';
import seedCsv from '../../data/poi/seed_collection.csv?raw';
import { PoiCard, StatusChip } from './PoiCard.jsx';

const NS = 'handover-2026-11';

function download(name, text, type = 'text/csv;charset=utf-8') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function PoiCollectView({ onBack, onOpenMap }) {
  const { role, actor, pois, mutate } = usePoiRuntime();
  const [text, setText] = useState('');
  const [format, setFormat] = useState('csv');
  const [namespace, setNamespace] = useState(NS);
  const [plan, setPlan] = useState(null);
  const [dups, setDups] = useState({});
  const [accept, setAccept] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [sel, setSel] = useState(null);
  const [draft, setDraft] = useState({ en: '', zh: '', state: '' });
  const [saveMsg, setSaveMsg] = useState('');

  if (!isStaff(role)) {
    return (
      <div className="poi-screen"><h1>Collect &amp; review</h1>
        <p>Signed-in drivers only. Open the itinerary builder, sign in, then return here.</p>
        {DEMO_ROLES_ENABLED && <button type="button" className="btn-primary" onClick={() => setRole('driver')}>Continue as driver (dev demo)</button>}{' '}
        <button type="button" className="btn-subtle" onClick={onBack}>Back</button></div>
    );
  }

  function check(src = text, fmt = format) {
    setError(''); setResult(null); setDups({}); setAccept({});
    try {
      const entries = fmt === 'json' ? entriesFromJson(src) : entriesFromCsv(src);
      setPlan(planImport(entries, poiStore.list(), { namespace }));
      setText(src);
    } catch (e) { setPlan(null); setError(`Could not read the file: ${e.message}`); }
  }
  function apply() {
    const confirmDuplicates = Object.keys(dups).filter((k) => dups[k]);
    const resolutions = {};
    Object.entries(accept).forEach(([cand, paths]) => { const list = Object.keys(paths).filter((p) => paths[p]); if (list.length) resolutions[cand] = { accept: list }; });
    const r = mutate(() => poiStore.applyImport(plan, actor, { confirmDuplicates, resolutions, rawText: text, format }));
    if (!r.ok) { setError(r.error); return; }
    setResult(r.report); setPlan(null);
  }
  function saveDraft(e) {
    e.preventDefault();
    setSaveMsg('Saving…');
    const r = mutate(() => poiStore.save({ id: newPoiId(), status: 'draft', names: { en: draft.en, zh: draft.zh }, location: { state: draft.state } }, actor));
    setSaveMsg(r.ok ? 'Draft saved.' : `Not saved: ${r.error}`);
    if (r.ok) setDraft({ en: '', zh: '', state: '' });
  }
  const shown = plan || result;
  const poiSel = sel && pois.find((p) => p.id === sel);

  return (
    <div className="poi-screen">
      <header className="poi-top">
        <div><span className="operator-badge">POI COLLECTION</span><h1>Collect, import &amp; review</h1>
          <p className="poi-muted">Imports are always drafts / needs-review. Nothing is overwritten or merged without your confirmation.</p></div>
        <div className="poi-btnrow"><button type="button" className="btn-secondary" onClick={onOpenMap}>🗺 Master map</button>
          <button type="button" className="btn-subtle" onClick={onBack}>✕ Close</button></div>
      </header>

      <section className="operator-section-card">
        <h3>1. Import</h3>
        <div className="poi-btnrow">
          <button type="button" className="btn-secondary" onClick={() => { setFormat('csv'); check(seedCsv, 'csv'); }}>Load starter collection (39 rows)</button>
          <button type="button" className="btn-subtle" onClick={() => download('poi_collection_template.csv', '\uFEFF' + toCsv(TEMPLATE_HEADERS, []))}>Download blank CSV template</button>
        </div>
        <div className="form-group"><label className="form-label" htmlFor="imp-file">Choose a CSV or JSON file</label>
          <input id="imp-file" type="file" accept=".csv,.json,text/csv,application/json" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const fmt = f.name.toLowerCase().endsWith('.json') ? 'json' : 'csv'; setFormat(fmt); check(await f.text(), fmt);
          }} /></div>
        <div className="form-group"><label className="form-label" htmlFor="imp-ns">Import namespace (part of each stable ID; keep the same for re-imports)</label>
          <input id="imp-ns" className="form-input" value={namespace} onChange={(e) => setNamespace(e.target.value)} /></div>
        {error && <div className="poi-error" role="alert">{error}</div>}
        {shown && (
          <div>
            <h4>{result ? 'Import report (applied)' : 'Dry run – nothing changed yet'}</h4>
            <p role="status">Total {shown.summary.total} · new {shown.summary.imported} · updated {shown.summary.updated || 0} · skipped {shown.summary.skipped} · conflicting {shown.summary.conflicting} · held as possible duplicates {shown.summary.held} · failed {shown.summary.failed}</p>
            <div className="poi-tablewrap"><table className="poi-table"><thead><tr><th>Row</th><th>Name</th><th>Result</th><th>Notes / decisions</th></tr></thead><tbody>
              {shown.items.map((i) => {
                const key = i.candidateId || i.row; const act = i.finalAction || i.action;
                return (<tr key={i.row}><td>{i.row}</td><td>{i.name}</td><td>{act}</td><td>
                  {i.errors.map((m, n) => <div key={n} className="poi-error">{m}</div>)}
                  {i.warnings.map((m, n) => <div key={n} className="poi-muted">{m}</div>)}
                  {i.matches.map((m) => <div key={m.poiId} className="poi-warn">Matches “{m.name}” ({m.reason}, {Math.round(m.score * 100)}%)</div>)}
                  {!result && i.action === 'held_duplicate' && <label><input type="checkbox" checked={!!dups[key]} onChange={(e) => setDups({ ...dups, [key]: e.target.checked })} /> Create anyway as a flagged separate record</label>}
                  {!result && i.action === 'update_proposed' && i.changes.map((c) => (
                    <label key={c.path} className="poi-block"><input type="checkbox" checked={!!accept[key]?.[c.path]} onChange={(e) => setAccept({ ...accept, [key]: { ...accept[key], [c.path]: e.target.checked } })} /> {c.kind} <code>{c.path}</code>: {JSON.stringify(c.from)} → {JSON.stringify(c.to)}</label>))}
                </td></tr>);
              })}</tbody></table></div>
            <div className="poi-btnrow">
              {plan && <button type="button" className="btn-primary" onClick={apply}>Apply import</button>}
              <button type="button" className="btn-secondary" onClick={() => download('import-report.md', reportToMarkdown(shown, { applied: !!result }), 'text/markdown;charset=utf-8')}>Download report</button>
            </div>
          </div>
        )}
      </section>

      <section className="operator-section-card">
        <h3>2. Quick draft (only a name is required)</h3>
        <form onSubmit={saveDraft} className="poi-filters">
          <input className="form-input" aria-label="English name" placeholder="English name" value={draft.en} onChange={(e) => setDraft({ ...draft, en: e.target.value })} />
          <input className="form-input" aria-label="Chinese name" placeholder="中文名称" value={draft.zh} onChange={(e) => setDraft({ ...draft, zh: e.target.value })} />
          <select className="form-input" aria-label="State" value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })}><option value="">State unknown</option>{REGIONS.map((r) => <option key={r.id}>{r.en}</option>)}</select>
          <button type="submit" className="btn-secondary">Save draft</button>
        </form>
        <p role="status" className="poi-muted">{saveMsg}</p>
      </section>

      <section className="operator-section-card">
        <h3>3. Review list ({pois.length})</h3>
        {pois.length === 0 && <p className="poi-muted">Empty. Load the starter collection above.</p>}
        <ul className="poi-list">{pois.map((p) => (
          <li key={p.id}><button type="button" onClick={() => setSel(p.id)}><StatusChip status={p.status} /> {p.names.en || p.names.zh} <span className="poi-muted">{p.location.state || 'state unknown'}{p.relations.possibleDuplicateIds.length ? ' · possible duplicate' : ''}</span></button></li>))}</ul>
        {poiSel && <PoiCard poi={poiSel} role={role} onClose={() => setSel(null)} onChange={() => mutate(() => {})} />}
      </section>
    </div>
  );
}
