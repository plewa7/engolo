export class TeacherDashboard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = "<div>Teacher Dashboard</div>";
  }
}
customElements.define("teacher-dashboard", TeacherDashboard);
