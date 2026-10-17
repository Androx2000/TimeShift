/* ==========================================================================
   TimeShift - Gestión de Datos
   Rama: feature/gestion-usuarios   |   Responsable: Alan
   Alcance: Agregar, editar, eliminar empleados + validaciones + SweetAlert2
   Requiere en gestion de datos.html (antes de este script):
   <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // --- 0. AUTH CHECK -----------------------------------------------------
    const tsUser = sessionStorage.getItem('ts_user') || localStorage.getItem('ts_user');
    const tsRole = sessionStorage.getItem('ts_role') || localStorage.getItem('ts_role');
    if (!tsUser || !tsRole || tsRole !== 'admin') {
        window.location.replace('index.html');
        return;
    }

    // --- 1. CONSTANTES Y HELPERS -------------------------------------------
    const LS_EMP = 'ts_employees';
    const LS_PUNCH = 'ts_punches';

    const DEPARTMENTS = ['Operaciones', 'Asesoría Legal', 'Personal Ejecutivo', 'Estrategia', 'Administración', 'Tecnología'];
    const SHIFTS = ['08:00 - 17:00', '09:00 - 18:00', '07:00 - 16:00', '13:00 - 21:00'];

    const stateColors = {
        available: { border: 'border-[#16A34A]', text: 'text-[#16A34A]' },
        court:     { border: 'border-[#1e3a8a]', text: 'text-[#1e3a8a]' },
        meeting:   { border: 'border-[#D97706]', text: 'text-[#D97706]' },
        lunch:     { border: 'border-slate-500', text: 'text-slate-500' },
        break:     { border: 'border-[#8B5CF6]', text: 'text-[#8B5CF6]' },
        end:       { border: 'border-[#DC2626]', text: 'text-[#DC2626]' }
    };
    // Pedido del cliente: solo 4 AUX (Disponible, Almuerzo, Break y Salida/Fin de Turno)
    const stateToColorId = {
        'Disponible': 'available',
        'Almuerzo': 'lunch',
        'Break': 'break',
        'Fin de Turno': 'end'
    };
    const STATES = Object.keys(stateToColorId);

    const punchColors = {
        'Puntual':              { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-500' },
        'Tardanza':             { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-500' },
        'Ausencia Justificada': { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-600' },
        'Falta Injustificada':  { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-600' },
        'Salida Anticipada':    { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-500' }
    };
    const ABSENCE_STATUSES = ['Ausencia Justificada', 'Falta Injustificada'];

    const $ = (id) => document.getElementById(id);

    // Escapa HTML para evitar inyección al pintar datos con innerHTML
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));

    const readList = (key) => {
        try {
            const v = JSON.parse(localStorage.getItem(key));
            return Array.isArray(v) ? v : [];
        } catch (_) {
            return [];
        }
    };
    const saveList = (key, list) => localStorage.setItem(key, JSON.stringify(list));
    const empCode = (id) => `EMP-${String(id).padStart(3, '0')}`;
    const avatarFor = (name) => `https://api.dicebear.com/10.x/pixelbot/svg?seed=${encodeURIComponent(name)}&backgroundColor=e2e8f0`;

    // Fecha local (toISOString() usa UTC y de noche en El Salvador devuelve el día siguiente)
    const todayLocal = () => {
        const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    };

    if (!localStorage.getItem(LS_EMP)) saveList(LS_EMP, []);
    if (!localStorage.getItem(LS_PUNCH)) saveList(LS_PUNCH, []);

    let employees = readList(LS_EMP);
    let punches = readList(LS_PUNCH);

    // Reconstruye los selects de estado para que solo existan los 4 AUX del cliente
    // (así no hay que editar las opciones a mano en el HTML)
    (function syncStateSelects() {
        const labels = { 'Disponible': 'Disponible (Activo)', 'Almuerzo': 'Almuerzo', 'Break': 'Break', 'Fin de Turno': 'Fin de Turno (Salida)' };
        const build = (id, withAll) => {
            const sel = $(id);
            if (!sel) return;
            sel.innerHTML = (withAll ? '<option value="ALL">Todos</option>' : '')
                + STATES.map((s) => `<option value="${s}">${labels[s] || s}</option>`).join('');
        };
        build('input-state', false);
        build('filter-status', true);
    })();

    // --- 2. SWEETALERT2 (con respaldo si el CDN no carga) ------------------
    const hasSwal = typeof window.Swal !== 'undefined';
    const SwalToast = hasSwal ? Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    }) : null;

    function notify(icon, message) {
        if (SwalToast) {
            SwalToast.fire({ icon, title: message });
            return;
        }
        const t = $('toast-notification');
        const m = $('toast-message');
        if (!t || !m) return;
        m.textContent = message;
        t.classList.remove('translate-y-24', 'opacity-0');
        setTimeout(() => t.classList.add('translate-y-24', 'opacity-0'), 3000);
    }

    async function askConfirm({ title, html = '', confirmText = 'Confirmar', icon = 'question', danger = false }) {
        if (!hasSwal) return window.confirm(title);
        const result = await Swal.fire({
            title,
            html,
            icon,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            focusCancel: danger,
            confirmButtonColor: danger ? '#DC2626' : '#FF5701',
            cancelButtonColor: '#64748b'
        });
        return result.isConfirmed;
    }

    function alertMessage(icon, title, text) {
        if (hasSwal) return Swal.fire({ icon, title, text, confirmButtonColor: '#FF5701' });
        window.alert(`${title}\n${text || ''}`);
        return Promise.resolve();
    }

    // --- 3. ERRORES INLINE EN FORMULARIOS ----------------------------------
    function setFieldError(input, message) {
        if (!input) return;
        let hint = input.parentElement.querySelector('.field-error');
        if (!message) {
            if (hint) hint.remove();
            input.classList.remove('border-red-500');
            input.classList.add('border-slate-300');
            input.removeAttribute('aria-invalid');
            return;
        }
        if (!hint) {
            hint = document.createElement('p');
            hint.className = 'field-error text-xs text-red-600 mt-1';
            input.insertAdjacentElement('afterend', hint);
        }
        hint.textContent = message;
        input.classList.remove('border-slate-300');
        input.classList.add('border-red-500');
        input.setAttribute('aria-invalid', 'true');
    }

    function showErrors(fieldMap, errors, onlyKey = null) {
        Object.keys(fieldMap).forEach((key) => {
            if (onlyKey && key !== onlyKey) return;
            setFieldError($(fieldMap[key]), errors[key] || '');
        });
    }

    function focusFirstError(fieldMap, errors) {
        const firstKey = Object.keys(fieldMap).find((k) => errors[k]);
        if (firstKey) $(fieldMap[firstKey])?.focus();
    }

    // --- 4. VALIDACIONES DE EMPLEADO ---------------------------------------
    const EMP_FIELDS = {
        name: 'input-name',
        email: 'input-email',
        role: 'input-role',
        department: 'input-department',
        shift: 'input-shift',
        state: 'input-state'
    };

    const LETTER = 'A-Za-zÁÉÍÓÚÜáéíóúüÑñ';
    const NAME_RE = new RegExp(`^[${LETTER}]+(?:[ '\\-][${LETTER}]+)+$`);        // al menos nombre y apellido
    const EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/;
    const ROLE_RE = /^[\p{L}\d][\p{L}\d .,&/()\-]*$/u;

    function readEmployeeForm() {
        return {
            name: $('input-name').value.trim().replace(/\s+/g, ' '),
            email: $('input-email').value.trim().toLowerCase(),
            role: $('input-role').value.trim().replace(/\s+/g, ' '),
            department: $('input-department').value,
            shift: $('input-shift').value,
            state: $('input-state').value
        };
    }

    function validateEmployee(d, editingId) {
        const e = {};

        if (!d.name) e.name = 'El nombre es obligatorio.';
        else if (d.name.length < 5 || d.name.length > 60) e.name = 'Debe tener entre 5 y 60 caracteres.';
        else if (!NAME_RE.test(d.name)) e.name = 'Escribe nombre y apellido, solo letras (sin números ni símbolos).';

        if (!d.email) e.email = 'El correo es obligatorio.';
        else if (d.email.length > 80) e.email = 'El correo no puede superar 80 caracteres.';
        else if (!EMAIL_RE.test(d.email)) e.email = 'Formato de correo inválido (ej. e.castillo@timeshift.com).';
        else if (employees.some((x) => x.id !== editingId && String(x.email).toLowerCase() === d.email)) {
            e.email = 'Ya existe un empleado con este correo.';
        }

        if (!d.role) e.role = 'El cargo es obligatorio.';
        else if (d.role.length < 3 || d.role.length > 50) e.role = 'Debe tener entre 3 y 50 caracteres.';
        else if (!ROLE_RE.test(d.role)) e.role = 'El cargo contiene caracteres no permitidos.';

        if (!DEPARTMENTS.includes(d.department)) e.department = 'Selecciona un departamento válido.';
        if (!SHIFTS.includes(d.shift)) e.shift = 'Selecciona un turno válido.';
        if (!STATES.includes(d.state)) e.state = 'Selecciona un estado válido.';

        return e;
    }

    // --- 5. NAVEGACIÓN ENTRE SECCIONES -------------------------------------
    const navBtnEmpleados = $('nav-btn-empleados');
    const navBtnMarcaciones = $('nav-btn-marcaciones');
    const secEmpleados = $('section-empleados');
    const secMarcaciones = $('section-marcaciones');

    function showSection(id) {
        const activeCls = ['text-white', 'border-b-2', 'border-primary', 'pb-1'];
        const idleCls = ['text-slate-400', 'hover:text-white'];
        const onEmp = id === 'empleados';
        secEmpleados.classList.toggle('hidden', !onEmp);
        secMarcaciones.classList.toggle('hidden', onEmp);
        const [on, off] = onEmp ? [navBtnEmpleados, navBtnMarcaciones] : [navBtnMarcaciones, navBtnEmpleados];
        on.classList.add(...activeCls);
        on.classList.remove(...idleCls);
        off.classList.remove(...activeCls);
        off.classList.add(...idleCls);
    }

    navBtnEmpleados?.addEventListener('click', (e) => { e.preventDefault(); showSection('empleados'); });
    navBtnMarcaciones?.addEventListener('click', (e) => { e.preventDefault(); showSection('marcaciones'); });

    showSection(window.location.hash === '#modulo-marcaciones' ? 'marcaciones' : 'empleados');

    // --- 6. RENDER DE EMPLEADOS --------------------------------------------
    function updateEmployeeSelect() {
        const select = $('select-employee-history');
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '<option value="" disabled selected>Elige un empleado...</option>';
        employees.forEach((emp) => {
            const opt = document.createElement('option');
            opt.value = emp.id;
            opt.textContent = `${emp.name} (${emp.department})`;
            select.appendChild(opt);
        });
        if (currentVal && employees.some((e) => String(e.id) === currentVal)) select.value = currentVal;
    }

    function renderEmployees() {
        employees = readList(LS_EMP);
        updateEmployeeSelect();

        // KPIs
        $('kpi-total-employees').textContent = employees.length;
        $('kpi-active-employees').textContent = employees.filter((e) => e.state !== 'Fin de Turno').length;
        $('kpi-departments-count').textContent = new Set(employees.map((e) => e.department)).size;
        $('kpi-inactive-employees').textContent = employees.filter((e) => e.state === 'Fin de Turno').length;

        const tbody = $('table-employees-body');
        if (!tbody) return;

        // Búsqueda + filtros
        const q = ($('employee-search-input')?.value || '').trim().toLowerCase();
        const fDept = $('filter-department')?.value || 'ALL';
        const fState = $('filter-status')?.value || 'ALL';

        const filtered = employees.filter((emp) => {
            const haystack = [emp.name, emp.email, emp.role, empCode(emp.id), emp.id].join(' ').toLowerCase();
            return (!q || haystack.includes(q))
                && (fDept === 'ALL' || emp.department === fDept)
                && (fState === 'ALL' || emp.state === fState);
        });

        $('table-employees-count').textContent = `Mostrando ${filtered.length} de ${employees.length} empleados`;

        if (filtered.length === 0) {
            const msg = employees.length === 0
                ? 'No hay empleados registrados. Presiona "+ Registrar Nuevo Empleado" para comenzar.'
                : 'Ningún empleado coincide con la búsqueda o los filtros.';
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 font-medium bg-slate-50">${msg}</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((emp) => {
            const style = stateColors[emp.colorId] || stateColors.available;
            return `
            <tr class="hover:bg-[#F8FAFC] transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <img class="h-10 w-10 rounded-full" src="${avatarFor(emp.name)}" alt="${esc(emp.name)}">
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-semibold text-slate-800">${esc(emp.name)}</p>
                            <p class="text-[11px] text-slate-500 font-mono">ID: ${empCode(emp.id)}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-slate-800 font-medium">${esc(emp.role)}</div>
                    <div class="text-xs text-slate-500">${esc(emp.email)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">${esc(emp.department)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${esc(emp.shift)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border border-solid ${style.border} ${style.text} bg-transparent">${esc(emp.state)}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button type="button" data-action="view" data-id="${emp.id}" class="text-xs font-semibold text-brandBlue hover:underline px-2 py-1">Ver Marcaciones</button>
                        <button type="button" data-action="edit" data-id="${emp.id}" class="text-slate-400 hover:text-brandBlue p-1 transition-colors" title="Editar" aria-label="Editar ${esc(emp.name)}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 pointer-events-none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>
                        </button>
                        <button type="button" data-action="delete" data-id="${emp.id}" class="text-slate-400 hover:text-red-600 p-1 transition-colors" title="Eliminar" aria-label="Eliminar ${esc(emp.name)}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 pointer-events-none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    $('employee-search-input')?.addEventListener('input', renderEmployees);
    $('filter-department')?.addEventListener('change', renderEmployees);
    $('filter-status')?.addEventListener('change', renderEmployees);

    // Delegación de eventos: un solo listener para Ver / Editar / Eliminar
    $('table-employees-body')?.addEventListener('click', (ev) => {
        const btn = ev.target.closest('[data-action]');
        if (!btn) return;
        const id = Number(btn.dataset.id);
        if (btn.dataset.action === 'view') viewHistory(id);
        else if (btn.dataset.action === 'edit') editEmployee(id);
        else if (btn.dataset.action === 'delete') deleteEmployee(id);
    });

    // --- 7. CRUD: AGREGAR / EDITAR -----------------------------------------
    const addModal = $('modal-add-employee');
    const formAdd = $('form-add-employee');
    const btnSubmitEmp = formAdd.querySelector('button[type="submit"]');
    let currentEditId = null;

    // Validamos nosotros (mensajes inline), no el globo nativo del navegador
    formAdd.setAttribute('novalidate', '');
    $('input-name').maxLength = 60;
    $('input-email').maxLength = 80;
    $('input-role').maxLength = 50;

    function openEmployeeModal(emp = null) {
        currentEditId = emp ? emp.id : null;
        formAdd.reset();
        showErrors(EMP_FIELDS, {});
        if (emp) {
            $('input-name').value = emp.name;
            $('input-email').value = emp.email;
            $('input-role').value = emp.role;
            $('input-department').value = emp.department;
            $('input-shift').value = emp.shift;
            // Empleados antiguos con AUX ya eliminados (En Tribunal, Reunión) pasan a Disponible
            $('input-state').value = STATES.includes(emp.state) ? emp.state : 'Disponible';
        }
        const title = addModal.querySelector('h3');
        const subtitle = title?.nextElementSibling;
        if (title) title.textContent = emp ? 'Editar Empleado' : 'Registrar Nuevo Empleado';
        if (subtitle) subtitle.textContent = emp ? `Modifica los datos de ${emp.name}` : 'Ingresa los datos para dar de alta al colaborador';
        if (btnSubmitEmp) btnSubmitEmp.textContent = emp ? 'Guardar cambios' : 'Guardar';
        addModal.classList.remove('hidden');
        $('input-name').focus();
    }

    function closeEmployeeModal() {
        addModal.classList.add('hidden');
        currentEditId = null;
    }

    function editEmployee(id) {
        employees = readList(LS_EMP);
        const emp = employees.find((e) => e.id === id);
        if (!emp) {
            alertMessage('error', 'Empleado no encontrado', 'Es posible que ya haya sido eliminado.');
            renderEmployees();
            return;
        }
        openEmployeeModal(emp);
    }

    $('btn-open-add-modal')?.addEventListener('click', () => openEmployeeModal());
    $('btn-close-modal-add')?.addEventListener('click', closeEmployeeModal);
    $('btn-cancel-add')?.addEventListener('click', closeEmployeeModal);
    addModal.addEventListener('mousedown', (e) => { if (e.target === addModal) closeEmployeeModal(); });

    // Validación en vivo: solo del campo que el usuario está tocando
    Object.entries(EMP_FIELDS).forEach(([key, inputId]) => {
        const el = $(inputId);
        const handler = () => {
            employees = readList(LS_EMP);
            showErrors(EMP_FIELDS, validateEmployee(readEmployeeForm(), currentEditId), key);
        };
        el.addEventListener('input', handler);
        el.addEventListener('blur', handler);
        el.addEventListener('change', handler);
    });

    formAdd.addEventListener('submit', async (e) => {
        e.preventDefault();
        employees = readList(LS_EMP); // datos frescos (el dashboard también escribe aquí)

        const data = readEmployeeForm();
        const errors = validateEmployee(data, currentEditId);
        showErrors(EMP_FIELDS, errors);

        if (Object.keys(errors).length) {
            focusFirstError(EMP_FIELDS, errors);
            notify('error', 'Revisa los campos marcados en rojo');
            return;
        }

        const colorId = stateToColorId[data.state] || 'available';

        if (currentEditId !== null) {
            const emp = employees.find((x) => x.id === currentEditId);
            if (!emp) {
                closeEmployeeModal();
                renderEmployees();
                alertMessage('error', 'Empleado no encontrado', 'Es posible que ya haya sido eliminado.');
                return;
            }
            const unchanged = ['name', 'email', 'role', 'department', 'shift', 'state'].every((k) => emp[k] === data[k]);
            if (unchanged) {
                closeEmployeeModal();
                notify('info', 'No hiciste ningún cambio');
                return;
            }
            const ok = await askConfirm({
                title: '¿Guardar los cambios?',
                html: `Se actualizará la información de <b>${esc(emp.name)}</b> (${empCode(emp.id)}).`,
                confirmText: 'Sí, guardar',
                icon: 'question'
            });
            if (!ok) return;
            Object.assign(emp, data, { colorId });
            saveList(LS_EMP, employees);
            closeEmployeeModal();
            renderEmployees();
            if (currentHistoryEmpId === emp.id) viewHistory(emp.id, false);
            notify('success', 'Empleado actualizado con éxito');
        } else {
            const newId = employees.length ? Math.max(...employees.map((x) => Number(x.id) || 0)) + 1 : 1;
            employees.push({ id: newId, ...data, time: '00:00:00', colorId });
            saveList(LS_EMP, employees);
            closeEmployeeModal();
            renderEmployees();
            notify('success', `${data.name} fue registrado (${empCode(newId)})`);
        }
    });

    // --- 8. CRUD: ELIMINAR -------------------------------------------------
    async function deleteEmployee(id) {
        employees = readList(LS_EMP);
        punches = readList(LS_PUNCH);
        const emp = employees.find((e) => e.id === id);
        if (!emp) {
            alertMessage('error', 'Empleado no encontrado', 'Es posible que ya haya sido eliminado.');
            renderEmployees();
            return;
        }
        const nPunches = punches.filter((p) => p.empId === id).length;
        const ok = await askConfirm({
            title: '¿Dar de baja a este empleado?',
            html: `
                <div style="text-align:left;font-size:14px;line-height:1.7">
                    <div><b>${esc(emp.name)}</b> (${empCode(emp.id)})</div>
                    <div>Cargo: ${esc(emp.role)}</div>
                    <div>Departamento: ${esc(emp.department)}</div>
                    <div style="margin-top:8px;color:#b91c1c">
                        También se borrarán sus ${nPunches} marcaciones. Esta acción no se puede deshacer.
                    </div>
                </div>`,
            confirmText: 'Sí, dar de baja',
            icon: 'warning',
            danger: true
        });
        if (!ok) return;

        saveList(LS_EMP, employees.filter((e) => e.id !== id));
        saveList(LS_PUNCH, punches.filter((p) => p.empId !== id));
        punches = readList(LS_PUNCH);

        if (currentHistoryEmpId === id) resetHistoryView();
        renderEmployees();
        notify('success', `${emp.name} fue dado de baja`);
    }

    // Compatibilidad por si otra página llama a estas funciones
    window.editEmployee = editEmployee;
    window.deleteEmployee = deleteEmployee;

    // --- 9. HISTORIAL DE MARCACIONES ---------------------------------------
    let currentHistoryEmpId = null;

    function resetHistoryView() {
        currentHistoryEmpId = null;
        const select = $('select-employee-history');
        if (select) select.selectedIndex = 0;
        const card = $('employee-profile-card');
        if (card) card.innerHTML = '';
        $('history-badge-total').textContent = '0 días';
        $('table-history-body').innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400 font-medium bg-slate-50">Seleccione un empleado del directorio para ver su historial.</td></tr>';
    }

    $('select-employee-history')?.addEventListener('change', (e) => viewHistory(Number(e.target.value)));

    function viewHistory(empId, scroll = true) {
        employees = readList(LS_EMP);
        const emp = employees.find((e) => e.id === empId);
        if (!emp) { resetHistoryView(); return; }

        currentHistoryEmpId = empId;
        const select = $('select-employee-history');
        if (select) select.value = empId;

        const card = $('employee-profile-card');
        if (card) {
            card.innerHTML = `
                <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <img src="${avatarFor(emp.name)}" class="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white shadow-sm flex-shrink-0" alt="${esc(emp.name)}">
                    <div>
                        <h3 class="text-base sm:text-lg font-bold text-slate-800">${esc(emp.name)}</h3>
                        <p class="text-xs sm:text-sm text-slate-500">${esc(emp.role)} &bull; ${esc(emp.department)} &bull; Turno: ${esc(emp.shift || '08:00 - 17:00')}</p>
                    </div>
                </div>`;
        }
        renderHistoryTable();
        if (scroll) secMarcaciones?.scrollIntoView({ behavior: 'smooth' });
    }
    window.viewHistory = viewHistory;

    function renderHistoryTable() {
        const tbody = $('table-history-body');
        if (!tbody || currentHistoryEmpId === null) return;
        punches = readList(LS_PUNCH);

        const list = punches
            .filter((p) => p.empId === currentHistoryEmpId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        $('history-badge-total').textContent = `${list.length} registros`;

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-500 text-sm">No hay marcaciones registradas para este empleado.</td></tr>';
            return;
        }

        tbody.innerHTML = list.map((p) => {
            const s = punchColors[p.status] || punchColors.Puntual;
            return `
            <tr class="hover:bg-[#F8FAFC] transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">${esc(p.date)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">${esc(p.checkin)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">${esc(p.breakDuration)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">${esc(p.checkout)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-brandBlue text-center font-mono">${esc(p.effective)}</td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${s.bg} ${s.text} border ${s.border}">${esc(p.status)}</span></td>
                <td class="px-6 py-4 text-sm text-slate-500 italic max-w-xs truncate">${esc(p.notes || '-')}</td>
            </tr>`;
        }).join('');
    }

    // --- 10. MARCACIÓN MANUAL (con validaciones) ---------------------------
    const punchModal = $('modal-add-punch');
    const formPunch = $('form-add-punch');
    const PUNCH_FIELDS = {
        date: 'punch-date',
        status: 'punch-status',
        checkin: 'punch-checkin',
        breakDuration: 'punch-break',
        checkout: 'punch-checkout',
        notes: 'punch-notes'
    };
    const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;
    const BREAK_RE = /^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/;
    const toMin = (t) => { const [h, m] = t.split(':'); return Number(h) * 60 + Number(m); };
    const fmtHM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

    if (formPunch) formPunch.setAttribute('novalidate', '');
    if ($('punch-notes')) $('punch-notes').maxLength = 200;

    function readPunchForm() {
        return {
            date: $('punch-date').value,
            status: $('punch-status').value,
            checkin: $('punch-checkin').value,
            breakDuration: $('punch-break').value.trim(),
            checkout: $('punch-checkout').value,
            notes: $('punch-notes').value.trim()
        };
    }

    function validatePunch(d) {
        const e = {};
        const absence = ABSENCE_STATUSES.includes(d.status);

        if (!d.date) e.date = 'La fecha es obligatoria.';
        else if (d.date > todayLocal()) e.date = 'No se puede registrar una fecha futura.';
        else {
            punches = readList(LS_PUNCH);
            if (punches.some((p) => p.empId === currentHistoryEmpId && p.date === d.date)) {
                e.date = 'Ya existe una marcación para esta fecha.';
            }
        }

        if (!Object.keys(punchColors).includes(d.status)) e.status = 'Selecciona un estado válido.';

        if (!absence) {
            if (!TIME_RE.test(d.checkin)) e.checkin = 'Hora de entrada inválida.';
            if (!TIME_RE.test(d.checkout)) e.checkout = 'Hora de salida inválida.';
            if (!BREAK_RE.test(d.breakDuration)) e.breakDuration = 'Usa el formato HH:MM:SS (ej. 01:00:00).';

            if (!e.checkin && !e.checkout) {
                const worked = toMin(d.checkout) - toMin(d.checkin);
                if (worked <= 0) e.checkout = 'La salida debe ser posterior a la entrada.';
                else if (!e.breakDuration) {
                    const br = toMin(d.breakDuration);
                    if (br >= worked) e.breakDuration = 'La pausa no puede ser mayor o igual al tiempo trabajado.';
                }
            }
        }

        if (d.notes.length > 200) e.notes = 'Máximo 200 caracteres.';
        else if (d.status === 'Ausencia Justificada' && d.notes.length < 5) {
            e.notes = 'Una ausencia justificada requiere una justificación (mín. 5 caracteres).';
        }
        return e;
    }

    // En ausencias/faltas no hay horas: se deshabilitan esos campos
    function syncPunchInputs() {
        const absence = ABSENCE_STATUSES.includes($('punch-status').value);
        ['punch-checkin', 'punch-break', 'punch-checkout'].forEach((id) => {
            const el = $(id);
            el.disabled = absence;
            el.classList.toggle('opacity-50', absence);
            if (absence) setFieldError(el, '');
        });
    }

    $('btn-add-punch')?.addEventListener('click', () => {
        if (currentHistoryEmpId === null) {
            alertMessage('info', 'Selecciona un empleado', 'Elige un empleado primero para registrarle una marcación.');
            return;
        }
        const emp = employees.find((x) => x.id === currentHistoryEmpId);
        if (!emp) { resetHistoryView(); return; }
        $('manual-punch-emp-name').textContent = emp.name;
        formPunch.reset();
        showErrors(PUNCH_FIELDS, {});
        $('punch-date').value = todayLocal();
        $('punch-date').max = todayLocal();
        syncPunchInputs();
        punchModal.classList.remove('hidden');
    });

    const closePunchModal = () => punchModal.classList.add('hidden');
    $('btn-close-modal-punch')?.addEventListener('click', closePunchModal);
    $('btn-cancel-punch')?.addEventListener('click', closePunchModal);
    punchModal?.addEventListener('mousedown', (e) => { if (e.target === punchModal) closePunchModal(); });

    Object.entries(PUNCH_FIELDS).forEach(([key, inputId]) => {
        const el = $(inputId);
        if (!el) return;
        const handler = () => {
            if (key === 'status') { syncPunchInputs(); showErrors(PUNCH_FIELDS, validatePunch(readPunchForm())); return; }
            showErrors(PUNCH_FIELDS, validatePunch(readPunchForm()), key);
        };
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
    });

    formPunch?.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = readPunchForm();
        const errors = validatePunch(d);
        showErrors(PUNCH_FIELDS, errors);
        if (Object.keys(errors).length) {
            focusFirstError(PUNCH_FIELDS, errors);
            notify('error', 'Revisa los campos marcados en rojo');
            return;
        }

        const absence = ABSENCE_STATUSES.includes(d.status);
        let checkin = '--:--', checkout = '--:--', breakDuration = '00:00:00', effective = '00:00';
        if (!absence) {
            const [h, m, s] = d.breakDuration.match(BREAK_RE).slice(1);
            breakDuration = `${h.padStart(2, '0')}:${m}:${s || '00'}`;
            checkin = d.checkin;
            checkout = d.checkout;
            effective = fmtHM(toMin(d.checkout) - toMin(d.checkin) - toMin(breakDuration));
        }

        punches = readList(LS_PUNCH);
        const newId = punches.length ? Math.max(...punches.map((p) => Number(p.id) || 0)) + 1 : 1;
        punches.push({
            id: newId,
            empId: currentHistoryEmpId,
            date: d.date,
            status: d.status,
            checkin,
            breakDuration,
            checkout,
            effective,
            notes: d.notes
        });
        saveList(LS_PUNCH, punches);
        renderHistoryTable();
        closePunchModal();
        notify('success', 'Marcación agregada con éxito');
    });

    // --- 11. CIERRE CON ESC ------------------------------------------------
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (hasSwal && Swal.isVisible()) return; // SweetAlert2 maneja su propio Esc
        closeEmployeeModal();
        closePunchModal();
    });

    // --- 12. RENDER INICIAL ------------------------------------------------
    renderEmployees();

    // Enlaces desde el dashboard: ?action=new  |  ?empId=3  |  ts_view_emp en localStorage
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') openEmployeeModal();

    const viewParam = params.get('empId') || localStorage.getItem('ts_view_emp');
    if (viewParam) {
        const n = parseInt(String(viewParam).replace(/\D/g, ''), 10);
        localStorage.removeItem('ts_view_emp');
        if (n) {
            showSection('marcaciones');
            setTimeout(() => viewHistory(n), 100);
        }
    }

    // --- 13. ENCABEZADO (perfil del administrador) -------------------------
    const adminName = sessionStorage.getItem('ts_name') || localStorage.getItem('ts_name')
        || (tsUser === 'cgerente' ? 'Carlos Guevara' : 'Jovita Alvarado');
    const adminCargo = sessionStorage.getItem('ts_cargo') || localStorage.getItem('ts_cargo')
        || (tsUser === 'cgerente' ? 'Gerente' : 'Dueña');
    const headerAvatar = `https://api.dicebear.com/10.x/pixelbot/svg?seed=${encodeURIComponent(adminName)}&backgroundColor=1e293b`;

    [['header-user-name', adminName], ['header-user-cargo', adminCargo],
     ['header-user-name-mobile', adminName], ['header-user-cargo-mobile', adminCargo],
     ['header-user-badge', adminName]].forEach(([id, text]) => { if ($(id)) $(id).textContent = text; });
    ['header-user-avatar', 'header-user-avatar-mobile'].forEach((id) => { if ($(id)) $(id).src = headerAvatar; });
});
