import { IMailer } from 'src/core/ports/mailer.interface';
import { Executable } from 'src/shared/executable';
import { User } from 'src/users/entities/user.entity';
import { IUserRepository } from 'src/users/ports/user-repository.interface';
import { IParticipationRepository } from 'src/webinars/ports/participation-repository.interface';
import { IWebinarRepository } from 'src/webinars/ports/webinar-repository.interface';
import { Participation } from '../entities/participation.entity';

type Request = {
  webinarId: string;
  user: User;
};
type Response = void;

export class BookSeat implements Executable<Request, Response> {
  constructor(
    private readonly participationRepository: IParticipationRepository,
    private readonly userRepository: IUserRepository,
    private readonly webinarRepository: IWebinarRepository,
    private readonly mailer: IMailer,
  ) {}
  async execute({ webinarId, user }: Request): Promise<Response> {
    const webinar = await this.webinarRepository.findById(webinarId);
    if (!webinar) {throw new Error('Webinar not found');}

    //Verifier qu'il reste des places
    //if (webinar.hasTooManySeats()) {throw new Error('No more seats available');}
    const existingParticipation = await this.participationRepository.findByWebinarId(webinarId);
    if (existingParticipation.length === webinar.props.seats) {throw new Error('No more seats available');}

    //Verifier que l'utilisateur n'est pas déjà inscrit
    if (existingParticipation.some((p) => p.props.userId === user.props.id)) {throw new Error('User already registered');}

    //Créer une participation
    const participation = new Participation({ userId: user.props.id, webinarId });
    await this.participationRepository.save(participation);

    //Notifier l'organisateur par mail
    const organizer = await this.userRepository.findById(webinar.props.organizerId);
    if (!organizer) {
      throw new Error('Organizer not found');
    }

    await this.mailer.send({
      to: organizer.props.email,
      subject: 'New participant registered',
      body: `A new participant has registered for your webinar: ${webinar.props.title}`,
  });
  }
}
