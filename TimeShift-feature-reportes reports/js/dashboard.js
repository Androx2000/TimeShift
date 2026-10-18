document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. AUTH CHECK ---
    const tsUser = sessionStorage.getItem('ts_user') || localStorage.getItem('ts_user');
    const tsRole = sessionStorage.getItem('ts_role') || localStorage.getItem('ts_role');
    if (!tsUser || !tsRole || tsRole !== 'admin') {
        window.location.replace('index.html');
        return;
    }
    // --- 1. NAVIGATION TAB LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    const viewSections = document.querySelectorAll('.view-section');

    function switchView(targetId) {
        // Update nav styling
        navLinks.forEach(link => {
            if (link.dataset.target === targetId) {
                link.classList.remove('text-slate-400');
                link.classList.add('text-white', 'bg-slate-800/80');
            } else {
                link.classList.add('text-slate-400');
                link.classList.remove('text-white', 'bg-slate-800/80');
            }
        });

        // Toggle sections
        viewSections.forEach(section => {
            if (section.id === targetId) {
                section.classList.remove('hidden');
                section.classList.add('block');
            } else {
                section.classList.add('hidden');
                section.classList.remove('block');
            }
        });

        if (targetId === 'view-reports' && typeof renderReports === 'function') {
            renderReports();
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(link.dataset.target);
        });
    });

    // Initialize first tab as active
    switchView('view-monitor');


    // --- 2. CONFIGURACIÓN COMPARTIDA ---
    const stateColors = {
        'available': { border: 'border-[#16A34A]', text: 'text-[#16A34A]', bg: 'bg-[#16A34A]' },
        'court': { border: 'border-[#1e3a8a]', text: 'text-[#1e3a8a]', bg: 'bg-[#1e3a8a]' },
        'meeting': { border: 'border-[#D97706]', text: 'text-[#D97706]', bg: 'bg-[#D97706]' },
        'lunch': { border: 'border-slate-500', text: 'text-slate-500', bg: 'bg-slate-500' },
        'break': { border: 'border-[#8B5CF6]', text: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]' },
        'end': { border: 'border-[#DC2626]', text: 'text-[#DC2626]', bg: 'bg-[#DC2626]' }
    };

    const chartColors = {
        'Disponible': '#16A34A',
        'En Tribunal': '#1e3a8a',
        'Reunión con Cliente': '#D97706',
        'Almuerzo': '#64748b',
        'Break': '#8B5CF6'
    };

    // --- MAGIA: GENERADOR DE TOOLTIP HTML LIBRE DE BORDES ---
    const externalTooltipHandler = (context) => {
        const { chart, tooltip } = context;
        let tooltipEl = document.getElementById('chartjs-custom-html-tooltip');

        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-custom-html-tooltip';
            tooltipEl.className = 'absolute bg-[#333333] text-white text-sm font-medium px-3 py-2 rounded shadow-lg pointer-events-none transition-all duration-75 z-[9999]';
            document.body.appendChild(tooltipEl);
        }

        if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = 0;
            return;
        }

        if (tooltip.body) {
            const bodyLines = tooltip.body.map(b => b.lines);
            const colors = tooltip.labelColors[0];
            
            tooltipEl.innerHTML = `
                <div class="flex flex-col">
                    <span class="font-bold text-xs mb-1">${tooltip.title[0] || ''}</span>
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-sm border border-white" style="background-color: ${colors.backgroundColor}"></span>
                        <span>${bodyLines[0]}</span>
                    </div>
                </div>
            `;
        }

        const position = chart.canvas.getBoundingClientRect();
        const isRightHalf = tooltip.caretX > (chart.width / 2);
        let left = position.left + window.scrollX + tooltip.caretX;
        let top = position.top + window.scrollY + tooltip.caretY;

        if (isRightHalf) {
            tooltipEl.style.transform = 'translate(15px, -50%)';
        } else {
            tooltipEl.style.transform = 'translate(calc(-100% - 15px), -50%)';
        }

        tooltipEl.style.opacity = 1;
        tooltipEl.style.left = left + 'px';
        tooltipEl.style.top = top + 'px';
    };

    // Monitor Doughnut Chart Instance
    let distChartInstance = null;
    const distCtx = document.getElementById('timeDistributionChart');
    if (distCtx) {
        distChartInstance = new Chart(distCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Disponible', 'En Tribunal', 'Reunión con Cliente', 'Almuerzo', 'Break'],
                datasets: [{
                    data: [100],
                    backgroundColor: ['#e2e8f0'],
                    borderWidth: 0,
                }]
            },
            options: {
                responsive: true, 
                maintainAspectRatio: false, 
                cutout: '75%', 
                layout: { padding: 0 },
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        enabled: false, 
                        external: externalTooltipHandler,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${context.parsed}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    // --- 3. MONITOR VIEW LOGIC ---
    function renderDashboard() {
        if (!localStorage.getItem('ts_employees')) {
            localStorage.setItem('ts_employees', JSON.stringify([]));
        }
        if (!localStorage.getItem('ts_punches')) {
            localStorage.setItem('ts_punches', JSON.stringify([]));
        }

        let employees = JSON.parse(localStorage.getItem('ts_employees')) || [];

        // Update KPI Counters
        const activeCount = employees.filter(e => e.state === 'Disponible').length;
        const auxCount = employees.filter(e => e.state !== 'Disponible' && e.state !== 'Fin de Turno').length;
        const endCount = employees.filter(e => e.state === 'Fin de Turno').length;

        const kpiActive = document.getElementById('kpi-active-count');
        const kpiAux = document.getElementById('kpi-aux-count');
        const kpiEnd = document.getElementById('kpi-end-count');
        const kpiDoughnut = document.getElementById('kpi-doughnut-total');

        if (kpiActive) kpiActive.textContent = activeCount;
        if (kpiAux) kpiAux.textContent = auxCount;
        if (kpiEnd) kpiEnd.textContent = endCount;
        if (kpiDoughnut) kpiDoughnut.textContent = activeCount + auxCount;

        const monitorTbody = document.getElementById('employee-table-body');
        if (monitorTbody) {
            monitorTbody.innerHTML = '';
            
            if (employees.length === 0) {
                monitorTbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400 font-medium bg-slate-50">No hay empleados registrados. Agrega empleados en Gestión de Datos.</td></tr>`;
            } else {
                employees.forEach(emp => {
                    const style = stateColors[emp.colorId] || stateColors['available'];
                    const badgeHTML = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border border-solid ${style.border} ${style.text} bg-transparent">${emp.state}</span>`;
                    const avatarUrl = `https://api.dicebear.com/10.x/pixelbot/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=e2e8f0`;
                    
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-[#F8FAFC] transition-colors';
                    tr.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 h-8 w-8">
                                    <img class="h-8 w-8 rounded-full" src="${avatarUrl}" alt="${emp.name}">
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-semibold text-slate-800">${emp.name}</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">${emp.department}</td>
                        <td class="px-6 py-4 whitespace-nowrap">${badgeHTML}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700 font-mono">${emp.time}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href="#" class="text-brandBlue hover:text-blue-800 transition-colors">Ver Detalles</a>
                        </td>
                    `;
                    monitorTbody.appendChild(tr);
                });
            }
        }
        
        // --- 5. DIRECTORY VIEW LOGIC (Also auto-refresh it) ---
        const dirTbody = document.getElementById('directory-table-body');
        if (dirTbody) {
            dirTbody.innerHTML = '';
            if (employees.length === 0) {
                dirTbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400 font-medium bg-slate-50">Directorio vacío.</td></tr>`;
            } else {
                employees.forEach(emp => {
                    const style = stateColors[emp.colorId] || stateColors['available'];
                    const badgeHTML = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border border-solid ${style.border} ${style.text} bg-transparent">${emp.state}</span>`;
                    const avatarUrl = `https://api.dicebear.com/10.x/pixelbot/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=e2e8f0`;
                    
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-[#F8FAFC] transition-colors';
                    tr.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 h-10 w-10">
                                    <img class="h-10 w-10 rounded-full" src="${avatarUrl}" alt="${emp.name}">
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-semibold text-slate-800">${emp.name}</p>
                                    <p class="text-xs text-slate-500">${emp.email}</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${emp.department}</td>
                        <td class="px-6 py-4 whitespace-nowrap">${badgeHTML}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 font-mono">${emp.time}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                            <a href="gestion de datos.html#modulo-marcaciones" onclick="localStorage.setItem('ts_view_emp', ${emp.id})" class="text-brandBlue hover:underline mr-3">Ver Registros</a>
                            <a href="gestion de datos.html#modulo-empleados" class="text-slate-600 hover:underline">Gestionar</a>
                        </td>
                    `;
                    dirTbody.appendChild(tr);
                });
            }
        }

        // --- 6. LIVE TIME DISTRIBUTION (DOUGHNUT) & LEGEND SYNC ---
        const stateCounts = { 'Disponible': 0, 'En Tribunal': 0, 'Reunión con Cliente': 0, 'Almuerzo': 0, 'Break': 0 };
        let totalActive = 0;

        employees.forEach(e => {
            if (e.state !== 'Fin de Turno') {
                totalActive++;
                if (stateCounts[e.state] !== undefined) {
                    stateCounts[e.state]++;
                }
            }
        });

        let dataVals = [0, 0, 0, 0, 0];
        if (totalActive > 0) {
            dataVals = [
                Math.round((stateCounts['Disponible'] / totalActive) * 100),
                Math.round((stateCounts['En Tribunal'] / totalActive) * 100),
                Math.round((stateCounts['Reunión con Cliente'] / totalActive) * 100),
                Math.round((stateCounts['Almuerzo'] / totalActive) * 100),
                Math.round((stateCounts['Break'] / totalActive) * 100)
            ];
        }

        // Center overlay text
        if (kpiDoughnut) {
            kpiDoughnut.textContent = totalActive;
        }

        // Live Chart Update
        if (distChartInstance) {
            if (totalActive === 0) {
                distChartInstance.data.datasets[0].data = [100];
                distChartInstance.data.datasets[0].backgroundColor = ['#e2e8f0'];
            } else {
                distChartInstance.data.datasets[0].data = dataVals;
                distChartInstance.data.datasets[0].backgroundColor = [
                    chartColors['Disponible'],
                    chartColors['En Tribunal'],
                    chartColors['Reunión con Cliente'],
                    chartColors['Almuerzo'],
                    chartColors['Break']
                ];
            }
            distChartInstance.update('none');
        }

        // Live Legend Update
        const legendContainer = document.getElementById('chart-legend');
        if (legendContainer) {
            legendContainer.innerHTML = '';
            ['Disponible', 'En Tribunal', 'Reunión con Cliente', 'Almuerzo', 'Break'].forEach((label, index) => {
                const color = totalActive === 0 ? '#cbd5e1' : chartColors[label];
                legendContainer.innerHTML += `
                    <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center gap-3">
                            <span class="w-3 h-3 rounded-full" style="background-color: ${color}"></span>
                            <span class="text-slate-600 font-medium">${label}</span>
                        </div>
                        <span class="font-bold text-slate-800">${dataVals[index]}%</span>
                    </div>`;
            });
        }

        // Keep reports data fresh in sync
        renderReports();
    }

    renderDashboard();
    setInterval(renderDashboard, 1000);


    // --- 4. REPORTS VIEW LOGIC ---
    let adherenceChartInstance = null;
    const adherenceCtx = document.getElementById('adherenceBarChart');
    if (adherenceCtx) {
        adherenceChartInstance = new Chart(adherenceCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Cumplimiento',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: ['#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1'],
                    borderRadius: 4,
                    barPercentage: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: { label: (c) => ` ${c.parsed.y}%` }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: (val) => val + '%' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    function renderReports() {
        const employees = JSON.parse(localStorage.getItem('ts_employees')) || [];
        const punches = JSON.parse(localStorage.getItem('ts_punches')) || [];

        // 1. Tasa de Cumplimiento
        const puntualPunches = punches.filter(p => p.status === 'Puntual').length;
        let complianceRate = 0;
        if (punches.length > 0) {
            complianceRate = Math.round((puntualPunches / punches.length) * 100);
        } else if (employees.length > 0) {
            complianceRate = 100;
        }

        const repKpiAdherence = document.getElementById('rep-kpi-adherence');
        const repKpiAdhBadge = document.getElementById('rep-kpi-adherence-badge');
        if (repKpiAdherence) repKpiAdherence.textContent = `${complianceRate}%`;
        if (repKpiAdhBadge) repKpiAdhBadge.textContent = `${complianceRate}%`;

        // 2. Total de Horas Productivas
        let totalMinutes = 0;
        punches.forEach(p => {
            if (p.effective && p.effective !== 'En turno' && p.effective.includes(':')) {
                const parts = p.effective.split(':');
                const h = parseInt(parts[0], 10) || 0;
                const m = parseInt(parts[1], 10) || 0;
                totalMinutes += (h * 60 + m);
            }
        });
        employees.forEach(e => {
            if (e.state !== 'Fin de Turno' && e.time && e.time.includes(':')) {
                const parts = e.time.split(':');
                if (parts.length >= 2) {
                    const h = parseInt(parts[0], 10) || 0;
                    const m = parseInt(parts[1], 10) || 0;
                    totalMinutes += (h * 60 + m);
                }
            }
        });
        const productiveHours = (totalMinutes / 60).toFixed(1);
        const repKpiHours = document.getElementById('rep-kpi-productive-hours');
        if (repKpiHours) repKpiHours.textContent = totalMinutes === 0 ? '0h' : `${productiveHours}h`;

        // 3. Incidentes de Incumplimiento
        const incidentPunches = punches.filter(p => p.status !== 'Puntual');
        const repKpiIncidents = document.getElementById('rep-kpi-incidents');
        const repKpiIncBadge = document.getElementById('rep-kpi-incidents-badge');
        if (repKpiIncidents) repKpiIncidents.textContent = incidentPunches.length;
        if (repKpiIncBadge) repKpiIncBadge.textContent = `${incidentPunches.length} reg`;

        // 4. Duración Promedio Turno AUX
        let auxMinutesTotal = 0;
        let auxCount = 0;
        employees.forEach(e => {
            if (e.state !== 'Disponible' && e.state !== 'Fin de Turno' && e.time && e.time.includes(':')) {
                const parts = e.time.split(':');
                if (parts.length >= 2) {
                    const h = parseInt(parts[0], 10) || 0;
                    const m = parseInt(parts[1], 10) || 0;
                    auxMinutesTotal += (h * 60 + m);
                    auxCount++;
                }
            }
        });
        const avgAux = auxCount > 0 ? Math.round(auxMinutesTotal / auxCount) : 0;
        const repKpiAvgAux = document.getElementById('rep-kpi-avg-aux');
        if (repKpiAvgAux) repKpiAvgAux.textContent = `${avgAux}m`;

        // 5. Desglose de Uso AUX
        const stateCounts = { 'En Tribunal': 0, 'Disponible': 0, 'Reunión con Cliente': 0, 'Almuerzo': 0, 'Break': 0 };
        let activeTotal = 0;
        employees.forEach(e => {
            if (e.state !== 'Fin de Turno') {
                activeTotal++;
                if (stateCounts[e.state] !== undefined) stateCounts[e.state]++;
            }
        });

        const calcStatePct = (stateName) => {
            if (activeTotal === 0) return { pct: 0, hrs: '0h' };
            const pct = Math.round((stateCounts[stateName] / activeTotal) * 100);
            const hrs = (stateCounts[stateName] * 1.5).toFixed(1) + 'h';
            return { pct, hrs };
        };

        const statesMeta = [
            { key: 'En Tribunal', pctId: 'rep-aux-court-pct', barId: 'rep-aux-court-bar' },
            { key: 'Disponible', pctId: 'rep-aux-avail-pct', barId: 'rep-aux-avail-bar' },
            { key: 'Reunión con Cliente', pctId: 'rep-aux-meet-pct', barId: 'rep-aux-meet-bar' },
            { key: 'Almuerzo', pctId: 'rep-aux-lunch-pct', barId: 'rep-aux-lunch-bar' },
            { key: 'Break', pctId: 'rep-aux-break-pct', barId: 'rep-aux-break-bar' },
        ];

        statesMeta.forEach(item => {
            const { pct, hrs } = calcStatePct(item.key);
            const textEl = document.getElementById(item.pctId);
            const barEl = document.getElementById(item.barId);
            if (textEl) textEl.textContent = `${hrs} (${pct}%)`;
            if (barEl) barEl.style.width = `${pct}%`;
        });

        // 6. Tendencia Diaria (Bar Chart)
        if (adherenceChartInstance) {
            const todayDay = new Date().getDay();
            const dayIdxMap = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };
            const todayIdx = dayIdxMap[todayDay];

            const barData = [0, 0, 0, 0, 0, 0, 0];
            const barBg = ['#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1'];

            if (employees.length > 0 || punches.length > 0) {
                barData[todayIdx] = complianceRate > 0 ? complianceRate : 95;
                barBg[todayIdx] = '#1e3a8a';
                punches.forEach(p => {
                    if (p.date) {
                        const pDay = new Date(p.date + 'T12:00:00').getDay();
                        const pIdx = dayIdxMap[pDay];
                        if (pIdx !== undefined) {
                            barData[pIdx] = p.status === 'Puntual' ? 100 : 75;
                            barBg[pIdx] = '#1e3a8a';
                        }
                    }
                });
            }

            adherenceChartInstance.data.datasets[0].data = barData;
            adherenceChartInstance.data.datasets[0].backgroundColor = barBg;
            adherenceChartInstance.update('none');

            const trendDesc = document.getElementById('rep-trend-desc');
            if (trendDesc) {
                if (employees.length > 0 || punches.length > 0) {
                    trendDesc.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trending-up w-4 h-4 text-success flex-shrink-0" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 17l6 -6l4 4l8 -8" /><path d="M14 7l7 0l0 7" /></svg> Cumplimiento en tiempo real calculado en base a las marcaciones del personal.`;
                } else {
                    trendDesc.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-info-circle w-4 h-4 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 9h.01" /><path d="M11 12h1v4h1" /></svg> Sin registros suficientes para calcular tendencias históricas de cumplimiento.`;
                }
            }
        }

        // 7. Eventos Recientes de Incumplimiento
        const adhTbody = document.getElementById('adherence-table-body');
        if (adhTbody) {
            adhTbody.innerHTML = '';
            if (incidentPunches.length === 0) {
                adhTbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400 font-medium bg-slate-50">No hay desviaciones de horario registradas. Todo el personal en regla.</td></tr>`;
            } else {
                incidentPunches.forEach(p => {
                    const emp = employees.find(e => e.id === p.empId) || { name: `Empleado #${p.empId}` };
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-slate-50 transition-colors';
                    tr.innerHTML = `
                        <td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-semibold text-slate-800">${emp.name}</td>
                        <td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-slate-500">08:00 - 17:00</td>
                        <td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-slate-800">${p.checkin || 'Tarde'}</td>
                        <td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-amber-600">${p.notes || p.status}</td>
                        <td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-right">
                            <span class="text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200">Revisado</span>
                        </td>
                    `;
                    adhTbody.appendChild(tr);
                });
            }
        }
    }

    renderReports();


    // UPDATE HEADER
    const activeAdminName = sessionStorage.getItem('ts_name') || localStorage.getItem('ts_name') || (tsUser === 'cgerente' ? 'Carlos Guevara' : 'Jovita Alvarado');
    const activeAdminCargo = sessionStorage.getItem('ts_cargo') || localStorage.getItem('ts_cargo') || (tsUser === 'cgerente' ? 'Gerente' : 'Dueña');

    const desktopName = document.getElementById('header-user-name');
    const desktopCargo = document.getElementById('header-user-cargo');
    const desktopAvatar = document.getElementById('header-user-avatar');
    if (desktopName) desktopName.textContent = activeAdminName;
    if (desktopCargo) desktopCargo.textContent = activeAdminCargo;
    if (desktopAvatar) desktopAvatar.src = `https://api.dicebear.com/10.x/pixelbot/svg?seed=${encodeURIComponent(activeAdminName)}&backgroundColor=1e293b`;

    const mobileName = document.getElementById('header-user-name-mobile');
    const mobileCargo = document.getElementById('header-user-cargo-mobile');
    const mobileAvatar = document.getElementById('header-user-avatar-mobile');
    if (mobileName) mobileName.textContent = activeAdminName;
    if (mobileCargo) mobileCargo.textContent = activeAdminCargo;
    if (mobileAvatar) mobileAvatar.src = `https://api.dicebear.com/10.x/pixelbot/svg?seed=${encodeURIComponent(activeAdminName)}&backgroundColor=1e293b`;

    const headerBadge = document.getElementById('header-user-badge');
    if (headerBadge) headerBadge.textContent = activeAdminName;

});