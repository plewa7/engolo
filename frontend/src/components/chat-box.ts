import { LitElement, html, css } from 'lit';

interface ChatUser {
  id: number;
  username: string;
  role?: { name: string };
}

const styles = css`
  .chat-box { 
    border: 1px solid #e1e5e9; 
    border-radius: 12px; 
    padding: 16px; 
    max-width: 600px; 
    margin: 0 auto;
    background: #fff; 
    display: flex; 
    flex-direction: column; 
    height: 500px; 
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .chat-box label {
    font-weight: 600;
    margin-bottom: 12px;
    color: #374151;
  }

  .chat-box select {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    margin-left: 8px;
    background: #fff;
  }

  .chat-messages { 
    flex: 1; 
    overflow-y: auto; 
    margin: 16px 0; 
    padding: 8px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .my-message { 
    text-align: right; 
    background: #3b82f6; 
    color: white;
    margin: 8px 0; 
    padding: 8px 12px; 
    border-radius: 18px 18px 4px 18px;
    max-width: 70%;
    margin-left: auto;
    word-wrap: break-word;
  }

  .other-message { 
    text-align: left; 
    background: #f3f4f6; 
    color: #374151;
    margin: 8px 0; 
    padding: 8px 12px; 
    border-radius: 18px 18px 18px 4px;
    max-width: 70%;
    margin-right: auto;
    word-wrap: break-word;
  }

  .chat-date { 
    font-size: 0.75em; 
    color: rgba(255,255,255,0.7); 
    margin-left: 8px; 
    display: block;
    margin-top: 4px;
  }

  .other-message .chat-date {
    color: #6b7280;
  }

  .chat-form { 
    display: flex; 
    gap: 8px; 
    align-items: stretch;
  }

  .chat-form input { 
    flex: 1; 
    padding: 12px 16px; 
    border-radius: 24px; 
    border: 1px solid #d1d5db; 
    outline: none;
    font-size: 14px;
  }

  .chat-form input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .chat-form button { 
    padding: 12px 20px; 
    border-radius: 24px; 
    border: none; 
    background: #3b82f6; 
    color: #fff; 
    cursor: pointer; 
    font-weight: 600;
    transition: background 0.2s;
  }

  .chat-form button:hover:not(:disabled) {
    background: #2563eb;
  }

  .chat-form button:disabled { 
    background: #9ca3af; 
    cursor: not-allowed; 
  }
`;


class ChatBox extends LitElement {
  static styles = styles;

  static properties = {
    groupId: { type: String, attribute: 'group-id' },
    messages: { type: Array },
    input: { type: String },
    user: { type: Object },
    loading: { type: Boolean },
    users: { type: Array },
    selectedTarget: { type: String },
  };

  declare groupId: string;
  declare messages: any[];
  declare input: string;
  declare user: any;
  declare loading: boolean;
  declare users: ChatUser[];
  declare selectedTarget: string;
  private _interval: number | null = null;

  constructor() {
    super();
    this.groupId = 'global';
    this.messages = [];
    this.input = '';
    this.user = null;
    this.loading = false;
    this.users = [];
    this.selectedTarget = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchUser().then(() => this.fetchUsers());
    this.fetchMessages();
    this._interval = setInterval(() => this.fetchMessages(), 2000) as number;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._interval) clearInterval(this._interval as number);
  }

  async fetchUser() {
    const jwt = localStorage.getItem('strapi_jwt');
    const res = await fetch('/api/users/me', {
      headers: jwt ? { 'Authorization': `Bearer ${jwt}` } : {},
    });
    if (res.ok) {
      this.user = await res.json();
    } else {
      this.user = null;
    }
  }

  async fetchUsers() {
    const jwt = localStorage.getItem('strapi_jwt');
    const res = await fetch('/api/users', {
      headers: jwt ? { 'Authorization': `Bearer ${jwt}` } : {},
    });
    if (res.ok) {
      const users: ChatUser[] = await res.json();
      this.users = users;
      if (!this.selectedTarget && this.user) {
        const firstOther = users.find((u: ChatUser) => u.id !== this.user.id);
        if (firstOther) this.selectedTarget = `user_${firstOther.id}`;
      }
    } else {
      this.users = [];
    }
  }

  async fetchMessages() {
    console.log('Pobieranie wiadomości dla:', this.selectedTarget);
    const jwt = localStorage.getItem('strapi_jwt');
    let url = '/api/chat-messages';
    
    // Jeśli wybrano konkretnego użytkownika
    if (this.selectedTarget && this.selectedTarget.startsWith('user_')) {
      // Wyciągnij ID użytkownika z "user_123" -> "123"
      const userId = this.selectedTarget.replace('user_', '');
      // Pobierz wiadomości między zalogowanym użytkownikiem a wybranym odbiorcą
      // Używamy prostszego zapytania - backend przefiltruje wyniki
      url += `?populate[0]=sender&populate[1]=receiver&filters[$or][0][sender][id]=${this.user?.id}&filters[$or][0][receiver][id]=${userId}&filters[$or][1][sender][id]=${userId}&filters[$or][1][receiver][id]=${this.user?.id}`;
      console.log('URL dla prywatnych wiadomości:', url);
    } else if (this.selectedTarget && this.selectedTarget.startsWith('group_')) {
      // Wiadomości grupowe - wyciągnij nazwę grupy z "group_global" -> "global"
      const groupName = this.selectedTarget.replace('group_', '');
      url += `?populate[0]=sender&filters[group][$eq]=${encodeURIComponent(groupName)}`;
      console.log('URL dla grupowych wiadomości:', url);
    } else {
      // Fallback - używaj groupId
      url += `?populate[0]=sender&filters[group][$eq]=${encodeURIComponent(this.groupId)}`;
      console.log('URL fallback:', url);
    }
    
    const res = await fetch(url, {
      headers: jwt ? { 'Authorization': `Bearer ${jwt}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      this.messages = Array.isArray(data) ? data : data.data || [];
      console.log('Pobrano wiadomości:', this.messages.length, 'dla celu:', this.selectedTarget);
      this.requestUpdate();
      // Przewiń do najnowszych wiadomości
      this.updateComplete.then(() => {
        const messagesDiv = this.shadowRoot?.querySelector('.chat-messages');
        if (messagesDiv) {
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
      });
    } else {
      console.error('Failed to fetch messages:', res.status, await res.text());
    }
  }

  async sendMessage(e: Event) {
    e.preventDefault();
    if (!this.input.trim()) return;
    this.loading = true;
    const jwt = localStorage.getItem('strapi_jwt');
    
    const messageData: any = {
      data: {
        content: this.input,
      }
    };
    
    // Jeśli to wiadomość do konkretnego użytkownika
    if (this.selectedTarget && this.selectedTarget.startsWith('user_')) {
      // Wyciągnij ID użytkownika z "user_123" -> "123"
      const userId = this.selectedTarget.replace('user_', '');
      messageData.data.receiver = parseInt(userId);
    } else if (this.selectedTarget && this.selectedTarget.startsWith('group_')) {
      // Wiadomość grupowa - wyciągnij nazwę grupy z "group_global" -> "global"
      const groupName = this.selectedTarget.replace('group_', '');
      messageData.data.group = groupName;
    } else {
      // Fallback - używaj groupId
      messageData.data.group = this.groupId;
    }
    
    try {
      const response = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify(messageData),
      });
      
      if (!response.ok) {
        console.error('Failed to send message:', response.status, await response.text());
      } else {
        this.input = '';
        await this.fetchMessages(); // Zaczekaj na pobranie wiadomości
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
    
    this.loading = false;
  }

  render() {
    return html`
      <div class="chat-box">
        <label>Wybierz odbiorcę/grupę:
          <select @change=${(e: Event) => {
            const newTarget = (e.target as HTMLSelectElement).value;
            console.log('Zmiana odbiorcy z:', this.selectedTarget, 'na:', newTarget);
            this.selectedTarget = newTarget;
            this.messages = []; // Wyczyść wiadomości przy zmianie odbiorcy
            console.log('Wyczyszczono wiadomości, aktualnie:', this.messages.length);
            this.requestUpdate(); // Natychmiastowo odśwież widok
            this.fetchMessages(); // Pobierz nowe wiadomości
          }}>
            ${this.users.filter((u: ChatUser) => u.id !== this.user?.id).map((u: ChatUser) => html`
              <option .value=${`user_${u.id}`} ?selected=${this.selectedTarget === `user_${u.id}`}>${u.username}</option>
            `)}
            <option .value=${'group_global'} ?selected=${this.selectedTarget === 'group_global'}>Grupa ogólna</option>
          </select>
        </label>
        <div class="chat-messages">
          ${this.messages.length === 0 ? html`
            <div style="text-align: center; color: #6b7280; font-style: italic; padding: 20px;">
              Brak wiadomości. Rozpocznij konwersację!
            </div>
          ` : ''}
          ${this.messages.map((msg: any) => html`
            <div class="${msg.sender.id === this.user?.id ? 'my-message' : 'other-message'}">
              <b>${msg.sender.username}:</b> ${msg.content}
              <span class="chat-date">${new Date(msg.createdAt).toLocaleTimeString()}</span>
            </div>
          `)}
        </div>
        <form @submit=${this.sendMessage.bind(this)} class="chat-form">
          <input
            .value=${this.input}
            @input=${(e: Event) => this.input = (e.target as HTMLInputElement).value}
            placeholder="Napisz wiadomość..."
            ?disabled=${this.loading}
          />
          <button type="submit" ?disabled=${this.loading || !this.input.trim()}>Wyślij</button>
        </form>
      </div>
    `;
  }
}

customElements.define('chat-box', ChatBox);
