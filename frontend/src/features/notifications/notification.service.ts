export interface Notification {
  id: string;
  type: 'quiz_completed' | 'module_completed' | 'ranking_advance' | 'streak' | 'login' | 'achievement';
  title: string;
  message: string;
  icon: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

export interface NotificationTrigger {
  type: string;
  condition?: any;
  message: string;
  icon: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];
  private listeners: Array<(notifications: Notification[]) => void> = [];
  private popupListeners: Array<(notification: Notification) => void> = [];

  private motivationalMessages = {
    quiz_completed: [
      "🎉 Świetna robota! Quiz ukończony z sukcesem!",
      "👏 Brawo! Kolejny quiz za Tobą!",
      "🌟 Excellent! Twoja wiedza rośnie!",
      "🚀 Amazing! Jesteś na dobrej drodze!",
      "💪 Perfect! Kontynuuj tak dalej!"
    ],
    module_completed: [
      "🎯 Gratulacje! Ukończyłeś cały moduł!",
      "📚 Brawo! Kolejny etap nauki za Tobą!",
      "🏆 Wspaniale! Twoje umiejętności się rozwijają!",
      "🌈 Fantastycznie! Jesteś coraz bliżej celu!",
      "⭐ Niesamowite! Moduł ukończony perfekcyjnie!"
    ],
    ranking_advance: [
      "🔥 Awansowałeś w rankingu! Brawo!",
      "📈 Twoja pozycja w rankingu wzrosła!",
      "🎊 Wspinasz się coraz wyżej! Gratulacje!",
      "🏅 Excellent work! Awans w rankingu!",
      "🌟 Amazing! Jesteś wśród najlepszych!"
    ],
    streak: [
      "🔥 Wow! {days} dni z rzedu! Niesamowita konsekwencja!",
      "⚡ {days} dni streak! Jesteś nieustający!",
      "🌟 {days} dni nauki! Twoja determinacja inspiruje!",
      "🎯 {days} dni z rzedu! Kontynuuj tę passę!",
      "💎 {days} dni streak! Jesteś prawdziwym mistrzem!"
    ],
    login: [
      "👋 Witamy z powrotem! Gotowy na naukę?",
      "🌅 Dzień dobry! Czas na nowe wyzwania!",
      "🎯 Witaj! Twoje cele czekają na realizację!",
      "🚀 Hej! Pora kontynuować naukową przygodę!",
      "💪 Witamy! Każdy dzień to nowa szansa na rozwój!"
    ],
    achievement: [
      "🏆 Nowe osiągnięcie odblokowane!",
      "⭐ Gratulacje! Specjalna nagroda czeka!",
      "🎖️ Brawo! Zasłużone wyróżnienie!",
      "🌟 Wspaniale! Kolejne osiągnięcie!",
      "🎊 Amazing! Nowy poziom mistrzostwa!"
    ],
    motivational: [
      "💪 Pamiętaj: każda minuta nauki się liczy!",
      "🌟 Jesteś na dobrej drodze! Kontynuuj!",
      "🚀 Twój potencjał jest nieograniczony!",
      "🎯 Małe kroki prowadzą do wielkich celów!",
      "📚 Wiedza to potęga - inwestuj w siebie!",
      "⭐ Każdy dzień to nowa szansa na rozwój!",
      "🔥 Twoja determinacja inspiruje innych!",
      "🌈 Sukces składa się z małych codziennych zwycięstw!",
      "💎 Jesteś bliżej swojego celu niż myślisz!",
      "🎊 Nauka to przygoda - ciesz się podróżą!",
      "🏆 Wytrwałość to klucz do sukcesu!",
      "🌱 Rozwijasz się z każdą chwilą!",
      "⚡ Energia, którą wkładasz w naukę, wraca się do Ciebie!",
      "🎨 Tworzysz swoją przyszłość poprzez naukę!",
      "🌟 Bądź dumny z każdego postępu!"
    ]
  };

  private motivationalTimer?: number;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private constructor() {
    this.loadNotifications();
    this.setupEventListeners();
    this.startMotivationalTimer();
  }

  private loadNotifications() {
    try {
      const stored = localStorage.getItem('engolo_notifications');
      if (stored) {
        this.notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.notifications = [];
    }
  }

  private saveNotifications() {
    try {
      localStorage.setItem('engolo_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private setupEventListeners() {
    // Listen for custom events that trigger notifications
    window.addEventListener('quiz_completed', (event: any) => {
      this.triggerNotification('quiz_completed', event.detail);
    });

    window.addEventListener('module_completed', (event: any) => {
      this.triggerNotification('module_completed', event.detail);
    });

    window.addEventListener('ranking_changed', (event: any) => {
      this.checkRankingAdvance(event.detail);
    });

    window.addEventListener('user_login', (event: any) => {
      this.triggerLoginNotification(event.detail);
      this.checkStreak(event.detail);
    });
  }

  subscribe(callback: (notifications: Notification[]) => void) {
    this.listeners.push(callback);
    callback(this.notifications);
  }

  subscribeToPopups(callback: (notification: Notification) => void) {
    this.popupListeners.push(callback);
  }

  unsubscribe(callback: (notifications: Notification[]) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  unsubscribeFromPopups(callback: (notification: Notification) => void) {
    this.popupListeners = this.popupListeners.filter(listener => listener !== callback);
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.notifications));
    this.saveNotifications();
  }

  private getRandomMessage(type: keyof typeof this.motivationalMessages, data?: any): string {
    const messages = this.motivationalMessages[type];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    if (data && type === 'streak' && data.days) {
      return randomMessage.replace('{days}', data.days.toString());
    }
    
    return randomMessage;
  }

  triggerNotification(type: Notification['type'], data?: any) {
    console.log('🔔 Triggering notification:', type, data);
    const notification: Notification = {
      id: this.generateId(),
      type,
      title: this.getTitleForType(type, data),
      message: this.getRandomMessage(type, data),
      icon: this.getIconForType(type),
      timestamp: new Date(),
      read: false,
      data
    };

    this.notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.notifyListeners();
    
    // Show popup
    console.log('🚀 Calling popup listeners, count:', this.popupListeners.length);
    this.popupListeners.forEach(callback => callback(notification));
  }

  private getTitleForType(type: Notification['type'], data?: any): string {
    switch (type) {
      case 'quiz_completed':
        return data?.quizName ? `Quiz "${data.quizName}" ukończony!` : 'Quiz ukończony!';
      case 'module_completed':
        return data?.moduleName ? `Moduł "${data.moduleName}" ukończony!` : 'Moduł ukończony!';
      case 'ranking_advance':
        return `Awans w rankingu!`;
      case 'streak':
        return `${data?.days || 1} dni z rzedu!`;
      case 'login':
        return 'Witamy z powrotem!';
      case 'achievement':
        return data?.achievement || 'Nowe osiągnięcie!';
      default:
        return 'Powiadomienie';
    }
  }

  private getIconForType(type: Notification['type']): string {
    switch (type) {
      case 'quiz_completed': return '🎯';
      case 'module_completed': return '📚';
      case 'ranking_advance': return '📈';
      case 'streak': return '🔥';
      case 'login': return '👋';
      case 'achievement': return '🏆';
      default: return '🔔';
    }
  }

  private checkRankingAdvance(data: any) {
    if (data.previousPosition > data.currentPosition) {
      const positionDiff = data.previousPosition - data.currentPosition;
      this.triggerNotification('ranking_advance', {
        previousPosition: data.previousPosition,
        currentPosition: data.currentPosition,
        improvement: positionDiff
      });
    }
  }

  private triggerLoginNotification(data: any) {
    // Show login notification only once per day
    const today = new Date().toDateString();
    const lastLoginNotification = this.notifications.find(n => 
      n.type === 'login' && n.timestamp.toDateString() === today
    );

    if (!lastLoginNotification) {
      this.triggerNotification('login', data);
    }
  }

  private checkStreak(data: any) {
    const streakDays = this.calculateStreak(data.userId);
    
    // Show streak notifications for milestones: 3, 7, 14, 30, 60, 100+ days
    const milestones = [3, 7, 14, 30, 60, 100];
    
    if (milestones.includes(streakDays) || (streakDays > 100 && streakDays % 50 === 0)) {
      this.triggerNotification('streak', { days: streakDays });
    }
  }

  private calculateStreak(userId: string): number {
    // This would typically come from the backend
    // For now, we'll use a simple localStorage approach
    try {
      const streakData = localStorage.getItem(`engolo_streak_${userId}`);
      if (streakData) {
        const { lastLoginDate, streakCount } = JSON.parse(streakData);
        const lastLogin = new Date(lastLoginDate);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          const newStreak = streakCount + 1;
          localStorage.setItem(`engolo_streak_${userId}`, JSON.stringify({
            lastLoginDate: today.toDateString(),
            streakCount: newStreak
          }));
          return newStreak;
        } else if (daysDiff === 0) {
          // Same day
          return streakCount;
        } else {
          // Streak broken
          localStorage.setItem(`engolo_streak_${userId}`, JSON.stringify({
            lastLoginDate: today.toDateString(),
            streakCount: 1
          }));
          return 1;
        }
      } else {
        // First login
        localStorage.setItem(`engolo_streak_${userId}`, JSON.stringify({
          lastLoginDate: new Date().toDateString(),
          streakCount: 1
        }));
        return 1;
      }
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 1;
    }
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  deleteNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifyListeners();
  }

  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Helper methods for triggering specific notifications
  onQuizCompleted(quizName: string, score: number) {
    window.dispatchEvent(new CustomEvent('quiz_completed', {
      detail: { quizName, score }
    }));
  }

  onModuleCompleted(moduleName: string) {
    window.dispatchEvent(new CustomEvent('module_completed', {
      detail: { moduleName }
    }));
  }

  onUserLogin(userId: string) {
    window.dispatchEvent(new CustomEvent('user_login', {
      detail: { userId, loginTime: new Date() }
    }));
  }

  onRankingChanged(previousPosition: number, currentPosition: number) {
    window.dispatchEvent(new CustomEvent('ranking_changed', {
      detail: { previousPosition, currentPosition }
    }));
  }

  // Cykliczne powiadomienia motywacyjne
  startMotivationalTimer() {
    console.log('🔔 Starting motivational notifications timer (every 5 minutes)');
    
    // Wyczyść poprzedni timer jeśli istnieje
    if (this.motivationalTimer) {
      clearInterval(this.motivationalTimer);
    }
    
    // Ustaw timer na co 5 minut (300000ms)
    this.motivationalTimer = window.setInterval(() => {
      this.triggerMotivationalNotification();
    }, 300000); // 5 minut = 300 sekund = 300000ms
  }

  stopMotivationalTimer() {
    if (this.motivationalTimer) {
      clearInterval(this.motivationalTimer);
      this.motivationalTimer = undefined;
      console.log('🔔 Motivational notifications timer stopped');
    }
  }

  private triggerMotivationalNotification() {
    console.log('🌟 Triggering motivational notification');
    
    const randomMessage = this.getRandomMessage('motivational');
    
    const notification: Notification = {
      id: `motivational_${Date.now()}`,
      type: 'achievement', // Używamy typu achievement dla stylu
      title: "💪 Motywacja",
      message: randomMessage,
      icon: "🌟",
      timestamp: new Date(),
      read: false,
      data: { type: 'motivational' }
    };

    this.notifications.unshift(notification);
    
    // Ogranicz liczbę powiadomień do 50
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    console.log('📢 Motivational notification created:', notification.message);
    this.notifyListeners();
    
    // Pokaż popup
    this.popupListeners.forEach(callback => callback(notification));
  }
}

export const notificationService = NotificationService.getInstance();
