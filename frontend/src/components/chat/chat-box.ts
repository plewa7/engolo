import { LitElement, html, css } from 'lit';

interface ChatUser {
  id: number;
  username: string;
  role?: { name: string };
}

const styles = css`
  .chat-box { 
    border: 1px solid var(--border-color); 
    border-radius: 12px; 
    padding: 16px; 
    max-width: 600px; 
    margin: 0 auto;
    background: var(--card-bg); 
    display: flex; 
    flex-direction: column; 
    height: 500px; 
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
            this.fetchMessages(); // Pobierz nowe wiadomości
          }} style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; width: 100%;">0,0,0.1);
  }

  .chat-box label {
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-primary);
  }

  .chat-box select {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    margin-left: 8px;
    background: var(--card-bg);
    color: var(--text-primary);
  }

  .chat-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .chat-controls select {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--card-bg);
    color: var(--text-primary);
    margin: 0;
  }

  .chat-controls button {
    padding: 8px 16px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s;
  }

  .chat-controls button:hover {
    background: var(--primary-dark);
  }

  .chat-messages { 
    flex: 1; 
    overflow-y: auto; 
    margin: 16px 0; 
    padding: 8px;
    background: var(--bg-tertiary);
    border-radius: 8px;
  }

  .my-message { 
    text-align: right; 
    background: var(--primary); 
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
    background: var(--card-bg); 
    color: var(--text-primary);
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
    color: var(--text-muted);
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
    border: 1px solid var(--border-color); 
    outline: none;
    font-size: 14px;
    background: var(--card-bg);
    color: var(--text-primary);
  }

  .chat-form input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .chat-form button { 
    padding: 12px 20px; 
    border-radius: 24px; 
    border: none; 
    background: var(--primary); 
    color: #fff; 
    cursor: pointer; 
    font-weight: 600;
    transition: background 0.2s;
  }

  .chat-form button:hover:not(:disabled) {
    background: var(--primary-dark);
  }

  .chat-form button:disabled { 
    background: var(--text-muted); 
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
    selectedUsers: { type: Array },
    showGroupCreation: { type: Boolean },
    newGroupName: { type: String },
    groups: { type: Array },
  };

  declare groupId: string;
  declare messages: any[];
  declare input: string;
  declare user: any;
  declare loading: boolean;
  declare users: ChatUser[];
  declare selectedTarget: string;
  declare selectedUsers: number[];
  declare showGroupCreation: boolean;
  declare newGroupName: string;
  declare groups: any[];
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
    this.selectedUsers = [];
    this.showGroupCreation = false;
    this.newGroupName = '';
    this.groups = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchUser().then(() => {
      this.fetchUsers();
      this.fetchGroups();
    });
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

  async fetchGroups() {
    const jwt = localStorage.getItem('strapi_jwt');
    const res = await fetch('/api/chat-messages/groups', {
      headers: jwt ? { 'Authorization': `Bearer ${jwt}` } : {},
    });
    if (res.ok) {
      this.groups = await res.json();
    } else {
      this.groups = [];
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
      // Używamy prostszego zapytania - backend przefiltruje wyniki
      url += `?populate[0]=sender&populate[1]=receiver&filters[$or][0][sender][id]=${this.user?.id}&filters[$or][0][receiver][id]=${userId}&filters[$or][1][sender][id]=${userId}&filters[$or][1][receiver][id]=${this.user?.id}`;
    } else if (this.selectedTarget && this.selectedTarget.startsWith('newgroup_')) {
      // Wiadomości nowej grupy - wyciągnij ID grupy z "newgroup_123" -> "123"
      const groupId = this.selectedTarget.replace('newgroup_', '');
      url += `?populate[0]=sender&filters[group][$eq]=group_${groupId}`;
    } else if (this.selectedTarget && this.selectedTarget.startsWith('group_')) {
      // Wiadomości grupowe - wyciągnij nazwę grupy z "group_global" -> "global"
      const groupName = this.selectedTarget.replace('group_', '');
      url += `?populate[0]=sender&filters[group][$eq]=${encodeURIComponent(groupName)}`;
    } else {
      // Fallback - używaj groupId
      url += `?populate[0]=sender&filters[group][$eq]=${encodeURIComponent(this.groupId)}`;
    }
    
    const res = await fetch(url, {
      headers: jwt ? { 'Authorization': `Bearer ${jwt}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      this.messages = Array.isArray(data) ? data : data.data || [];
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
    } else if (this.selectedTarget && this.selectedTarget.startsWith('newgroup_')) {
      // Wiadomość do nowej grupy - wyciągnij ID grupy z "newgroup_123" -> "123"
      const groupId = this.selectedTarget.replace('newgroup_', '');
      messageData.data.groupId = groupId;
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

  toggleUserSelection(userId: number) {
    if (this.selectedUsers.includes(userId)) {
      this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
    } else {
      this.selectedUsers = [...this.selectedUsers, userId];
    }
    this.requestUpdate();
  }

  async createGroup() {
    if (!this.newGroupName.trim() || this.selectedUsers.length === 0) {
      alert('Podaj nazwę grupy i wybierz przynajmniej jednego użytkownika');
      return;
    }

    const jwt = localStorage.getItem('strapi_jwt');
    try {
      const response = await fetch('/api/chat-messages/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({
          data: {
            name: this.newGroupName,
            memberIds: this.selectedUsers,
          }
        }),
      });

      if (response.ok) {
        const newGroup = await response.json();
        this.groups = [...this.groups, newGroup];
        this.selectedTarget = `newgroup_${newGroup.id}`;
        this.newGroupName = '';
        this.selectedUsers = [];
        this.showGroupCreation = false;
        this.messages = [];
        this.fetchMessages();
        this.requestUpdate();
      } else {
        console.error('Failed to create group:', await response.text());
        alert('Nie udało się utworzyć grupy');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Błąd podczas tworzenia grupy');
    }
  }

  render() {
    return html`
      <div class="chat-box">
        ${this.showGroupCreation ? html`
          <!-- Tworzenie nowej grupy -->
          <div style="border: 2px solid var(--primary); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 12px 0; color: var(--primary);">Utwórz nową grupę</h3>
            <input 
              type="text" 
              placeholder="Nazwa grupy..."
              .value=${this.newGroupName}
              @input=${(e: Event) => this.newGroupName = (e.target as HTMLInputElement).value}
              style="width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid var(--border-color); border-radius: 4px;"
            />
            <div style="margin-bottom: 12px;">
              <label style="font-weight: 600; display: block; margin-bottom: 8px;">Wybierz członków:</label>
              ${this.users.filter((u: ChatUser) => u.id !== this.user?.id).map((u: ChatUser) => html`
                <label style="display: flex; align-items: center; margin-bottom: 4px; cursor: pointer;">
                  <input 
                    type="checkbox" 
                    .checked=${this.selectedUsers.includes(u.id)}
                    @change=${() => this.toggleUserSelection(u.id)}
                    style="margin-right: 8px;"
                  />
                  ${u.username}
                </label>
              `)}
            </div>
            <div style="display: flex; gap: 8px;">
              <button 
                type="button" 
                @click=${this.createGroup}
                style="padding: 8px 16px; background: var(--button-primary-bg); color: var(--button-primary-text); border: none; border-radius: 4px; cursor: pointer;"
                ?disabled=${!this.newGroupName.trim() || this.selectedUsers.length === 0}
              >
                Utwórz grupę
              </button>
              <button 
                type="button" 
                @click=${() => { this.showGroupCreation = false; this.selectedUsers = []; this.newGroupName = ''; }}
                style="padding: 8px 16px; background: var(--button-secondary-bg); color: var(--button-secondary-text); border: none; border-radius: 4px; cursor: pointer;"
              >
                Anuluj
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Wybór odbiorcy/grupy -->
        <div class="chat-controls">
          <label style="font-weight: 600; display: block; margin-bottom: 8px; color: var(--text-primary);">Rozmowa z:</label>
          <select @change=${(e: Event) => {
            const newTarget = (e.target as HTMLSelectElement).value;
            this.selectedTarget = newTarget;
            this.messages = []; // Wyczyść wiadomości przy zmianie odbiorcy
            this.requestUpdate(); // Natychmiastowo odśwież widok
            this.fetchMessages(); // Pobierz nowe wiadomości
          }}>
            <option value="">-- Wybierz --</option>
            
            <!-- Prywatne rozmowy -->
            <optgroup label="Prywatne rozmowy">
              ${this.users.filter((u: ChatUser) => u.id !== this.user?.id).map((u: ChatUser) => html`
                <option .value=${`user_${u.id}`} ?selected=${this.selectedTarget === `user_${u.id}`}>${u.username}</option>
              `)}
            </optgroup>
            
            <!-- Moje grupy -->
            ${this.groups.length > 0 ? html`
              <optgroup label="Moje grupy">
                ${this.groups.map((group: any) => html`
                  <option .value=${`newgroup_${group.id}`} ?selected=${this.selectedTarget === `newgroup_${group.id}`}>
                    ${group.name} (${group.members?.length || 0} osób)
                  </option>
                `)}
              </optgroup>
            ` : ''}
            
            <!-- Grupa ogólna -->
            <optgroup label="Grupy systemowe">
              <option .value=${'group_global'} ?selected=${this.selectedTarget === 'group_global'}>Grupa ogólna</option>
            </optgroup>
          </select>
          
          <button 
            type="button" 
            @click=${() => this.showGroupCreation = true}
          >
            + Utwórz nową grupę
          </button>
        </div>

        <!-- Wiadomości -->
        <div class="chat-messages">
          ${this.messages.length === 0 ? html`
            <div style="text-align: center; color: var(--text-muted); font-style: italic; padding: 20px;">
              ${this.selectedTarget ? 'Brak wiadomości. Rozpocznij konwersację!' : 'Wybierz odbiorcę aby zobaczyć wiadomości'}
            </div>
          ` : ''}
          ${this.messages.map((msg: any) => html`
            <div class="${msg.sender.id === this.user?.id ? 'my-message' : 'other-message'}">
              <b>${msg.sender.username}:</b> ${msg.content}
              <span class="chat-date">${new Date(msg.createdAt).toLocaleTimeString()}</span>
            </div>
          `)}
        </div>

        <!-- Formularz wysyłania -->
        <form @submit=${this.sendMessage.bind(this)} class="chat-form">
          <input
            .value=${this.input}
            @input=${(e: Event) => this.input = (e.target as HTMLInputElement).value}
            placeholder="Napisz wiadomość..."
            ?disabled=${this.loading || !this.selectedTarget}
          />
          <button type="submit" ?disabled=${this.loading || !this.input.trim() || !this.selectedTarget}>Wyślij</button>
        </form>
      </div>
    `;
  }
}

customElements.define('chat-box', ChatBox);
