import { BookSeat } from './book-seat';
import { IParticipationRepository } from '../ports/participation-repository.interface';
import { IUserRepository } from '../../users/ports/user-repository.interface';
import { IWebinarRepository } from '../ports/webinar-repository.interface';
import { I_MAILER, IMailer } from '../../core/ports/mailer.interface';
import { InMemoryWebinarRepository } from '../adapters/webinar-repository.in-memory';
import { Participation } from '../entities/participation.entity';
import { User } from 'src/users/entities/user.entity';
import { Webinar } from '../entities/webinar.entity';
import { InMemoryParticipationRepository } from '../adapters/participation-repository.in-memorys';

describe('Feature: Book Seat', () => {
    let participationRepository: IParticipationRepository;
    let userRepository: IUserRepository;
    let webinarRepository: IWebinarRepository;
    let mailer: IMailer;
    let useCase: BookSeat;
  
    const user = new User({ id: 'user-bob-id', email: 'bob@example.com', password: 'password' });
  
    beforeEach(() => {
      participationRepository = new InMemoryParticipationRepository();
      userRepository = new InMemoryUserRepository();
      webinarRepository = new InMemoryWebinarRepository();
      mailer = new I_MAILER()
      useCase = new BookSeat(participationRepository, userRepository, webinarRepository, mailer);
    });
  
    describe('Scenario: happy path', () => {
      let webinar: Webinar;
  
      beforeEach(async () => {
        webinar = new Webinar({
          id: 'webinar-id-1',
          organizerId: 'user-alice-id',
          title: 'Webinar title',
          seats: 100,
          startDate: new Date('2024-01-10T10:00:00.000Z'),
          endDate: new Date('2024-01-10T11:00:00.000Z'),
        });
  
        await webinarRepository.save(webinar); // Sauvegarde du webinar avant d'essayer de s'inscrire
      });
  
      it('should book a seat successfully', async () => {
        await useCase.execute({ webinarId: webinar.id, user });
  
        const participations = await participationRepository.findByWebinarId(webinar.id);
        expect(participations).toHaveLength(1);
        expect(participations[0].props.userId).toBe(user.props.id);
      });
  
      it('should notify the organizer via mail', async () => {
        await useCase.execute({ webinarId: webinar.id, user });
  
        // Verifie que le mail a été envoyé
        const emailSent = mailer.lastSentEmail();
        expect(emailSent).toBeDefined();
        expect(emailSent.to).toBe(webinar.props.organizerId);
        expect(emailSent.subject).toBe('New participant registered');
      });
    });
  
    describe('Scenario: no more seats available', () => {
      beforeEach(async () => {
        const webinar = new Webinar({
          id: 'webinar-id-1',
          organizerId: 'user-alice-id',
          title: 'Webinar title',
          seats: 1,
          startDate: new Date('2024-01-10T10:00:00.000Z'),
          endDate: new Date('2024-01-10T11:00:00.000Z'),
        });
  
        await webinarRepository.save(webinar);
        await participationRepository.save(new Participation({ userId: user.props.id, webinarId: webinar.id }));
      });
  
      it('should throw an error when no more seats are available', async () => {
        await expect(useCase.execute({ webinarId: 'webinar-id-1', user })).rejects.toThrow('No more seats available');
      });
    });
  
    describe('Scenario: user already registered', () => {
      beforeEach(async () => {
        const webinar = new Webinar({
          id: 'webinar-id-2',
          organizerId: 'user-alice-id',
          title: 'Webinar title',
          seats: 100,
          startDate: new Date('2024-01-10T10:00:00.000Z'),
          endDate: new Date('2024-01-10T11:00:00.000Z'),
        });
  
        await webinarRepository.save(webinar);
        await participationRepository.save(new Participation({ userId: user.props.id, webinarId: webinar.id }));
      });
  
      it('should throw an error when user is already registered', async () => {
        await expect(useCase.execute({ webinarId: 'webinar-id-2', user })).rejects.toThrow('User already registered');
      });
    });
  
    describe('Scenario: webinar not found', () => {
      it('should throw an error when webinar does not exist', async () => {
        await expect(useCase.execute({ webinarId: 'non-existing-webinar-id', user })).rejects.toThrow('Webinar not found');
      });
    });
  });
  