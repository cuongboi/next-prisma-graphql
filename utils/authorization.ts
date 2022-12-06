import type { NextApiRequest } from "next";
import { decode } from "jsonwebtoken";
import { resolve } from "path";
import { newEnforcer } from "casbin";
import AuthorizerAdapter from "@/utils/casbin-adapter";
import { Resolver, Query, Ctx } from "type-graphql";
import { Users } from "@/prisma/generated/type-graphql";
import _ from "lodash";

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
  private static _req: NextApiRequest;

  static getAuth() {
    return this._auth || {};
  }

  static getReq() {
    return this._req;
  }

  static async setAuth(req: NextApiRequest) {
    this._req = req;
    this._auth = await getAuth(req);
  }
}

type MeAttribute = Omit<Users, "password" | "createdAt" | "updatedAt">;
@Resolver((_of) => Users)
export class AuthorizerResolver {
  @Query((returns) => Users, { nullable: true })
  async me(
    @Ctx() { req }: { req: NextApiRequest }
  ): Promise<MeAttribute | null> {
    return (await getAuth(req)) as MeAttribute;
  }
}

export const parsePolicyEffect: (
  policy: string[],
  context: any
) => { [key: string]: any } = (policy, context) => {
  try {
    const effectJson = Buffer.from(policy[5], "base64")
      .toString("utf-8")
      .fill(context);

    return JSON.parse(effectJson);
  } catch (e) {
    return {};
  }
};

export {};
