import { Link } from 'react-router-dom';

const posts = [
    {
        slug: 'market-trends-aug',
        title: 'Islamabad–Rawalpindi: August market trends',
        excerpt: 'Heat map of activity, average list prices by block, and where demand is moving next.',
        cover: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1200&auto=format&fit=crop',
        tag: 'Insights',
        date: 'Aug 2025'
    },
    {
        slug: 'how-to-verify-plot',
        title: 'How to verify a plot before you buy',
        excerpt: 'Checklist + map overlays to avoid common pitfalls.',
        cover: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?q=80&w=1200&auto=format&fit=crop',
        tag: 'Guides',
        date: 'Aug 2025'
    },
    {
        slug: 'seller-pro-tips',
        title: 'Pro tips to list and sell faster',
        excerpt: 'Photos, pins, and shareable links that convert.',
        cover: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1200&auto=format&fit=crop',
        tag: 'Playbook',
        date: 'Jul 2025'
    }
];

export default function Blog() {
    return (
        <section>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 20px 20px' }}>
                <h1 className="animate__animated animate__fadeInDown" style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 44, margin: '10px 0' }}>Blog</h1>
                <p data-aos="fade-up" style={{ color: 'var(--muted)', maxWidth: 720 }}>Research, playbooks, and product updates from the PlotVista team.</p>
            </div>

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                {posts.map((p, i) => (
                    <article key={p.slug} data-aos="fade-up" data-aos-delay={i * 70}
                        style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: 'var(--panel)', boxShadow: 'var(--shadow)' }}>
                        <div style={{ position: 'relative', paddingTop: '60%', background: `center/cover url(${p.cover})` }} />
                        <div style={{ padding: 16 }}>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.tag} • {p.date}</div>
                            <h3 style={{ margin: '6px 0' }}>{p.title}</h3>
                            <p style={{ color: 'var(--muted)' }}>{p.excerpt}</p>
                            <Link to={`/blog/${p.slug}`} style={{ textDecoration: 'none' }}>
                                <sl-button variant="primary" size="small">Read more</sl-button>
                            </Link>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
