import { Injectable } from '@nestjs/common';
import { Cat } from './cat.type';

@Injectable()
export class CatService {
  db: Map<string, Cat> = new Map(); // Simulate a external DB

  getCats(): Cat[] {
    return Array.from(this.db.values());
  }

  createCat(name: string): string {
    const id = this.db.size + 1;

    const newCat = {
      id: id.toString(),
      name,
    };

    this.db.set(newCat.id, newCat);

    return newCat.id;
  }

  getCat(id: string): Cat {
    const cat = this.db.get(id);

    if (!cat) {
      throw new Error("Can't find the cat");
    }

    return cat;
  }
}
