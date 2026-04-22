
import React, { useState, useEffect } from 'react';
import {
    Settings, Plus, Calendar as CalendarIcon,
    TrendingUp, TrendingDown, DollarSign,
    Package, PieChart, Edit3, Trash2,
    ChevronDown, Info, Trash
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './ProducaoView.css';
import ConfiguracaoValoresModal from '../components/ConfiguracaoValoresModal';
import GastoMateriaPrimaModal from '../components/GastoMateriaPrimaModal';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const fmt = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const DEFAULT_PRODUCTS = [
    { tipo: '500ml', valor: 58.00, peso: 0.00 },
    { tipo: '450ml', valor: 52.00, peso: 0.00 },
    { tipo: '300ml', valor: 47.00, peso: 0.00 },
    { tipo: '1 litro', valor: 46.00, peso: 0.00 }
];

const ProducaoView = ({ selectedMonth, setSelectedMonth, selectedYear, setSelectedYear }) => {
    const [loading, setLoading] = useState(true);
    const [producoes, setProducoes] = useState([]);
    const [stats, setStats] = useState({
        totalProducao: 0,
        countProducao: 0,
        custoProducao: 0,
        lucroProducao: 0,
        despesasFixas: 0,
        despesasMensais: 0,
        lucroLiquido: 0,
        margemLucro: 0,
        materialAlta: 0,
        materialBaixa: 0,
        materialAltaSacos: 0,
        materialBaixaSacos: 0
    });

    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Config states
    const [config, setConfig] = useState(() => {
        const saved = localStorage.getItem('wsa_producao_config_v3');
        if (saved) {
            const parsed = JSON.parse(saved);
            let updated = false;

            // Ensure 450ml is present
            if (parsed.produtos && !parsed.produtos.find(p => p.tipo === '450ml')) {
                parsed.produtos.push({ tipo: '450ml', valor: 52.00 });
                updated = true;
            }

            // Ensure 1 litro is present
            if (parsed.produtos && !parsed.produtos.find(p => p.tipo === '1 litro')) {
                parsed.produtos.push({ tipo: '1 litro', valor: 46.00 });
                updated = true;
            }

            // Update prices for 500ml and 300ml to user's new defaults if still at old defaults
            if (parsed.produtos) {
                const prod500 = parsed.produtos.find(p => p.tipo === '500ml');
                if (prod500 && prod500.valor === 47.00) { prod500.valor = 58.00; updated = true; }

                const prod300 = parsed.produtos.find(p => p.tipo === '300ml');
                if (prod300 && prod300.valor === 35.00) { prod300.valor = 47.00; updated = true; }
            }

            if (updated) {
                localStorage.setItem('wsa_producao_config_v3', JSON.stringify(parsed));
            }
            return parsed;
        }
        return {
            kgPorSaco: 25,
            precoKgAlta: 13.40,
            precoKgBaixa: 13.90,
            produtos: DEFAULT_PRODUCTS
        };
    });

    // Form states
    const [form, setForm] = useState({
        data: new Date().toISOString().split('T')[0],
        preco_kg_alta: config.precoKgAlta,
        qtd_sacos_alta: '',
        preco_kg_baixa: config.precoKgBaixa,
        qtd_baixa: '',
        produtos: []
    });

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Reutilizando tabela original: gastos_materia_prima
            const { data: prodData } = await supabase
                .from('gastos_materia_prima')
                .select('*')
                .order('data', { ascending: false });

            const currentProducoes = (prodData || []).filter(p => {
                const pDate = new Date(p.data + 'T12:00:00');
                return pDate.getMonth() === selectedMonth && pDate.getFullYear() === selectedYear;
            });
            setProducoes(currentProducoes);

            // 1. Dívidas Fixas (Obrigação do Mês): Fetch da tabela de dividas_fixas_wsa (Target: 14.717)
            const { data: divData } = await supabase.from('dividas_fixas_wsa').select('*');
            const mesRef = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
            const mapByDesc = {};

            // First pass: master records
            (divData || []).forEach(d => {
                if (!d.mes_referencia) mapByDesc[d.descricao || d.nome] = d;
            });
            // Second pass: monthly specific records override master
            (divData || []).forEach(d => {
                if (d.mes_referencia === mesRef) mapByDesc[d.descricao || d.nome] = d;
            });

            const totalFixedBudget = Object.values(mapByDesc).reduce((acc, d) => {
                if (d.ativa === false) return acc;
                const nome = (d.nome || d.descricao || '').toLowerCase();
                const cat = (d.categoria || '').toLowerCase();
                const isMateriaPrima = nome.includes('alta') || nome.includes('baixa') || nome.includes('matéria') || nome.includes('materia') ||
                    cat.includes('alta') || cat.includes('baixa') || cat.includes('matéria') || cat.includes('materia');
                if (isMateriaPrima) return acc;
                return acc + (Number(d.valor || d.valor_mensal) || 0);
            }, 0);

            // 2. Fetch Despesas do Mês (Tabela despesas) para cálculo das variáveis
            const { data: despData } = await supabase
                .from('despesas')
                .select('valor, data, descricao, categoria, business_unit');

            const filteredDespesas = (despData || []).filter(d => {
                const dDate = new Date(d.data + 'T12:00:00');
                const isSamePeriod = dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear;
                // APENAS PEAD (PEAD ou null)
                const isPEAD = !d.business_unit || d.business_unit === 'PEAD';
                return isSamePeriod && isPEAD;
            });

            const totalDespesasGeral = filteredDespesas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

            // Identificar Pagamentos de Fixas, Matéria Prima e Retiradas (STRICT CATEGORY MATCH)
            // Fixas: "Dívidas Fixas", "Fixa"
            // MP: "Matéria Prima", "Materia Prima"
            // Retiradas: "Retirada de lucro"
            const totalFixasPagas = filteredDespesas.reduce((acc, d) => {
                const cat = (d.categoria || '').toLowerCase();
                if (cat.includes('fixa')) return acc + (Number(d.valor) || 0);
                return acc;
            }, 0);

            const totalMateriaPrimaPagas = filteredDespesas.reduce((acc, d) => {
                const cat = (d.categoria || '').toLowerCase();
                if (cat.includes('matéria prima') || cat.includes('materia prima')) return acc + (Number(d.valor) || 0);
                return acc;
            }, 0);

            const totalRetiradas = filteredDespesas.reduce((acc, d) => {
                const cat = (d.categoria || '').toLowerCase();
                if (cat.includes('retirada')) return acc + (Number(d.valor) || 0);
                return acc;
            }, 0);

            // Despesas Mensais (Variáveis): Geral - FixasPagas - MP - Retiradas
            const totalDespesasMensais = totalDespesasGeral - totalFixasPagas - totalMateriaPrimaPagas - totalRetiradas;
            const totalDespesasFixas = totalFixedBudget;

            // Calculations
            const totalProdVal = currentProducoes.reduce((acc, p) => acc + (Number(p.valor_producao) || 0), 0);
            const totalCustoVal = currentProducoes.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
            const lucroProd = totalProdVal - totalCustoVal;

            // Lógica para lidar com registros antigos (legado) e novos (detalhados)
            let matAlta = 0;
            let matBaixa = 0;
            let matAltaSacos = 0;
            let matBaixaSacos = 0;

            currentProducoes.forEach(p => {
                const desc = (p.descricao || '') + ' ' + (p.fornecedor || '');

                // 1. Tentar campos novos primeiro
                if (p.custo_alta || p.custo_baixa) {
                    matAlta += Number(p.custo_alta || 0);
                    matBaixa += Number(p.custo_baixa || 0);
                    matAltaSacos += Number(p.qtd_sacos_alta || 0);
                    matBaixaSacos += Number(p.qtd_sacos_baixa || 0);
                    return;
                }

                // 2. Tentar Parsear Descrição (Regex para Alta e Baixa)
                // Padrão: Alta: X sacos (R$ Y/kg)
                const altaMatch = desc.match(/Alta:\s*([\d.]+)\s*sacos?\s*\(R\$\s*([\d.]+)\/kg\)/i);
                const baixaMatch = desc.match(/Baixa:\s*([\d.]+)\s*sacos?\s*\(R\$\s*([\d.]+)\/kg\)/i);

                let foundAlta = false;
                let foundBaixa = false;

                if (altaMatch) {
                    const qtd = parseFloat(altaMatch[1]);
                    const preco = parseFloat(altaMatch[2]);
                    const custo = qtd * preco * config.kgPorSaco;
                    matAlta += custo;
                    matAltaSacos += qtd;
                    foundAlta = true;
                }

                if (baixaMatch) {
                    const qtd = parseFloat(baixaMatch[1]);
                    const preco = parseFloat(baixaMatch[2]);
                    const custo = qtd * preco * config.kgPorSaco;
                    matBaixa += custo;
                    matBaixaSacos += qtd;
                    foundBaixa = true;
                }

                // 3. Fallback se não encontrar nada mas tiver valor
                if (!foundAlta && !foundBaixa && p.valor) {
                    // Assume que é tudo Alta por padrão se não houver indicação
                    matAlta += Number(p.valor);
                    matAltaSacos += Number(p.quantidade || 0);
                }
            });

            const totalGastosExtras = totalDespesasFixas + totalDespesasMensais;
            const lucroLiq = totalProdVal - totalCustoVal - totalGastosExtras;
            const margem = totalProdVal > 0 ? (lucroProd / totalProdVal) * 100 : 0;

            setStats({
                totalProducao: totalProdVal,
                countProducao: currentProducoes.length,
                custoProducao: totalCustoVal,
                lucroProducao: lucroProd,
                despesasFixas: totalDespesasFixas,
                despesasMensais: totalDespesasMensais,
                lucroLiquido: lucroLiq,
                margemLucro: margem,
                materialAlta: matAlta,
                materialBaixa: matBaixa,
                materialAltaSacos: matAltaSacos,
                materialBaixaSacos: matBaixaSacos
            });

        } catch (err) {
            console.error('Erro ao buscar dados:', err);
        } finally {
            setLoading(false);
        }
    };

    const addProductRow = () => {
        const firstProd = config.produtos[0] || { tipo: '', valor: 0 };
        setForm({
            ...form,
            produtos: [...form.produtos, { tipo: firstProd.tipo, quantidade: 0, valor_un: firstProd.valor }]
        });
    };

    const removeProductRow = (index) => {
        const newProds = [...form.produtos];
        newProds.splice(index, 1);
        setForm({ ...form, produtos: newProds });
    };

    const updateProductRow = (index, field, value) => {
        const newProds = [...form.produtos];
        newProds[index][field] = value;
        if (field === 'tipo') {
            const prodDef = config.produtos.find(p => p.tipo === value);
            if (prodDef) newProds[index].valor_un = prodDef.valor;
        }
        setForm({ ...form, produtos: newProds });
    };

    const handleEditRecord = (p) => {
        const desc = (p.descricao || '') + ' ' + (p.fornecedor || '');
        const altaMatch = desc.match(/Alta:\s*([\d.]+)\s*sacos?\s*\(R\$\s*([\d.]+)\/kg\)/i);
        const baixaMatch = desc.match(/Baixa:\s*([\d.]+)\s*sacos?\s*\(R\$\s*([\d.]+)\/kg\)/i);

        setEditingId(p.id);
        setForm({
            data: p.data,
            preco_kg_alta: altaMatch ? Number(altaMatch[2]) : config.precoKgAlta,
            qtd_sacos_alta: altaMatch ? Number(altaMatch[1]) : '',
            preco_kg_baixa: baixaMatch ? Number(baixaMatch[2]) : config.precoKgBaixa,
            qtd_baixa: baixaMatch ? Number(baixaMatch[1]) : '',
            produtos: p.produtos || []
        });
        setIsAddModalOpen(true);
    };

    const handleSaveProducao = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Pegar o ID do usuário logado
            const savedUser = localStorage.getItem('wsa_user');
            const user = savedUser ? JSON.parse(savedUser) : null;
            const userId = user?.id || user?.user?.id;

            if (!userId) {
                alert('Erro: Usuário não identificado. Por favor, faça login novamente.');
                return;
            }

            const custoAlta = (Number(form.preco_kg_alta) || 0) * (Number(form.qtd_sacos_alta) || 0) * config.kgPorSaco;
            const custoBaixa = (Number(form.preco_kg_baixa) || 0) * (Number(form.qtd_baixa) || 0) * config.kgPorSaco;
            const valorProducaoTotal = form.produtos.reduce((acc, p) => acc + (Number(p.quantidade) * Number(p.valor_un)), 0);

            // Mapeamento para gastos_materia_prima (usando colunas existentes)
            const payload = {
                user_id: userId,
                data: form.data,
                valor: custoAlta + custoBaixa,
                quantidade: (Number(form.qtd_sacos_alta) || 0) + (Number(form.qtd_baixa) || 0),
                unidade: 'sacos',
                preco_por_kg: Number(form.preco_kg_alta),
                valor_producao: valorProducaoTotal,
                produtos: form.produtos,
                descricao: `Produção: ${form.produtos.map(p => `${p.quantidade}x ${p.tipo}`).join(', ')}`,
                fornecedor: `Alta: ${form.qtd_sacos_alta} sacos (R$ ${form.preco_kg_alta}/kg) | Baixa: ${form.qtd_baixa} sacos (R$ ${form.preco_kg_baixa}/kg)`
            };

            let res;
            if (editingId) {
                res = await supabase.from('gastos_materia_prima').update(payload).eq('id', editingId);
            } else {
                res = await supabase.from('gastos_materia_prima').insert([payload]);
            }

            if (res.error) throw res.error;

            setIsAddModalOpen(false);
            setEditingId(null);
            setForm({
                data: new Date().toISOString().split('T')[0],
                preco_kg_alta: config.precoKgAlta,
                qtd_sacos_alta: '',
                preco_kg_baixa: config.precoKgBaixa,
                qtd_baixa: '',
                produtos: []
            });
            fetchData();
        } catch (err) {
            console.error('Erro detalhado:', err);
            alert(`Erro ao salvar: ${err.message || 'Verifique sua conexão ou permissões.'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRecord = async (id) => {
        if (!confirm('Deseja excluir este registro?')) return;
        await supabase.from('gastos_materia_prima').delete().eq('id', id);
        fetchData();
    };

    const saveConfig = () => {
        localStorage.setItem('wsa_producao_config_v3', JSON.stringify(config));
        setIsConfigModalOpen(false);
    };

    return (
        <div className="producao-container">
            <header className="producao-header">
                <div className="producao-header-left">
                    <h1>Controle de Lucro Sob Produção</h1>
                    <p>Análise de vendas e lucratividade mensal (Tabela: gastos_materia_prima)</p>
                </div>
                <div className="producao-header-right">
                    <button className="btn-config" onClick={() => setIsConfigModalOpen(true)}>
                        <Settings size={18} />
                        Configurar Valores
                    </button>
                    <button className="btn-add" onClick={() => setIsAddModalOpen(true)}>
                        <Plus size={18} />
                        Adicionar Gasto
                    </button>
                    <div className="month-selector-container" style={{ position: 'relative' }}>
                        <div className="month-selector" onClick={() => setShowMonthPicker(!showMonthPicker)}>
                            <CalendarIcon size={18} />
                            <span>{MONTHS[selectedMonth]} de {selectedYear}</span>
                            <ChevronDown size={14} />
                        </div>

                        {showMonthPicker && (
                            <div className="month-picker-dropdown">
                                <div className="picker-header">
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedYear(selectedYear - 1); }}>&lt;</button>
                                    <span>{selectedYear}</span>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedYear(selectedYear + 1); }}>&gt;</button>
                                </div>
                                <div className="picker-months">
                                    {MONTHS.map((m, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className={selectedMonth === idx ? 'active' : ''}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMonth(idx);
                                                setShowMonthPicker(false);
                                            }}
                                        >
                                            {m.substring(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="producao-grid">
                <div className="producao-card">
                    <span className="card-label">Total de Produção</span>
                    <span className="card-value text-green">{fmt(stats.totalProducao)}</span>
                    <span className="card-subtext">{stats.countProducao} cadastros de produção</span>
                    <DollarSign className="card-icon" size={24} />
                </div>

                <div className="producao-card">
                    <span className="card-label">Custo Sob Produção</span>
                    <span className="card-value text-red">{fmt(stats.custoProducao)}</span>
                    <span className="card-subtext">Gastos de Matéria Prima</span>
                    <TrendingDown className="card-icon" size={24} />
                    <div className="card-details">
                        <div className="detail-row">
                            <span className="detail-label">Material Alta:</span>
                            <span className="detail-value">{fmt(stats.materialAlta)} ({stats.materialAltaSacos} sacos)</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Material Baixa:</span>
                            <span className="detail-value">{fmt(stats.materialBaixa)} ({stats.materialBaixaSacos} sacos)</span>
                        </div>
                    </div>
                </div>

                <div className="producao-card">
                    <span className="card-label">Lucro Sob Produção</span>
                    <span className="card-value text-green">{fmt(stats.lucroProducao)}</span>
                    <span className="card-subtext">Total Produção - Custo Produção</span>
                    <TrendingUp className="card-icon" size={24} />
                </div>

                <div className="producao-card highlight">
                    <span className="card-label">Despesas Mensais + Fixas</span>
                    <TrendingDown className="card-icon" size={24} />
                    <div className="card-details">
                        <div className="detail-row">
                            <span className="detail-label">Despesas Fixas:</span>
                            <span className="detail-value text-orange">{fmt(stats.despesasFixas)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Despesas Mensais:</span>
                            <span className="detail-value text-orange">{fmt(stats.despesasMensais)}</span>
                        </div>
                        <div className="detail-row detail-final">
                            <span className="detail-label" style={{ color: '#fff' }}>Total:</span>
                            <span className="detail-value text-orange">{fmt(stats.despesasFixas + stats.despesasMensais)}</span>
                        </div>
                    </div>
                </div>

                <div className="producao-card">
                    <span className="card-label">Lucro Líquido Sob Despesas</span>
                    <span className={`card-value ${stats.lucroLiquido >= 0 ? 'text-green' : 'text-red'}`}>
                        {fmt(stats.lucroLiquido)}
                    </span>
                    <span className="card-subtext">Produção - Despesas</span>
                    <Package className="card-icon" size={24} />
                </div>

                <div className="producao-card">
                    <span className="card-label">Margem de Lucro</span>
                    <span className="card-value text-green">{stats.margemLucro.toFixed(2)}%</span>
                    <span className="card-subtext">Percentual médio</span>
                    <PieChart className="card-icon" size={24} />
                </div>
            </div>

            <section className="table-section">
                <h3 className="table-title">
                    <Package size={20} style={{ color: '#f59e0b' }} />
                    Gastos de Matéria Prima e Produção
                </h3>
                <div className="table-responsive">
                    <table className="producao-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Descrição / Fornecedor</th>
                                <th>Quantidade</th>
                                <th>Custo Material</th>
                                <th>Valor de Produção</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td></tr>
                            ) : producoes.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Nenhum registro encontrado.</td></tr>
                            ) : producoes.map(p => (
                                <tr key={p.id}>
                                    <td style={{ color: '#94a3b8' }}>{new Date(p.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                    <td>
                                        <div>{p.descricao}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.fornecedor}</div>
                                    </td>
                                    <td>{p.quantidade} {p.unidade}</td>
                                    <td className="text-red">{fmt(p.valor)}</td>
                                    <td className="text-green">{fmt(p.valor_producao)}</td>
                                    <td className="col-actions">
                                        <button className="action-btn" onClick={() => handleEditRecord(p)} title="Editar"><Edit3 size={14} /></button>
                                        <button className="action-btn delete" onClick={() => handleDeleteRecord(p.id)} title="Excluir"><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <GastoMateriaPrimaModal 
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingId(null);
                    setForm({
                        data: new Date().toISOString().split('T')[0],
                        preco_kg_alta: config.precoKgAlta,
                        qtd_sacos_alta: '',
                        preco_kg_baixa: config.precoKgBaixa,
                        qtd_baixa: '',
                        produtos: []
                    });
                }}
                form={form}
                setForm={setForm}
                config={config}
                onSave={handleSaveProducao}
                saving={saving}
                editingId={editingId}
                addProductRow={addProductRow}
                removeProductRow={removeProductRow}
                updateProductRow={updateProductRow}
            />

            <ConfiguracaoValoresModal 
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                config={config}
                setConfig={setConfig}
                onSave={saveConfig}
            />
        </div>
    );
};

export default ProducaoView;
