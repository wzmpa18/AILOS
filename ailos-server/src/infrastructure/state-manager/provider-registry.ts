import { Injectable, Logger } from '@nestjs/common';
import {
  IProviderRegistry,
  IStateProvider,
  ProviderRegistration,
} from './state-manager.types';

/**
 * Provider Registry — State Manager 核心治理组件
 * 负责 Provider 注册、命名空间隔离、路由解析
 */
@Injectable()
export class ProviderRegistry implements IProviderRegistry {
  private readonly logger = new Logger(ProviderRegistry.name);
  private readonly providers = new Map<string, IStateProvider>();
  private readonly registrations = new Map<string, ProviderRegistration>();
  private readonly namespaceMap = new Map<string, string>();

  register(
    provider: IStateProvider,
    registration: ProviderRegistration,
  ): void {
    if (this.providers.has(registration.provider_name)) {
      throw new Error(
        `Provider "${registration.provider_name}" already registered`,
      );
    }
    if (this.namespaceMap.has(registration.state_namespace)) {
      throw new Error(
        `Namespace "${registration.state_namespace}" already claimed by "${this.namespaceMap.get(registration.state_namespace)}"`,
      );
    }

    this.providers.set(registration.provider_name, provider);
    this.registrations.set(registration.provider_name, registration);
    this.namespaceMap.set(
      registration.state_namespace,
      registration.provider_name,
    );

    this.logger.log(
      `Provider registered: ${registration.provider_name} → namespace "${registration.state_namespace}" (domain: ${registration.owner_domain})`,
    );
  }

  unregister(providerName: string): void {
    const registration = this.registrations.get(providerName);
    if (!registration) {
      throw new Error(`Provider "${providerName}" not found`);
    }

    const provider = this.providers.get(providerName);
    if (provider) {
      provider.shutdown().catch((err) => {
        this.logger.error(`Error shutting down provider "${providerName}": ${err.message}`);
      });
    }

    this.namespaceMap.delete(registration.state_namespace);
    this.registrations.delete(providerName);
    this.providers.delete(providerName);

    this.logger.log(`Provider unregistered: ${providerName}`);
  }

  get(providerName: string): IStateProvider | undefined {
    return this.providers.get(providerName);
  }

  resolve(namespace: string): IStateProvider | undefined {
    const providerName = this.namespaceMap.get(namespace);
    if (providerName) {
      return this.providers.get(providerName);
    }
    return undefined;
  }

  list(): ProviderRegistration[] {
    return Array.from(this.registrations.values());
  }

  /** 从 state_key 提取命名空间 */
  extractNamespace(stateKey: string): string {
    const dotIndex = stateKey.indexOf(':');
    if (dotIndex === -1) {
      return stateKey;
    }
    return stateKey.substring(0, dotIndex);
  }
}