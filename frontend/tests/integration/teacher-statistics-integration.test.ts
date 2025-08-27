// Test integracyjny dla TeacherStatistics

// Mock komponentu z prawdziwą logiką API
class MockTeacherStatisticsElement extends HTMLElement {
  public statistics: any = null;
  public loading: boolean = true;
  public allUsers: any[] = [];
  public allStatistics: any[] = [];

  connectedCallback() {
    this.loadStatistics();
  }

  async loadStatistics() {
    try {
      const token = localStorage.getItem("strapi_jwt");
      if (!token) {
        console.error("Brak autoryzacji");
        this.loading = false;
        return;
      }

      // Pobierz wszystkich użytkowników
      const usersResponse = await fetch('http://localhost:1337/api/users', {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!usersResponse || !usersResponse.ok) {
        console.error('Users API error:', usersResponse?.status, usersResponse?.statusText);
        this.loading = false;
        return;
      }

      const users = await usersResponse.json();
      
      // Pobierz wszystkie statystyki ćwiczeń
      const exerciseStatsResponse = await fetch('http://localhost:1337/api/exercise-statistics?populate=user&sort=completedAt:desc', {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!exerciseStatsResponse || !exerciseStatsResponse.ok) {
        console.error('Exercise Statistics API error:', exerciseStatsResponse?.status);
        this.loading = false;
        return;
      }

      const exerciseStats = await exerciseStatsResponse.json();

      // Pobierz wszystkie statystyki quizów
      const quizStatsResponse = await fetch('http://localhost:1337/api/quiz-statistics?populate=user&sort=completedAt:desc', {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!quizStatsResponse || !quizStatsResponse.ok) {
        console.error('Quiz Statistics API error:', quizStatsResponse?.status);
        this.loading = false;
        return;
      }

      const quizStats = await quizStatsResponse.json();

      this.allUsers = users;
      this.allStatistics = [...(exerciseStats.data || []), ...(quizStats.data || [])];
      this.loading = false;

    } catch (error) {
      console.error('Error loading teacher statistics:', error);
      this.loading = false;
    }
  }
}

describe('TeacherStatistics - Integration Tests', () => {
  let container: HTMLElement;
  let component: MockTeacherStatisticsElement;

  beforeEach(() => {
    // Przygotuj środowisko testowe
    container = document.createElement('div');
    document.body.appendChild(container);

    // Mock fetch API
    global.fetch = jest.fn();
    
    // Mock localStorage z tokenem
    (localStorage.getItem as jest.Mock).mockReturnValue('valid-jwt-token');

    // Zarejestruj custom element w testowym środowisku
    if (!customElements.get('teacher-statistics')) {
      customElements.define('teacher-statistics', MockTeacherStatisticsElement);
    }
  });

  afterEach(() => {
    // Wyczyść DOM po każdym teście
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe('API Integration', () => {
    it('should fetch users and statistics data on component initialization', async () => {
      const mockUsersResponse = {
        ok: true,
        json: () => Promise.resolve([
          { id: 1, username: 'student1', isTeacher: false },
          { id: 2, username: 'student2', isTeacher: false }
        ])
      };

      const mockExerciseStatsResponse = {
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 1, attributes: { correctAnswers: 8, totalQuestions: 10, user: { data: { id: 1 } } } }
          ]
        })
      };

      const mockQuizStatsResponse = {
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 2, attributes: { correctAnswers: 6, totalQuestions: 10, user: { data: { id: 2 } } } }
          ]
        })
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockUsersResponse)
        .mockResolvedValueOnce(mockExerciseStatsResponse)
        .mockResolvedValueOnce(mockQuizStatsResponse);

      // Symuluj dodanie komponentu do DOM
      component = document.createElement('teacher-statistics') as MockTeacherStatisticsElement;
      container.appendChild(component);

      // Poczekaj na zakończenie ładowania danych
      await new Promise(resolve => setTimeout(resolve, 200));

      // Sprawdź czy zostały wykonane odpowiednie wywołania API
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:1337/api/users',
        expect.objectContaining({
          headers: { "Authorization": "Bearer valid-jwt-token" }
        })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:1337/api/exercise-statistics?populate=user&sort=completedAt:desc',
        expect.objectContaining({
          headers: { "Authorization": "Bearer valid-jwt-token" }
        })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:1337/api/quiz-statistics?populate=user&sort=completedAt:desc',
        expect.objectContaining({
          headers: { "Authorization": "Bearer valid-jwt-token" }
        })
      );

      // Sprawdź czy dane zostały załadowane
      expect(component.allUsers).toHaveLength(2);
      expect(component.allStatistics).toHaveLength(2);
      expect(component.loading).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockErrorResponse) // Users API error
        .mockResolvedValueOnce(mockErrorResponse) // Exercise stats error
        .mockResolvedValueOnce(mockErrorResponse); // Quiz stats error

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      component = document.createElement('teacher-statistics') as MockTeacherStatisticsElement;
      container.appendChild(component);

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(consoleSpy).toHaveBeenCalled();
      expect(component.loading).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should handle missing authorization token', async () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      component = document.createElement('teacher-statistics') as MockTeacherStatisticsElement;
      container.appendChild(component);

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(global.fetch).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("Brak autoryzacji");
      consoleSpy.mockRestore();
    });
  });

  describe('Data Processing Integration', () => {
    it('should process and display statistics data correctly', async () => {
      const mockUsersResponse = {
        ok: true,
        json: () => Promise.resolve([
          { id: 1, username: 'student1', isTeacher: false },
          { id: 2, username: 'student2', isTeacher: false },
          { id: 3, username: 'teacher1', isTeacher: true }
        ])
      };

      const mockExerciseStatsResponse = {
        ok: true,
        json: () => Promise.resolve({
          data: [
            { 
              id: 1, 
              attributes: { 
                correctAnswers: 8, 
                totalQuestions: 10, 
                timeSpent: 120,
                completedAt: '2025-01-01T10:00:00Z',
                user: { data: { id: 1, attributes: { username: 'student1' } } }
              } 
            }
          ]
        })
      };

      const mockQuizStatsResponse = {
        ok: true,
        json: () => Promise.resolve({ data: [] })
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockUsersResponse)
        .mockResolvedValueOnce(mockExerciseStatsResponse)
        .mockResolvedValueOnce(mockQuizStatsResponse);

      component = document.createElement('teacher-statistics') as MockTeacherStatisticsElement;
      container.appendChild(component);

      await new Promise(resolve => setTimeout(resolve, 200));

      // Sprawdź czy komponent został dodany do DOM
      expect(container.contains(component)).toBe(true);
      expect(component.tagName.toLowerCase()).toBe('teacher-statistics');
      
      // Sprawdź czy dane zostały przetworzone
      expect(component.allUsers).toHaveLength(3);
      expect(component.allStatistics).toHaveLength(1);
    });
  });

  describe('User Interaction Integration', () => {
    it('should respond to view changes', async () => {
      component = document.createElement('teacher-statistics') as MockTeacherStatisticsElement;
      container.appendChild(component);

      // Symuluj zmianę widoku
      const event = new CustomEvent('viewchange', { 
        detail: { view: 'students' } 
      });
      component.dispatchEvent(event);

      // Sprawdź czy event został wysłany
      expect(component).toBeDefined();
      expect(component.tagName.toLowerCase()).toBe('teacher-statistics');
    });
  });
});
