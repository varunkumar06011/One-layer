export default function About() {
  return (
    <div className="about">
      <section className="section about-hero">
        <div className="container-narrow text-center">
          <p className="eyebrow">About</p>
          <h1>One layer of fabric.<br />One layer of identity.</h1>
        </div>
      </section>

      <section className="section bg-stone">
        <div className="container-narrow">
          <div className="about-text">
            <p>
              ONE LAYER began with a simple idea: a tee should be one clean layer.
              One layer of fabric against your skin. One layer of identity on your chest.
              No excess stitching, no loud graphics, no unnecessary categories.
            </p>
            <p>
              We make three fits — a polo collar, a round neck, and an oversized printed tee.
              Each is cut from combed cotton with a matte finish, designed to drape without clinging,
              to age without wearing out, and to feel like the tee you reach for first, every time.
            </p>
            <p>
              For individuals, we let you make it yours — upload a design, choose a placement,
              see it live before you commit. For companies, we make uniforms that don't feel
              like uniforms — save your logo once, save your team's sizes, reorder in 30 seconds.
            </p>
            <p>
              We believe in calm. In whitespace. In the quiet confidence of a well-made thing.
              No sale banners. No countdown timers. Just good tees, made with intention.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="values-grid">
            <div className="value-card">
              <h3>Considered</h3>
              <p className="text-muted">Every detail — fabric weight, collar structure, color palette — is chosen, not defaulted.</p>
            </div>
            <div className="value-card">
              <h3>Calm</h3>
              <p className="text-muted">No noise. No clutter. No pressure. Just the product, presented with space to breathe.</p>
            </div>
            <div className="value-card">
              <h3>Yours</h3>
              <p className="text-muted">Whether it's your design or your team's logo, the tee becomes one layer of your identity.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
