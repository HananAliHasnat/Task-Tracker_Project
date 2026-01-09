// Small utility helpers
function pad(n) { return String(n).padStart(2, '0'); }
function displayDateShort(d) {
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}
function isoDateKey(d) {
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    return `${year}-${month}-${day}`; // sortable key
}

// Entries are stored in localStorage under key 'entries' as JSON map: { 'YYYY-MM-DD': { checkIn, checkOut, topics, updatedAt } }
function getEntries() {
    try {
        return JSON.parse(localStorage.getItem('entries') || '{}');
    } catch (e) {
        return {};
    }
}

function saveEntries(entries) {
    localStorage.setItem('entries', JSON.stringify(entries));
}

function updateEntryForDate(key, patch) {
    const entries = getEntries();
    const existing = entries[key] || {};
    entries[key] = Object.assign({}, existing, patch, { updatedAt: Date.now() });
    saveEntries(entries);
    renderHistory();
}

// ----- DATE -----
function loadDate() {
    const today = new Date();
    document.getElementById('currentDate').innerText = displayDateShort(today);
}

// ----- CHECK IN -----
document.getElementById('checkInBtn').addEventListener('click', function () {
    const time = new Date().toLocaleTimeString();
    localStorage.setItem('checkInTime', time); // backward compatibility
    document.getElementById('checkInTime').innerText = time;
    const key = isoDateKey(new Date());
    updateEntryForDate(key, { checkIn: time });
});

// ----- CHECK OUT -----
document.getElementById('checkOutBtn').addEventListener('click', function () {
    const time = new Date().toLocaleTimeString();
    localStorage.setItem('checkOutTime', time);
    document.getElementById('checkOutTime').innerText = time;
    const key = isoDateKey(new Date());
    updateEntryForDate(key, { checkOut: time });
});

// ----- TOPICS COVERED -----
document.getElementById('saveTopicsBtn').addEventListener('click', function () {
    const topics = document.getElementById('topicsInput').value.trim();
    localStorage.setItem('topicsCovered', topics);
    document.getElementById('savedTopics').innerText = topics || '--';
    const key = isoDateKey(new Date());
    updateEntryForDate(key, { topics: topics });
});

// ----- RENDER / HISTORY -----
function makeBadge(status) {
    if (status === 'checkin') return '<span class="badge badge--checkin">Check-in</span>';
    if (status === 'active') return '<span class="badge badge--active">Active</span>';
    if (status === 'checkout') return '<span class="badge badge--checkout">Checked-out</span>';
    return '';
}

function renderHistory() {
    const container = document.getElementById('history');
    container.innerHTML = '';
    const entries = getEntries();
    const keys = Object.keys(entries).sort((a,b)=> b.localeCompare(a));
    if (!keys.length) {
        container.innerHTML = '<p class="muted-small">No past entries yet. Your saved days will appear here.</p>';
        return;
    }

    keys.forEach(key => {
        const entry = entries[key] || {};
        const dateParts = key.split('-');
        const dateObj = new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`);
        const display = displayDateShort(dateObj);

        // Decide status
        let status = 'checkin';
        if (entry.checkOut) status = 'checkout';
        else if (entry.checkIn) status = 'active';

        const preview = entry.topics ? (entry.topics.length > 140 ? entry.topics.slice(0,140)+'…' : entry.topics) : '<span class="muted-small">No topics saved</span>';

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="card-title">${display}</div>
                    <div class="card-sub">${entry.checkIn || '--'} · ${entry.checkOut || '--'}</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
                    <div>${makeBadge(status)}</div>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-ghost" data-key="${key}" data-action="load">Load</button>
                    </div>
                </div>
            </div>
            <div>${preview}</div>
        `;

        // Load on click
        card.querySelector('[data-action="load"]').addEventListener('click', function () {
            loadEntryIntoForm(key);
        });

        container.appendChild(card);
    });
}

function loadEntryIntoForm(key) {
    const entries = getEntries();
    const entry = entries[key] || {};
    document.getElementById('topicsInput').value = entry.topics || '';
    document.getElementById('savedTopics').innerText = entry.topics || '--';
    document.getElementById('checkInTime').innerText = entry.checkIn || '--';
    document.getElementById('checkOutTime').innerText = entry.checkOut || '--';
    // also update displayed date if user wants to see
}

// ----- LOAD SAVED DATA (on init) -----
function loadSavedData() {
    const entries = getEntries();
    const todayKey = isoDateKey(new Date());
    const todayEntry = entries[todayKey];

    // prefer per-date entries; fall back to old single keys
    if (todayEntry) {
        document.getElementById('checkInTime').innerText = todayEntry.checkIn || '--';
        document.getElementById('checkOutTime').innerText = todayEntry.checkOut || '--';
        document.getElementById('savedTopics').innerText = todayEntry.topics || '--';
        document.getElementById('topicsInput').value = todayEntry.topics || '';
    } else {
        const checkIn = localStorage.getItem('checkInTime');
        const checkOut = localStorage.getItem('checkOutTime');
        const topics = localStorage.getItem('topicsCovered');
        if (checkIn) document.getElementById('checkInTime').innerText = checkIn;
        if (checkOut) document.getElementById('checkOutTime').innerText = checkOut;
        if (topics) { document.getElementById('savedTopics').innerText = topics; document.getElementById('topicsInput').value = topics; }
    }

    renderHistory();
}

// ----- INITIAL LOAD -----
loadDate();
loadSavedData();
