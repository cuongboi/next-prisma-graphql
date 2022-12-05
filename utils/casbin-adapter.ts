import { Helper, Adapter, Model } from "casbin";

type CasbinPolicy = {
  ptype: string;
  v0?: string; // Role ID
  v1?: string; // Path
  v2?: string; // Method
  v3?: string; // Model
  v4?: string; // Action
  v5?: string; // Effect (Base64 encoded JSON)
};

class AuthorizerAdapter implements Adapter {
  async loadPolicy(model: Model) {
    const lines = await prisma.policies.findMany();

    for (const line of lines) {
      const lineString =
        line.ptype +
        ", " +
        [line.v0, line.v1, line.v2, line.v3 || "", line.v4 || "", line.v5 || ""]
          .filter((n) => n)
          .join(", ");

      Helper.loadPolicyLine(lineString, model);
    }
  }

  async savePolicy(model: Model) {
    await prisma.policies.delete({
      where: {},
    });

    const processes: any[] = [];

    for (const ptype of ["p", "g"]) {
      model?.model?.get(ptype)?.forEach(([, ast]: any) => {
        ast.policy.forEach((rule: any) => {
          processes.push(
            prisma.policies.create({
              data: this._policyRecord(ptype, rule),
            })
          );
        });
      });
    }

    await Promise.all(processes);

    return true;
  }

  async addPolicy(sec: any, ptype: any, rule: any) {
    await prisma.policies.create({
      data: this._policyRecord(ptype, rule),
    });
  }

  async addPolicies(sec: any, ptype: any, rules: any) {
    const processes = [];
    for (const rule of rules) {
      const p = prisma.policies.create({
        data: this._policyRecord(ptype, rule),
      });
      processes.push(p);
    }

    await Promise.all(processes);
  }

  async removePolicy(sec: any, ptype: any, rule: any) {
    await prisma.policies.deleteMany({
      where: this._policyRecord(ptype, rule),
    });
  }

  async removePolicies(sec: any, ptype: any, rules: any) {
    const processes = [];
    for (const rule of rules) {
      const p = prisma.policies.deleteMany({
        where: this._policyRecord(ptype, rule),
      });
      processes.push(p);
    }

    await Promise.all(processes);
  }

  async removeFilteredPolicy(
    sec: any,
    ptype: any,
    fieldIndex: any,
    ...fieldValues: any[]
  ) {
    const line = <CasbinPolicy>{ ptype };

    const idx = fieldIndex + fieldValues.length;

    if (fieldIndex <= 0 && 0 < idx) {
      line.v0 = fieldValues[0 - fieldIndex];
    }
    if (fieldIndex <= 1 && 1 < idx) {
      line.v1 = fieldValues[1 - fieldIndex];
    }
    if (fieldIndex <= 2 && 2 < idx) {
      line.v2 = fieldValues[2 - fieldIndex];
    }
    if (fieldIndex <= 3 && 3 < idx) {
      line.v3 = fieldValues[3 - fieldIndex];
    }
    if (fieldIndex <= 4 && 4 < idx) {
      line.v4 = fieldValues[4 - fieldIndex];
    }
    if (fieldIndex <= 5 && 5 < idx) {
      line.v5 = fieldValues[5 - fieldIndex];
    }

    await prisma.policies.deleteMany({ where: line });
  }

  async close() {
    return prisma.$disconnect();
  }

  static async newAdapter() {
    return new AuthorizerAdapter();
  }

  private _policyRecord(ptype: any, rule: any) {
    const line = { ptype };

    rule.forEach((value: any, index: number) => {
      line[`v${index}` as keyof typeof line] = value;
    });

    return line;
  }
}

export default AuthorizerAdapter;
