import { MARQUEE } from "@/lib/data";

export default function Marquee() {
  const cards = [...MARQUEE, ...MARQUEE];

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {cards.map((card, index) => (
          <div className="marquee-card" key={`${card.no}-${index}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.src} alt="" loading="eager" />
            <div className="marquee-tint" />
            <span className="marquee-no">{card.no}</span>
            <span className="marquee-label">{card.label}</span>
          </div>
        ))}
      </div>
      <div className="marquee-veil" />
    </div>
  );
}
