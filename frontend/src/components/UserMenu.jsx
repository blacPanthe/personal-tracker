import { useEffect, useRef, useState } from 'react';

export default function UserMenu({ email, onProfile, onSignOut }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const initial = email ? email[0].toUpperCase() : '?';

  return (
    <div className="user-menu" ref={rootRef}>
      <button type="button" className="user-menu-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="user-menu-avatar">{initial}</span>
        <span className="user-menu-email">{email}</span>
        <span className={`user-menu-chevron${open ? ' open' : ''}`}>⌄</span>
      </button>

      {open && (
        <div className="user-menu-dropdown">
          <button
            type="button"
            className="user-menu-item"
            onClick={() => {
              onProfile();
              setOpen(false);
            }}
          >
            <span className="user-menu-icon">☰</span>
            Profile
          </button>
          <div className="user-menu-divider" />
          <button
            type="button"
            className="user-menu-item user-menu-item--danger"
            onClick={() => {
              onSignOut();
              setOpen(false);
            }}
          >
            <span className="user-menu-icon">⏻</span>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
