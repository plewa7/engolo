import "./dashboard-home.ts";
export class TeacherDashboard extends HTMLElement {
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
      this.innerHTML = `<div><h2>Wyzwania - nauczyciel</h2><p>Zarządzaj i dodawaj wyzwania dla uczniów.</p></div>`;
    } else if (section === "chat") {
      this.innerHTML = `<div><h2>Czat - nauczyciel</h2><p>Komunikuj się z uczniami i innymi nauczycielami.</p></div>`;
    } else if (section === "stats") {
      this.innerHTML = `<div><h2>Statystyki uczniów</h2><p>Przeglądaj postępy i wyniki uczniów.</p></div>`;
    } else if (section === "dictionary") {
      this.innerHTML = `<div><h2>Słownik (Oxford API)</h2><p>Wyszukuj definicje i przykłady.</p></div>`;
    } else if (section === "notifications") {
      this.innerHTML = `<div><h2>Powiadomienia</h2><p>Automatyczne powiadomienia motywacyjne.</p></div>`;
    } else {
      this.innerHTML = `<div><h2>Panel</h2></div>`;
    }
  }
}
customElements.define("teacher-dashboard", TeacherDashboard);
