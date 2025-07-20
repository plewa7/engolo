export class StudentDashboard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = "<div>Student Dashboard</div>";
  }
}
customElements.define("student-dashboard", StudentDashboard);
