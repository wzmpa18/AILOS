import { Module, Global } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { GlobalLoggingInterceptor } from './logging.interceptor';

@Global()
@Module({
  providers: [LoggingService, GlobalLoggingInterceptor],
  exports: [LoggingService, GlobalLoggingInterceptor],
})
export class LoggingModule {}
