
import React from 'react';
import { X, Plus, Trash2, Package, Settings, DollarSign, Weight } from 'lucide-react';
import './ConfiguracaoValoresModal.css';

const ConfiguracaoValoresModal = ({ isOpen, onClose, config, setConfig, onSave }) => {
  if (!isOpen) return null;

  const handleUpdateProduct = (idx, field, value) => {
    const newProducts = [...config.produtos];
    newProducts[idx] = { ...newProducts[idx], [field]: value };
    setConfig({ ...config, produtos: newProducts });
  };

  const handleRemoveProduct = (idx) => {
    const newProducts = [...config.produtos];
    newProducts.splice(idx, 1);
    setConfig({ ...config, produtos: newProducts });
  };

  const handleAddProduct = () => {
    setConfig({
      ...config,
      produtos: [...config.produtos, { tipo: '', valor: 0, peso: 0 }]
    });
  };

  return (
    <div className="premium-modal-overlay" onClick={onClose}>
      <div className="premium-modal-content" onClick={e => e.stopPropagation()}>
        <div className="premium-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.1)', 
              padding: '8px', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Settings size={22} className="text-orange" />
            </div>
            <h2>Configuração de Valores</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="premium-modal-body">
          {/* Section: Valores Padrão */}
          <div className="section-title">
            <Package size={14} />
            Valores Padrão
          </div>

          <div className="premium-grid">
            <div className="premium-field full-width">
              <label>KG POR SACO</label>
              <div className="premium-input-wrapper has-icon">
                <Weight size={18} className="input-icon-left" />
                <input 
                  type="number" 
                  className="premium-input" 
                  value={config.kgPorSaco} 
                  onChange={e => setConfig({ ...config, kgPorSaco: parseFloat(e.target.value) })}
                  placeholder="Ex: 25"
                />
              </div>
            </div>

            <div className="premium-field">
              <label>PREÇO KG ALTA</label>
              <div className="premium-input-wrapper has-icon">
                <DollarSign size={18} className="input-icon-left" />
                <input 
                  type="number" 
                  step="0.01" 
                  className="premium-input" 
                  value={config.precoKgAlta} 
                  onChange={e => setConfig({ ...config, precoKgAlta: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="premium-field">
              <label>PREÇO KG BAIXA</label>
              <div className="premium-input-wrapper has-icon">
                <DollarSign size={18} className="input-icon-left" />
                <input 
                  type="number" 
                  step="0.01" 
                  className="premium-input" 
                  value={config.precoKgBaixa} 
                  onChange={e => setConfig({ ...config, precoKgBaixa: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Section: Garrafas e Preços */}
          <div className="section-title">
            <DollarSign size={14} />
            Garrafas e Preços de Venda
          </div>

          <div className="items-list">
            {config.produtos.map((p, idx) => (
              <div key={idx} className="item-card">
                <div className="premium-input-wrapper item-type-input">
                  <input 
                    placeholder="Tipo (ex: 500ml)" 
                    className="premium-input" 
                    value={p.tipo} 
                    onChange={e => handleUpdateProduct(idx, 'tipo', e.target.value)}
                  />
                </div>
                <div className="premium-input-wrapper item-weight-input has-icon">
                  <Weight size={14} className="input-icon-left" />
                  <input 
                    type="number" 
                    step="0.001"
                    placeholder="Peso (g)" 
                    className="premium-input" 
                    value={p.peso || ''} 
                    onChange={e => handleUpdateProduct(idx, 'peso', parseFloat(e.target.value))}
                  />
                </div>
                <div className="premium-input-wrapper item-value-input has-icon">
                  <DollarSign size={14} className="input-icon-left" />
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="Valor" 
                    className="premium-input" 
                    value={p.valor || ''} 
                    onChange={e => handleUpdateProduct(idx, 'valor', parseFloat(e.target.value))}
                  />
                </div>
                <button className="delete-item-btn" onClick={() => handleRemoveProduct(idx)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <button className="btn-add-premium" onClick={handleAddProduct}>
            <Plus size={18} />
            Adicionar Novo Tipo
          </button>
        </div>

        <div className="premium-modal-action-bar">
          <div className="action-buttons-wrapper">
            <button className="action-cancel-btn" onClick={onClose}>
              Cancelar
            </button>
            <button className="action-confirm-btn" onClick={onSave}>
              Salvar Configuração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracaoValoresModal;
