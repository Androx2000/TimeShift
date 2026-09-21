document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Setup Auth & UI
    const tsUser = sessionStorage.getItem('ts_user') || localStorage.getItem('ts_user');
    const tsName = sessionStorage.getItem('ts_name') || localStorage.getItem('ts_name');
    const tsCargo = sessionStorage.getItem('ts_cargo') || localStorage.getItem('ts_cargo');

    if (!tsUser) {
        window.location.replace('index.html');
        return;
    }

    if (tsName) {
        const userNameEl = document.getElementById('user-name');
        const userRoleEl = document.getElementById('user-role-label');
        const userAvatarEl = document.getElementById('user-avatar');

        if (userNameEl) userNameEl.textContent = tsName;
        if (userRoleEl) userRoleEl.textContent = tsCargo || 'Empleado';
        if (userAvatarEl) {
            userAvatarEl.src = `https://api.dicebear.com/10.x/pixelbot/svg?seed=${encodeURIComponent(tsName)}&backgroundColor=e2e8f0`;
        }
    }

    // 2. Simple Clock
    function updateClock() {
        const now = new Date();
        const clockEl = document.getElementById('live-clock');
        const dateEl = document.getElementById('live-date');
        if (clockEl) {
            clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 3. State Management & Real-time Sync
    const deptMap = {
        'jalvarado': 'Dirección',
        'cgerente': 'Administración',
        'aruiz': 'Asesoría Legal',
        'mportillo': 'Asesoría Legal',
        'jhenriquez': 'Asesoría Legal',
        'lcastro': 'Asesoría Legal',
        'rflores': 'Recepción',
        'ppineda': 'Contabilidad',
        'esantos': 'Operaciones'
    };

    let employees = JSON.parse(localStorage.getItem('ts_employees')) || [];
    let myEmp = employees.find(e => e.email && e.email.toLowerCase().startsWith(tsUser.toLowerCase() + '@'));

    if (!myEmp) {
        const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id || 0)) + 1 : 1;
        myEmp = {
            id: newId,
            name: tsName || tsUser,
            email: `${tsUser}@timeshift.com`,
            department: deptMap[tsUser] || 'Operaciones',
            role: tsCargo || 'Empleado',
            shift: '08:00 - 17:00',
            state: 'Disponible',
            colorId: 'available',
            time: '00:00:00'
        };
        employees.push(myEmp);
        localStorage.setItem('ts_employees', JSON.stringify(employees));
    }

    const stateHeading = document.getElementById('current-state-heading');
    const stateTimerDisplay = document.getElementById('state-timer-display');
    const auxButtons = document.querySelectorAll('.aux-btn');
    const historyContainer = document.getElementById('history-rows-container');
    const historyBadge = document.getElementById('history-counter-badge');

    // Local daily history for the portal view
    const historyKey = `ts_daily_history_${tsUser}`;
    let dailyHistory = JSON.parse(localStorage.getItem(historyKey)) || [];

    let stateStartTime = new Date();
    const savedStartTime = localStorage.getItem(`ts_state_start_${tsUser}`);
    if (savedStartTime) {
        stateStartTime = new Date(savedStartTime);
    } else {
        localStorage.setItem(`ts_state_start_${tsUser}`, stateStartTime.toISOString());
    }

    // Seed initial daily history row if empty
    if (dailyHistory.length === 0) {
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        dailyHistory.push({ time: nowStr, state: myEmp.state, color: '#16A34A', duration: null });
        localStorage.setItem(historyKey, JSON.stringify(dailyHistory));
    }

    function renderDailyHistory() {
        if (!historyContainer) return;
        historyContainer.innerHTML = '';
        
        const reversed = [...dailyHistory].reverse();
        reversed.forEach((entry, index) => {
            const isLatest = (index === 0);
            let durationHtml = entry.duration || '-';
            
            if (isLatest) {
                if (myEmp && myEmp.colorId === 'end') {
                    durationHtml = '<span class="text-slate-400 font-bold">OFF</span>';
                } else {
                    durationHtml = '<span id="history-current-duration" class="text-emerald-500 font-bold">00:00:00</span>';
                }
            }

            const div = document.createElement('div');
            div.className = 'w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-slate-50 transition-colors';
            div.innerHTML = `
                <div class="w-1/4 sm:w-1/5 font-mono text-xs sm:text-sm font-semibold text-slate-700">${entry.time}</div>
                <div class="w-2/4 sm:w-2/5 flex items-center gap-2 sm:gap-3">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0" style="background-color: ${entry.color}"></span>
                    <span class="text-xs sm:text-sm font-semibold text-slate-800 truncate">${entry.state}</span>
                </div>
                <div class="w-1/4 sm:w-2/5 font-mono text-xs text-right">${durationHtml}</div>
            `;
            historyContainer.appendChild(div);
        });

        if (historyBadge) {
            historyBadge.textContent = `${dailyHistory.length} registros`;
        }
    }

    function updateStateUI(stateId, stateLabel, color) {
        auxButtons.forEach(btn => {
            if (btn.dataset.stateId === stateId) {
                btn.classList.add('ring-2', 'ring-offset-2', `ring-[${color}]`, 'scale-[0.98]');
                btn.style.boxShadow = `0 0 15px ${color}80`;
            } else {
                btn.classList.remove('ring-2', 'ring-offset-2', 'scale-[0.98]');
                btn.style.boxShadow = 'none';
            }
        });

        if (stateHeading) {
            stateHeading.textContent = `TIEMPO EN ESTADO ACTUAL (${stateLabel})`;
            stateHeading.style.color = color;
        }
    }

    function syncEmployeeToStorage(timeOverride) {
        let currentEmps = JSON.parse(localStorage.getItem('ts_employees')) || [];
        const empIndex = currentEmps.findIndex(e => e.id === myEmp.id || (e.email && e.email.startsWith(tsUser + '@')));
        if (timeOverride !== undefined) {
            myEmp.time = timeOverride;
        }
        if (empIndex !== -1) {
            currentEmps[empIndex] = { ...currentEmps[empIndex], ...myEmp };
        } else {
            currentEmps.push(myEmp);
        }
        localStorage.setItem('ts_employees', JSON.stringify(currentEmps));
    }

    function parseTimeToMinutes(str) {
        if (!str || typeof str !== 'string') return 0;
        const cleanStr = str.trim().toLowerCase();
        const isPM = cleanStr.includes('pm') || cleanStr.includes('p. m.') || cleanStr.includes('p.m.');
        const isAM = cleanStr.includes('am') || cleanStr.includes('a. m.') || cleanStr.includes('a.m.');
        const match = cleanStr.match(/(\d{1,2}):(\d{2})/);
        if (!match) return 0;
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        if (isNaN(hours) || isNaN(minutes)) return 0;
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
        return hours * 60 + minutes;
    }

    function syncPunchRecord(stateLabel, stateId) {
        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();
        const nowH = now.getHours().toString().padStart(2, '0');
        const nowM = now.getMinutes().toString().padStart(2, '0');
        const nowTimeStr = `${nowH}:${nowM}`;

        let punches = JSON.parse(localStorage.getItem('ts_punches')) || [];
        let punch = punches.find(p => p.empId === myEmp.id && p.date === todayStr);

        if (!punch) {
            const newPunchId = punches.length > 0 ? Math.max(...punches.map(p => p.id || 0)) + 1 : 1;
            punch = {
                id: newPunchId,
                empId: myEmp.id,
                date: todayStr,
                checkin: nowTimeStr,
                breakDuration: '00:00',
                checkout: (stateId === 'end') ? nowTimeStr : '--:--',
                effective: 'En turno',
                status: 'Puntual',
                notes: `Inicio en: ${stateLabel}`
            };
            punches.push(punch);
        } else {
            if (stateId === 'end') {
                punch.checkout = nowTimeStr;
                punch.status = 'Puntual';
                punch.notes = 'Turno finalizado';
                try {
                    const inMinutes = parseTimeToMinutes(punch.checkin);
                    const outMinutes = parseTimeToMinutes(nowTimeStr);
                    const diffMinutes = Math.max(0, outMinutes - inMinutes);
                    const effH = Math.floor(diffMinutes / 60).toString().padStart(2, '0');
                    const effM = (diffMinutes % 60).toString().padStart(2, '0');
                    punch.effective = `${effH}:${effM}`;
                } catch(e) {
                    punch.effective = '08:00';
                }
            } else {
                punch.notes = `Estado: ${stateLabel}`;
            }
        }
        localStorage.setItem('ts_punches', JSON.stringify(punches));
    }

    function changeState(stateId, stateLabel, color) {
        if (myEmp.colorId === stateId) return;

        const now = new Date();
        
        // Update duration of the PREVIOUS state if exists
        if (dailyHistory.length > 0) {
            const diff = Math.floor((now - stateStartTime) / 1000);
            const h = Math.floor(diff / 3600).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            dailyHistory[dailyHistory.length - 1].duration = `${h}:${m}:${s}`;
        }

        // Reset timer
        stateStartTime = now;
        localStorage.setItem(`ts_state_start_${tsUser}`, stateStartTime.toISOString());

        // Update Employee object
        myEmp.state = stateLabel;
        myEmp.colorId = stateId;
        myEmp.time = (stateId === 'end') ? '00:00:00' : '00:00:00';

        // Add to daily history (new state)
        const nowStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        dailyHistory.push({ time: nowStr, state: stateLabel, color: color, duration: null });
        localStorage.setItem(historyKey, JSON.stringify(dailyHistory));

        // Sync to ts_employees and ts_punches
        syncEmployeeToStorage('00:00:00');
        syncPunchRecord(stateLabel, stateId);

        updateStateUI(stateId, stateLabel, color);
        renderDailyHistory();
    }

    // Attach click events
    auxButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            changeState(btn.dataset.stateId, btn.dataset.stateLabel, btn.dataset.color);
        });
    });

    // Timer Logic
    function formatTimeDiff(start) {
        const diff = Math.floor((new Date() - start) / 1000);
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    setInterval(() => {
        let timeStr = formatTimeDiff(stateStartTime);
        
        if (myEmp && myEmp.colorId === 'end') {
            timeStr = '--:--:--';
        }

        if (stateTimerDisplay) {
            stateTimerDisplay.textContent = timeStr;
        }

        const historyDurDisplay = document.getElementById('history-current-duration');
        if (historyDurDisplay && myEmp.colorId !== 'end') {
            historyDurDisplay.textContent = timeStr;
        }
        
        // Background sync to localStorage for the Dashboard to read live!
        if (myEmp) {
            const timeToSync = (myEmp.colorId === 'end') ? '00:00:00' : timeStr;
            syncEmployeeToStorage(timeToSync);
        }
    }, 1000);

    // Initial sync and punch record
    syncEmployeeToStorage();
    syncPunchRecord(myEmp.state, myEmp.colorId);

    // Initial Render
    let activeBtn = Array.from(auxButtons).find(b => b.dataset.stateId === myEmp.colorId);
    if (activeBtn) {
        updateStateUI(myEmp.colorId, activeBtn.dataset.stateLabel, activeBtn.dataset.color);
    }
    renderDailyHistory();
});
