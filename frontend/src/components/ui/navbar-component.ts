export class NavbarComponent extends HTMLElement {
  static get observedAttributes() {
    return ["role", "current-section"];
  }

  role: string = "student";
  currentSection: string = "dashboard";
  sections: Array<{ key: string; label: string }> = [];

  connectedCallback() {
    this.updateSections();
    // Odczytaj sekcję z hash w URL, jeśli istnieje
    const hashSection = window.location.hash.replace("#", "");
    if (hashSection && this.sections.some((s) => s.key === hashSection)) {
      this.currentSection = hashSection;
      this.setAttribute("current-section", hashSection);
    } else {
      this.currentSection = "dashboard";
      this.setAttribute("current-section", "dashboard");
    }
    this.render();
  }

  attributeChangedCallback(name: string, newValue: string) {
    if (name === "role") {
      this.role = newValue;
      this.updateSections();
    }
    if (name === "current-section") {
      this.currentSection = newValue;
    }
    this.render();
  }

  updateSections() {
    if (this.role === "teacher") {
      this.sections = [
        { key: "dashboard", label: "Panel główny" },
        { key: "challenges", label: "Wyzwania" },
        { key: "chat", label: "Czat" },
        { key: "stats", label: "Statystyki uczniów" },
        { key: "dictionary", label: "Słownik" },
        { key: "notifications", label: "Powiadomienia" },
      ];
    } else {
      this.sections = [
        { key: "dashboard", label: "Panel główny" },
        { key: "challenges", label: "Wyzwania" },
        { key: "chat", label: "Czat" },
        { key: "stats", label: "Moje statystyki" },
        { key: "dictionary", label: "Słownik" },
        { key: "notifications", label: "Powiadomienia" },
      ];
    }
  }

  render() {

    const nav = this.querySelector("nav.navbar");
    if (nav) {
      // Aktualizuj klasy aktywności przycisków
      nav.querySelectorAll(".nav-btn").forEach((btn) => {
        const section = btn.getAttribute("data-section");
        if (section === this.currentSection) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
      return;
    }

    this.innerHTML = `
      <link rel="stylesheet" href="/src/styles/navbar.css">
      <nav class="navbar">
        ${this.sections
          .map(
            (s) =>
              `<button class="nav-btn${
                s.key === this.currentSection ? " active" : ""
              }" data-section="${s.key}">${s.label}</button>`
          )
          .join("")}
        <button class="logout-btn">Wyloguj</button>
      </nav>
    `;
    this.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const section = (e.currentTarget as HTMLElement).dataset.section;
        if (section && section !== this.currentSection) {
          this.currentSection = section;
          this.setAttribute("current-section", section);
          window.location.hash = section;
        }
        this.dispatchEvent(
          new CustomEvent("navigate", {
            detail: { section },
            bubbles: true,
          })
        );
      });
    });
    this.querySelector(".logout-btn")?.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("logout", { bubbles: true }));
    });
  }
}

customElements.define("navbar-component", NavbarComponent);
