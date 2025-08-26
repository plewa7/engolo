import { ajax } from "rxjs/ajax";
import { map, tap } from "rxjs/operators";
import { Observable } from "rxjs";
import { setUser } from "./auth.store";

const API_URL = "http://localhost:1337/api"; // dostosuj do swojego backendu

export function login(form: FormData): Observable<any> {
  return ajax
    .post(
      `${API_URL}/auth/local`,
      {
        identifier: form.get("identifier"),
        password: form.get("password"),
      },
      { "Content-Type": "application/json" }
    )
    .pipe(
      map((res) => res.response),
      tap((response: any) => {
        // Strapi zwraca JWT w response.jwt
        if (response.user) {
          setUser(response.user);
          localStorage.setItem("user", JSON.stringify(response.user));
        }
        if (response.jwt) localStorage.setItem("strapi_jwt", response.jwt);
      })
    );
}

export function register(form: FormData): Observable<any> {
  console.log('Attempting registration with:', {
    username: form.get("username"),
    email: form.get("email"),
    password: form.get("password") ? '[HIDDEN]' : 'MISSING'
  });

  return ajax
    .post(
      `${API_URL}/auth/local/register`,
      {
        username: form.get("username"),
        email: form.get("email"),
        password: form.get("password"),
      },
      { "Content-Type": "application/json" }
    )
    .pipe(
      map((res) => res.response),
      tap((response: any) => {
        console.log('Registration response:', response);
        // Strapi zwraca JWT również po rejestracji
        if (response.user) {
          console.log('Setting user:', response.user);
          setUser(response.user);
          // Zapisz też user do localStorage
          localStorage.setItem("user", JSON.stringify(response.user));
        }
        if (response.jwt) {
          console.log('Setting JWT token');
          localStorage.setItem("strapi_jwt", response.jwt);
        }
      })
    );
}
