import React, { useEffect, useState, useRef } from 'react';
import {
    Search, Calendar, ChevronDown,
    MessageCircle, Edit3, Trash2,
    X, Check, Loader, CreditCard, Package,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './PedidosView.css';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const STATUS_OPTIONS = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'pago', label: 'Pago' },
    { value: 'parcialmente_pago', label: 'Pago parcialmente' },
    { value: 'a_receber', label: 'Aguardando pagamento' },
];

const PAYMENT_OPTIONS = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'pix', label: 'Pix' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'cartao_debito', label: 'Cartão de Débito' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'cheque', label: 'Cheque' },
];

const STATUS_BADGE = {
    pendente: { label: 'Pendente', cls: 'pv-badge-pendente' },
    pago: { label: 'Pago', cls: 'pv-badge-pago' },
    a_receber: { label: 'Aguardando pagamento', cls: 'pv-badge-receber' },
    parcialmente_pago: { label: 'Pago parcialmente', cls: 'pv-badge-parcial' },
    aguardando_pagamento: { label: 'Aguardando pagamento', cls: 'pv-badge-receber' },
};

const TOTAL_COLOR = {
    pendente: '#f59e0b',
    pago: '#10b981',
    a_receber: '#3b82f6',
    parcialmente_pago: '#ec4899',
    aguardando_pagamento: '#3b82f6',
};

const A_RECEBER_STATUSES = ['a_receber', 'parcialmente_pago', 'aguardando_pagamento', 'aguardando pagamento'];

const fmt = val =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const fmtW = val => fmt(val).replace(/\u00A0/g, ' ');

const addDays = (dateStr, days) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

/* ============================================================ */
const PedidosView = ({ status, title, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, businessUnit }) => {
    const now = new Date();
    // Removed local selectedMonth/Year
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [pedidos, setPedidos] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i);

    /* ---- Edit modal state ---- */
    const [editPedido, setEditPedido] = useState(null);
    const [editItens, setEditItens] = useState([]);
    const [editLoading, setEditLoading] = useState(false);
    const [editSaving, setEditSaving] = useState(false);

    // Payment fields
    const [eParcelas, setEParcelas] = useState(1);
    const [eData, setEData] = useState('');
    const [eIntervalo, setEIntervalo] = useState(7);
    const [eForma, setEForma] = useState('');
    const [eStatus, setEStatus] = useState('');
    const [eObs, setEObs] = useState('');
    const [eEntrega, setEEntrega] = useState('');
    const [eDataPagamento, setEDataPagamento] = useState('');
    const [eMesReferencia, setEMesReferencia] = useState('');
    const [eValorRecebido, setEValorRecebido] = useState('');
    const [eAddValor, setEAddValor] = useState('');
    const [manualParcelas, setManualParcelas] = useState([]);
    const [editingParc, setEditingParc] = useState({ index: -1, value: '' });
    const [showStatusDrop, setShowStatusDrop] = useState(false);
    const [showPayDrop, setShowPayDrop] = useState(false);
    const [showMonthDrop, setShowMonthDrop] = useState(false);
    const [showParcelasList, setShowParcelasList] = useState(false);

    /* ---- WhatsApp Modal state ---- */
    const [isWAModalOpen, setIsWAModalOpen] = useState(false);
    const [waClientOrders, setWaClientOrders] = useState({ pead: [], pet: [] });
    const [waCurrentClient, setWaCurrentClient] = useState(null);
    const [waLoading, setWaLoading] = useState(false);

    const statusRef = useRef(null);
    const payRef = useRef(null);
    const monthRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (statusRef.current && !statusRef.current.contains(e.target)) setShowStatusDrop(false);
            if (payRef.current && !payRef.current.contains(e.target)) setShowPayDrop(false);
            if (monthRef.current && !monthRef.current.contains(e.target)) setShowMonthDrop(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* ---- Fetch pedidos ---- */
    useEffect(() => {
        const fetchPedidos = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('pedidos')
                    .select('*, clientes(nome, telefone)')
                    .eq('business_unit', businessUnit)
                    .order('data_pedido', { ascending: false });

                if (error) throw error;

                const filtered = (data || []).map(p => ({
                    ...p,
                    data_pedido: p.data_pedido ? p.data_pedido.split('T')[0] : null
                })).filter(p => {
                    if (!p.data_pedido) return false;

                    const normalizedStatus = (p.status || '').toLowerCase().trim();
                    const isDebit = ['a_receber', 'parcialmente_pago', 'aguardando_pagamento', 'aguardando pagamento', 'parcialmente pago'].includes(normalizedStatus);
                    const isPending = normalizedStatus === 'pendente';
                    const isPaid = normalizedStatus === 'pago' || Number(p.condicoes_pagamento?.valor_recebido || 0) > 0;

                    // Match view category
                    if (status === 'a_receber') {
                        if (!isDebit) return false;
                    } else if (status === 'pendente') {
                        if (!isPending) return false;
                    } else if (status === 'pago') {
                        if (!isPaid) return false;
                    } else {
                        if (p.status !== status) return false;
                    }

                    const d = new Date(p.data_pedido + 'T12:00:00');
                    let pMonth = d.getMonth();
                    let pYear = d.getFullYear();

                    // Priority to mes_referencia
                    if (p.mes_referencia) {
                        const monthsNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                        const refIdx = monthsNames.indexOf(p.mes_referencia.toLowerCase());
                        if (refIdx !== -1) pMonth = refIdx;
                    }

                    return pMonth === selectedMonth && pYear === selectedYear;
                });

                setPedidos(filtered);
                const totalCalculado = filtered.reduce((acc, p) => {
                    const valTotal = Number(p.valor_total) || 0;
                    const nParc = Number(p.numero_parcelas) || Number(p.condicoes_pagamento?.numeroParcelas) || 1;
                    const pPagas = Number(p.parcelas_pagas) || 0;

                    let valorPago = Number(p.condicoes_pagamento?.valor_recebido || 0);

                    if (status === 'a_receber') {
                        const pendente = valTotal - valorPago;
                        return acc + pendente;
                    }
                    if (status === 'pago') {
                        if (p.status === 'pago') return acc + valTotal;
                        return acc + valorPago;
                    }
                    return acc + valTotal;
                }, 0);
                setTotal(totalCalculado);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPedidos();
    }, [status, selectedMonth, selectedYear, businessUnit]);

    /* ---- WhatsApp ---- */
    const handleWhatsApp = async (pedido) => {
        const tel = pedido.clientes?.telefone || '';
        const cleanTel = tel.replace(/\D/g, '');
        if (!cleanTel) {
            alert('Este cliente não possui telefone cadastrado.');
            return;
        }

        setWaLoading(true);
        setWaCurrentClient(pedido.clientes);

        try {
            // Fetch ALL orders for this client for cross-unit relation check
            const { data: allOrders, error } = await supabase
                .from('pedidos')
                .select(`
                    *,
                    clientes(nome, telefone),
                    pedidos_produtos(
                        quantidade, preco_unitario, subtotal,
                        produtos(nome, preco_unitario)
                    )
                `)
                .eq('cliente_id', pedido.cliente_id)
                .order('data_pedido', { ascending: false });

            if (error) throw error;

            // Filter by current month/year context (using selectedMonth/Year from props)
            const contextOrders = (allOrders || []).filter(p => {
                const d = new Date(p.data_pedido + 'T12:00:00');
                let pMonth = d.getMonth();
                let pYear = d.getFullYear();
                if (p.mes_referencia) {
                    const monthsNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                    const refIdx = monthsNames.indexOf(p.mes_referencia.toLowerCase());
                    if (refIdx !== -1) pMonth = refIdx;
                }
                return pMonth === selectedMonth && pYear === selectedYear;
            });

            const peadOrders = contextOrders.filter(o => o.business_unit === 'PEAD');
            const petOrders = contextOrders.filter(o => o.business_unit === 'PET');

            // If we have orders in both units, show modal to choose.
            // Otherise keep same behavior but with better formatting.
            if (peadOrders.length > 0 && petOrders.length > 0) {
                setWaClientOrders({ pead: peadOrders, pet: petOrders });
                setIsWAModalOpen(true);
            } else {
                // Determine which direction to send automatically
                const activeOrders = peadOrders.length > 0 ? peadOrders : petOrders;
                if (activeOrders.length > 0) {
                    sendWhatsAppMessage(activeOrders, cleanTel, pedido.clientes?.nome);
                } else {
                    // Fallback to the clicked order if filters missed it
                    sendWhatsAppMessage([pedido], cleanTel, pedido.clientes?.nome);
                }
            }
        } catch (err) {
            console.error('Error handling WhatsApp relation:', err);
            alert('Erro ao carregar dados dos pedidos para o WhatsApp.');
        } finally {
            setWaLoading(false);
        }
    };

    const sendWhatsAppMessage = (selectedOrders, tel, clientName) => {
        if (!selectedOrders || selectedOrders.length === 0) return;

        let msg = `*RELAÇÃO DE PEDIDOS - ${clientName?.toUpperCase()}*\n`;
        msg += `*Competência:* ${MONTHS[selectedMonth]}/${selectedYear}\n\n`;

        let totalGeral = 0;
        const itemsByUnit = { PEAD: [], PET: [] };

        selectedOrders.forEach(order => {
            const unit = order.business_unit === 'PET' ? 'PET' : 'PEAD';
            if (order.pedidos_produtos) {
                order.pedidos_produtos.forEach(it => {
                    itemsByUnit[unit].push(it);
                    totalGeral += Number(it.subtotal || 0);
                });
            }
        });

        ['PEAD', 'PET'].forEach(unit => {
            if (itemsByUnit[unit].length > 0) {
                msg += `*📦 UNIDADE ${unit}:*\n`;
                msg += `----------------------------------\n`;
                
                // Consolidate identical products
                const consolidated = {};
                itemsByUnit[unit].forEach(it => {
                    const name = it.produtos?.nome || 'Produto';
                    if (!consolidated[name]) {
                        consolidated[name] = { qty: 0, price: it.preco_unitario, sub: 0 };
                    }
                    consolidated[name].qty += Number(it.quantidade);
                    consolidated[name].sub += Number(it.subtotal);
                });

                Object.entries(consolidated).forEach(([name, data]) => {
                    msg += `🔹 ${data.qty}x ${name}\n`;
                    msg += `     ${fmtW(data.price)} un. = *${fmtW(data.sub)}*\n`;
                });
                msg += `\n`;
            }
        });

        msg += `----------------------------------\n`;
        msg += `*💰 VALOR TOTAL GERAL: ${fmtW(totalGeral)}*\n\n`;
        msg += `_Favor conferir os itens acima._\n`;
        msg += `_Dúvidas, estamos à disposição!_`;

        const url = `https://api.whatsapp.com/send?phone=55${tel}&text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
        setIsWAModalOpen(false);
    };

    const handleSendParcelasWhatsApp = () => {
        const tel = editPedido.clientes?.telefone || '';
        const cleanTel = tel.replace(/\D/g, '');
        if (!cleanTel) {
            alert('Este cliente não possui telefone cadastrado.');
            return;
        }

        let parcelasText = `Olá, *${editPedido.clientes?.nome}*! Segue o detalhamento das parcelas do seu pedido:\n\n`;
        parcelasPreview.forEach(p => {
            const dateFmt = p.data ? p.data.split('-').reverse().join('/') : '-';
            parcelasText += `- *Parcela ${p.n}:* ${dateFmt} - ${fmtW(p.val)}\n`;
        });
        parcelasText += `\n*Total:* ${fmtW(editTotal)}`;

        const url = `https://api.whatsapp.com/send?phone=55${cleanTel}&text=${encodeURIComponent(parcelasText)}`;
        window.open(url, '_blank');
    };

    /* ---- Helpers ---- */
    const formatDate = str => {
        if (!str) return '-';
        const [y, m, d] = str.split('T')[0].split('-');
        return `${d}/${m}/${y}`;
    };

    const filteredList = pedidos.filter(p =>
        (p.clientes?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredTotal = filteredList.reduce((acc, p) => {
        const valTotal = Number(p.valor_total) || 0;
        const nParc = Number(p.numero_parcelas) || Number(p.condicoes_pagamento?.numeroParcelas) || 1;
        const pPagas = Number(p.parcelas_pagas) || 0;

        let valorPago = Number(p.condicoes_pagamento?.valor_recebido || 0);

        if (status === 'a_receber') {
            const pendente = valTotal - valorPago;
            return acc + pendente;
        }
        if (status === 'pago') {
            if (p.status === 'pago') return acc + valTotal;
            return acc + valorPago;
        }
        return acc + valTotal;
    }, 0);

    /* ---- Delete ---- */
    const handleDelete = async (pedido) => {
        if (!window.confirm(`Excluir o pedido de "${pedido.clientes?.nome || 'este cliente'}"? Ação irreversível.`)) return;
        try {
            await supabase.from('pedidos_produtos').delete().eq('pedido_id', pedido.id);
            if (businessUnit === 'PET') {
                await supabase.from('pedidos_a_pagar_pet').delete().like('descricao', `%Ped #${pedido.id} -%`);
            }
            const { error } = await supabase.from('pedidos').delete().eq('id', pedido.id);
            if (error) throw error;
            setPedidos(prev => prev.filter(p => p.id !== pedido.id));
            setTotal(prev => prev - (pedido.valor_total || 0));
        } catch (err) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    /* ---- Open edit modal ---- */
    const openEdit = async (pedido) => {
        setEditPedido(pedido);
        setEditLoading(true);
        setEditItens([]);
        setEAddValor('');
        setShowParcelasList(false);

        // Pre-fill payment fields from stored condições
        const cond = pedido.condicoes_pagamento || {};
        setEParcelas(pedido.numero_parcelas || cond.numeroParcelas || 1);
        setEData(cond.dataPrimeiraParcela || '');
        setEIntervalo(cond.intervaloDias || 7);
        setEForma(cond.formaPagamento || '');
        setEStatus(pedido.status || '');
        setEObs(pedido.observacoes || '');
        setEEntrega(pedido.data_entrega ? pedido.data_entrega.split('T')[0] : '');
        setEDataPagamento(pedido.data_pagamento ? pedido.data_pagamento.split('T')[0] : '');
        setEMesReferencia(pedido.mes_referencia || '');

        const manualVal = cond.valor_recebido;
        setEValorRecebido(manualVal !== undefined ? Number(manualVal).toFixed(2) : '0.00');
        setManualParcelas(cond.valoresParcelas || []);

        try {
            const { data, error } = await supabase
                .from('pedidos_produtos')
                .select('*, produtos(nome, custo_producao)')
                .eq('pedido_id', pedido.id);
            if (error) throw error;
            setEditItens((data || []).map(it => ({
                ...it,
                qty: it.quantidade,
                price: it.preco_unitario,
                cost: it.produtos?.custo_producao || it.produtos?.preco_custo || 0,
            })));
        } catch (err) {
            alert('Erro ao carregar itens: ' + err.message);
            setEditPedido(null);
        } finally {
            setEditLoading(false);
        }
    };

    const closeEdit = () => {
        setEditPedido(null);
        setEditItens([]);
        setShowParcelasList(false);
    };

    const updateEditItem = (id, field, value) => {
        setEditItens(prev => prev.map(it =>
            it.id === id ? { ...it, [field]: value } : it
        ));
    };

    const editTotal = editItens.reduce((acc, it) => acc + (Number(it.qty) * Number(it.price)), 0);
    const editCustoTotal = editItens.reduce((acc, it) => acc + (Number(it.qty) * Number(it.cost || 0)), 0);
    const editLucroTotal = editTotal - editCustoTotal;

    // Sincroniza manualParcelas com o split proporcional apenas quando o número de parcelas 
    // ou o valor total do pedido muda (ex: alteração de itens).
    useEffect(() => {
        if (!editPedido) return;
        const count = Number(eParcelas) || 1;
        
        // Se mudou o número de parcelas ou o total, reinicializamos
        if (manualParcelas.length !== count) {
            const each = editTotal / count;
            setManualParcelas(Array.from({ length: count }, () => each));
        }
    }, [eParcelas]);

    // Caso o total do pedido mude (itens alterados), opcionalmente resetamos as parcelas
    useEffect(() => {
        if (!editPedido) return;
        const count = Number(eParcelas) || 1;
        const currentSum = manualParcelas.reduce((a, b) => a + b, 0);
        if (Math.abs(currentSum - editTotal) > 0.05) {
             const each = editTotal / count;
             setManualParcelas(Array.from({ length: count }, () => each));
        }
    }, [editTotal]);

    const handleManualParcChange = (index, val) => {
        setEditingParc({ index, value: val });
        const cleanVal = val.replace(',', '.');
        const newVal = parseFloat(cleanVal) || 0;
        
        setManualParcelas(prev => {
            const copy = [...prev];
            copy[index] = newVal;
            return copy;
        });
    };

    const parcelasPreview = eParcelas > 0 && eData
        ? manualParcelas.map((val, i) => ({
            n: i + 1,
            data: addDays(eData, i * Number(eIntervalo)),
            val: val,
        }))
        : [];

    /* ---- Save edit ---- */
    const saveEdit = async () => {
        if (!editPedido) return;
        setEditSaving(true);
        try {
            // 1. Update each item in pedidos_produtos
            for (const it of editItens) {
                const qty = Number(it.qty) || 1;
                const price = Number(it.price) || 0;
                const { error } = await supabase
                    .from('pedidos_produtos')
                    .update({ quantidade: qty, preco_unitario: price, subtotal: qty * price })
                    .eq('id', it.id);
                if (error) throw error;
            }

            const addVal = parseFloat(eAddValor) || 0;
            const currentRec = parseFloat(eValorRecebido) || 0;
            const newValRecebido = currentRec + addVal;

            const condicoes = {
                formaPagamento: eForma,
                numeroParcelas: Number(eParcelas),
                dataPrimeiraParcela: eData || '',
                intervaloDias: Number(eIntervalo),
                valor_recebido: newValRecebido,
                valoresParcelas: manualParcelas,
            };

            // 3. Update pedido row
            // Auto-update status if payment covers total
            let finalStatus = eStatus;
            if (newValRecebido >= editTotal - 0.01) { // 0.01 for rounding issues
                finalStatus = 'pago';
            } else if (newValRecebido > 0 && finalStatus === 'pendente') {
                finalStatus = 'parcialmente_pago';
            }

            // Calculate how many parcels are paid based on their specific values
            let calculatedPagas = 0;
            let tempRec = newValRecebido;
            for (let i = 0; i < manualParcelas.length; i++) {
                if (tempRec >= manualParcelas[i] - 0.01) {
                    calculatedPagas++;
                    tempRec -= manualParcelas[i];
                } else {
                    break;
                }
            }
            if (finalStatus === 'pago') calculatedPagas = Number(eParcelas);

            const { error: pedErr } = await supabase
                .from('pedidos')
                .update({
                    valor_total: editTotal,
                    status: finalStatus,
                    observacoes: eObs || null,
                    data_entrega: eEntrega || null,
                    data_pagamento: (finalStatus === 'pago' && !eDataPagamento) ? new Date().toISOString().split('T')[0] : (eDataPagamento || null),
                    mes_referencia: eMesReferencia || null,
                    numero_parcelas: Number(eParcelas),
                    parcelas_pagas: calculatedPagas,
                    condicoes_pagamento: condicoes,
                })
                .eq('id', editPedido.id);
            if (pedErr) throw pedErr;

            // NEW: Sync with Pedidos a Pagar se businessUnit === 'PET'
            if (businessUnit === 'PET') {
                const { data: prods } = await supabase.from('produtos').select('id, custo_producao').in('id', editItens.map(i => i.produto_id));
                const prodMap = {};
                prods?.forEach(p => prodMap[p.id] = Number(p.custo_producao) || 0);

                const newCustoTotal = editItens.reduce((s, i) => s + (Number(i.qty) * (prodMap[i.produto_id] || 0)), 0);
                const valorAPagar = newCustoTotal > 0 ? newCustoTotal : editTotal;

                const { data: existingPayable } = await supabase
                    .from('pedidos_a_pagar_pet')
                    .select('id')
                    .like('descricao', `%Ped #${editPedido.id} -%`)
                    .maybeSingle();

                if (existingPayable) {
                    await supabase
                        .from('pedidos_a_pagar_pet')
                        .update({ valor: valorAPagar })
                        .eq('id', existingPayable.id);
                } else if (finalStatus === 'a_receber') {
                    // Create if it didn't exist but is now a_receber
                    const mesRef = editPedido.mes_referencia || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                    await supabase.from('pedidos_a_pagar_pet').insert([{
                        user_id: editPedido.user_id,
                        descricao: `Custo Ped #${editPedido.id} - ${editPedido.clientes?.nome || 'Cliente Editado'}`,
                        vencimento: parseInt(eData?.split('-')?.[2] || new Date().getDate(), 10),
                        valor: valorAPagar,
                        valor_pago: 0,
                        ativa: true,
                        paga: false,
                        categoria: 'Fornecedor PET',
                        tipo: 'mensal',
                        mes_referencia: mesRef
                    }]);
                }
            }

            // 4. Reflect changes locally
            setPedidos(prev => prev.map(p =>
                p.id === editPedido.id
                    ? {
                        ...p,
                        valor_total: editTotal,
                        status: finalStatus,
                        condicoes_pagamento: condicoes,
                        numero_parcelas: Number(eParcelas),
                        parcelas_pagas: calculatedPagas
                    }
                    : p
            ));
            setTotal(prev => prev - (editPedido.valor_total || 0) + editTotal);
            closeEdit();
        } catch (err) {
            alert('Erro ao salvar: ' + err.message);
        } finally {
            setEditSaving(false);
        }
    };

    const monthLabel = `${MONTHS[selectedMonth]} de ${selectedYear}`;
    const totalColor = TOTAL_COLOR[status] || '#f59e0b';
    const colSpan = status === 'a_receber' ? 8 : 7;

    /* ============================================================
       RENDER
    ============================================================ */
    return (
        <div className="pv-container">

            {/* ===== HEADER ===== */}
            <header className="pv-header">
                <div className="pv-header-left"><h1>{title}</h1></div>
                <div className="pv-header-right">
                    <div className="pv-month-selector" style={{ position: 'relative' }}>
                        <button className="pv-month-btn" onClick={() => setShowMonthPicker(v => !v)}>
                            <Calendar size={15} />
                            <span>{monthLabel}</span>
                            <ChevronDown size={14} />
                        </button>
                        {showMonthPicker && (
                            <div className="pv-month-popup">
                                <div className="pv-year-row">
                                    {years.map(y => (
                                        <button key={y}
                                            className={`pv-year-btn ${y === selectedYear ? 'active' : ''}`}
                                            onClick={() => setSelectedYear(y)}>{y}</button>
                                    ))}
                                </div>
                                <div className="pv-month-grid">
                                    {MONTHS.map((m, idx) => (
                                        <button key={m}
                                            className={`pv-month-pill ${idx === selectedMonth ? 'active' : ''}`}
                                            onClick={() => { setSelectedMonth(idx); setShowMonthPicker(false); }}>
                                            {m.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ===== TOTAL + SEARCH ===== */}
            <div className="pv-totals-row">
                <div className="pv-total-card">
                    <span className="pv-total-label">Total de {title}</span>
                    <span className="pv-total-value" style={{ color: totalColor }}>{fmt(filteredTotal)}</span>
                </div>
                <div className="pv-search-wrapper">
                    <Search size={15} className="pv-search-icon" />
                    <input type="text" className="pv-search-input" placeholder="Buscar cliente..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* ===== TABLE ===== */}
            <div className="pv-table-wrapper">
                <table className="pv-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Data</th>
                            <th>Itens</th>
                            <th>Forma de Pagamento</th>
                            {status === 'a_receber' && <th>Parcelas</th>}
                            <th>Total</th>
                            <th>Status</th>
                            <th className="pv-th-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={colSpan} className="pv-empty">Carregando pedidos...</td></tr>
                        ) : filteredList.length === 0 ? (
                            <tr><td colSpan={colSpan} className="pv-empty">Nenhum pedido encontrado.</td></tr>
                        ) : filteredList.map(p => {
                            let badge = STATUS_BADGE[p.status] || { label: p.status.replace('_', ' '), cls: 'pv-badge-pendente' };
                            if (status === 'pago' && p.status !== 'pago') {
                                badge = { label: 'Pago', cls: 'pv-badge-pago' };
                            }
                            return (
                                <tr key={p.id} onClick={(e) => {
                                    // Ignore if clicking on buttons with stopPropagation
                                    openEdit(p);
                                }} className={`pv-table-row mobile-card-${status}`} style={{ cursor: 'pointer' }}>
                                    <td className="pv-td-cliente">{p.clientes?.nome || 'Cliente não identificado'}</td>
                                    <td className="pv-td-muted">{formatDate(p.data_pedido)}</td>
                                    <td className="pv-td-muted">{p.itens_count || 0} produto(s)</td>
                                    <td className="pv-td-muted">
                                        {typeof p.condicoes_pagamento === 'object'
                                            ? p.condicoes_pagamento?.formaPagamento || 'N/A'
                                            : p.condicoes_pagamento || 'N/A'}
                                    </td>
                                    {status === 'a_receber' && (
                                        <td className="pv-td-muted">
                                            {typeof p.condicoes_pagamento === 'object'
                                                ? `${p.condicoes_pagamento?.numeroParcelas || 1}x`
                                                : '1x'}
                                        </td>
                                    )}
                                    <td className="pv-td-valor">
                                        {status === 'a_receber' ? (
                                            (() => {
                                                const pago = Number(p.condicoes_pagamento?.valor_recebido || 0);
                                                const pendente = p.valor_total - pago;
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span>{fmt(pendente)}</span>
                                                        {pago > 0 && (
                                                            <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 'normal' }}>
                                                                de {fmt(p.valor_total)}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()
                                        ) : status === 'pago' && p.status !== 'pago' ? (
                                            (() => {
                                                const pago = Number(p.condicoes_pagamento?.valor_recebido || 0);
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span>{fmt(pago)}</span>
                                                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 'normal' }}>
                                                            Pagamento Parcial
                                                        </span>
                                                    </div>
                                                );
                                            })()
                                        ) : fmt(p.valor_total)}
                                    </td>
                                    <td><span className={`pv-badge ${badge.cls}`}>{badge.label}</span></td>
                                    <td className="pv-td-actions">
                                        <div className="pv-actions">
                                            <button className="pv-action-btn pv-whatsapp-btn" title="WhatsApp"
                                                onClick={(e) => { e.stopPropagation(); handleWhatsApp(p); }}>
                                                <MessageCircle size={15} />
                                            </button>
                                            <button className="pv-action-btn pv-edit-btn" title="Editar"
                                                onClick={(e) => { e.stopPropagation(); openEdit(p); }}>
                                                <Edit3 size={15} />
                                            </button>
                                            <button className="pv-action-btn pv-delete-btn" title="Excluir"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(p); }}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ===== EDIT MODAL ===== */}
            {editPedido && (
                <div className="pv-modal-overlay" onClick={closeEdit}>
                    <div className="pv-modal pv-modal-wide" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="pv-modal-header">
                            <div>
                                <h2 className="pv-modal-title">Detalhes do Pedido</h2>
                                <p className="pv-modal-sub">{editPedido.clientes?.nome || 'Cliente não identificado'}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button className="pv-modal-close" onClick={() => handleWhatsApp(editPedido)} title="WhatsApp" style={{ color: '#10b981' }}><MessageCircle size={18} /></button>
                                <button className="pv-modal-close" onClick={() => { handleDelete(editPedido); closeEdit(); }} title="Excluir" style={{ color: '#ef4444' }}><Trash2 size={18} /></button>
                                <button className="pv-modal-close" onClick={closeEdit} title="Fechar"><X size={18} /></button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="pv-modal-body">
                            {editLoading ? (
                                <div className="pv-modal-load">
                                    <Loader size={28} className="pv-spin" />
                                    <span>Carregando...</span>
                                </div>
                            ) : (
                                <div className="pv-edit-sections">

                                    {/* ── Itens ── */}
                                    <div className="pv-edit-section">
                                        <div className="pv-edit-section-title">
                                            <Package size={15} /> Itens do Pedido
                                        </div>
                                        {editItens.length === 0 ? (
                                            <p className="pv-modal-empty">Nenhum item encontrado.</p>
                                        ) : (
                                            <table className="pv-edit-table">
                                                <thead>
                                                    <tr>
                                                        <th>Produto</th>
                                                        <th>Qtd</th>
                                                        <th>Venda Unit.</th>
                                                        <th>Custo Unit.</th>
                                                        <th>Lucro</th>
                                                        <th>Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {editItens.map(it => (
                                                        <tr key={it.id}>
                                                            <td className="pv-eit-name">{it.produtos?.nome || '-'}</td>
                                                            <td>
                                                                <input type="number" min="1" className="pv-eit-inp"
                                                                    value={it.qty}
                                                                    onChange={e => updateEditItem(it.id, 'qty', e.target.value)} />
                                                            </td>
                                                            <td>
                                                                <input type="number" min="0" step="0.01" className="pv-eit-inp"
                                                                    value={it.price}
                                                                    onChange={e => updateEditItem(it.id, 'price', e.target.value)} />
                                                            </td>
                                                            <td className="pv-eit-sub" style={{ color: '#94a3b8' }}>
                                                                {fmt(it.cost)}
                                                            </td>
                                                            <td className="pv-eit-sub" style={{ color: '#10b981' }}>
                                                                {fmt((Number(it.price) - Number(it.cost)) * Number(it.qty))}
                                                            </td>
                                                            <td className="pv-eit-sub">
                                                                {fmt(Number(it.qty) * Number(it.price))}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                        <div className="pv-edit-subtotal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.6)', padding: '0.8rem 1.2rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custo Produção</span>
                                                <strong style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>{fmt(editCustoTotal)}</strong>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lucro Projetado</span>
                                                <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>{fmt(editLucroTotal)}</strong>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor do Pedido</span>
                                                <strong style={{ color: '#f59e0b', fontSize: '1.1rem' }}>{fmt(editTotal)}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Detalhes do Pedido ── */}
                                    <div className="pv-edit-section">
                                        <div className="pv-edit-grid3">
                                            {/* Status */}
                                            <div className="pv-edit-field">
                                                <label>Status do Pedido</label>
                                                <div className="pv-status-dropdown" ref={statusRef}>
                                                    <button type="button" className={`pv-status-trigger ${eStatus ? 'sel' : ''}`}
                                                        onClick={() => setShowStatusDrop(!showStatusDrop)}>
                                                        <span>{eStatus ? STATUS_OPTIONS.find(o => o.value === eStatus)?.label : 'Selecione...'}</span>
                                                        <ChevronDown size={14} className={showStatusDrop ? 'open' : ''} />
                                                    </button>
                                                    {showStatusDrop && (
                                                        <div className="pv-status-list">
                                                            {STATUS_OPTIONS.map(opt => (
                                                                <button key={opt.value} type="button" className={`pv-status-item ${eStatus === opt.value ? 'active' : ''}`}
                                                                    onClick={() => { setEStatus(opt.value); setShowStatusDrop(false); }}>
                                                                    <span className={`pv-status-dot dot-${opt.value}`} />
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Pagamentos */}
                                            <div className="pv-edit-field">
                                                <label>Já Recebido (R$)</label>
                                                <input type="number" step="0.01" className="pv-edit-input"
                                                    value={eValorRecebido}
                                                    onChange={e => setEValorRecebido(e.target.value)} />
                                                <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>
                                                    Pendente: {fmt(editTotal - (parseFloat(eValorRecebido) || 0) - (parseFloat(eAddValor) || 0))}
                                                </small>

                                                <div style={{ marginTop: '0.75rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <label style={{ fontSize: '0.75rem', color: '#f59e0b' }}>+ Adicionar Pagamento</label>
                                                        <button type="button" className="pv-manage-btn" style={{ padding: '2px 6px', fontSize: '0.65rem' }}
                                                            onClick={() => setEAddValor((editTotal - (parseFloat(eValorRecebido) || 0)).toFixed(2))}>
                                                            Quitar Tudo
                                                        </button>
                                                    </div>
                                                    <input type="number" step="0.01" className="pv-edit-input"
                                                        style={{ borderColor: eAddValor > 0 ? '#f59e0b' : '#334155', background: eAddValor > 0 ? 'rgba(245, 158, 11, 0.05)' : '#0f172a' }}
                                                        value={eAddValor}
                                                        onChange={e => setEAddValor(e.target.value)}
                                                        placeholder="0,00" />
                                                </div>
                                            </div>

                                            {/* Forma de Pagamento */}
                                            <div className="pv-edit-field">
                                                <label>Forma de Pagamento</label>
                                                <div className="pv-status-dropdown" ref={payRef}>
                                                    <button type="button" className={`pv-status-trigger ${eForma ? 'sel' : ''}`}
                                                        onClick={() => setShowPayDrop(!showPayDrop)}>
                                                        <span>{eForma ? PAYMENT_OPTIONS.find(o => o.value === eForma)?.label : 'Selecione...'}</span>
                                                        <ChevronDown size={14} className={showPayDrop ? 'open' : ''} />
                                                    </button>
                                                    {showPayDrop && (
                                                        <div className="pv-status-list">
                                                            {PAYMENT_OPTIONS.map(opt => (
                                                                <button key={opt.value} type="button" className={`pv-status-item ${eForma === opt.value ? 'active' : ''}`}
                                                                    onClick={() => {
                                                                        if (eForma && eForma !== opt.value && (eStatus === 'pago' || eStatus === 'parcialmente_pago')) {
                                                                            // Feedback visual através de console ou state poderia ser adicionado aqui
                                                                            alert(`Atenção: O saldo será transferido de ${eForma} para ${opt.value}`);
                                                                        }
                                                                        setEForma(opt.value);
                                                                        setShowPayDrop(false);
                                                                    }}>
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pv-edit-grid3" style={{ marginTop: '1.2rem' }}>
                                            <div className="pv-edit-field">
                                                <label>Data de entrega</label>
                                                <input type="date" className="pv-edit-input" value={eEntrega} onChange={e => setEEntrega(e.target.value)} />
                                            </div>
                                            <div className="pv-edit-field">
                                                <label>Data de Pagamento</label>
                                                <input type="date" className="pv-edit-input" value={eDataPagamento} onChange={e => setEDataPagamento(e.target.value)} />
                                            </div>
                                            <div className="pv-edit-field">
                                                <label>Mês de Referência</label>
                                                <div className="pv-status-dropdown" ref={monthRef}>
                                                    <button type="button" className={`pv-status-trigger ${eMesReferencia ? 'sel' : ''}`}
                                                        onClick={() => setShowMonthDrop(!showMonthDrop)}>
                                                        <span>{eMesReferencia || 'Selecione o mês'}</span>
                                                        <ChevronDown size={14} className={showMonthDrop ? 'open' : ''} />
                                                    </button>
                                                    {showMonthDrop && (
                                                        <div className="pv-status-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                            {MONTHS.map(m => (
                                                                <button key={m} type="button" className={`pv-status-item ${eMesReferencia === m ? 'active' : ''}`}
                                                                    onClick={() => { setEMesReferencia(m); setShowMonthDrop(false); }}>
                                                                    {m}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Condições de Pagamento ── */}
                                    <div className="pv-edit-section" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem' }}>
                                        <div className="pv-edit-section-title" style={{ justifyContent: 'space-between', width: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span role="img" aria-label="money">💰</span> Condições de Pagamento
                                            </div>
                                            <button className="pv-manage-btn" type="button" onClick={() => setShowParcelasList(!showParcelasList)}>
                                                <CreditCard size={14} /> {showParcelasList ? 'Ocultar Detalhes' : 'Gerenciar Parcelas'}
                                            </button>
                                        </div>
                                        <small style={{ color: '#64748b', marginBottom: '1rem', display: 'block' }}>Valor Total: {fmt(editTotal)}</small>

                                        <div className="pv-edit-grid3">
                                            <div className="pv-edit-field">
                                                <label>Número de Parcelas</label>
                                                <input type="number" min="1" className="pv-edit-input"
                                                    value={eParcelas}
                                                    onChange={e => setEParcelas(Number(e.target.value) || 1)} />
                                            </div>
                                            <div className="pv-edit-field">
                                                <label>Data da Primeira Parcela</label>
                                                <input type="date" className="pv-edit-input"
                                                    value={eData}
                                                    onChange={e => setEData(e.target.value)} />
                                            </div>
                                            <div className="pv-edit-field">
                                                <label>Intervalo entre Parcelas (dias)</label>
                                                <input type="number" min="1" className="pv-edit-input"
                                                    value={eIntervalo}
                                                    onChange={e => setEIntervalo(Number(e.target.value) || 1)} />
                                            </div>
                                        </div>

                                        {/* Preview de parcelas */}
                                        {showParcelasList && parcelasPreview.length > 0 && (
                                            <div className="pv-parc-preview-modern">
                                                <div className="pv-parc-summary">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                        <strong style={{ fontSize: '0.85rem', color: '#f8fafc', letterSpacing: '0.5px' }}>DETALHAMENTO DE PARCELAS</strong>
                                                        <button
                                                            className="pv-action-btn pv-whatsapp-btn"
                                                            style={{
                                                                padding: '6px 14px',
                                                                fontSize: '0.7rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                background: '#10b981',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontWeight: '600'
                                                            }}
                                                            onClick={handleSendParcelasWhatsApp}
                                                        >
                                                            <MessageCircle size={14} /> ENVIAR PARCELA
                                                        </button>
                                                    </div>
                                                    <div className="pv-ps-row"><span>Previsão de Parcelas:</span> <strong>Valor Total: {fmt(editTotal)}</strong></div>
                                                    {parcelasPreview.map((p, idx) => (
                                                        <div key={p.n} className="pv-ps-row thin" style={{ alignItems: 'center' }}>
                                                            <span>Parcela {p.n}:</span>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.data ? p.data.split('-').reverse().join('/') : '-'}</span>
                                                                <div className="pv-edit-price-wrapper" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px 8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginRight: '4px' }}>R$</span>
                                                                    <input
                                                                        type="text"
                                                                        className="pv-parc-edit-input"
                                                                        value={editingParc.index === idx ? editingParc.value : p.val.toFixed(2).replace('.', ',')}
                                                                        onChange={(e) => handleManualParcChange(idx, e.target.value)}
                                                                        onBlur={() => setEditingParc({ index: -1, value: '' })}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            color: '#f8fafc',
                                                                            fontSize: '0.8rem',
                                                                            fontWeight: '600',
                                                                            width: '80px',
                                                                            padding: '2px 0',
                                                                            outline: 'none'
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="pv-ps-footer">
                                                         <span>Total das Parcelas:</span>
                                                         <strong style={{ color: Math.abs(manualParcelas.reduce((a,b)=>a+b,0) - editTotal) > 0.05 ? '#ef4444' : '#f59e0b' }}>
                                                            {fmt(manualParcelas.reduce((a,b)=>a+b,0))}
                                                         </strong>
                                                     </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {!editLoading && (
                            <div className="pv-modal-footer">
                                <div className="pv-modal-total">
                                    <span>Total atualizado</span>
                                    <strong>{fmt(editTotal)}</strong>
                                </div>
                                <div className="pv-modal-actions">
                                    <button className="pv-modal-cancel" onClick={closeEdit}>Cancelar</button>
                                    <button className="pv-modal-save" onClick={saveEdit} disabled={editSaving}>
                                        {editSaving
                                            ? <><Loader size={14} className="pv-spin" /> Salvando...</>
                                            : <><Check size={14} /> Salvar Alterações</>}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* ===== WHATSAPP SELECTION MODAL ===== */}
            {isWAModalOpen && (
                <div className="pv-modal-overlay" onClick={() => setIsWAModalOpen(false)}>
                    <div className="pv-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="pv-modal-header">
                            <div>
                                <h2 className="pv-modal-title">Enviar para WhatsApp</h2>
                                <p className="pv-modal-sub">Escolha quais pedidos deseja enviar</p>
                            </div>
                            <button className="pv-modal-close" onClick={() => setIsWAModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="pv-modal-body" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <button
                                    className="pv-whatsapp-select-btn pead"
                                    onClick={() => sendWhatsAppMessage(waClientOrders.pead, waCurrentClient?.telefone?.replace(/\D/g, ''), waCurrentClient?.nome)}
                                >
                                    <Package size={18} />
                                    <span>ENVIAR SOMENTE PEAD</span>
                                </button>
                                <button
                                    className="pv-whatsapp-select-btn pet"
                                    onClick={() => sendWhatsAppMessage(waClientOrders.pet, waCurrentClient?.telefone?.replace(/\D/g, ''), waCurrentClient?.nome)}
                                >
                                    <Package size={18} />
                                    <span>ENVIAR SOMENTE PET</span>
                                </button>
                                <button
                                    className="pv-whatsapp-select-btn both"
                                    onClick={() => sendWhatsAppMessage([...waClientOrders.pead, ...waClientOrders.pet], waCurrentClient?.telefone?.replace(/\D/g, ''), waCurrentClient?.nome)}
                                >
                                    <MessageCircle size={18} />
                                    <span>ENVIAR AMBOS (RELATÓRIO COMPLETO)</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== LOADING OVERLAY FOR WHATSAPP FETCH ===== */}
            {waLoading && (
                <div className="pv-modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="pv-modal-load">
                        <Loader size={32} className="pv-spin" style={{ color: '#10b981' }} />
                        <span style={{ color: '#fff', fontSize: '1rem', fontWeight: '600' }}>Gerando relação de pedidos...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PedidosView;
