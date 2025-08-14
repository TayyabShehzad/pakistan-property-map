import { useParams, Link } from 'react-router-dom';

const content = {
    'market-trends-aug': {
        title: 'Islamabad–Rawalpindi: August market trends',
        body: [
            'We analyzed listing velocity, median ask, and view heat across 200k+ plots.',
            'Localities with the largest MoM demand shift were Kohistan Enclave, Faisal Hills, and C-16.'
        ]
    },
    'how-to-verify-plot': {
        title: 'How to verify a plot before you buy',
        body: [
            'Use official KML overlays and on-ground imagery to confirm alignment.',
            'Always validate the boundary against the block plan and NOC documents.'
        ]
    },
    'seller-pro-tips': {
        title: 'Pro tips to list and sell faster',
        body: [
            'Share deep links that open exactly on your plot.',
            'Add clear frontage/size notes and 3 photos taken perpendicular to plot edges.'
        ]
    }
};

export default function BlogPost() {
    const { slug } = useParams();
    const post = content[slug];

    if (!post) return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 20px' }}>
            <h1>Post not found</h1>
            <Link to="/blog">Back to blog</Link>
        </div>
    );

    return (
        <article style={{ maxWidth: 820, margin: '0 auto', padding: '70px 20px' }}>
            <h1 className="animate__animated animate__fadeInDown" style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 42 }}>{post.title}</h1>
            <div style={{ height: 8 }} />
            {post.body.map((p, i) => (
                <p key={i} data-aos="fade-up" data-aos-delay={i * 60} style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text)' }}>{p}</p>
            ))}
            <div style={{ height: 18 }} />
            <Link to="/blog"><sl-button size="small">← Back to Blog</sl-button></Link>
        </article>
    );
}
