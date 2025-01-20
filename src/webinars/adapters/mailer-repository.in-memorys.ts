import { Email, IMailer } from "src/core/ports/mailer.interface";

export class InMemoryMailerRepository implements IMailer {
  constructor(public database: Email[] = []) {}

  async send(props: Email): Promise<void> {
    if (!props.to || !props.subject || !props.body) {
        throw new Error('Missing required email properties: to, subject, or body.');
    }
      
      // Simuler l'envoi d'un e-mail en mémoire
      this.database.push(props);
  }

}