import "./dashboard-home";
import "./quiz-list";
import '../components/chat-box';
import "./dictionary";

export class StudentDashboard extends HTMLElement {
  static get observedAttributes() {
    return ["section"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const section = this.getAttribute("section") || "dashboard";
    if (section === "dashboard") {
      this.innerHTML = `<dashboard-home></dashboard-home>`;
    } else if (section === "challenges") {
      this.innerHTML = `
        <div>
          <h2>Wyzwania - uczeń</h2>
          <quiz-list></quiz-list>
        </div>
      `;
    } else if (section === "chat") {
      this.innerHTML = `<section><h2>Czat - uczeń</h2><p>Rozmawiaj z nauczycielem lub innymi uczniami.</p><chat-box></chat-box></section>`;
    } else if (section === "stats") {
      this.innerHTML = `<div><h2>Moje statystyki</h2><p>Śledź swoje postępy i wyniki.</p></div>`;
    } else if (section === "dictionary") {
      this.innerHTML = `
        <div>
          <dictionary-component></dictionary-component>
        </div>
      `;
    } else if (section === "notifications") {
      this.innerHTML = `<div><h2>Powiadomienia</h2><p>Automatyczne powiadomienia motywacyjne.</p></div>`;
    } else {
      this.innerHTML = `<div><h2>Panel</h2></div>`;
    }
  }
}
customElements.define("student-dashboard", StudentDashboard);
