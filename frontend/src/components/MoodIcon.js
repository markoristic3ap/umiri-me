const MoodIcon = ({ mood, size = 48, className = "" }) => {
  const s = size;
  const r = s / 2;
  const icons = {
    srecan: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="22" fill="#E8F5E9" stroke="#769F78" strokeWidth="1.5"/>
        <circle cx="16" cy="20" r="2.5" fill="#769F78"/>
        <circle cx="32" cy="20" r="2.5" fill="#769F78"/>
        <path d="M14 29C14 29 18 35 24 35C30 35 34 29 34 29" stroke="#769F78" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    odusevljen: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="22" fill="#FFF8E1" stroke="#E8C170" strokeWidth="1.5"/>
        <path d="M13 19L16 16L19 19" stroke="#E8C170" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M29 19L32 16L35 19" stroke="#E8C170" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="16" cy="21" r="2" fill="#E8C170"/>
        <circle cx="32" cy="21" r="2" fill="#E8C170"/>
        <path d="M14 30C14 30 18 36 24 36C30 36 34 30 34 30" stroke="#E8C170" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 10L13 7" stroke="#E8C170" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M38 10L35 7" stroke="#E8C170" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M24 5V2" stroke="#E8C170" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    miran: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="22" fill="#E3F2FD" stroke="#7CA5B8" strokeWidth="1.5"/>
        <path d="M13 20H19" stroke="#7CA5B8" strokeWidth="2" strokeLinecap="round"/>
        <path d="M29 20H35" stroke="#7CA5B8" strokeWidth="2" strokeLinecap="round"/>
        <path d="M18 31C18 31 20 33 24 33C28 33 30 31 30 31" stroke="#7CA5B8" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    neutralan: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="22" fill="#F2F4F0" stroke="#8A9999" strokeWidth="1.5"/>
        <circle cx="16" cy="20" r="2.5" fill="#8A9999"/>
        <circle cx="32" cy="20" r="2.5" fill="#8A9999"/>
        <path d="M17 31H31" stroke="#8A9999" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    umoran: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="22" fill="#FFF3E0" stroke="#B8A07C" strokeWidth="1.5"/>
        <circle cx="16" cy="21" r="2" fill="#B8A07C"/>
        <path d="M29 20C29 20 31 18 35 20" stroke="#B8A07C" strokeWidth="2" strokeLinecap="round"/>
        <path d="M17 32C17 32 20 30 24 30C28 30 31 32 31 32" stroke="#B8A07C" strokeWidth="2" strokeLinecap="round"/>
        <path d="M36 28C36 28 38 30 38 32" stroke="#B8A07C" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    tuzan: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="22" fill="#E3F2FD" stroke="#7CA5B8" strokeWidth="1.5"/>
        <circle cx="16" cy="19" r="2.5" fill="#7CA5B8"/>
        <circle cx="32" cy="19" r="2.5" fill="#7CA5B8"/>
        <path d="M17 33C17 33 20 28 24 28C28 28 31 33 31 33" stroke="#7CA5B8" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 24L10 28" stroke="#7CA5B8" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        <path d="M36 24L38 28" stroke="#7CA5B8" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      </svg>
    ),
    anksiozan: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="22" fill="#FFEBEE" stroke="#D66A6A" strokeWidth="1.5"/>
        <circle cx="16" cy="19" r="2.5" fill="#D66A6A"/>
        <circle cx="32" cy="19" r="2.5" fill="#D66A6A"/>
        <path d="M13 14L19 16" stroke="#D66A6A" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M35 14L29 16" stroke="#D66A6A" strokeWidth="1.5" strokeLinecap="round"/>
        <ellipse cx="24" cy="33" rx="5" ry="4" stroke="#D66A6A" strokeWidth="2"/>
        <path d="M11 26L9 30" stroke="#D66A6A" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
        <path d="M37 26L39 30" stroke="#D66A6A" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
      </svg>
    ),
    ljut: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="22" fill="#FFEBEE" stroke="#D66A6A" strokeWidth="1.5"/>
        <circle cx="16" cy="21" r="2.5" fill="#D66A6A"/>
        <circle cx="32" cy="21" r="2.5" fill="#D66A6A"/>
        <path d="M12 15L20 18" stroke="#D66A6A" strokeWidth="2" strokeLinecap="round"/>
        <path d="M36 15L28 18" stroke="#D66A6A" strokeWidth="2" strokeLinecap="round"/>
        <path d="M17 33C17 33 20 29 24 29C28 29 31 33 31 33" stroke="#D66A6A" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  };

  return icons[mood] || null;
};

export default MoodIcon;
