import type { OperatorIdentity } from "../contracts";
import { operatorRepo } from "../db/repositories/operator-repo";
import type { Operator, OperatorStatus } from "../domain/types";

export const operatorService = {
  async ensureOperator(identity: OperatorIdentity): Promise<Operator> {
    return operatorRepo.ensure(identity.id, identity.displayName);
  },

  async listOperators(): Promise<Operator[]> {
    return operatorRepo.listAll();
  },

  async setStatus(operatorId: string, status: OperatorStatus): Promise<Operator> {
    const operator = await operatorRepo.setStatus(operatorId, status);
    if (!operator) throw new Error(`Care Desk: operator ${operatorId} not found`);
    return operator;
  },
};
