const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '1083257758857-um0n173p6sab1kic6b06g1qtrvnv5vaj.apps.googleusercontent.com';

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

/**
 * Service to authenticate with Google OAuth and fetch recent emails via Gmail API.
 */
class GmailService {
  constructor() {
    this.accessToken = null;
    this.tokenClient = null;
  }

  /**
   * Initializes Google OAuth Token Client if loaded.
   */
  initClient(callback, errorCallback) {
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      throw new Error('Google Identity Services SDK is loading. Please try again in a moment.');
    }

    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GMAIL_SCOPE,
      callback: (tokenResponse) => {
        if (tokenResponse?.error) {
          if (errorCallback) errorCallback(tokenResponse.error);
          return;
        }
        this.accessToken = tokenResponse.access_token;
        if (callback) callback(tokenResponse.access_token);
      },
    });
  }

  /**
   * Prompts the Google OAuth consent popup to request access token.
   */
  requestAccess() {
    return new Promise((resolve, reject) => {
      try {
        this.initClient(
          (token) => resolve(token),
          (err) => reject(new Error(err?.message || 'Google authorization was cancelled or failed.'))
        );
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Helper to decode Base64URL text from Gmail API parts.
   */
  decodeBase64Url(str) {
    if (!str) return '';
    try {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      return decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {
      try {
        return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
      } catch {
        return str;
      }
    }
  }

  /**
   * Extracts readable plain text body from Gmail message payload.
   */
  extractEmailBody(payload) {
    if (!payload) return '';
    if (payload.body?.data) {
      return this.decodeBase64Url(payload.body.data);
    }
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return this.decodeBase64Url(part.body.data);
        }
      }
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          const html = this.decodeBase64Url(part.body.data);
          return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
        }
      }
    }
    return '';
  }

  /**
   * Fetches latest inbox messages with subject, sender, and content.
   */
  async fetchRecentInboxEmails(maxResults = 5) {
    if (!this.accessToken) {
      throw new Error('No active Gmail session. Please connect your Google account first.');
    }

    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=label:INBOX`;
    const listRes = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!listRes.ok) {
      const errData = await listRes.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Failed to fetch messages from Gmail (Status ${listRes.status}).`);
    }

    const listData = await listRes.json();
    const messageStubs = listData.messages || [];

    if (messageStubs.length === 0) {
      return [];
    }

    // Fetch full details for each message in parallel
    const emailPromises = messageStubs.map(async (stub) => {
      try {
        const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${stub.id}?format=full`;
        const msgRes = await fetch(msgUrl, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        });
        if (!msgRes.ok) return null;
        const msg = await msgRes.json();

        const headers = msg.payload?.headers || [];
        const subject = headers.find((h) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const from = headers.find((h) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const date = headers.find((h) => h.name.toLowerCase() === 'date')?.value || '';

        const fullBody = this.extractEmailBody(msg.payload) || msg.snippet || '';

        return {
          id: msg.id,
          threadId: msg.threadId,
          subject,
          sender: from,
          date,
          snippet: msg.snippet || '',
          content: fullBody,
        };
      } catch (err) {
        console.warn(`Failed to fetch detail for email ${stub.id}:`, err);
        return null;
      }
    });

    const results = await Promise.all(emailPromises);
    return results.filter(Boolean);
  }
}

export const gmailService = new GmailService();
export default gmailService;
