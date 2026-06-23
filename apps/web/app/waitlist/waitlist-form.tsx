"use client";

import { FormEvent, useMemo, useState } from "react";

type FormState = {
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  preferredContact: string;
  heardAboutWolfie: string;
  userType: string;
  interest: string;
  optionalNotes: string;
};

type Errors = Partial<Record<keyof FormState | "form", string>>;

const initialState: FormState = {
  fullName: "",
  emailAddress: "",
  phoneNumber: "",
  preferredContact: "",
  heardAboutWolfie: "",
  userType: "",
  interest: "",
  optionalNotes: ""
};

const preferredContactOptions = ["Email", "Phone", "Text", "No Preference"];
const userTypeOptions = [
  "Investor",
  "Trader",
  "Builder / Developer",
  "Financial Professional",
  "Curious Early User",
  "Other"
];
const interestOptions = [
  "Agentic trading",
  "Robinhood integration",
  "Automated strategy execution",
  "Signal intelligence",
  "Paper trading beta",
  "Early access",
  "Other"
];

export function WaitlistForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const heardOptions = useMemo(
    () => ["Search", "Social media", "Friend or colleague", "Robinhood community", "News or podcast", "Other"],
    []
  );

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  function validate() {
    const nextErrors: Errors = {};
    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full Name is required.";
    }
    if (!form.emailAddress.trim()) {
      nextErrors.emailAddress = "Email Address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailAddress.trim())) {
      nextErrors.emailAddress = "Enter a valid Email Address.";
    }
    return nextErrors;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setErrors({ form: payload.error || "The submission could not be sent." });
        return;
      }
      setSubmitted(true);
    } catch {
      setErrors({ form: "The submission could not be sent. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="waitlist-success" role="status" aria-live="polite">
        Thank you! And welcome to the pack!
      </div>
    );
  }

  return (
    <form className="waitlist-form" onSubmit={submit} noValidate>
      <div className="field-row">
        <Field
          label="Full Name"
          value={form.fullName}
          error={errors.fullName}
          onChange={(value) => updateField("fullName", value)}
          autoComplete="name"
          required
        />
        <Field
          label="Email Address"
          value={form.emailAddress}
          error={errors.emailAddress}
          onChange={(value) => updateField("emailAddress", value)}
          autoComplete="email"
          inputMode="email"
          required
        />
      </div>
      <div className="field-row">
        <Field
          label="Phone Number"
          value={form.phoneNumber}
          onChange={(value) => updateField("phoneNumber", value)}
          autoComplete="tel"
          inputMode="tel"
        />
        <SelectField
          label="Preferred Contact"
          value={form.preferredContact}
          options={preferredContactOptions}
          onChange={(value) => updateField("preferredContact", value)}
        />
      </div>
      <SelectField
        label="How did you hear about Wolfie?"
        value={form.heardAboutWolfie}
        options={heardOptions}
        onChange={(value) => updateField("heardAboutWolfie", value)}
      />
      <SelectField
        label="What best describes you?"
        value={form.userType}
        options={userTypeOptions}
        onChange={(value) => updateField("userType", value)}
      />
      <SelectField
        label="What are you most interested in?"
        value={form.interest}
        options={interestOptions}
        onChange={(value) => updateField("interest", value)}
      />
      <label className="field textarea-field">
        <span>Optional Notes</span>
        <textarea
          aria-label="Optional Notes"
          placeholder="Optional Notes"
          value={form.optionalNotes}
          onChange={(event) => updateField("optionalNotes", event.target.value)}
          rows={3}
        />
      </label>
      {errors.form ? <p className="form-error">{errors.form}</p> : null}
      <button className="save-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </button>
      <p className="privacy-line">We respect your privacy.</p>
    </form>
  );
}

function Field({
  label,
  value,
  error,
  onChange,
  autoComplete,
  inputMode,
  required
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  inputMode?: "email" | "tel";
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
      />
      {error ? <em>{error}</em> : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = value || label;

  return (
    <div
      className={`field custom-select-field${isOpen ? " is-open" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <span>{label}</span>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label}
        className="select-trigger"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        {selectedLabel}
      </button>
      {isOpen ? (
        <div className="select-menu" role="listbox" aria-label={label} tabIndex={-1}>
          <button
            className={!value ? "is-selected" : ""}
            role="option"
            aria-selected={!value}
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
          >
            {label}
          </button>
          {options.map((option) => (
            <button
              className={value === option ? "is-selected" : ""}
              key={option}
              role="option"
              aria-selected={value === option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
