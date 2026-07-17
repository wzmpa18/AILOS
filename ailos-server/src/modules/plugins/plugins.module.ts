import { Module } from '@nestjs/common';
import { PluginLoaderService } from './plugin-loader.service';

@Module({
  providers: [PluginLoaderService],
  exports: [PluginLoaderService],
})
export class PluginsModule {}
