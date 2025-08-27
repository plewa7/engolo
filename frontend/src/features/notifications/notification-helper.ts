import { notificationService } from './notification.service';

class NotificationHelperClass {
  triggerQuizCompleted(quizName: string, score: number) {
    console.log('Triggering quiz completed notification:', quizName, score);
    notificationService.onQuizCompleted(quizName, score);
  }

  triggerModuleCompleted(moduleName: string) {
    console.log('Triggering module completed notification:', moduleName);
    notificationService.onModuleCompleted(moduleName);
  }

  triggerRankingAdvance(previousPosition: number, currentPosition: number) {
    console.log('Triggering ranking advance notification:', previousPosition, currentPosition);
    notificationService.onRankingChanged(previousPosition, currentPosition);
  }

  triggerAchievement(achievementName: string) {
    console.log('Triggering achievement notification:', achievementName);
    notificationService.triggerNotification('achievement', { achievement: achievementName });
  }

  triggerStreak(days: number) {
    console.log('Triggering streak notification:', days);
    notificationService.triggerNotification('streak', { days });
  }

  triggerLogin(userId: string) {
    console.log('Triggering login notification:', userId);
    notificationService.onUserLogin(userId);
  }
}

export const notificationHelper = new NotificationHelperClass();
export { NotificationHelperClass as NotificationHelper };
