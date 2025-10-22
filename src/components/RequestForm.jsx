import { useState } from "react";

export default function RequestForm() {
  const [formData, setFormData] = useState({
    clientName: "",
    email: "",
    phone: "",
    recipientName: "",
    recipientAddress: "",
    priority: "",
    website: "",
  });

  const [submitted, setSubmitted] = useState(false); // Track submission

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/submit-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
      } else {
        alert("Failed to submit request. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  if (submitted) {
    return (
      <div className="request-form confirmation-message">
        <p>Received your service inquiry, we will call you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="request-form">
      <input
        type="text"
        name="website"
        value={formData.website}
        onChange={handleChange}
        autoComplete="off"
        tabIndex="-1"
        aria-hidden="true"
        style={{ display: "none" }}
      />

      <div className="form-group">
        <label htmlFor="clientName">Client Name</label>
        <input
          type="text"
          id="clientName"
          name="clientName"
          value={formData.clientName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="recipientName">Recipient Name</label>
        <input
          type="text"
          id="recipientName"
          name="recipientName"
          value={formData.recipientName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="recipientAddress">Recipient Address</label>
        <textarea
          id="recipientAddress"
          name="recipientAddress"
          value={formData.recipientAddress}
          onChange={handleChange}
          required
        />
      </div>

      {/* Priority Dropdown */}
      <div className="form-group">
        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          required
        >
          <option value="" disabled>
            Select Priority
          </option>
          <option value="Today">Today (ASAP) - $150</option>
          <option value="Rush">Rush (1-2 business days) - $60</option>
          <option value="Regular">Regular (3-5 business days) - $40</option>
        </select>
      </div>

      <button type="submit" className="submit-button">
        Submit Request
      </button>
    </form>
  );
}
