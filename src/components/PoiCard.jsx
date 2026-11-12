import React, { useState } from 'react';
import { canReview, canSeePrivate, isStaff, pinKind, publicView, snapshotPoi } from '../poi/access.js';
import { displayName } from '../poi/schema.js';
import { poiStore, privateStore, actorFor } from '../poi/runtime.js';
import { addPick } from '../data/itineraryPicks.js';

export const STATUS_META = {
  draft: { label: 'Draft', shape: '■', color: '#64748b' },
  needs_review: { label: 'Needs review', shape: '◆', color: '#d97706' },
  approved: { label: 'Approved', shape: '●', color: '#168A4A' },
  archived: { label: 'Archived', shape: '▲', color: '#334155' }
};

export function StatusChip({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return <span className="poi-chip" style={{ borderColor: m.color, color: m.color }}><span aria-hidden="true">{m.shape}</span> {m.label}</span>;
}

const ACT_LABEL = {
  farmTour: 'Farm tour', fruitTasting: 'Fruit tasting', fruitPicking: 'Fruit picking',
  herbPicking: 'Herb picking', durianTasting: 'Durian tasting', durianPicking: 'Durian picking'
};

function Checked({ label, item }) {
  if (!item?.text) return null;
  return (
    <p className="poi-row"><b>{label}:</b> {item.text}{' '}
      <span className="poi-muted">{item.checkedAt ? `(checked ${item.checkedAt})` : '(not dated – verify before relying on it)'}</span></p>
  );
}

function PrivatePanel({ poi, role, onChange }) {
  const existing = privateStore.get(poi.id, role);
  const [notes, setNotes] = useState(existing?.driverNotes || '');
  const [kind, setKind] = useState(existing?.commission?.kind || 'unknown');
  const [text, setText] = useState(existing?.commission?.text || '');
  const [msg, setMsg] = useState('');
  function save() {
    const r = privateStore.set(poi.id, { driverNotes: notes, commission: { kind, text } }, actorFor(role));
    setMsg(r.ok ? 'Saved privately.' : r.error);
    onChange?.();
  }
  return (
    <section className="poi-private" aria-label="Private driver notes (not shown to passengers)">
      <h4>🔒 Private – driver &amp; admin only</h4>
      <label className="form-label" htmlFor={`pn-${poi.id}`}>Driver notes</label>
      <textarea id={`pn-${poi.id}`} className="form-input poi-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <label className="form-label" htmlFor={`pc-${poi.id}`}>Commission arrangement</label>
      <select id={`pc-${poi.id}`} className="form-input" value={kind} onChange={(e) => setKind(e.target.value)}>
        <option value="unknown">Unknown</option><option value="percentage">Percentage</option>
        <option value="amount">Fixed amount</option><option value="text">Other (free text)</option>
      </select>
      {kind !== 'unknown' && (
        <input className="form-input" aria-label="Commission details" placeholder="Details as agreed" value={text} onChange={(e) => setText(e.target.value)} />
      )}
      {existing && <p className="poi-muted">Supplied by {existing.suppliedBy} on {existing.suppliedAt?.slice(0, 10)}</p>}
      <button type="button" className="btn-secondary" onClick={save}>Save private info</button>
      <span role="status" className="poi-muted"> {msg}</span>
    </section>
  );
}

export function PoiCard({ poi, role, lang = 'en', onClose, onChange, showAdd = true }) {
  const [note, setNote] = useState('');
  const staff = isStaff(role);
  const exact = pinKind(poi, role);
  const view = staff ? poi : publicView(poi);
  if (!view) return null;

  const name = displayName(poi, lang);
  const summary = (lang === 'zh' ? poi.summary.zh || poi.summary.en : poi.summary.en || poi.summary.zh);

  function setStatus(status) {
    const r = poiStore.setStatus(poi.id, status, actorFor(role));
    setNote(r.ok ? `Status: ${status}` : r.error);
    onChange?.();
  }
  function verifyCoords() {
    const today = new Date().toISOString().slice(0, 10);
    const r = poiStore.save({
      ...poi, location: { ...poi.location, coordinateStatus: 'verified', coordinateVerifiedAt: today, coordinateSource: poi.location.coordinateSource || 'reviewer check' }
    }, actorFor(role), { expectedVersion: poi.version });
    setNote(r.ok ? 'Coordinates marked verified.' : r.error);
    onChange?.();
  }
  function add() {
    const r = addPick(snapshotPoi(poi, new Date().toISOString()));
    setNote(!r.ok ? `Could not add: ${r.error}` : r.already ? 'Already in your itinerary list.' : `Added. ${r.count} in itinerary list.`);
  }

  return (
    <article className="poi-card" aria-label={`Details for ${name}`}>
      <header className="poi-card-head">
        <div>
          <h3>{name}</h3>
          {lang === 'en' && poi.names.zh && <div className="poi-zh" lang="zh">{poi.names.zh}</div>}
          {lang === 'zh' && poi.names.en && <div className="poi-muted">{poi.names.en}</div>}
        </div>
        {onClose && <button type="button" className="btn-subtle" onClick={onClose} aria-label="Close details">✕</button>}
      </header>
      <p>{staff && <StatusChip status={poi.status} />} {poi.category && <span className="poi-chip neutral">{poi.category}</span>}</p>
      <p className="poi-row"><b>Place:</b> {[poi.location.city, poi.location.state || 'State unknown'].filter(Boolean).join(', ')}
        {staff && poi.location.state && poi.location.stateBasis !== 'documented' && <span className="poi-muted"> (state not yet confirmed)</span>}</p>
      <p className="poi-row">
        {exact === 'exact' && <span>📍 Exact location verified{poi.location.coordinateVerifiedAt ? ` on ${poi.location.coordinateVerifiedAt}` : ''}.</span>}
        {exact === 'unconfirmed' && <span>❓ Coordinates reported by {poi.location.coordinateSource || 'a source'} but <b>not verified</b> – pin is provisional.</span>}
        {exact === 'none' && <span>No exact map location available{poi.location.locationNote ? ` – ${poi.location.locationNote}` : ''}.</span>}
      </p>
      {summary && <p>{summary}</p>}
      {poi.visit.durationMinutes != null && (
        <p className="poi-row"><b>Suggested visit:</b> {poi.visit.durationMinutes} min <span className="poi-muted">({poi.visit.durationBasis === 'sourced' ? 'from a source' : poi.visit.durationBasis === 'estimate' ? 'estimate' : 'basis unknown'})</span></p>
      )}
      <Checked label="Hours" item={poi.visit.hours} />
      <Checked label="Admission" item={poi.visit.admission} />
      <Checked label="Seasonality" item={poi.visit.seasonality} />
      <Checked label="Accessibility" item={poi.visit.accessibility} />
      {Object.entries(ACT_LABEL).some(([k]) => poi.activities[k] !== 'unknown') || poi.category === 'farm' ? (
        <div className="poi-row"><b>Activities:</b>{' '}
          {Object.entries(ACT_LABEL).map(([k, l]) => (
            <span key={k} className={`poi-chip act-${poi.activities[k]}`}>{l}: {poi.activities[k] === 'confirmed' ? 'yes' : poi.activities[k] === 'not_offered' ? 'no' : 'not confirmed'}</span>
          ))}
        </div>
      ) : null}
      {staff && poi.review.flags.length > 0 && <p className="poi-row poi-warn"><b>Needs checking:</b> {poi.review.flags.join(', ')}</p>}
      {staff && poi.review.notes && <p className="poi-row poi-muted"><b>Internal notes:</b> {poi.review.notes}</p>}
      {staff && poi.sources.length > 0 && (
        <details className="poi-row"><summary>Sources ({poi.sources.length})</summary>
          <ul>{poi.sources.map((s, i) => (
            <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a> : s.name} <span className="poi-muted">[{s.type}{s.accessedAt ? `, accessed ${s.accessedAt}` : ''}]</span>
              {s.notes && <div className="poi-muted">{s.notes}</div>}</li>))}</ul>
        </details>
      )}
      <div className="poi-actions">
        {staff && showAdd && poi.status !== 'archived' && <button type="button" className="btn-primary" onClick={add}>＋ Add to itinerary</button>}
        {canReview(role) && poi.status === 'needs_review' && <button type="button" className="btn-secondary" onClick={() => setStatus('approved')}>Approve</button>}
        {canReview(role) && poi.status !== 'archived' && <button type="button" className="btn-subtle" onClick={() => setStatus('archived')}>Archive</button>}
        {canReview(role) && poi.status === 'archived' && <button type="button" className="btn-secondary" onClick={() => setStatus('needs_review')}>Restore</button>}
        {canReview(role) && exact === 'unconfirmed' && <button type="button" className="btn-subtle" onClick={verifyCoords}>Mark coordinates verified</button>}
      </div>
      <p role="status" className="poi-muted">{note}</p>
      {canSeePrivate(role) && <PrivatePanel poi={poi} role={role} onChange={onChange} />}
    </article>
  );
}
