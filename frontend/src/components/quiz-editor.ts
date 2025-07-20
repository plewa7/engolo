// @ts-ignore
import quizEditorCss from "../styles/quiz-editor.css?inline";

class QuizEditor extends HTMLElement {
  shadow: ShadowRoot;
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadow.innerHTML = `
      <style data-quiz-editor-style>\n${quizEditorCss}\n</style>
      <form id="quiz-form" class="quiz-editor-form">
        <label>Pytanie:
          <input name="question" required />
        </label>
        <label>Poprawna odpowiedź:
          <input name="correctAnswer" required />
        </label>
        <label>Opcje (oddzielone przecinkami):
          <input name="options" required />
        </label>
        <button type="submit">Zapisz quiz</button>
      </form>
      <div id="status"></div>
    `;
    const form = this.shadow.querySelector<HTMLFormElement>("#quiz-form");
    if (form) {
      form.onsubmit = this.handleSubmit.bind(this);
    }
  }

  async handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const question = (form.elements.namedItem("question") as HTMLInputElement)
      ?.value;
    const correctAnswer = (
      form.elements.namedItem("correctAnswer") as HTMLInputElement
    )?.value;
    const optionsRaw = (form.elements.namedItem("options") as HTMLInputElement)
      ?.value;
    const options = optionsRaw
      ? optionsRaw.split(",").map((o: string) => o.trim())
      : [];
    // TODO: Pobierz userId nauczyciela jeśli wymagane
    const quiz = { question, correctAnswer, options };
    try {
      // Ustal właściwy adres backendu Strapi
      const API_URL = "http://localhost:1337/api/quizzes";
      const token = localStorage.getItem("strapi_jwt");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ data: quiz }),
      });
      const statusDiv = this.shadow.querySelector<HTMLDivElement>("#status");
      if (res.ok) {
        if (statusDiv) statusDiv.textContent = "Quiz zapisany!";
        form.reset();
      } else if (res.status === 403) {
        if (statusDiv)
          statusDiv.textContent =
            "Brak uprawnień do zapisu quizu. Skonfiguruj uprawnienia w panelu Strapi (kolekcja quizzes).";
      } else if (res.status === 404) {
        if (statusDiv)
          statusDiv.textContent =
            "Nie znaleziono endpointu. Sprawdź czy Strapi działa na http://localhost:1337 i czy kolekcja quizzes istnieje.";
      } else {
        if (statusDiv) statusDiv.textContent = "Błąd zapisu quizu.";
      }
    } catch (err) {
      const statusDiv = this.shadow.querySelector<HTMLDivElement>("#status");
      if (statusDiv) statusDiv.textContent = "Błąd sieci.";
    }
  }
}
customElements.define("quiz-editor", QuizEditor);
