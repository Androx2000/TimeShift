document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. AUTH CHECK ---
    const tsUser = sessionStorage.getItem('ts_user') || localStorage.getItem('ts_user');
    const tsRole = sessionStorage.getItem('ts_role') || localStorage.getItem('ts_role');
    if (!tsUser || !tsRole || tsRole !== 'admin') {
        window.location.replace('index.html');
        return;
    }

    if (!localStorage.getItem('ts_employees')) {
        localStorage.setItem('ts_employees', JSON.stringify([]));
    }
    if (!localStorage.getItem('ts_punches')) {
        localStorage.setItem('ts_punches', JSON.stringify([]));
    }

    // --- 2. GLOBAL STATE ---
    let employees = JSON.parse(localStorage.getItem('ts_employees'));
    let punches = JSON.parse(localStorage.getItem('ts_punches'));
    
    // Tab Switching Logic
    const navBtnEmpleados = document.getElementById('nav-btn-empleados');
    const navBtnMarcaciones = document.getElementById('nav-btn-marcaciones');
    const secEmpleados = document.getElementById('section-empleados');
    const secMarcaciones = document.getElementById('section-marcaciones');

    function showSection(id) {
        if (id === 'empleados') {
            secEmpleados.classList.remove('hidden');
            secMarcaciones.classList.add('hidden');
            
            navBtnEmpleados.classList.add('text-white', 'border-b-2', 'border-primary', 'pb-1');
            navBtnEmpleados.classList.remove('text-slate-400', 'hover:text-white');
            
            navBtnMarcaciones.classList.remove('text-white', 'border-b-2', 'border-primary', 'pb-1');
            navBtnMarcaciones.classList.add('text-slate-400', 'hover:text-white');
        } else {
            secEmpleados.classList.add('hidden');
            secMarcaciones.classList.remove('hidden');
            
            navBtnMarcaciones.classList.add('text-white', 'border-b-2', 'border-primary', 'pb-1');
            navBtnMarcaciones.classList.remove('text-slate-400', 'hover:text-white');
            
            navBtnEmpleados.classList.remove('text-white', 'border-b-2', 'border-primary', 'pb-1');
            navBtnEmpleados.classList.add('text-slate-400', 'hover:text-white');
        }
    }

    navBtnEmpleados?.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('empleados');
    });

    navBtnMarcaciones?.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('marcaciones');
    });

    // Check hash for initial tab
    if (window.location.hash === '#modulo-marcaciones') {
        showSection('marcaciones');
    } else {
        showSection('empleados'); // Default
    }

    const stateColors = {
        'available': { border: 'border-[#16A34A]', text: 'text-[#16A34A]' },
        'court': { border: 'border-[#1e3a8a]', text: 'text-[#1e3a8a]' },
        'meeting': { border: 'border-[#D97706]', text: 'text-[#D97706]' },
        'lunch': { border: 'border-slate-500', text: 'text-slate-500' },
        'break': { border: 'border-[#8B5CF6]', text: 'text-[#8B5CF6]' },
        'end': { border: 'border-[#DC2626]', text: 'text-[#DC2626]' }
    };

    const stateToColorId = {
        'Disponible': 'available',
        'En Tribunal': 'court',
        'Reunión con Cliente': 'meeting',
        'Almuerzo': 'lunch',
        'Break': 'break',
        'Fin de Turno': 'end'
    };

    const punchColors = {
        'Puntual': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-500' },
        'Tardanza': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-500' },
        'Ausencia Justificada': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-600' },
        'Falta Injustificada': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-600' },
        'Salida Anticipada': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-500' }
    };
    
    // UI Elements
    const addModal = document.getElementById('modal-add-employee');
    const deleteModal = document.getElementById('modal-delete-employee');
    const punchModal = document.getElementById('modal-add-punch');

    const formAdd = document.getElementById('form-add-employee');
    const formPunch = document.getElementById('form-add-punch');
    let currentEditId = null;
    let currentDeleteId = null;

    // Toasts
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-message');

    function showToast(message) {
        toastMsg.textContent = message;
        toast.classList.remove('translate-y-24', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-24', 'opacity-0');
        }, 3000);
    }

    // --- 3. RENDER EMPLOYEES (CRUD LIST) ---
    function renderEmployees() {
        employees = JSON.parse(localStorage.getItem('ts_employees')) || [];
        updateEmployeeSelect();

        // KPI Update
        const activeCount = employees.filter(e => e.state !== 'Fin de Turno').length;
        document.getElementById('kpi-total-employees').textContent = employees.length;
        document.getElementById('kpi-active-employees').textContent = activeCount;
        
        const depts = new Set(employees.map(e => e.department));
        document.getElementById('kpi-departments-count').textContent = depts.size;
        
        const inactiveCount = employees.filter(e => e.state === 'Fin de Turno').length;
        document.getElementById('kpi-inactive-employees').textContent = inactiveCount;

        const tbody = document.getElementById('table-employees-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        const searchQuery = (document.getElementById('employee-search-input')?.value || '').toLowerCase();

        const filtered = employees.filter(emp => {
            return emp.name.toLowerCase().includes(searchQuery) || emp.email.toLowerCase().includes(searchQuery);
        });

        document.getElementById('table-employees-count').textContent = `Mostrando ${filtered.length} empleados`;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 font-medium bg-slate-50">No hay empleados registrados. Presiona "+ Agregar Empleado" para comenzar.</td></tr>`;
        } else {
            filtered.forEach(emp => {
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
                            <p class="text-[11px] text-slate-500 font-mono">ID: EMP-${String(emp.id).padStart(3, '0')}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-slate-800 font-medium">${emp.role}</div>
                    <div class="text-xs text-slate-500">${emp.email}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">${emp.department}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${emp.shift}</td>
                <td class="px-6 py-4 whitespace-nowrap">${badgeHTML}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button class="text-xs font-semibold text-brandBlue hover:underline px-2 py-1" onclick="window.viewHistory(${emp.id})">Ver Marcaciones</button>
                        <button class="text-slate-400 hover:text-brandBlue p-1 transition-colors" onclick="window.editEmployee(${emp.id})" title="Editar">
                            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil w-4 h-4" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>
                        </button>
                        <button class="text-slate-400 hover:text-red-600 p-1 transition-colors" onclick="window.deleteEmployee(${emp.id})" title="Eliminar">
                            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash w-4 h-4" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Update selects
        updateEmployeeSelect();
    }

    document.getElementById('employee-search-input')?.addEventListener('input', renderEmployees);

    // --- 4. CRUD LOGIC ---
    // ADD / EDIT
    document.getElementById('btn-open-add-modal').addEventListener('click', () => {
        currentEditId = null;
        formAdd.reset();
        document.querySelector('#modal-add-employee h3').textContent = 'Registrar Nuevo Empleado';
        addModal.classList.remove('hidden');
    });

    document.getElementById('btn-close-modal-add').addEventListener('click', () => addModal.classList.add('hidden'));
    document.getElementById('btn-cancel-add').addEventListener('click', () => addModal.classList.add('hidden'));

    formAdd.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('input-name').value;
        const email = document.getElementById('input-email').value;
        const role = document.getElementById('input-role').value;
        const dept = document.getElementById('input-department').value;
        const shift = document.getElementById('input-shift').value;
        const state = document.getElementById('input-state').value;
        const colorId = stateToColorId[state] || 'available';

        if (currentEditId) {
            const emp = employees.find(e => e.id === currentEditId);
            if (emp) {
                emp.name = name;
                emp.email = email;
                emp.role = role;
                emp.department = dept;
                emp.shift = shift;
                emp.state = state;
                emp.colorId = colorId;
            }
            showToast('Empleado actualizado con éxito');
        } else {
            const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
            employees.push({
                id: newId, name, email, role, department: dept, shift, state, time: '00:00:00', colorId
            });
            showToast('Empleado registrado con éxito');
        }

        localStorage.setItem('ts_employees', JSON.stringify(employees));
        renderEmployees();
        addModal.classList.add('hidden');
    });

    window.editEmployee = (id) => {
        const emp = employees.find(e => e.id === id);
        if (emp) {
            currentEditId = id;
            document.getElementById('input-name').value = emp.name;
            document.getElementById('input-email').value = emp.email;
            document.getElementById('input-role').value = emp.role;
            document.getElementById('input-department').value = emp.department;
            document.getElementById('input-shift').value = emp.shift;
            document.getElementById('input-state').value = emp.state;
            document.querySelector('#modal-add-employee h3').textContent = 'Editar Empleado';
            addModal.classList.remove('hidden');
        }
    };

    // DELETE
    window.deleteEmployee = (id) => {
        currentDeleteId = id;
        const emp = employees.find(e => e.id === id);
        if (emp) {
            document.getElementById('delete-employee-name').textContent = emp.name;
            document.getElementById('delete-employee-details').innerHTML = `
                <div>ID: EMP-${String(emp.id).padStart(3, '0')}</div>
                <div>Departamento: ${emp.department}</div>
            `;
            deleteModal.classList.remove('hidden');
        }
    };

    document.getElementById('btn-cancel-delete').addEventListener('click', () => deleteModal.classList.add('hidden'));
    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        if (currentDeleteId) {
            employees = employees.filter(e => e.id !== currentDeleteId);
            localStorage.setItem('ts_employees', JSON.stringify(employees));
            
            // Cleanup punches
            punches = punches.filter(p => p.empId !== currentDeleteId);
            localStorage.setItem('ts_punches', JSON.stringify(punches));
            
            renderEmployees();
            showToast('Empleado dado de baja');
            deleteModal.classList.add('hidden');
        }
    });

    // --- 5. HISTORY RENDERING ---
    let currentHistoryEmpId = null;

    function updateEmployeeSelect() {
        const select = document.getElementById('select-employee-history');
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '<option value="" disabled selected>Elige un empleado...</option>';
        employees.forEach(emp => {
            const opt = document.createElement('option');
            opt.value = emp.id;
            opt.textContent = `${emp.name} (${emp.department})`;
            select.appendChild(opt);
        });
        if (currentVal && employees.find(e => e.id == currentVal)) {
            select.value = currentVal;
        }
    }

    document.getElementById('select-employee-history')?.addEventListener('change', (e) => {
        viewHistory(parseInt(e.target.value));
    });

    window.viewHistory = (empId) => {
        currentHistoryEmpId = empId;
        const select = document.getElementById('select-employee-history');
        if(select) select.value = empId;
        
        // Render Profile Card
        const emp = employees.find(e => e.id === empId);
        const card = document.getElementById('employee-profile-card');
        if (emp && card) {
            const avatarUrl = `https://api.dicebear.com/10.x/pixelbot/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=e2e8f0`;
            card.innerHTML = `
                <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <img src="${avatarUrl}" class="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white shadow-sm flex-shrink-0" alt="${emp.name}">
                    <div>
                        <h3 class="text-base sm:text-lg font-bold text-slate-800">${emp.name}</h3>
                        <p class="text-xs sm:text-sm text-slate-500">${emp.role} &bull; ${emp.department} &bull; Turno: ${emp.shift || '08:00 - 17:00'}</p>
                    </div>
                </div>
            `;
        }

        renderHistoryTable();

        // Scroll to history
        document.getElementById('section-marcaciones')?.scrollIntoView({ behavior: 'smooth' });
    };

    function renderHistoryTable() {
        const tbody = document.getElementById('table-history-body');
        if (!tbody || !currentHistoryEmpId) return;
        
        tbody.innerHTML = '';
        punches = JSON.parse(localStorage.getItem('ts_punches')) || [];
        const empPunches = punches.filter(p => p.empId === currentHistoryEmpId).sort((a,b) => new Date(b.date) - new Date(a.date));

        document.getElementById('history-badge-total').textContent = `${empPunches.length} registros`;

        if(empPunches.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-500 text-sm">No hay marcaciones registradas para este empleado.</td></tr>`;
            return;
        }

        empPunches.forEach(p => {
            const style = punchColors[p.status] || punchColors['Puntual'];
            const badgeHTML = `<span class="inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${style.bg} ${style.text} border ${style.border}">${p.status}</span>`;
            
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-[#F8FAFC] transition-colors';
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">${p.date}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">${p.checkin}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">${p.breakDuration}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">${p.checkout}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-brandBlue text-center font-mono">${p.effective}</td>
                <td class="px-6 py-4 whitespace-nowrap">${badgeHTML}</td>
                <td class="px-6 py-4 text-sm text-slate-500 italic max-w-xs truncate">${p.notes || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
        }
    }

    // --- 6. ADD PUNCH MANUAL ---
    document.getElementById('btn-add-punch')?.addEventListener('click', () => {
        if (!currentHistoryEmpId) {
            alert('Por favor, selecciona un empleado primero para registrarle una marcación.');
            return;
        }
        const emp = employees.find(e => e.id === currentHistoryEmpId);
        document.getElementById('manual-punch-emp-name').textContent = emp.name;
        
        formPunch.reset();
        document.getElementById('punch-date').value = new Date().toISOString().split('T')[0];
        punchModal.classList.remove('hidden');
    });

    document.getElementById('btn-close-modal-punch')?.addEventListener('click', () => punchModal.classList.add('hidden'));
    document.getElementById('btn-cancel-punch')?.addEventListener('click', () => punchModal.classList.add('hidden'));

    formPunch?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const date = document.getElementById('punch-date').value;
        const status = document.getElementById('punch-status').value;
        const checkin = document.getElementById('punch-checkin').value;
        const breakDuration = document.getElementById('punch-break').value;
        const checkout = document.getElementById('punch-checkout').value;
        const notes = document.getElementById('punch-notes').value;

        // Calculate effective purely for UI mock (assuming 01:00 break)
        // Simplistic calc
        const effective = "08:00"; 

        const newId = punches.length > 0 ? Math.max(...punches.map(p => p.id)) + 1 : 1;
        punches.push({
            id: newId,
            empId: currentHistoryEmpId,
            date, status, checkin, breakDuration, checkout, effective, notes
        });

        localStorage.setItem('ts_punches', JSON.stringify(punches));
        renderHistoryTable();
        showToast('Marcación agregada con éxito');
        punchModal.classList.add('hidden');
    });

    // INITIAL RENDER
    renderEmployees();

    if (window.location.hash === '#modulo-marcaciones') {
        const viewEmp = localStorage.getItem('ts_view_emp');
        if (viewEmp) {
            setTimeout(() => {
                viewHistory(parseInt(viewEmp));
                localStorage.removeItem('ts_view_emp');
            }, 100);
        }
    }

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
