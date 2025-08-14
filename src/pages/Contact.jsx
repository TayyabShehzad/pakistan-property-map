export default function Contact() {
    return (
        <section style={{ maxWidth: 1040, margin: '0 auto', padding: '70px 20px' }}>
            <h1 className="animate__animated animate__fadeInDown" style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 44, marginBottom: 12 }}>Contact</h1>
            <p data-aos="fade-up" style={{ color: 'var(--muted)' }}>Questions, partnerships, or enterprise data ingestion — we’d love to talk.</p>

            <div data-aos="fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                <div style={{ border: '1px solid var(--border)', background: 'var(--panel)', borderRadius: 16, padding: 18 }}>
                    <h3>Send a message</h3>
                    <sl-input label="Your name" placeholder="Full name"></sl-input>
                    <div style={{ height: 8 }} />
                    <sl-input label="Email" type="email" placeholder="you@email.com"></sl-input>
                    <div style={{ height: 8 }} />
                    <sl-textarea label="Message" rows="6" placeholder="How can we help?"></sl-textarea>
                    <div style={{ height: 12 }} />
                    <sl-button variant="primary">Send</sl-button>
                </div>

                <div style={{ border: '1px solid var(--border)', background: 'var(--panel)', borderRadius: 16, padding: 18 }}>
                    <h3>Office</h3>
                    <p>Islamabad, Pakistan</p>
                    <h3>Support</h3>
                    <p>support@plotvista.pk</p>
                    <h3>Sales</h3>
                    <p>sales@plotvista.pk</p>
                </div>
            </div>
        </section>
    );
}
