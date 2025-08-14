export default function About() {
    return (
        <section>
            {/* Hero with Hero Patterns background */}
            <div style={{
                backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><g fill="none" fill-opacity="0.05" fill-rule="evenodd"><g fill="#111827"><path d="M29 24h2v2h-2zM19 14h2v2h-2zM39 34h2v2h-2z"/></g></g></svg>`)})`,
                backgroundColor: '#f8fafc'
            }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 20px' }}>
                    <h1 className="animate__animated animate__fadeInDown" style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 48, margin: 0 }}>About PlotVista</h1>
                    <p data-aos="fade-up" style={{ maxWidth: 760, fontSize: 18, color: 'var(--muted)' }}>
                        A map-first real-estate experience purpose-built for Pakistan. Visualize, search, and share plots with professional accuracy.
                    </p>
                    <div data-aos="fade-up" data-aos-delay="100" style={{ display: 'flex', gap: 12 }}>
                        <sl-button variant="primary" pill size="large">Get in touch</sl-button>
                        <sl-button pill size="large">See blog</sl-button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px' }}>
                <div data-aos="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                    {[
                        ['Localities mapped', '120+'],
                        ['Plots indexed', '1.2M+'],
                        ['Avg. load time', '< 2.0s'],
                        ['Data freshness', 'Weekly']
                    ].map(([label, val]) => (
                        <div key={label} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 18, background: 'var(--panel)', boxShadow: 'var(--shadow)' }}>
                            <div style={{ fontSize: 28, fontWeight: 800 }}>{val}</div>
                            <div style={{ color: 'var(--muted)' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '10px 20px 60px' }}>
                <h2 data-aos="fade-up" style={{ fontFamily: 'Plus Jakarta Sans' }}>Our journey</h2>
                <div style={{ display: 'grid', gap: 16 }}>
                    {[
                        ['2023', 'Prototype for internal GIS workflows'],
                        ['2024', 'Public beta with plot sharing links'],
                        ['2025', 'Premium locality views & marketplace']
                    ].map((row, i) => (
                        <div key={i} data-aos="fade-up" data-aos-delay={i * 80}
                            style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <div style={{ fontWeight: 800, width: 80 }}>{row[0]}</div>
                            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--panel)' }}>{row[1]}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
