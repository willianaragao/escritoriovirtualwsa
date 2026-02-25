// Supabase Configuration
const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // Force cache refresh by changing a constant
    const VERSION = '1.2.0';
    console.log(`WSA Dashboard v${VERSION} loading...`);

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // --- Data Fetching Functions ---

    async function fetchStats() {
        try {
            // These table names are placeholders and should be updated by the user
            const { data, error } = await supabaseClient.from('stats').select('*').single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error fetching stats:', err);
            return null;
        }
    }

    async function fetchTransactions() {
        try {
            const { data, error } = await supabaseClient
                .from('transactions')
                .select('*')
                .order('date', { ascending: false });
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error fetching transactions:', err);
            return [];
        }
    }

    async function fetchTopClients() {
        try {
            const { data, error } = await supabaseClient
                .from('clients')
                .select('*')
                .order('value', { ascending: false })
                .limit(5);
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error fetching top clients:', err);
            return [];
        }
    }

    // --- UI Update functions ---

    function updateStatsUI(stats) {
        if (!stats) return;
        // Map stats to UI elements - assuming element IDs or classes exist
        // This part might need further refinement based on index.html structure
        // For now, updating elements with classes based on the HTML structure
        const elements = {
            entradas: document.querySelector('.stat-card.entradas .stat-value'),
            saidas: document.querySelector('.stat-card.saidas .stat-value'),
            saldo: document.querySelector('.stat-card.saldo .stat-value'),
            dividas: document.querySelector('.stat-card.dividas .stat-value'),
            previsao_recebimento: document.querySelector('.stat-card.previsao .stat-value'),
            a_receber: document.querySelector('.previsao-row:nth-child(1) strong'),
            pendentes: document.querySelector('.previsao-row:nth-child(2) strong'),
            a_pagar: document.querySelector('.stat-card.apagar .stat-value')
        };

        if (elements.entradas) elements.entradas.textContent = formatCurrency(stats.entradas);
        if (elements.saidas) elements.saidas.textContent = formatCurrency(stats.saidas);
        if (elements.saldo) elements.saldo.textContent = formatCurrency(stats.saldo);
        if (elements.dividas) elements.dividas.textContent = formatCurrency(stats.dividas_fixas);
        if (elements.previsao_recebimento) elements.previsao_recebimento.textContent = formatCurrency(stats.previsao_recebimento);
        if (elements.a_receber) elements.a_receber.textContent = formatCurrency(stats.a_receber);
        if (elements.pendentes) elements.pendentes.textContent = formatCurrency(stats.pendentes);
        if (elements.a_pagar) elements.a_pagar.textContent = formatCurrency(stats.a_pagar);
    }

    function formatCurrency(val) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    }

    function renderTransactions(transactions) {
        const tableMount = document.getElementById('transactionMount');
        if (!tableMount) return;

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
            const dateStr = new Date(t.date).toLocaleDateString('pt-BR');
            html += `
                <tr>
                    <td>${dateStr}</td>
                    <td style="font-weight: 500;">${t.description || t.desc}</td>
                    <td>${t.category || t.cat}</td>
                    <td><span class="type-badge ${isEntrada ? 'type-entrada' : 'type-saida'}">${t.type}</span></td>
                    <td style="font-weight: 700; color: ${isEntrada ? '#10b981' : '#ef4444'}">
                        ${formatCurrency(t.value || t.val)}
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        tableMount.innerHTML = html;
    }

    function renderTopClients(clients) {
        const topClientsMount = document.getElementById('topClientsMount');
        if (!topClientsMount) return;

        topClientsMount.innerHTML = clients.map((c, index) => `
            <div class="top-client-item">
                <div class="client-info">
                    <div class="client-rank-badge">${index + 1}º</div>
                    <div class="client-details">
                        <span class="name">${c.name}</span>
                        <span class="tag">${c.tag || 'Cliente'}</span>
                    </div>
                </div>
                <div class="client-value">${formatCurrency(c.value || c.val)} ${c.trend ? `<span class="client-trend">~</span>` : ''}</div>
            </div>
        `).join('');
    }

    // --- Initial Load ---

    const [stats, transactions, clients] = await Promise.all([
        fetchStats(),
        fetchTransactions(),
        fetchTopClients()
    ]);

    updateStatsUI(stats);
    renderTransactions(transactions);
    renderTopClients(clients);

    // Setup Chart.js with dynamic data (example from stats)
    const ctx = document.getElementById('expensesChart');
    if (ctx && stats && stats.expenses_data) {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: stats.expenses_labels || ['Combustível', 'Manutenção', 'Dívidas Fixas', 'Contas', 'Alimentação'],
                datasets: [{
                    data: stats.expenses_data,
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

    // --- Navigation Logic ---

    function switchView(viewId) {
        document.querySelectorAll('#dashboard-view, #dividas-view').forEach(view => {
            view.style.display = view.id === viewId ? 'block' : 'none';
        });

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        if (viewId === 'dashboard-view') {
            document.getElementById('nav-dashboard').classList.add('active');
        } else if (viewId === 'dividas-view') {
            document.getElementById('nav-dividas').classList.add('active');
            loadDividasFixas(); // Load data when switching to this view
        }
    }

    document.getElementById('nav-dashboard').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('dashboard-view');
    });

    document.getElementById('nav-dividas').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('dividas-view');
    });

    // --- Data Fetching Functions ---

    async function fetchDividasFixas() {
        try {
            const { data, error } = await supabaseClient
                .from('dividas_fixas_wsa')
                .select('*')
                .order('vencimento', { ascending: true });
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error fetching dividas fixas:', err);
            return [];
        }
    }

    // --- UI Update functions ---

    async function loadDividasFixas() {
        const data = await fetchDividasFixas();
        renderDividasFixas(data);
    }

    function renderDividasFixas(dividas) {
        const dividasMount = document.getElementById('dividasFixasMount');
        const totalDisplay = document.getElementById('total-dividas-fixas');
        if (!dividasMount) return;

        let total = 0;
        dividasMount.innerHTML = dividas.map(d => {
            const val = d.valor_mensal || d.valor || 0;
            total += val;
            const status = d.status || 'Ativa';
            const isPago = status.toLowerCase() === 'pago';

            return `
                <tr>
                    <td style="font-weight: 500;">${d.descricao}</td>
                    <td>${d.vencimento}</td>
                    <td>
                        <span class="badge ${isPago ? 'badge-pago' : 'badge-ativa'}">
                            ${status}
                        </span>
                    </td>
                    <td style="font-weight: 700;">${formatCurrency(val)}</td>
                    <td style="text-align: right;">
                        <button class="action-btn" title="Editar"><i data-lucide="edit-3"></i></button>
                        <button class="action-btn" title="Excluir" style="color: #ef4444;"><i data-lucide="trash-2"></i></button>
                    </td>
                </tr>
            `;
        }).join('');

        if (totalDisplay) totalDisplay.textContent = formatCurrency(total);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    switchView('dashboard-view');
});
