import { Participation } from "../entities/participation.entity";
import { IParticipationRepository } from "../ports/participation-repository.interface";

export class InMemoryParticipationRepository implements IParticipationRepository {
      constructor(public database: Participation[] = []) {}
    
    async findByWebinarId(webinarId: string): Promise<Participation[]> {
        return this.database.filter((p) => p.props.webinarId === webinarId);
    }
    async save(participation: Participation): Promise<void> {
        this.database.push(participation);
    }

}