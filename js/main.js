// ============================================================
// ACE FACILITY DASHBOARD — main.js
// ============================================================

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ---- Auth guard ------------------------------------------
let currentUser = null;

async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.href = 'login.html'; return false; }
  currentUser = session.user;
  const initials = (currentUser.email || 'U').slice(0, 2).toUpperCase();
  document.getElementById('user-avatar').textContent = initials;
  return true;
}

async function signOut() {
  await sb.auth.signOut();
  location.href = 'login.html';
}

// ---- Tab routing -----------------------------------------
function switchTab(tab) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + tab).classList.add('active');
  document.querySelector('[data-tab="' + tab + '"]').classList.add('active');
  currentTab = tab;
  if (tab === 'overview')  loadOverview();
  if (tab === 'schedule')  loadSchedule();
  if (tab === 'members')   loadMembers();
  if (tab === 'billing')   loadBilling();
}

let currentTab = 'overview';

// ---- Dates -----------------------------------------------
let scheduleOffset = 0;
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function currentScheduleDate() {
  const d = new Date();
  d.setDate(d.getDate() + scheduleOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateLabel(d) {
  return DAY_NAMES[d.getDay()] + ', ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getDate();
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60)   return Math.round(diff) + 's ago';
  if (diff < 3600) return Math.round(diff / 60) + ' min ago';
  if (diff < 86400)return Math.round(diff / 3600) + ' hr ago';
  return Math.round(diff / 86400) + 'd ago';
}

function fmtMoney(cents) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  { bg: '#e6f0fb', fg: '#1a4a8f' },
  { bg: '#e8f5ee', fg: '#1a6b3c' },
  { bg: '#faeeda', fg: '#8b6914' },
  { bg: '#fbeaf0', fg: '#72243e' },
  { bg: '#fef0e6', fg: '#944a18' },
  { bg: '#eeedfe', fg: '#3c3489' },
];

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h += name.charCodeAt(i);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ---- OVERVIEW -------------------------------------------
async function loadOverview() {
  try {
    const [{ data: courts }, { data: bookings }, { data: members }, { data: invoices }] = await Promise.all([
      sb.from('courts').select('*'),
      sb.from('bookings').select('*').gte('created_at', new Date(Date.now() - 86400000 * 30).toISOString()),
      sb.from('members').select('*'),
      sb.from('invoices').select('*').gte('created_at', new Date(Date.now() - 86400000 * 30).toISOString()),
    ]);

    const revenue = (invoices || []).filter(i => i.status === 'paid').reduce((s, i) => s + i.amount_cents, 0);
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayBookings = (bookings || []).filter(b => new Date(b.starts_at) >= todayStart).length;

    document.getElementById('kpi-revenue').textContent   = '$' + Math.round(revenue / 100).toLocaleString();
    document.getElementById('kpi-members').textContent   = (members || []).length;
    document.getElementById('kpi-bookings').textContent  = todayBookings;
    document.getElementById('kpi-util').textContent      = courts
      ? Math.round(((courts.filter(c => c.status === 'booked').length) / courts.length) * 100) + '%'
      : '—';

    renderCourts(courts || []);
    renderActivity(bookings || [], members || [], invoices || []);
    renderRevChart();
  } catch (e) { console.error('Overview error', e); }
}

function renderCourts(courts) {
  const g = document.getElementById('court-grid');
  if (!courts.length) { g.innerHTML = '<div class="empty">No courts found.</div>'; return; }
  g.innerHTML = courts.map(c => `
    <div class="court-item ${c.status}" onclick="setCourtsStatus(${c.id}, '${c.status === 'available' ? 'booked' : 'available'}')">
      <div class="court-num">${c.name.replace('Court ', 'C')}</div>
      <div class="court-surface">${c.surface}</div>
      <div class="court-status">${c.status === 'maintenance' ? 'Maint.' : c.status.charAt(0).toUpperCase() + c.status.slice(1)}</div>
    </div>
  `).join('');
}

async function setCourtsStatus(id, status) {
  await sb.from('courts').update({ status }).eq('id', id);
}

function renderActivity(bookings, members, invoices) {
  const el = document.getElementById('activity-list');
  const items = [];
  bookings.slice(0, 3).forEach(b => items.push({ type: 'booking', text: 'Booking ' + b.status + ' — ' + (b.type || 'Court session'), time: b.created_at }));
  invoices.filter(i => i.status === 'paid').slice(0, 2).forEach(i => items.push({ type: 'payment', text: 'Payment received — ' + fmtMoney(i.amount_cents), time: i.created_at }));
  members.slice(0, 2).forEach(m => items.push({ type: 'new', text: 'Member registered — ' + m.full_name, time: m.joined_at }));
  items.sort((a, b) => new Date(b.time) - new Date(a.time));
  if (!items.length) { el.innerHTML = '<div class="empty">No recent activity.</div>'; return; }
  el.innerHTML = items.slice(0, 7).map(a => `
    <div class="activity-item">
      <div class="act-dot ${a.type}"></div>
      <div class="act-text">${a.text}</div>
      <div class="act-time">${timeAgo(a.time)}</div>
    </div>
  `).join('');
}

function renderRevChart() {
  const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
  const vals = [14200, 16800, 18500, 20100, 21900, 24180];
  const maxVal = Math.max(...vals);
  const c = document.getElementById('rev-chart');
  c.innerHTML = vals.map((v, i) => {
    const h = Math.max(4, Math.round((v / maxVal) * 82));
    return `<div class="bar-group">
      <div style="display:flex;align-items:flex-end;height:82px;">
        <div class="bar primary" style="height:${h}px;flex:1;"></div>
      </div>
      <div class="bar-label">${months[i]}</div>
    </div>`;
  }).join('');
}

// ---- SCHEDULE -------------------------------------------
async function loadSchedule() {
  const d = currentScheduleDate();
  document.getElementById('date-label').textContent = formatDateLabel(d);
  const end = new Date(d); end.setHours(23, 59, 59, 999);

  const tbody = document.getElementById('sched-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading…</td></tr>';

  const courtFilter = document.getElementById('court-filter').value;
  let query = sb.from('bookings')
    .select('*, courts(name, surface), members(full_name)')
    .gte('starts_at', d.toISOString())
    .lte('starts_at', end.toISOString())
    .order('starts_at');

  if (courtFilter !== 'all') query = query.eq('court_id', parseInt(courtFilter));

  const { data, error } = await query;
  if (error) { tbody.innerHTML = '<tr><td colspan="6" class="loading">Error loading schedule.</td></tr>'; return; }

  if (!data.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty">No bookings for this date.</td></tr>'; return; }

  tbody.innerHTML = data.map(row => {
    const t = new Date(row.starts_at);
    const hm = t.getHours().toString().padStart(2,'0') + ':' + t.getMinutes().toString().padStart(2,'0');
    const pillMap = { confirmed:'pill-confirmed', pending:'pill-pending', cancelled:'pill-cancelled', open:'pill-open' };
    const pill = pillMap[row.status] || 'pill-pending';
    const court = row.courts ? row.courts.name : 'Court ?';
    const member = row.members ? row.members.full_name : '—';
    return `<tr>
      <td style="font-family:var(--mono)">${hm}</td>
      <td>${court}</td>
      <td>${member}</td>
      <td>${row.type || '—'}</td>
      <td><span class="pill ${pill}">${row.status.charAt(0).toUpperCase()+row.status.slice(1)}</span></td>
      <td>
        ${row.status === 'pending' ? `<button class="btn-sm primary" onclick="confirmBooking('${row.id}')">Confirm</button>` : ''}
        ${row.status === 'confirmed' ? `<button class="btn-sm danger" onclick="cancelBooking('${row.id}')">Cancel</button>` : ''}
        ${row.status === 'cancelled' ? `<button class="btn-sm" onclick="restoreBooking('${row.id}')">Restore</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

async function confirmBooking(id) {
  await sb.from('bookings').update({ status: 'confirmed' }).eq('id', id);
  loadSchedule();
}
async function cancelBooking(id) {
  await sb.from('bookings').update({ status: 'cancelled' }).eq('id', id);
  loadSchedule();
}
async function restoreBooking(id) {
  await sb.from('bookings').update({ status: 'pending' }).eq('id', id);
  loadSchedule();
}

function changeDay(d) { scheduleOffset += d; loadSchedule(); }

// ---- NEW BOOKING MODAL ----------------------------------
let allCourts = [];
let allMembers = [];

async function openBookingModal() {
  const [{ data: courts }, { data: members }] = await Promise.all([
    sb.from('courts').select('*').neq('status', 'maintenance'),
    sb.from('members').select('*').order('full_name'),
  ]);
  allCourts  = courts  || [];
  allMembers = members || [];

  const cSel = document.getElementById('modal-court');
  cSel.innerHTML = allCourts.map(c => `<option value="${c.id}">${c.name} (${c.surface})</option>`).join('');

  const mSel = document.getElementById('modal-member');
  mSel.innerHTML = allMembers.map(m => `<option value="${m.id}">${m.full_name}</option>`).join('');

  const today = new Date(); today.setDate(today.getDate() + scheduleOffset);
  document.getElementById('modal-date').value = today.toISOString().slice(0, 10);

  document.getElementById('booking-modal').style.display = 'flex';
}

function closeBookingModal() {
  document.getElementById('booking-modal').style.display = 'none';
}

async function submitBooking() {
  const court_id   = document.getElementById('modal-court').value;
  const member_id  = document.getElementById('modal-member').value;
  const date       = document.getElementById('modal-date').value;
  const time       = document.getElementById('modal-time').value;
  const type       = document.getElementById('modal-type').value;
  const starts_at  = new Date(date + 'T' + time + ':00').toISOString();

  const { error } = await sb.from('bookings').insert({ court_id: parseInt(court_id), member_id, starts_at, type, status: 'confirmed' });
  if (error) { alert('Error: ' + error.message); return; }
  closeBookingModal();
  loadSchedule();
}

// ---- MEMBERS --------------------------------------------
let memberPlanFilter = 'all';
let memberSearch = '';

async function loadMembers() {
  const el = document.getElementById('member-list');
  el.innerHTML = '<div class="loading">Loading members…</div>';

  let query = sb.from('members').select('*').order('full_name');
  if (memberSearch) query = query.ilike('full_name', '%' + memberSearch + '%');
  if (memberPlanFilter !== 'all') query = query.eq('plan', memberPlanFilter);

  const { data, error } = await query;
  if (error) { el.innerHTML = '<div class="empty">Error loading members.</div>'; return; }
  if (!data.length) { el.innerHTML = '<div class="empty">No members found.</div>'; return; }

  el.innerHTML = data.map(m => {
    const col = avatarColor(m.full_name);
    const ini = initials(m.full_name);
    const joined = new Date(m.joined_at).getFullYear();
    return `<div class="member-card">
      <div class="member-av" style="background:${col.bg};color:${col.fg};">${ini}</div>
      <div class="member-info">
        <div class="member-name">${m.full_name}</div>
        <div class="member-meta">${m.email} · Member since ${joined}</div>
      </div>
      <div class="member-right">
        <span class="pill plan-${m.plan}">${m.plan}</span>
        <div style="font-size:12px;color:var(--text2);margin-top:4px;">${m.sessions_per_month} sessions/mo</div>
      </div>
    </div>`;
  }).join('');
}

function onMemberSearch(val) { memberSearch = val; loadMembers(); }
function onPlanFilter(val)   { memberPlanFilter = val; loadMembers(); }

// ---- ADD MEMBER MODAL -----------------------------------
function openMemberModal() {
  document.getElementById('member-modal').style.display = 'flex';
}
function closeMemberModal() {
  document.getElementById('member-modal').style.display = 'none';
}
async function submitMember() {
  const full_name = document.getElementById('m-name').value.trim();
  const email     = document.getElementById('m-email').value.trim();
  const plan      = document.getElementById('m-plan').value;
  if (!full_name || !email) { alert('Name and email are required.'); return; }
  const { error } = await sb.from('members').insert({ full_name, email, plan });
  if (error) { alert('Error: ' + error.message); return; }
  closeMemberModal();
  loadMembers();
}

// ---- BILLING --------------------------------------------
async function loadBilling() {
  const { data: invoices, error } = await sb.from('invoices')
    .select('*, members(full_name)')
    .order('created_at', { ascending: false });

  if (error) { return; }

  const paid    = (invoices || []).filter(i => i.status === 'paid').reduce((s, i) => s + i.amount_cents, 0);
  const outst   = (invoices || []).filter(i => i.status === 'outstanding').reduce((s, i) => s + i.amount_cents, 0);
  const overdue = (invoices || []).filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount_cents, 0);

  document.getElementById('rev-paid').textContent    = fmtMoney(paid);
  document.getElementById('rev-outst').textContent   = fmtMoney(outst);
  document.getElementById('rev-overdue').textContent = fmtMoney(overdue);

  const inv = document.getElementById('invoice-list');
  inv.innerHTML = (invoices || []).slice(0, 10).map(i => {
    const pillMap = { paid:'pill-paid', outstanding:'pill-outstanding', overdue:'pill-overdue' };
    const name = i.members ? i.members.full_name : 'Unknown';
    const date = new Date(i.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `<div class="invoice-row">
      <div>
        <div class="inv-name">${name}</div>
        <div class="inv-meta">${i.description || '—'} · ${date}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
        <span class="pill ${pillMap[i.status] || 'pill-outstanding'}">${i.status.charAt(0).toUpperCase()+i.status.slice(1)}</span>
        <span class="inv-amount">${fmtMoney(i.amount_cents)}</span>
      </div>
    </div>`;
  }).join('') || '<div class="empty">No invoices yet.</div>';
}

// ---- REALTIME -------------------------------------------
function startRealtime() {
  const dot = document.getElementById('rt-dot');

  sb.channel('courts-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'courts' }, payload => {
      dot.classList.add('live');
      if (currentTab === 'overview') loadOverview();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, payload => {
      dot.classList.add('live');
      if (currentTab === 'schedule') loadSchedule();
      if (currentTab === 'overview') loadOverview();
    })
    .subscribe(status => {
      dot.classList.toggle('live', status === 'SUBSCRIBED');
    });
}

// ---- BOOT -----------------------------------------------
async function boot() {
  const ok = await initAuth();
  if (!ok) return;
  startRealtime();
  loadOverview();

  // populate court filter dropdown
  const { data: courts } = await sb.from('courts').select('id, name');
  const sel = document.getElementById('court-filter');
  (courts || []).forEach(c => {
    const o = document.createElement('option');
    o.value = c.id; o.textContent = c.name;
    sel.appendChild(o);
  });
}

document.addEventListener('DOMContentLoaded', boot);
