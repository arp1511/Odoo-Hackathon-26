// Shared small components used across pages

export function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>;
}

export function EmptyState({ icon = '📭', title, sub, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {sub && <div className="empty-state-sub">{sub}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

const STATUS_MAP = {
  AVAILABLE:  'available',
  ON_TRIP:    'on-trip',
  IN_SHOP:    'in-shop',
  RETIRED:    'retired',
  OFF_DUTY:   'off-duty',
  SUSPENDED:  'suspended',
  DRAFT:      'draft',
  DISPATCHED: 'dispatched',
  COMPLETED:  'completed',
  CANCELLED:  'cancelled',
  OPEN:       'open',
  CLOSED:     'closed',
  ACTIVE:     'active',
  INACTIVE:   'inactive',
};

export function StatusBadge({ status }) {
  const cls = STATUS_MAP[status] || 'draft';
  return (
    <span className={`badge badge-${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export function Modal({ title, children, footer, onClose, size }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size === 'lg' ? 'modal-lg' : ''}`}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ title, message, onConfirm, onCancel, danger }) {
  return (
    <Modal title={title} onClose={onCancel} footer={
      <>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
          Confirm
        </button>
      </>
    }>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

export function Alert({ type = 'info', children }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}
