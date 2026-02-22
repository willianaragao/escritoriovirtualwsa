document.addEventListener('DOMContentLoaded', () => {
    // Force cache refresh by changing a constant
    const VERSION = '1.1.0';
    console.log(`WSA Dashboard v${VERSION} loading...`);

    // Setup Chart.js
    const ctx = document.getElementById('expensesChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Combustível', 'Manutenção', 'Dívidas Fixas', 'Contas', 'Alimentação'],
                datasets: [{
                    data: [15, 10, 45, 20, 10],
                    backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: {
                        position: 'left',
                        labels: {
                            color: '#94a3b8',
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }

    // Transactions Data
    const transactions = [
        { date: '21/02/2026', desc: 'Venda de Garrafas PET', cat: 'Vendas', type: 'Entrada', val: 1250.00 },
        { date: '20/02/2026', desc: 'Energia Elétrica', cat: 'Infraestrutura', type: 'Saída', val: 450.32 },
        { date: '19/02/2026', desc: 'Materiais de Produção', cat: 'Estoque', type: 'Saída', val: 2300.00 },
        { date: '18/02/2026', desc: 'Consultoria Financeira', cat: 'Vendas', type: 'Entrada', val: 3400.00 }
    ];

    const tableMount = document.getElementById('transactionMount');
    if (tableMount) {
        let html = `
            <div class="transaction-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Categoria</th>
                            <th>Tipo</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        transactions.forEach(t => {
            const isEntrada = t.type === 'Entrada';
            html += `
                <tr>
                    <td>${t.date}</td>
                    <td style="font-weight: 500;">${t.desc}</td>
                    <td>${t.cat}</td>
                    <td><span class="type-badge ${isEntrada ? 'type-entrada' : 'type-saida'}">${t.type}</span></td>
                    <td style="font-weight: 700; color: ${isEntrada ? '#10b981' : '#ef4444'}">
                        R$ ${Math.abs(t.val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        tableMount.innerHTML = html;
    }

    // Menu interaction
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
});
