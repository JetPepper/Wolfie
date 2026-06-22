export type BrokerConnectorStatus = "disconnected" | "local_ready" | "invalid_session" | "not_implemented";

export type BrokerConnectorReadiness = {
  status: BrokerConnectorStatus;
  localReady: boolean;
  reason?: string;
};

export interface LocalBrokerConnector {
  status: BrokerConnectorStatus;
  connectLocal(): BrokerConnectorReadiness;
  disconnectLocal(): BrokerConnectorReadiness;
  getLocalReadiness(): BrokerConnectorReadiness;
  validateLocalSession(): BrokerConnectorReadiness;
  submitOrderIntentLocal(intent: unknown): { submitted: false; reason: string };
}

export class StubLocalBrokerConnector implements LocalBrokerConnector {
  status: BrokerConnectorStatus = "not_implemented";

  connectLocal(): BrokerConnectorReadiness {
    this.status = "not_implemented";
    return this.getLocalReadiness();
  }

  disconnectLocal(): BrokerConnectorReadiness {
    this.status = "disconnected";
    return this.getLocalReadiness();
  }

  getLocalReadiness(): BrokerConnectorReadiness {
    return { status: this.status, localReady: this.status === "local_ready", reason: "Real broker/MCP connector remains fail-closed until local implementation is complete." };
  }

  validateLocalSession(): BrokerConnectorReadiness {
    return this.getLocalReadiness();
  }

  submitOrderIntentLocal(): { submitted: false; reason: string } {
    return { submitted: false, reason: "submitOrderIntentLocal is a fail-closed placeholder." };
  }
}
