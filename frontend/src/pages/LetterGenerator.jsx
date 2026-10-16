import React, { useState, useEffect } from 'react';
import LetterForm from '../components/letters/LetterForm';
import LetterPreview from '../components/letters/LetterPreview';
import Alert from '../components/common/Alert';
import { FileText, ShieldCheck, CheckCircle2 } from 'lucide-react';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LetterGenerator = ({ user: propUser, initialData }) => {
  const { user: authUser } = useAuth();
  const currentUser = propUser || authUser;

  const [formData, setFormData] = useState({
    letter_type: 'deletion',
    framework: 'DPDP',
    company_name: initialData?.company_name || '',
    recipient_email: '',
    user_name: '',
    user_email: '',
    account_id: '',
    custom_notes: initialData?.custom_notes || initialData?.notes || '',
  });

  const [generatedLetter, setGeneratedLetter] = useState('');
  const [letterMeta, setLetterMeta] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [alert, setAlert] = useState(null);

  // Auto-fill user credentials when authenticated
  useEffect(() => {
    if (currentUser) {
      const name =
        currentUser.displayName ||
        currentUser.user_metadata?.full_name ||
        currentUser.full_name ||
        '';
      const email = currentUser.email || '';
      setFormData((prev) => ({
        ...prev,
        user_name: prev.user_name || name,
        user_email: prev.user_email || email,
      }));
    }
  }, [currentUser]);

  // Update if initialData changes dynamically
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        company_name: initialData.company_name || prev.company_name,
        custom_notes: initialData.custom_notes || initialData.notes || prev.custom_notes,
      }));
    }
  }, [initialData]);

  const generateLocalDraft = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const isDPDP = formData.framework === 'DPDP';
    const frameworkName = isDPDP
      ? 'Digital Personal Data Protection Act, 2023 (DPDP Act)'
      : 'General Data Protection Regulation (Regulation (EU) 2016/679 - GDPR)';

    let subject = '';
    let bodyContent = '';

    if (formData.letter_type === 'deletion') {
      subject = isDPDP
        ? `Statutory Data Erasure Notice under DPDP Act 2023 - ${formData.user_name}`
        : `Formal Request for Erasure (Right to be Forgotten) under GDPR Article 17 - ${formData.user_name}`;

      bodyContent = `I am writing to formally exercise my statutory right to data erasure (permanent deletion) under the provisions of the ${frameworkName}.

I hereby request and demand the immediate, irrevocable, and permanent deletion of all personal data, behavioral telemetry, location coordinates, usage logs, device identifiers, and profiling attributes held by ${formData.company_name} or any third-party data processors and advertising partners acting on your behalf.

Specific Identifier Details:
- Full Legal Name: ${formData.user_name}
- Registered Email Address: ${formData.user_email}
${formData.account_id ? `- Account Identifier / Customer ID: ${formData.account_id}\n` : ''}${formData.custom_notes ? `- Targeted Categories: ${formData.custom_notes}\n` : ''}
Under the applicable data protection framework, kindly provide formal written confirmation within thirty (30) days certifying that:
1. All personal records concerning me have been wiped from active databases and redundant backup snapshots.
2. Any downstream data brokers or affiliates who received my personal data have been instructed to delete all copies.`;
    } else if (formData.letter_type === 'access') {
      subject = isDPDP
        ? `Right to Information & Disclosure Request under DPDP Act 2023 - ${formData.user_name}`
        : `Subject Access Request (SAR) under GDPR Article 15 - ${formData.user_name}`;

      bodyContent = `Please consider this a formal statutory Subject Access Request under the provisions of the ${frameworkName}.

I hereby request a complete, structured disclosure of all personal data held and processed by ${formData.company_name} concerning me, including:
1. The categories of personal data collected, stored, or derived.
2. The specific commercial or technical purposes for which this data has been processed.
3. The identities and categories of all third-party processors, advertisers, and data brokers with whom my personal records have been shared.
4. The statutory or contractual retention schedule for these records.

Applicant Verification:
- Full Legal Name: ${formData.user_name}
- Registered Account Email: ${formData.user_email}
${formData.account_id ? `- Associated Identifier / Account ID: ${formData.account_id}\n` : ''}${formData.custom_notes ? `- Specific Information Sought: ${formData.custom_notes}\n` : ''}
Please deliver this disclosure in a structured, standard electronic format (e.g., JSON or CSV) within the statutory 30-day window.`;
    } else {
      // consent_withdrawal
      subject = isDPDP
        ? `Formal Revocation of Consent under DPDP Act 2023 - ${formData.user_name}`
        : `Formal Notice of Consent Withdrawal under GDPR Article 7(3) - ${formData.user_name}`;

      bodyContent = `I am writing to notify you that I hereby withdraw all previously granted consent for the collection, retention, marketing use, profiling, and monetization of my personal data under the provisions of the ${frameworkName}.

With immediate effect:
1. Please cease all non-essential data processing, behavioural telemetry tracking, and personalized advertising concerning me.
2. Cease sharing or licensing my contact details with any marketing syndicates or affiliates.

Account Details:
- Full Legal Name: ${formData.user_name}
- Registered Email: ${formData.user_email}
${formData.account_id ? `- Account Reference: ${formData.account_id}\n` : ''}${formData.custom_notes ? `- Scope of Withdrawal: ${formData.custom_notes}\n` : ''}
Please confirm compliance with this revocation notice without undue delay.`;
    }

    return {
      subject,
      content: `Date: ${currentDate}

To: Data Protection Officer / Privacy Compliance Department
Organization: ${formData.company_name}
${formData.recipient_email ? `Email: ${formData.recipient_email}\n` : ''}
Subject: ${subject}

Dear Data Protection Officer,

${bodyContent}

If you are unable to satisfy this request due to conflicting statutory record-retention requirements, please state the specific statutory grounds and the timeline for subsequent erasure.

Yours sincerely,

${formData.user_name}
${formData.user_email}`,
    };
  };

  const handleGenerate = async () => {
    if (!formData.company_name?.trim() || !formData.user_name?.trim()) {
      setAlert({
        type: 'warning',
        message: 'Please provide both the organization name and your full legal name.',
      });
      return;
    }

    if (!formData.user_email || !formData.user_email.includes('@')) {
      setAlert({
        type: 'warning',
        message: 'Please provide a valid registered email address for verification.',
      });
      return;
    }

    setIsGenerating(true);
    setAlert(null);

    const apiPayload = {
      company_name: formData.company_name.trim(),
      letter_type: formData.letter_type,
      user_full_name: formData.user_name.trim(),
      user_email: formData.user_email.trim(),
      recipient_email: formData.recipient_email?.trim() || undefined,
      custom_details: [
        formData.account_id ? `Account ID: ${formData.account_id}` : '',
        formData.custom_notes ? `Notes: ${formData.custom_notes}` : '',
        `Statutory Framework: ${formData.framework === 'DPDP' ? 'DPDP Act 2023 (India)' : 'GDPR (EU)'}`,
      ]
        .filter(Boolean)
        .join(' | ') || undefined,
    };

    try {
      const response = await apiClient.post('/letters/generate', apiPayload);
      if (response.data && response.data.content) {
        setGeneratedLetter(response.data.content);
        setLetterMeta({
          company_name: formData.company_name,
          letter_type: formData.letter_type,
          recipient_email: formData.recipient_email,
          user_name: formData.user_name,
          subject: `${formData.letter_type.toUpperCase()} Request - ${formData.user_name}`,
        });
        setAlert({
          type: 'success',
          message: 'Legal notice generated successfully via backend engine! Review and export your draft below.',
        });
        return;
      }
    } catch {
      // Local template generation fallback
    }

    // High-fidelity local fallback
    const localDraft = generateLocalDraft();
    setGeneratedLetter(localDraft.content);
    setLetterMeta({
      company_name: formData.company_name,
      letter_type: formData.letter_type,
      recipient_email: formData.recipient_email,
      user_name: formData.user_name,
      subject: localDraft.subject,
    });
    setAlert({
      type: 'success',
      message: 'Legal notice generated successfully! You can edit, copy, or download the draft below.',
    });
    setIsGenerating(false);
  };

  return (
    <div className="letter-generator-page" id="letter-generator-view">
      <div className="dashboard-hero">
        <div className="hero-badge">
          <FileText size={14} className="hero-badge-icon text-cyan" />
          <span>Statutory Privacy Rights Enforcer</span>
        </div>
        <h1 className="hero-title">
          Data Request <span className="gradient-text">Letter Generator</span>
        </h1>
        <p className="hero-subtitle">
          Draft legally grounded notices to enforce your rights of access, disclosure, and permanent data deletion under India's DPDP Act 2023 and EU GDPR frameworks.
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="letter-workspace-grid">
        <LetterForm
          formData={formData}
          onChange={setFormData}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />

        {generatedLetter && (
          <LetterPreview
            content={generatedLetter}
            onChangeContent={setGeneratedLetter}
            meta={letterMeta}
          />
        )}
      </div>
    </div>
  );
};

export default LetterGenerator;
