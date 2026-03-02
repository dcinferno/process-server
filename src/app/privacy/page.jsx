export default function PrivacyPage() {
  return (
    <main className="legal-container">
      <h1>Privacy Policy</h1>
      <p className="legal-updated">Last updated: March 1, 2025</p>

      <section>
        <h2>1. Information We Collect</h2>
        <p>
          When you submit a service request or make a purchase, we collect
          information you provide directly, including your name, email address,
          phone number, and address. We also collect payment information
          processed securely by Stripe.
        </p>
      </section>

      <section>
        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Process and fulfill service requests and purchases</li>
          <li>Send order confirmations and delivery information</li>
          <li>Respond to inquiries and provide customer support</li>
          <li>Improve our services and website</li>
        </ul>
      </section>

      <section>
        <h2>3. Information Sharing</h2>
        <p>
          We do not sell or share your personal information with third parties
          except as necessary to fulfill your order (e.g., payment processing
          via Stripe) or as required by law.
        </p>
      </section>

      <section>
        <h2>4. Payment Processing</h2>
        <p>
          All payments are processed by Stripe, Inc. We do not store credit
          card numbers or payment details on our servers. Stripe&apos;s privacy
          practices are governed by their own Privacy Policy.
        </p>
      </section>

      <section>
        <h2>5. Cookies</h2>
        <p>
          We use essential cookies for authentication and session management. We
          do not use tracking or advertising cookies.
        </p>
      </section>

      <section>
        <h2>6. Data Retention</h2>
        <p>
          We retain your information as long as necessary to provide our
          services and comply with legal obligations. You may request deletion
          of your data by contacting us through the{" "}
          <a href="/request">request form</a>.
        </p>
      </section>

      <section>
        <h2>7. Security</h2>
        <p>
          We use industry-standard security measures including HTTPS encryption
          and secure cookies to protect your personal information.
        </p>
      </section>

      <section>
        <h2>8. Contact</h2>
        <p>
          For privacy-related questions, please use our{" "}
          <a href="/request">contact form</a>.
        </p>
      </section>
    </main>
  );
}
