import areschatIcon from '../assets/iconeAresChat.png';

export function AresChatButton() {
  return (
    <a
      href="https://rodrigues.areschat.com.br"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Suporte via AresChat"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#1a73e8',
        color: '#fff',
        textDecoration: 'none',
        padding: '12px 18px',
        borderRadius: '50px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        fontSize: '0.95rem',
        fontWeight: 600,
        transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = '#1558c0';
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.45)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = '#1a73e8';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.35)';
      }}
    >
      <img
        src={areschatIcon}
        alt="AresChat"
        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
      <span>AresChat</span>
    </a>
  );
}
