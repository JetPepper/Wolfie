import { assertAllowedCloudMetadataShape, assertCloudPayloadSafe } from "./zero-trade-cloud-policy";

export type WolfieCloudRequest = {
  path: "/login" | "/entitlement/refresh" | "/device/activate" | "/version" | "/subscription/status" | "/release/manifest";
  payload: Record<string, unknown>;
};

export async function wolfieCloudRequest<T>(request: WolfieCloudRequest, fetcher: (path: string, payload: Record<string, unknown>) => Promise<T>): Promise<T> {
  assertAllowedCloudMetadataShape(request.payload);
  return fetcher(request.path, request.payload);
}

export function assertNoTradeDataForCloud(payload: unknown): void {
  assertCloudPayloadSafe(payload);
}
