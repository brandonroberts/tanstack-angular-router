import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class TodosService {
  private http = inject(HttpClient);

  getTodo(id: number) {
    return this.http.get(`https://jsonplaceholder.typicode.com/todos/${id}`);
  }
}