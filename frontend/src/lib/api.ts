import { auth } from './firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function getGuestToken() {
  if (typeof window === 'undefined') return 'guest_fallback';
  let token = localStorage.getItem('doclens_guest_token');
  if (!token) {
    token = 'guest_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('doclens_guest_token', token);
  }
  return token;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!auth.currentUser) {
    return {
      'Authorization': `Bearer ${getGuestToken()}`
    };
  }
  const token = await auth.currentUser.getIdToken();
  return {
    'Authorization': `Bearer ${token}`
  };
}

export const api = {
  async uploadDocument(file: File, summaryLength: 'short' | 'medium' | 'long') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('summary_length', summaryLength);

    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${await response.text()}`);
    }
    return response.json();
  },

  async getDocuments() {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/documents`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }
    return response.json();
  },

  async getDocument(docId: string) {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }
    return response.json();
  },

  async chatWithDocument(docId: string, question: string) {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/documents/${docId}/chat`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    return response.json();
  },

  async getChatHistory(docId: string) {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/documents/${docId}/chat`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat history');
    }
    return response.json();
  },

  async translateSummary(docId: string, language: string) {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/documents/${docId}/translate`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language }),
    });

    if (!response.ok) {
      throw new Error('Failed to translate summary');
    }
    return response.json();
  },

  async deleteDocument(docId: string) {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }
    return response.json();
  }
};
