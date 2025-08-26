import { notificationService } from './notification.service';

export class NotificationHelper {
  private static instance: NotificationHelper;

  static getInstance(): NotificationHelper {
    if (!NotificationHelper.instance) {
      NotificationHelper.instance = new NotificationHelper();
    }
    return NotificationHelper.instance;
  }

  private constructor() {}

  // Helper methods for easy integration with existing components
  static onQuizCompleted(quizName: string, score: number) {
    notificationService.onQuizCompleted(quizName, score);
    
    // Additional achievements based on performance
    if (score >= 100) {
      notificationService.triggerNotification('achievement', { 
        achievement: '🎯 Perfect Score! Wszystkie odpowiedzi poprawne!' 
      });
    } else if (score >= 90) {
      notificationService.triggerNotification('achievement', { 
        achievement: '⭐ Excellent! Prawie perfekcyjny wynik!' 
      });
    }
  }

  static onModuleCompleted(moduleName: string, totalScore?: number) {
    notificationService.onModuleCompleted(moduleName);
    
    // Additional achievements for module completion
    if (totalScore && totalScore >= 85) {
      notificationService.triggerNotification('achievement', { 
        achievement: '🏆 Module Master! Ukończyłeś moduł z wysokim wynikiem!' 
      });
    }
  }

  static onUserLogin(userId: string) {
    // This will handle both login notification and streak calculation
    notificationService.onUserLogin(userId);
  }

  static onRankingImprovement(previousPosition: number, currentPosition: number) {
    notificationService.onRankingChanged(previousPosition, currentPosition);
    
    // Special achievements for ranking milestones
    if (currentPosition <= 3 && previousPosition > 3) {
      notificationService.triggerNotification('achievement', { 
        achievement: '🥉 Top 3! Jesteś wśród najlepszych uczniów!' 
      });
    }
    
    if (currentPosition === 1 && previousPosition > 1) {
      notificationService.triggerNotification('achievement', { 
        achievement: '👑 Number One! Jesteś najlepszym uczniem!' 
      });
    }
  }

  static onSpecialAchievement(achievementName: string, description?: string) {
    notificationService.triggerNotification('achievement', { 
      achievement: achievementName,
      description 
    });
  }

  static onDailyGoalCompleted() {
    notificationService.triggerNotification('achievement', { 
      achievement: '📅 Daily Goal! Ukończyłeś dzisiejszy cel nauki!' 
    });
  }

  static onWeeklyGoalCompleted() {
    notificationService.triggerNotification('achievement', { 
      achievement: '📆 Weekly Champion! Ukończyłeś tygodniowy cel nauki!' 
    });
  }

  static onFirstQuizEver() {
    notificationService.triggerNotification('achievement', { 
      achievement: '🚀 First Steps! Twój pierwszy ukończony quiz!' 
    });
  }

  static onMultipleQuizzesInDay(count: number) {
    if (count >= 5) {
      notificationService.triggerNotification('achievement', { 
        achievement: `🔥 Quiz Marathon! ${count} quizów w jednym dniu!` 
      });
    }
  }

  static onPerfectWeek() {
    notificationService.triggerNotification('achievement', { 
      achievement: '🌟 Perfect Week! 7 dni z rzedu nauki!' 
    });
  }

  static onStudyMilestone(days: number) {
    const milestones = {
      30: '🌟 30-Day Warrior!',
      60: '💎 60-Day Champion!',
      100: '👑 100-Day Legend!',
      365: '🏆 Year-Long Master!'
    };

    const achievement = milestones[days as keyof typeof milestones];
    if (achievement) {
      notificationService.triggerNotification('achievement', { 
        achievement: `${achievement} ${days} dni nauki!` 
      });
    }
  }

  // Method to manually trigger test notifications for development
  static triggerTestNotifications() {
    setTimeout(() => {
      this.onQuizCompleted('Test Quiz', 95);
    }, 1000);

    setTimeout(() => {
      this.onModuleCompleted('Moduł Testowy', 88);
    }, 3000);

    setTimeout(() => {
      this.onSpecialAchievement('🎉 Test Achievement', 'To jest testowe osiągnięcie!');
    }, 5000);

    setTimeout(() => {
      notificationService.triggerNotification('streak', { days: 7 });
    }, 7000);
  }

  // Clear all notifications (for testing or reset)
  static clearAllNotifications() {
    notificationService.clearAll();
  }

  // Get current notification count
  static getUnreadCount(): number {
    return notificationService.getUnreadCount();
  }
}

// Export singleton instance
export const notificationHelper = NotificationHelper.getInstance();
