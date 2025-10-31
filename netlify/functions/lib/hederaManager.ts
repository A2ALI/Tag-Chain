import { Client, PrivateKey, TopicMessageSubmitTransaction } from '@hashgraph/sdk';

class HederaManager {
  private static instance: HederaManager;
  private client: Client | null = null;
  private operatorKey: PrivateKey | null = null;

  private constructor() {}

  static getInstance(): HederaManager {
    if (!HederaManager.instance) HederaManager.instance = new HederaManager();
    return HederaManager.instance;
  }

  getNetwork(): string {
    return process.env.HEDERA_NETWORK || process.env.VITE_HEDERA_NETWORK || 'testnet';
  }

  async getClient(): Promise<Client> {
    if (this.client) return this.client;

    const network = this.getNetwork();
    this.client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();

  // Read server-only env vars. Do NOT fall back to VITE_* client-exposed envs.
  const operatorId = process.env.HEDERA_ACCOUNT_ID;
  const operatorKeyStr = process.env.HEDERA_PRIVATE_KEY;

    if (!operatorId || !operatorKeyStr) {
      throw new Error('Hedera operator id/key not configured in environment');
    }

    this.operatorKey = PrivateKey.fromStringED25519(operatorKeyStr);
    this.client.setOperator(operatorId, this.operatorKey as PrivateKey);

    return this.client;
  }

  async submitTopicMessage(topicId: string, payload: any): Promise<{ txId: string }>{
    const client = await this.getClient();

    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);

    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message)
      .freezeWith(client)
      .sign(this.operatorKey as PrivateKey);

    const txResponse = await tx.execute(client);
    // ensure consensus
    await txResponse.getReceipt(client);

    return { txId: txResponse.transactionId.toString() };
  }

  async close(): Promise<void> {
    if (this.client) {
      try { await this.client.close(); } catch (e) { /* ignore */ }
      this.client = null;
      this.operatorKey = null;
    }
  }
}

export const hederaManager = HederaManager.getInstance();
