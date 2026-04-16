
import React from 'react';
import { X, Plus, Trash2, Calendar, DollarSign, Package, Layers } from 'lucide-react';
import './GastoMateriaPrimaModal.css';

const fmt = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const GastoMateriaPrimaModal = ({ 
  isOpen, 
  onClose, 
  form, 
  setForm, 
  config, 
  onSave, 
  saving, 
  editingId,
  addProductRow,
  removeProductRow,
  updateProductRow
}) => {
  if (!isOpen) return null;

  return (
    <div className="gasto-modal-overlay" onClick={onClose}>
      <div className="gasto-modal-content" onClick={e => e.stopPropagation()}>
        <div className="gasto-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.1)', 
              padding: '8px', 
              borderRadius: '12px',
              display: 'flex'
            }}>
              <Layers size={20} className="text-orange" style={{ color: '#f59e0b' }} />
            </div>
            <h2>{editingId ? 'Editar Gasto' : 'Novo Gasto'} de Matéria Prima</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="gasto-modal-body">
          <div className="form-grid">
            <div className="form-field full">
              <label>Data da Operação</label>
              <input 
                type="date" 
                className="gasto-input" 
                value={form.data} 
                onChange={e => setForm({ ...form, data: e.target.value })} 
                required 
              />
            </div>

            <div className="form-field">
              <label>Preço KG Alta</label>
              <input 
                type="number" 
                step="0.01" 
                className="gasto-input" 
                value={form.preco_kg_alta} 
                onChange={e => setForm({ ...form, preco_kg_alta: e.target.value })} 
              />
            </div>

            <div className="form-field">
              <label>Quantidade (Sacos Alta)</label>
              <input 
                type="number" 
                step="0.1" 
                className="gasto-input" 
                placeholder="Ex: 2.5" 
                value={form.qtd_sacos_alta} 
                onChange={e => setForm({ ...form, qtd_sacos_alta: e.target.value })} 
              />
              <div className="input-help">Valor total: {fmt(form.preco_kg_alta * config.kgPorSaco * (form.qtd_sacos_alta || 0))}</div>
            </div>

            <div className="form-field">
              <label>Preço KG Baixa</label>
              <input 
                type="number" 
                step="0.01" 
                className="gasto-input" 
                value={form.preco_kg_baixa} 
                onChange={e => setForm({ ...form, preco_kg_baixa: e.target.value })} 
              />
            </div>

            <div className="form-field">
              <label>Quantidade (Sacos Baixa)</label>
              <input 
                type="number" 
                step="0.1" 
                className="gasto-input" 
                placeholder="Ex: 1.0" 
                value={form.qtd_baixa} 
                onChange={e => setForm({ ...form, qtd_baixa: e.target.value })} 
              />
              <div className="input-help">Valor total: {fmt(form.preco_kg_baixa * config.kgPorSaco * (form.qtd_baixa || 0))}</div>
            </div>
          </div>

          <div className="products-section">
            <div className="products-header">
              <h3>Produtos Fabricados</h3>
              <button type="button" className="btn-add-item" onClick={addProductRow}>
                <Plus size={16} /> Adicionar Produto
              </button>
            </div>

            {form.produtos.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--modal-border)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Nenhum produto adicionado ainda. Clique em "+ Adicionar Produto".
              </div>
            )}

            {form.produtos.map((p, idx) => (
              <div key={idx} className="product-item-card">
                <div className="p-field p-type">
                  <label>TIPO DE GARRAFA</label>
                  <select className="p-select" value={p.tipo} onChange={e => updateProductRow(idx, 'tipo', e.target.value)}>
                    {config.produtos.map(opt => (
                      <option key={opt.tipo} value={opt.tipo}>{opt.tipo}</option>
                    ))}
                  </select>
                </div>
                <div className="p-field p-qty">
                  <label>QUANTIDADE</label>
                  <input
                    type="number"
                    className="gasto-input"
                    value={p.quantidade}
                    onChange={e => updateProductRow(idx, 'quantidade', e.target.value)}
                  />
                </div>
                <div className="p-field p-price">
                  <label>PREÇO UNIT.</label>
                  <div className="p-value-display">
                    {fmt(p.valor_un)}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-remove-p"
                  onClick={() => removeProductRow(idx)}
                  title="Remover produto"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-modal-action-bar">
          <div className="action-buttons-wrapper">
            <button type="button" className="action-cancel-btn" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="button" 
              className="action-confirm-btn" 
              onClick={onSave}
              disabled={saving}
            >
              {saving ? 'Salvando...' : (editingId ? 'Atualizar Gasto' : 'Confirmar Gasto')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GastoMateriaPrimaModal;
