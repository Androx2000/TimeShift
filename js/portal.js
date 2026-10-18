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

    const officialLabels = {
        available: 'Disponible',
        lunch: 'Lunch',
        break: 'Break',
        end: 'Salida'
    };
    const historicalLabels = {
        court: 'En Tribunal',
        meeting: 'Reunión con Cliente'
    };
    const stateHexColors = {
        available: '#00A669',
        lunch: '#64748B',
        break: '#8B5CF6',
        end: '#EF4444',
        court: '#1D3B8B',
        meeting: '#F59E0B'
    };

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
    } else {
        // Unificar únicamente nombres renombrados ('Almuerzo' -> 'Lunch', 'Fin de Turno' -> 'Salida')
        // conservando estados heredados desconocidos o históricos sin convertirlos forzosamente a Disponible
        if (myEmp.state === 'Almuerzo') {
            myEmp.colorId = 'lunch';
            myEmp.state = 'Lunch';
        } else if (myEmp.state === 'Fin de Turno') {
            myEmp.colorId = 'end';
            myEmp.state = 'Salida';
        } else if (officialLabels[myEmp.colorId]) {
            myEmp.state = officialLabels[myEmp.colorId];
        } else if (historicalLabels[myEmp.colorId] && !myEmp.state) {
            myEmp.state = historicalLabels[myEmp.colorId];
        } else if (!myEmp.colorId && !myEmp.state) {
            myEmp.colorId = 'available';
            myEmp.state = 'Disponible';
        }
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
        const parsedStart = new Date(savedStartTime);
        if (!isNaN(parsedStart.getTime()) && parsedStart <= stateStartTime) {
            stateStartTime = parsedStart;
        } else {
            localStorage.setItem(`ts_state_start_${tsUser}`, stateStartTime.toISOString());
        }
    } else {
        localStorage.setItem(`ts_state_start_${tsUser}`, stateStartTime.toISOString());
    }

    // Sesión activa total: arranca al abrir el portal cada día y se reinicia al volver de Salida
    const sessionKey = `ts_session_start_${tsUser}`;
    const sessionDisplay = document.getElementById('session-timer-display');
    let sessionStartTime = new Date();
    const savedSession = localStorage.getItem(sessionKey);
    if (savedSession && new Date(savedSession).toDateString() === new Date().toDateString()) {
        sessionStartTime = new Date(savedSession);
    } else {
        localStorage.setItem(sessionKey, sessionStartTime.toISOString());
    }

    // Seed initial daily history row if empty
    if (dailyHistory.length === 0) {
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        dailyHistory.push({
            time: nowStr,
            state: myEmp.state,
            color: stateHexColors[myEmp.colorId] || '#00A669',
            duration: myEmp.colorId === 'end' ? 'OFF' : null
        });
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
            stateHeading.style.color = color || stateHexColors[stateId] || '#64748B';
        }
    }

    function appendAuxLog(prevStateId, startDate, endDate) {
        if (!prevStateId || prevStateId === 'end') return;
        if (!(startDate instanceof Date) || !(endDate instanceof Date)) return;
        const startMs = startDate.getTime();
        const endMs = endDate.getTime();
        if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return;

        let auxLogs = [];
        try {
            auxLogs = JSON.parse(localStorage.getItem('ts_aux_logs')) || [];
            if (!Array.isArray(auxLogs)) auxLogs = [];
        } catch (e) {
            auxLogs = [];
        }

        const startIso = startDate.toISOString();
        const endIso = endDate.toISOString();
        const recordId = `aux_${tsUser}_${startMs}_${prevStateId}`;

        const existingIdx = auxLogs.findIndex(
            r => r && (r.id === recordId || (r.user === tsUser && r.stateId === prevStateId && r.start === startIso))
        );

        const logEntry = {
            id: recordId,
            user: tsUser,
            name: myEmp.name || tsName || tsUser,
            cargo: myEmp.role || tsCargo || 'Empleado',
            stateId: prevStateId,
            start: startIso,
            end: endIso
        };

        if (existingIdx !== -1) {
            auxLogs[existingIdx] = logEntry;
        } else {
            auxLogs.push(logEntry);
        }

        localStorage.setItem('ts_aux_logs', JSON.stringify(auxLogs));
    }

    function formatDurationBetween(startDate, endDate) {
        const diff = Math.max(0, Math.floor((endDate - startDate) / 1000));
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    // Sincroniza cambios realizados externamente (ej. desde Gestión de Usuarios)
    // conservando la fecha/hora original del estado anterior antes de cerrar dailyHistory
    // y preservando el inicio real del nuevo período sin sobrescribir ni duplicar registros
    function syncExternalChanges() {
        let currentEmps = [];
        try {
            currentEmps = JSON.parse(localStorage.getItem('ts_employees')) || [];
        } catch (e) {
            return;
        }
        const storedEmp = currentEmps.find(
            e => e && (e.id === myEmp.id || (e.email && e.email.toLowerCase().startsWith(tsUser.toLowerCase() + '@')))
        );
        if (!storedEmp) return;

        let extColorId = storedEmp.colorId;
        let extState = storedEmp.state;
        if (extState === 'Almuerzo') { extColorId = 'lunch'; extState = 'Lunch'; }
        else if (extState === 'Fin de Turno') { extColorId = 'end'; extState = 'Salida'; }
        else if (officialLabels[extColorId]) { extState = officialLabels[extColorId]; }

        const storedStartStr = localStorage.getItem(`ts_state_start_${tsUser}`);
        const parsedStoredStart = storedStartStr ? new Date(storedStartStr) : null;
        const hasValidStoredStart = parsedStoredStart && !isNaN(parsedStoredStart.getTime());

        const stateChangedExternally = (extColorId && extColorId !== myEmp.colorId) || (extState && extState !== myEmp.state);
        const startChangedExternally = hasValidStoredStart && parsedStoredStart.getTime() !== stateStartTime.getTime();

        // Sincronizar metadatos del empleado si cambiaron en Gestión
        if (storedEmp.name) myEmp.name = storedEmp.name;
        if (storedEmp.role) myEmp.role = storedEmp.role;
        if (storedEmp.department) myEmp.department = storedEmp.department;
        if (storedEmp.shift) myEmp.shift = storedEmp.shift;

        if (!stateChangedExternally && !startChangedExternally) {
            return;
        }

        // Conservar fecha/hora e identificador originales del estado anterior ANTES de actualizar stateStartTime
        const prevStateId = myEmp.colorId;
        const prevStateLabel = myEmp.state;
        const prevStateStartTime = new Date(stateStartTime.getTime());
        const now = new Date();
        const transitionTime = startChangedExternally ? parsedStoredStart : now;
        const closedDurationStr = prevStateId === 'end'
            ? 'OFF'
            : formatDurationBetween(prevStateStartTime, transitionTime);

        if (stateChangedExternally) {
            // 1. Si el cambio externo no actualizó ts_state_start_<user>, cerrar el período anterior en ts_aux_logs usando prevStateStartTime
            if (!startChangedExternally) {
                appendAuxLog(prevStateId, prevStateStartTime, transitionTime);
                localStorage.setItem(`ts_state_start_${tsUser}`, transitionTime.toISOString());
            }

            // 2. Actualizar y sincronizar dailyHistory ANTES de pisar stateStartTime, garantizando que la duración coincida con ts_aux_logs
            try {
                const storedHistory = JSON.parse(localStorage.getItem(historyKey));
                if (Array.isArray(storedHistory) && storedHistory.length > 0) {
                    dailyHistory = storedHistory;
                }
            } catch (e) {}

            const nextStateLabel = extState || myEmp.state;
            const nextColorId = extColorId || myEmp.colorId;
            const lastEntry = dailyHistory[dailyHistory.length - 1];

            if (!lastEntry || lastEntry.state !== nextStateLabel) {
                // Cerrar la fila anterior con la duración calculada desde prevStateStartTime hasta transitionTime
                if (lastEntry) {
                    if (!lastEntry.duration) {
                        lastEntry.duration = closedDurationStr;
                    }
                } else {
                    const prevStartLabel = prevStateStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    dailyHistory.push({
                        time: prevStartLabel,
                        state: prevStateLabel,
                        color: stateHexColors[prevStateId] || '#00A669',
                        duration: closedDurationStr
                    });
                }

                const newStartLabel = transitionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                dailyHistory.push({
                    time: newStartLabel,
                    state: nextStateLabel,
                    color: stateHexColors[nextColorId] || '#00A669',
                    duration: nextColorId === 'end' ? 'OFF' : null
                });
                localStorage.setItem(historyKey, JSON.stringify(dailyHistory));
            } else if (dailyHistory.length >= 2 && !dailyHistory[dailyHistory.length - 2].duration) {
                // Si Gestión ya agregó la fila nueva pero la anterior quedó sin duración, asegurar que tenga closedDurationStr
                dailyHistory[dailyHistory.length - 2].duration = closedDurationStr;
                localStorage.setItem(historyKey, JSON.stringify(dailyHistory));
            }

            // 3. Ahora sí actualizar stateStartTime al inicio real del nuevo período
            stateStartTime = transitionTime;

            if (prevStateId === 'end' && nextColorId !== 'end') {
                sessionStartTime = stateStartTime;
                localStorage.setItem(sessionKey, sessionStartTime.toISOString());
            }

            myEmp.colorId = nextColorId;
            myEmp.state = nextStateLabel;
            myEmp.time = storedEmp.time || '00:00:00';

            const matchingBtn = Array.from(auxButtons).find(b => b.dataset.stateId === myEmp.colorId);
            const uiColor = matchingBtn ? matchingBtn.dataset.color : (stateHexColors[myEmp.colorId] || '#64748B');
            updateStateUI(myEmp.colorId, myEmp.state, uiColor);
            renderDailyHistory();
        } else if (startChangedExternally) {
            stateStartTime = parsedStoredStart;
            try {
                const storedHistory = JSON.parse(localStorage.getItem(historyKey));
                if (Array.isArray(storedHistory) && storedHistory.length > 0) {
                    dailyHistory = storedHistory;
                    renderDailyHistory();
                }
            } catch (e) {}
        }
    }

    function syncEmployeeToStorage(timeOverride, onlyTime = false) {
        if (onlyTime) {
            // Antes de escribir el tick de tiempo, sincronizar cualquier cambio externo para no sobrescribirlo
            syncExternalChanges();
        }

        let currentEmps = [];
        try {
            currentEmps = JSON.parse(localStorage.getItem('ts_employees')) || [];
        } catch (e) {
            currentEmps = [];
        }

        const empIndex = currentEmps.findIndex(
            e => e && (e.id === myEmp.id || (e.email && e.email.toLowerCase().startsWith(tsUser.toLowerCase() + '@')))
        );

        const nextTime = timeOverride !== undefined ? timeOverride : myEmp.time;
        myEmp.time = nextTime;

        if (empIndex !== -1) {
            if (onlyTime) {
                // Evitar escrituras redundantes o sobrescritura de campos editados en Gestión
                if (currentEmps[empIndex].time === nextTime) return;
                currentEmps[empIndex].time = nextTime;
            } else {
                currentEmps[empIndex] = { ...currentEmps[empIndex], ...myEmp };
            }
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
        // Primero verificar si hubo un cambio externo reciente antes de procesar el clic
        syncExternalChanges();
        if (myEmp.colorId === stateId) return;

        const now = new Date();
        const prevStateId = myEmp.colorId;

        // 1. Close previous state period in ts_aux_logs BEFORE resetting stateStartTime
        appendAuxLog(prevStateId, stateStartTime, now);

        // 2. Update duration of the PREVIOUS state in portal dailyHistory
        if (dailyHistory.length > 0) {
            if (prevStateId === 'end') {
                dailyHistory[dailyHistory.length - 1].duration = 'OFF';
            } else {
                const diff = Math.max(0, Math.floor((now - stateStartTime) / 1000));
                const h = Math.floor(diff / 3600).toString().padStart(2, '0');
                const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
                const s = (diff % 60).toString().padStart(2, '0');
                dailyHistory[dailyHistory.length - 1].duration = `${h}:${m}:${s}`;
            }
        }

        // 3. Reset timer for the new state
        stateStartTime = now;
        localStorage.setItem(`ts_state_start_${tsUser}`, stateStartTime.toISOString());

        // Si regresa desde Salida, empieza una nueva sesión
        if (prevStateId === 'end') {
            sessionStartTime = now;
            localStorage.setItem(sessionKey, sessionStartTime.toISOString());
        }

        // 4. Update Employee object
        myEmp.state = stateLabel;
        myEmp.colorId = stateId;
        myEmp.time = '00:00:00';

        // 5. Add to daily history (new state)
        const nowStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        dailyHistory.push({ time: nowStr, state: stateLabel, color: color, duration: (stateId === 'end') ? 'OFF' : null });
        localStorage.setItem(historyKey, JSON.stringify(dailyHistory));

        // 6. Sync to ts_employees and ts_punches
        syncEmployeeToStorage('00:00:00', false);
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

    // Escuchar eventos storage entre pestañas para reflejar cambios desde Gestión de inmediato
    window.addEventListener('storage', (e) => {
        if (!e || !e.key || e.key === 'ts_employees' || e.key === `ts_state_start_${tsUser}` || e.key === historyKey) {
            syncExternalChanges();
        }
    });

    // Timer Logic
    function formatTimeDiff(start) {
        const diff = Math.max(0, Math.floor((new Date() - start) / 1000));
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    setInterval(() => {
        // Primero sincronizar si Gestión modificó el estado mientras el Portal está abierto
        syncExternalChanges();

        let timeStr = formatTimeDiff(stateStartTime);
        
        if (myEmp && myEmp.colorId === 'end') {
            timeStr = '--:--:--';
        }

        if (stateTimerDisplay) {
            stateTimerDisplay.textContent = timeStr;
        }

        if (sessionDisplay) {
            sessionDisplay.textContent = (myEmp && myEmp.colorId === 'end') ? '--:--:--' : formatTimeDiff(sessionStartTime);
        }

        const historyDurDisplay = document.getElementById('history-current-duration');
        if (historyDurDisplay && myEmp.colorId !== 'end') {
            historyDurDisplay.textContent = timeStr;
        }
        
        // Background sync to localStorage for the Dashboard to read live (solo actualiza time sin sobrescribir estado externo)
        if (myEmp) {
            const timeToSync = (myEmp.colorId === 'end') ? '00:00:00' : timeStr;
            syncEmployeeToStorage(timeToSync, true);
        }
    }, 1000);

    // Initial sync and punch record
    syncEmployeeToStorage(undefined, false);
    syncPunchRecord(myEmp.state, myEmp.colorId);

    // Initial Render
    let activeBtn = Array.from(auxButtons).find(b => b.dataset.stateId === myEmp.colorId);
    if (activeBtn) {
        updateStateUI(myEmp.colorId, activeBtn.dataset.stateLabel, activeBtn.dataset.color);
    } else {
        updateStateUI(myEmp.colorId, myEmp.state, stateHexColors[myEmp.colorId] || '#64748B');
    }
    renderDailyHistory();
});
