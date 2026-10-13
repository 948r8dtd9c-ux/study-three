(() => {
  'use strict';

  const DATA_KEY = 'study3.data.v1'; // Deliberately different from math91 keys.
  const THEME_KEY = 'study3.theme.v1';
  const APP_ID = 'study-three-pwa';
  const SUBJECTS = {
    physics: { label: '物理', english: 'PHYSICS' },
    english: { label: '英語', english: 'ENGLISH' },
    chemistry: { label: '化学', english: 'CHEMISTRY' }
  };
  const IDS = Object.keys(SUBJECTS);
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function defaultData() {
    return { version: 1, counts: { physics: 20, english: 20, chemistry: 20 }, tasks: { physics: {}, english: {}, chemistry: {} } };
  }

  function normalizedData(raw) {
    if (!raw || typeof raw !== 'object' || !raw.counts || !raw.tasks) throw new Error('データ形式が正しくありません。');
    const clean = defaultData();
    for (const id of IDS) {
      const n = Number(raw.counts[id]);
      if (!Number.isInteger(n) || n < 1 || n > 300 || !raw.tasks[id] || typeof raw.tasks[id] !== 'object') throw new Error('科目別のデータが不正です。');
      clean.counts[id] = n;
      for (const [key, entry] of Object.entries(raw.tasks[id])) {
        const idx = Number(key);
        if (!Number.isInteger(idx) || idx < 1 || idx > 300 || !entry || typeof entry !== 'object') continue;
        clean.tasks[id][idx] = { a: entry.a === true, b: entry.b === true, note: typeof entry.note === 'string' ? entry.note.slice(0, 120) : '' };
      }
    }
    return clean;
  }

  let data;
  try {
    const stored = localStorage.getItem(DATA_KEY);
    data = stored ? normalizedData(JSON.parse(stored)) : defaultData();
  } catch (error) {
    console.warn('Local data could not be loaded:', error);
    data = defaultData();
  }

  let subject = 'physics';
  let filter = 'all';
  let search = '';
  let toastTimer;
  let nextId = 1;

  function notify(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function save() {
    try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); return true; }
    catch (error) { console.error(error); notify('自動保存できません。容量やブラウザ設定を確認してください。'); return false; }
  }

  function item(id, n) { return data.tasks[id][n] || { a: false, b: false, note: '' }; }
  function stats(id) {
    let a = 0, b = 0, both = 0, notes = 0;
    const n = data.counts[id];
    for (let i = 1; i <= n; i++) {
      const t = item(id, i);
      if (t.a) a++;
      if (t.b) b++;
      if (t.a && t.b) both++;
      if (t.note.trim()) notes++;
    }
    return { count: n, a, b, both, notes, checks: a + b, percent: Math.round((a + b) * 100 / (n * 2)) };
  }

  function repaintStatistics() {
    const total = { count: 0, a: 0, b: 0, both: 0, notes: 0, checks: 0 };
    for (const id of IDS) {
      const s = stats(id);
      for (const key of Object.keys(total)) total[key] += s[key];
      $(`[data-stat="${id}-percent"]`).textContent = `${s.percent}%`;
      $(`[data-stat="${id}-caption"]`).textContent = `${s.checks} / ${s.count * 2} チェック`;
      $(`[data-stat="${id}-bar"]`).style.width = `${s.percent}%`;
    }
    const max = total.count * 2;
    const percent = Math.round(total.checks * 100 / max);
    $('#total-percent').textContent = percent;
    $('#total-bar').style.width = `${percent}%`;
    $('#all-meter').setAttribute('aria-valuemax', String(max));
    $('#all-meter').setAttribute('aria-valuenow', String(total.checks));
    $('#total-checks').textContent = `${total.checks} / ${max} チェック`;
    $('#total-done').textContent = `2周完了 ${total.both}問`;
    $('#all-first').textContent = `${total.a} / ${total.count}`;
    $('#all-second').textContent = `${total.b} / ${total.count}`;
    $('#all-notes').textContent = `${total.notes} 件`;
  }

  function renderItem(id, n) {
    const t = item(id, n);
    const element = document.createElement('article');
    element.className = `item${t.a && t.b ? ' is-complete' : ''}`;
    element.dataset.number = String(n);
    element.id = `${id}-${n}`;
    const status = t.a && t.b ? '2周完了 ✓' : t.a || t.b ? '進行中' : '未着手';
    element.innerHTML = `
      <div class="item-top">
        <div class="item-number">${String(n).padStart(2, '0')}<small>番</small></div>
        <span class="item-status">${status}</span>
        <div class="checks">
          <label class="check-label first"><input type="checkbox" data-round="a" aria-label="${SUBJECTS[id].label} ${n}番 1周目" ${t.a ? 'checked' : ''}><span>①</span></label>
          <label class="check-label second"><input type="checkbox" data-round="b" aria-label="${SUBJECTS[id].label} ${n}番 2周目" ${t.b ? 'checked' : ''}><span>②</span></label>
        </div>
      </div>
      <label class="note-wrap"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="m12 20-8 1 1-8L16.7 1.3a3 3 0 0 1 4.2 4.2Z"/><path d="m14 4 6 6"/></svg><span class="visually-hidden">${SUBJECTS[id].label} ${n}番の一言メモ</span><input class="note-input" type="text" maxlength="120" placeholder="一言メモ（例：電場の向きを再確認）" autocomplete="off" aria-label="${SUBJECTS[id].label} ${n}番の一言メモ"></label>`;
    element.querySelector('.note-input').value = t.note;
    return element;
  }

  function matches(id, n) {
    const t = item(id, n);
    if (filter === 'pending' && t.a && t.b) return false;
    if (filter === 'completed' && !(t.a && t.b)) return false;
    const q = search.trim().toLocaleLowerCase();
    if (q && !String(n).includes(q) && !t.note.toLocaleLowerCase().includes(q)) return false;
    return true;
  }

  function renderList() {
    const container = $('#items');
    const nodes = document.createDocumentFragment();
    let count = 0;
    for (let n = 1; n <= data.counts[subject]; n++) {
      if (!matches(subject, n)) continue;
      nodes.appendChild(renderItem(subject, n));
      count++;
    }
    container.replaceChildren(nodes);
    $('#visible-count').textContent = `${count}件を表示`;
    $('#empty-state').hidden = count !== 0;
  }

  function updateCurrentSubject() {
    const s = SUBJECTS[subject];
    $('#current-kicker').textContent = s.english;
    $('#subject-title').firstChild.textContent = `${s.label}の演習 `;
    $('#subject-count').textContent = `01 – ${String(data.counts[subject]).padStart(2, '0')}`;
    $('#item-count-input').value = data.counts[subject];
    $$('.subject-card').forEach((button) => {
      const active = button.dataset.subject === subject;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    renderList();
  }

  function changeSubject(id) {
    if (!SUBJECTS[id] || id === subject) return;
    subject = id;
    filter = 'all';
    search = '';
    $('#search-input').value = '';
    updateFilters();
    updateCurrentSubject();
    // Scroll to the list rather than leaving the user at their old subject's item number.
    $('#study-list').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function updateFilters() {
    $$('.filter').forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  $('#subject-cards').addEventListener('click', (event) => {
    const button = event.target.closest('[data-subject]');
    if (button) changeSubject(button.dataset.subject);
  });

  $('.filters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    filter = button.dataset.filter;
    updateFilters();
    renderList();
  });

  $('#search-input').addEventListener('input', (event) => { search = event.target.value; renderList(); });
  $('#clear-filters').addEventListener('click', () => {
    filter = 'all'; search = '';
    $('#search-input').value = '';
    updateFilters(); renderList();
  });

  $('#items').addEventListener('change', (event) => {
    const el = event.target;
    if (!(el instanceof HTMLInputElement) || !el.matches('[data-round]')) return;
    const article = el.closest('[data-number]');
    const n = Number(article.dataset.number);
    const row = data.tasks[subject][n] || { a: false, b: false, note: '' };
    row[el.dataset.round] = el.checked;
    data.tasks[subject][n] = row;
    save();
    repaintStatistics();
    article.classList.toggle('is-complete', row.a && row.b);
    article.querySelector('.item-status').textContent = row.a && row.b ? '2周完了 ✓' : row.a || row.b ? '進行中' : '未着手';
    if (filter !== 'all') renderList();
  });

  $('#items').addEventListener('input', (event) => {
    const el = event.target;
    if (!(el instanceof HTMLInputElement) || !el.classList.contains('note-input')) return;
    const n = Number(el.closest('[data-number]').dataset.number);
    const row = data.tasks[subject][n] || { a: false, b: false, note: '' };
    row.note = el.value;
    data.tasks[subject][n] = row;
    save();
    repaintStatistics();
    // The list is NOT recreated while typing so iPhone keyboard focus is preserved.
  });

  $('#items').addEventListener('focusout', (event) => {
    if (event.target.classList?.contains('note-input') && search.trim()) renderList();
  });

  $('#next-button').addEventListener('click', () => {
    const id = subject;
    let found = -1;
    for (let n = 1; n <= data.counts[id]; n++) {
      const t = item(id, n);
      if (!t.a || !t.b) { found = n; break; }
    }
    if (found === -1) { notify('この科目はすべて2周完了！'); return; }
    if (filter !== 'all' || search !== '') {
      filter = 'all'; search = ''; $('#search-input').value = '';
      updateFilters(); renderList();
    }
    const target = document.getElementById(`${id}-${found}`);
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    if (target) { target.animate([{ boxShadow:'0 0 0 3px var(--accent)' }, { boxShadow:'0 0 0 0px transparent' }], { duration: 1200 }); }
  });

  $('#count-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const num = Number($('#item-count-input').value);
    if (!Number.isInteger(num) || num < 1 || num > 300) { notify('問題数は1〜300の整数にしてね。'); return; }
    const old = data.counts[subject];
    if (num === old) { notify('問題数は変更されていません。'); return; }
    if (num < old && !confirm(`${SUBJECTS[subject].label}の表示を${old}問から${num}問に減らしますか？\n超えた番号の記録は削除せず、再び増やせば表示できます。`)) return;
    data.counts[subject] = num;
    save(); repaintStatistics(); updateCurrentSubject();
    notify(`${SUBJECTS[subject].label}を${num}問に変更しました。`);
  });

  $('#theme-toggle').addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    $('meta[name="theme-color"]').content = theme === 'dark' ? '#0e1422' : '#f5f7fb';
    $('#theme-toggle').setAttribute('aria-label', theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
    try { localStorage.setItem(THEME_KEY, theme); } catch (error) { console.error(error); }
  });

  $('#export-button').addEventListener('click', () => {
    const stamp = new Date().toLocaleDateString('sv-SE');
    const backup = { app: APP_ID, exportedAt: new Date().toISOString(), data };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `study-three-backup-${stamp}.json`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    notify('バックアップを保存しました。');
  });

  $('#import-button').addEventListener('click', () => $('#import-input').click());
  $('#import-input').addEventListener('change', async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1500000) throw new Error('ファイルが大きすぎます。');
      const backup = JSON.parse(await file.text());
      if (backup.app !== APP_ID) throw new Error('このアプリのバックアップではありません。');
      const imported = normalizedData(backup.data);
      if (!confirm('現在のチェック・メモ・問題数をバックアップの内容で上書きします。よろしいですか？')) return;
      data = imported;
      save(); repaintStatistics(); updateCurrentSubject();
      notify('バックアップを復元しました。');
    } catch (error) { alert(`復元できませんでした：${error.message}`); }
    finally { input.value = ''; }
  });

  $('#reset-button').addEventListener('click', () => {
    if (!confirm('3科目すべてのチェックとメモを消去しますか？問題数はそのまま残ります。取り消せません。')) return;
    if (!confirm('本当にすべて削除しますか？')) return;
    for (const id of IDS) data.tasks[id] = {};
    save(); repaintStatistics(); renderList(); notify('チェックとメモを消去しました。');
  });

  // If a system theme change happens and the user hasn't selected a manual theme, follow it.
  try {
    const media = matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', (event) => {
      if (localStorage.getItem(THEME_KEY)) return;
      const theme = event.matches ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
      $('meta[name="theme-color"]').content = theme === 'dark' ? '#0e1422' : '#f5f7fb';
    });
  } catch (error) { /* No matchMedia listener support; manual toggle still works. */ }

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('Offline mode unavailable:', error)));
  }

  repaintStatistics();
  updateCurrentSubject();
  $('#theme-toggle').setAttribute('aria-label', document.documentElement.dataset.theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
})();
