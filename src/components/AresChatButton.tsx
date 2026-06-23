import areschatIcon from '../assets/iconeAresChat.png';

export function AresChatButton() {
  return (
    <a
      href="https://adtech.areschat.com.br/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Suporte via AresChat"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#1a73e8',
        color: '#fff',
        textDecoration: 'none',
        padding: '8px 16px',
        borderRadius: '50px',
        fontSize: '0.875rem',
        fontWeight: 600,
        transition: 'background 0.2s, transform 0.15s',
        height: '36px',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = '#1558c0';
        el.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = '#1a73e8';
        el.style.transform = 'translateY(0)';
      }}
    >
      <img
        src={areschatIcon}
        alt="AresChat"
        style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
      <span>AresChat</span>
    </a>
  );
}
