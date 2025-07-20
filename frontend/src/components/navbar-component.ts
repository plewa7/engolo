export class NavbarComponent extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <nav>
        <button id="logout-btn">Wyloguj</button>
      </nav>
    `;
    this.querySelector("#logout-btn")?.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("logout", { bubbles: true }));
    });
  }
}

customElements.define("navbar-component", NavbarComponent);
