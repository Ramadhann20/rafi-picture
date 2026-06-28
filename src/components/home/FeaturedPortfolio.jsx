const portfolioItems = [
  {
    title: "The Kensington Wedding",
    location: "London, UK",
    className: "md:col-span-8",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAo2i6fEcQbKnJ9sp0gekL8ys0CBUnsDTIYl-qF1zWuUBbswTizrEP4Ilf2kJ2r3Sx_UNUpFgdrNY9BJXHnOzCHU86HBNERjdnYKpZlcdrRQyK15JOmJV2j3JmLTlhkBCOvLpuo4hqNTAwkEgfq4iqvc-tnr04Q_wfpEmHMGgwqpqVpFMC9B_AXG5hR72Rt5y2YLHmI1i1gpI80Tjn_0Swiv0u3k-jmr11fqVU-ubKG1BHsVofDQsgNkS8dvLysLbYZM1WnPBWGfSOJ",
    alt: "An editorial-style wedding photo of a couple walking down a historic city street at night.",
  },
  {
    title: "Coastal Romance",
    location: "Big Sur, CA",
    className: "md:col-span-4",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBMmjK6NPqMWRbnFsXL3PtgsSMeO9CoMkeJFV-e6WwzHMXQuwLJ_XVyzCcNlki1pTFkw_KEyVx1q6YGh9pS3J8mtAvGKDwWcblNfoaFG5z0zAswuWLN99aJ6f0VN8zBxrh92nDmS4h8e5AOeR946zL2LUD9X7mpOJ530nxs5-SKF7XRI8n9ZK-Kf_tybF_rGdIkcnrRpjMizNVRgeIkK95P8ceHU4ZzkPgyqskR-tkcm9IulNjYLWV48C4DONRuefkZogK5kcN0rHgG",
    alt: "A close-up portrait of an engaged couple during a golden hour session on a rugged coastal cliff.",
  },
  {
    title: "Midnight Soirée",
    location: "Paris, FR",
    className: "md:col-span-4",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA7KkPJGSc07NXG4FU6mA6IMfsoDQzTYxY5KZYZ3eqUcQgbAvhujQ4yzq5_ilWcLqLzApnAIzwYhM25Gb9SB7KQzM7czO-SiwP6UNCj7m5gaKHh4lOf0BdtYJRH9U2picPII5QHvrXwGFtcvY62i3tNGCkdIzoPlVMgXjWOT9xnEGYF73qGQ40YuHEvMgU0AWJhi3mSv76qzeottq2hQfxVSDHcH-qSCPAOUQs_YaByGuPHP5b6GZt_QZmwQpSXY7pDOcvhvwwcOEsT",
    alt: "An elegant wedding reception scene in a grand candle-lit ballroom with chandeliers.",
  },
  {
    title: "Above the Clouds",
    location: "Swiss Alps",
    className: "md:col-span-8",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCSjek-lZ3-ogPBMMTdejx-dpjpLIlUh4pKKo_B9cxTaed8sVxfAWjhcR1lW5fKrYz8CAKgJt4o9ccNpYHu2BDC0coAP4zTxQcPNW3A8tzrSvi2ofQ5CQQ80MxcFw5G1L9BySOVLAVoDhZZyhlcFO8EGTgm3PjV2aNH8aUa8fmr8ehM_Jf2elVy0DfjeuUDJKvnyZ9lnqkQAQF0jJzKlzHktQXqMzf8UlkmujJpfx-8eTV-gYF7V83q2DVga_F4o97Iz7d3lLr1QVge",
    alt: "A landscape wedding shot of a couple standing on a mountain peak at sunrise.",
  },
];

export default function FeaturedPortfolio() {
  return (
    <section className="py-[120px] bg-white" id="portfolio">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="flex flex-col md:flex-row justify-between items-end mb-stack-lg gap-6">
          <div>
            <span className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-4 block">
              Our Work
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary">Featured Stories</h2>
          </div>
          <a className="font-label-md text-label-md text-primary border-b border-primary pb-1 hover:opacity-70 transition-all" href="#">
            View Full Gallery
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[1000px]">
          {portfolioItems.map((item) => (
            <PortfolioCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PortfolioCard({ item }) {
  return (
    <div className={`${item.className} group relative overflow-hidden rounded-lg ambient-shadow min-h-[360px] md:min-h-0`}>
      <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={item.image} alt={item.alt} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-stack-md">
        <div className="text-white">
          <p className="font-label-sm text-label-sm uppercase tracking-widest mb-2">{item.location}</p>
          <h3 className="font-headline-md text-headline-md">{item.title}</h3>
        </div>
      </div>
    </div>
  );
}
