document.addEventListener('DOMContentLoaded', () => {
    // 1. Employee Table Data
    const employees = [
        { name: 'John Miller', department: 'Operations', state: 'At Court', time: '01:14:02', colorId: 'court' },
        { name: 'Alice Jenkins', department: 'Legal Advisory', state: 'Available', time: '00:45:10', colorId: 'available' },
        { name: 'Robert Chen', department: 'Executive Staff', state: 'Client Meeting', time: '02:10:00', colorId: 'meeting' },
        { name: 'Diana Prince', department: 'Public Relations', state: 'Lunch Break', time: '00:22:45', colorId: 'lunch' },
        { name: 'Marcus Aurelius', department: 'Strategy', state: 'At Court', time: '00:08:12', colorId: 'court' },
        { name: 'Selina Kyle', department: 'Security Audit', state: 'Available', time: '04:55:18', colorId: 'available' },
        { name: 'Bruce Wayne', department: 'Board Admin', state: 'End of Shift', time: '00:00:00', colorId: 'end' },
    ];

    // State Colors Definitions based on the design
    const stateColors = {
        'available': { border: 'border-[#16A34A]', text: 'text-[#16A34A]' },
        'court': { border: 'border-[#1e3a8a]', text: 'text-[#1e3a8a]' },
        'meeting': { border: 'border-[#D97706]', text: 'text-[#D97706]' },
        'lunch': { border: 'border-slate-500', text: 'text-slate-500' },
        'end': { border: 'border-[#DC2626]', text: 'text-[#DC2626]' }
    };

    const tbody = document.getElementById('employee-table-body');
    
    employees.forEach(emp => {
        const style = stateColors[emp.colorId] || stateColors['available'];
        
        // Outlined badge style to match Admin Panel spec
        const badgeHTML = `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-solid ${style.border} ${style.text} bg-transparent">
            ${emp.state}
        </span>`;

        // Generate generic avatars
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
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                ${emp.department}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${badgeHTML}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 text-right font-mono">
                ${emp.time}
            </td>
        `;
        tbody.appendChild(tr);
    });

    // 2. Chart Configuration
    const chartColors = {
        'Available': '#16A34A',
        'At Court': '#1e3a8a',
        'Client Meeting': '#D97706',
        'Lunch Break': '#64748b'
    };

    const chartData = {
        labels: ['Available', 'At Court', 'Client Meeting', 'Lunch Break'],
        datasets: [{
            data: [50, 33, 11, 6],
            backgroundColor: [
                chartColors['Available'],
                chartColors['At Court'],
                chartColors['Client Meeting'],
                chartColors['Lunch Break']
            ],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    const ctx = document.getElementById('timeDistributionChart');
    if(ctx) {
        new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%', // Thin ring
                plugins: {
                    legend: {
                        display: false // We use custom legend below
                    },
                    tooltip: {
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

    // 3. Custom Legend Rendering
    const legendContainer = document.getElementById('chart-legend');
    if(legendContainer) {
        chartData.labels.forEach((label, index) => {
            const color = chartData.datasets[0].backgroundColor[index];
            const value = chartData.datasets[0].data[index];
            
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between text-sm';
            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="w-3 h-3 rounded-full" style="background-color: ${color}"></span>
                    <span class="text-slate-600 font-medium">${label}</span>
                </div>
                <span class="font-bold text-slate-800">${value}%</span>
            `;
            legendContainer.appendChild(item);
        });
    }
});
