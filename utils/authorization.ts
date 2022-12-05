import type { NextApiRequest } from "next";
import { decode } from "jsonwebtoken";
import { resolve } from "path";
import { newEnforcer } from "casbin";
import AuthorizerAdapter from "@/utils/casbin-adapter";

export const getEnforcer = async () => {
  const adapter = await AuthorizerAdapter.newAdapter();
  const model = await newEnforcer(
    resolve(process.cwd(), "", "config/casbin/model.conf"),
    adapter
  );

  return model;
};

const getAuth: (req: NextApiRequest) => Promise<{
  [key: string]: any;
} | null> = async (req) => {
  const auth = req.headers.authorization;
  if (!auth) return null;

  const [type, token] = auth.split(" ");
  if (type !== "Bearer") return null;

  try {
    return decode(token) as { [key: string]: any };
  } catch (e) {
    return null;
  }
};

export class AuthClass {
  private static _auth: any;

  static async getAuth() {
    return this._auth;
  }

  static async setAuth(req: NextApiRequest) {
    this._auth = await getAuth(req);
  }
}

export const parsePolicyEffect: (policy: string[]) => { [key: string]: any } = (
  policy
) => {
  try {
    return JSON.parse(Buffer.from(policy[5], "base64").toString("utf-8"));
  } catch (e) {
    return {};
  }
};

export {};
