import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class TodosService {
  private http = inject(HttpClient);

  getTodo(id: number) {
    return this.http.get<{ id: string }>(`https://jsonplaceholder.typicode.com/todos/${id}`);
  }
}