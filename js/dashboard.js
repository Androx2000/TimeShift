document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. NAVIGATION TAB LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    const viewSections = document.querySelectorAll('.view-section');

    function switchView(targetId) {
        // Update nav styling
        navLinks.forEach(link => {
            if (link.dataset.target === targetId) {
                link.classList.remove('text-slate-400');
                link.classList.add('text-white');
            } else {
                link.classList.add('text-slate-400');
                link.classList.remove('text-white');
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
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(link.dataset.target);
        });
    });

    // Initialize first tab as active
    switchView('view-monitor');


    // --- 2. DATA DEFS ---
    const stateColors = {
        'available': { border: 'border-[#16A34A]', text: 'text-[#16A34A]' },
        'court': { border: 'border-[#1e3a8a]', text: 'text-[#1e3a8a]' },
        'meeting': { border: 'border-[#D97706]', text: 'text-[#D97706]' },
        'lunch': { border: 'border-slate-500', text: 'text-slate-500' },
        'end': { border: 'border-[#DC2626]', text: 'text-[#DC2626]' }
    };

    const chartColors = {
        'Disponible': '#16A34A',
        'En Tribunal': '#1e3a8a',
        'Reunión con Cliente': '#D97706',
        'Almuerzo / Descanso': '#64748b'
    };

    // --- 3. MONITOR VIEW LOGIC ---
    const employees = [
        { name: 'Sarah Connor', email: 's.connor@timeshift.com', department: 'Operaciones', state: 'En Tribunal', time: '00:15:22', colorId: 'court' },
        { name: 'John Miller', email: 'j.miller@timeshift.com', department: 'Operaciones', state: 'Almuerzo / Descanso', time: '00:44:02', colorId: 'lunch' },
        { name: 'Alice Jenkins', email: 'a.jenkins@timeshift.com', department: 'Asesoría Legal', state: 'Disponible', time: '00:08:14', colorId: 'available' },
        { name: 'Robert Chen', email: 'r.chen@timeshift.com', department: 'Personal Ejecutivo', state: 'Reunión con Cliente', time: '02:10:00', colorId: 'meeting' },
        { name: 'Marcus Aurelius', email: 'm.aurelius@timeshift.com', department: 'Estrategia', state: 'En Tribunal', time: '00:08:12', colorId: 'court' },
        { name: 'Bruce Wayne', email: 'b.wayne@timeshift.com', department: 'Administración', state: 'Fin de Turno', time: '05:12:00', colorId: 'end' },
    ];

    const monitorTbody = document.getElementById('employee-table-body');
    if (monitorTbody) {
        employees.forEach(emp => {
            const style = stateColors[emp.colorId] || stateColors['available'];
            const badgeHTML = `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-solid ${style.border} ${style.text} bg-transparent">${emp.state}</span>`;
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
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 text-right font-mono">${emp.time}</td>
            `;
            monitorTbody.appendChild(tr);
        });
    }

    // --- MAGIA: GENERADOR DE TOOLTIP HTML LIBRE DE BORDES ---
    const externalTooltipHandler = (context) => {
        const { chart, tooltip } = context;
        let tooltipEl = document.getElementById('chartjs-custom-html-tooltip');

        // Crea el elemento div la primera vez
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-custom-html-tooltip';
            // Se inyecta en el BODY y se le da un z-index altísimo para que pase por encima de todo
            tooltipEl.className = 'absolute bg-[#333333] text-white text-sm font-medium px-3 py-2 rounded shadow-lg pointer-events-none transition-all duration-75 z-[9999]';
            document.body.appendChild(tooltipEl);
        }

        // Ocultar cuando no hay hover
        if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = 0;
            return;
        }

        // Estructura del contenido
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

        // Posicionamiento inteligente fuera de la Dona
        const position = chart.canvas.getBoundingClientRect();
        
        // Saber de qué lado estamos tocando (izquierda o derecha de la dona)
        const isRightHalf = tooltip.caretX > (chart.width / 2);
        
        // Coordenadas base absolutas
        let left = position.left + window.scrollX + tooltip.caretX;
        let top = position.top + window.scrollY + tooltip.caretY;

        // Si tocamos el lado derecho, empujamos el recuadro a la derecha (+15px de margen)
        // Si tocamos el lado izquierdo, lo empujamos completamente hacia la izquierda
        if (isRightHalf) {
            tooltipEl.style.transform = 'translate(15px, -50%)';
        } else {
            tooltipEl.style.transform = 'translate(calc(-100% - 15px), -50%)';
        }

        tooltipEl.style.opacity = 1;
        tooltipEl.style.left = left + 'px';
        tooltipEl.style.top = top + 'px';
    };

    // Monitor Chart
    const distCtx = document.getElementById('timeDistributionChart');
    if (distCtx) {
        new Chart(distCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Disponible', 'En Tribunal', 'Reunión con Cliente', 'Almuerzo / Descanso'],
                datasets: [{
                    data: [50, 33, 11, 6],
                    backgroundColor: [chartColors['Disponible'], chartColors['En Tribunal'], chartColors['Reunión con Cliente'], chartColors['Almuerzo / Descanso']],
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
                        // APAGAMOS EL NATIVO
                        enabled: false, 
                        // ENCENDEMOS EL EXTERNO HTML
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

        // Monitor Legend
        const legendContainer = document.getElementById('chart-legend');
        if (legendContainer) {
            ['Disponible', 'En Tribunal', 'Reunión con Cliente', 'Almuerzo / Descanso'].forEach((label, index) => {
                const dataVals = [50, 33, 11, 6];
                const color = chartColors[label];
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
    }


    // --- 4. REPORTS VIEW LOGIC ---
    // Adherence Bar Chart
    const adherenceCtx = document.getElementById('adherenceBarChart');
    if (adherenceCtx) {
        new Chart(adherenceCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Cumplimiento',
                    data: [92, 95, 89, 94, 96, 91, 94],
                    backgroundColor: '#1e3a8a',
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

    // Reports Table
    const adherenceEvents = [
        { name: 'Sarah Connor', scheduled: 'Disponible', actual: 'En Tribunal (Atrasado)', dev: '+35 min', devColor: 'text-danger' },
        { name: 'John Miller', scheduled: 'Almuerzo / Descanso', actual: 'Disponible', dev: '-15 min', devColor: 'text-warning' },
        { name: 'Alice Jenkins', scheduled: 'Disponible', actual: 'Fin de Turno (Temprano)', dev: '+20 min', devColor: 'text-danger' }
    ];
    const adhTbody = document.getElementById('adherence-table-body');
    if (adhTbody) {
        adherenceEvents.forEach(ev => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">${ev.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${ev.scheduled}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-800">${ev.actual}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${ev.devColor}">${ev.dev}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <a href="#" class="text-brandBlue font-medium hover:underline">Reconocer</a>
                </td>
            `;
            adhTbody.appendChild(tr);
        });
    }

    // --- 5. DIRECTORY VIEW LOGIC ---
    const dirTbody = document.getElementById('directory-table-body');
    if (dirTbody) {
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
                    <a href="#" class="text-brandBlue hover:underline mr-3">Ver Registros</a>
                    <a href="#" class="text-slate-600 hover:underline">Editar</a>
                </td>
            `;
            dirTbody.appendChild(tr);
        });
    }

});