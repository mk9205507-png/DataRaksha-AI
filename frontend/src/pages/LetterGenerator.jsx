import React, { useState } from 'react';
import LetterForm from '../components/letters/LetterForm';
import LetterPreview from '../components/letters/LetterPreview';
import Alert from '../components/common/Alert';
import { FileText, ShieldCheck } from 'lucide-react';
import apiClient from '../services/api';

export const LetterGenerator = () => {
  const [formData, setFormData] = useState({
    letter_type: 'deletion',
    company_name: '',
    user_name: '',
    user_email: '',
    account_id: '',
  });

  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleGenerate = async () => {
    if (!formData.company_name || !formData.user_name) {
      setAlert({ type: 'warning', message: 'Please provide both company name and your full name.' });
      return;
    }

    setIsGenerating(true);
    setAlert(null);

    try {
      const response = await apiClient.post('/letters/generate', formData);
      setGeneratedLetter(response.data.content);
    } catch {
      // Local template generation fallback
      setTimeout(() => {
        const currentDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const isDeletion = formData.letter_type === 'deletion';

        const template = isDeletion
          ? `Date: ${currentDate}

To: Data Protection Officer / Privacy Team
Organization: ${formData.company_name}

Subject: Formal Request for Erasure and Permanent Deletion of Personal Data

Dear Privacy Officer,

I am writing to formally exercise my statutory right to data erasure and privacy under the relevant data protection framework (including the Digital Personal Data Protection Act and General Data Protection Regulation).

I hereby request the immediate and permanent deletion of all personal data, tracking records, device telemetry, and identifier logs held by ${formData.company_name} or any third-party processors acting on your behalf, concerning me.

My identification details are as follows:
- Full Name: ${formData.user_name}
- Registered Email Address: ${formData.user_email || '[Your Registered Email]'}
${formData.account_id ? `- Account / User ID: ${formData.account_id}` : ''}

Please confirm in writing within the statutory timeframe (30 days) that:
1. All personal data associated with my account has been completely wiped from your active databases and backup systems.
2. Any third-party vendors or data brokers with whom my data was shared have likewise been instructed to delete all copies.

If you are unable to fulfill this request due to statutory record-retention requirements, please specify the exact legal grounds and the schedule for subsequent deletion.

Sincerely,

${formData.user_name}
${formData.user_email}`
          : `Date: ${currentDate}

To: Data Protection Officer / Privacy Team
Organization: ${formData.company_name}

Subject: Formal Request for Access to and Disclosure of Personal Data

Dear Privacy Officer,

I am writing to exercise my right to access the personal data held by ${formData.company_name} concerning me under the applicable Data Protection legislation.

Please provide me with a comprehensive disclosure containing:
1. Categories of personal data currently processed and stored.
2. The specific purposes for which this data is being collected and processed.
3. The names and categories of third parties, advertisers, or data brokers to whom my personal information has been disclosed.
4. The anticipated retention schedule for these records.

My verification information:
- Full Name: ${formData.user_name}
- Registered Email Address: ${formData.user_email || '[Your Registered Email]'}
${formData.account_id ? `- Account / User ID: ${formData.account_id}` : ''}

I look forward to receiving this information in a portable, readable format within the statutory timeframe.

Sincerely,

${formData.user_name}
${formData.user_email}`;

        setGeneratedLetter(template);
        setIsGenerating(false);
      }, 500);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="letter-generator-page" id="letter-generator-view">
      <div className="dashboard-hero">
        <div className="hero-badge">
          <FileText size={14} className="hero-badge-icon" />
          <span>Statutory Privacy Rights Enforcer</span>
        </div>
        <h1 className="hero-title">
          Data Request <span className="gradient-text">Letter Generator</span>
        </h1>
        <p className="hero-subtitle">
          Draft legally compliant notices to exercise your rights of data disclosure, access, and permanent deletion under DPDP Act & GDPR frameworks.
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
          />
        )}
      </div>
    </div>
  );
};

export default LetterGenerator;
