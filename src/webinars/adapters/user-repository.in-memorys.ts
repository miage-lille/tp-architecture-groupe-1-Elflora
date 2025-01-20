import { User } from "src/users/entities/user.entity";
import { IUserRepository } from "src/users/ports/user-repository.interface";


export class InMemoryUserRepository implements IUserRepository {
  constructor(public database: User[] = []) {}

  async findById(id: string): Promise<User | null> {
    return this.database.find((u) => u.props.id === id) || null;
  }

  async save(user: User): Promise<void> {
    this.database.push(user);
  }
}