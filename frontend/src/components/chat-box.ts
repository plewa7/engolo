import { LitElement, html, css } from 'lit';

interface ChatUser {
  id: number;
  username: string;
  role?: { name: string };
}

const styles = css`
  .chat-box { border: 1px solid #ccc; border-radius: 8px; padding: 8px; max-width: 400px; background: #fff; display: flex; flex-direction: column; height: 350px; }
  .chat-messages { flex: 1; overflow-y: auto; margin-bottom: 8px; }
  .my-message { text-align: right; background: #e0ffe0; margin: 2px 0; padding: 4px 8px; border-radius: 6px; }
  .other-message { text-align: left; background: #f0f0f0; margin: 2px 0; padding: 4px 8px; border-radius: 6px; }
  .chat-date { font-size: 0.7em; color: #888; margin-left: 8px; }
  .chat-form { display: flex; gap: 4px; }
  .chat-form input { flex: 1; padding: 4px; border-radius: 4px; border: 1px solid #ccc; }
  .chat-form button { padding: 4px 12px; border-radius: 4px; border: none; background: #007bff; color: #fff; cursor: pointer; }
  .chat-form button:disabled { background: #aaa; cursor: not-allowed; }
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
    const jwt = localStorage.getItem('strapi_jwt');
    let url = '/api/chat-messages';
    
    // Jeśli wybrano konkretnego użytkownika
    if (this.selectedTarget && this.selectedTarget.startsWith('user_')) {
      // Wyciągnij ID użytkownika z "user_123" -> "123"
      const userId = this.selectedTarget.replace('user_', '');
      // Pobierz wiadomości między zalogowanym użytkownikiem a wybranym odbiorcą
      url += `?populate=sender,receiver&filters[$or][0][sender][id]=${this.user?.id}&filters[$or][0][receiver][id]=${userId}&filters[$or][1][sender][id]=${userId}&filters[$or][1][receiver][id]=${this.user?.id}`;
    } else if (this.selectedTarget && this.selectedTarget.startsWith('group_')) {
      // Wiadomości grupowe - wyciągnij nazwę grupy z "group_global" -> "global"
      const groupName = this.selectedTarget.replace('group_', '');
      url += `?populate=sender&filters[group][$eq]=${encodeURIComponent(groupName)}`;
    } else {
      // Fallback - używaj groupId
      url += `?populate=sender&filters[group][$eq]=${encodeURIComponent(this.groupId)}`;
    }
    
    const res = await fetch(url, {
      headers: jwt ? { 'Authorization': `Bearer ${jwt}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      this.messages = Array.isArray(data) ? data : data.data || [];
      this.requestUpdate();
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
        this.fetchMessages();
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
            this.selectedTarget = (e.target as HTMLSelectElement).value;
            this.fetchMessages();
          }}>
            ${this.users.filter((u: ChatUser) => u.id !== this.user?.id).map((u: ChatUser) => html`
              <option .value=${`user_${u.id}`} ?selected=${this.selectedTarget === `user_${u.id}`}>${u.username}</option>
            `)}
            <option .value=${'group_global'} ?selected=${this.selectedTarget === 'group_global'}>Grupa ogólna</option>
          </select>
        </label>
        <div class="chat-messages">
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
