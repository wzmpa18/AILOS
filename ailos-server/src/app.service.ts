import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'AILOS Server',
      version: '0.0.1',
      timestamp: Date.now(),
    };
  }
}
