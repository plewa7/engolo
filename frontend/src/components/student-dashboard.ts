import "./dashboard-home.ts";

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
      this.innerHTML = `<div><h2>Wyzwania - uczeń</h2><p>Weź udział w codziennych zadaniach.</p></div>`;
    } else if (section === "chat") {
      this.innerHTML = `<div><h2>Czat - uczeń</h2><p>Rozmawiaj z nauczycielem lub innymi uczniami.</p></div>`;
    } else if (section === "stats") {
      this.innerHTML = `<div><h2>Moje statystyki</h2><p>Śledź swoje postępy i wyniki.</p></div>`;
    } else if (section === "dictionary") {
      this.innerHTML = `<div><h2>Słownik (Oxford API)</h2><p>Wyszukuj definicje i przykłady.</p></div>`;
    } else if (section === "notifications") {
      this.innerHTML = `<div><h2>Powiadomienia</h2><p>Automatyczne powiadomienia motywacyjne.</p></div>`;
    } else {
      this.innerHTML = `<div><h2>Panel</h2></div>`;
    }
  }
}
customElements.define("student-dashboard", StudentDashboard);
