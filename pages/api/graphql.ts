import type { NextApiRequest, NextApiResponse } from "next";
import { createYoga } from "graphql-yoga";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { resolvers } from "@/prisma/generated/type-graphql";
import {
  AuthClass,
  getEnforcer,
  parsePolicyEffect,
  AuthorizerResolver,
} from "@/utils/authorization";
import deepMerge from "@/utils/deepMerge";
import { PrismaClient } from "@prisma/client";
import { GraphQLError } from "graphql";

export const config = {
  api: {
    bodyParser: false,
  },
};

let schema: any;
let prismaContext: PrismaClient;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  if (process.env.NODE_ENV === "production" && req.method === "GET") {
    return res.status(405).send({
      message: "Method GET not allowed in production",
    });
  }

  AuthClass.setAuth(req);

  if (!schema) {
    schema = await buildSchema({
      resolvers: [...resolvers, AuthorizerResolver],
      validate: false,
    });
  }

  if (!prismaContext) {
    prismaContext = new PrismaClient();
    const enforcer = await getEnforcer();
    prismaContext.$use(async (params, next) => {
      const context = {
        req: {
          path: req.url,
          method: req.method,
          query: req.query,
        },
        user: AuthClass.getAuth(),
        params,
      };

      try {
        const [result, policy] = await enforcer.enforceEx(
          ...Object.values(context)
        );

        if (!result) {
          throw new Error("Unauthorized");
        }

        params.args = deepMerge(
          params.args,
          parsePolicyEffect(policy, context)
        );

        return await next(params);
      } catch (e: any) {
        return new GraphQLError(e.message);
      }
    });
  }

  return createYoga({
    graphqlEndpoint: "/api/graphql",
    schema,
    context: { prisma: prismaContext, req },
  })(req, res);
}
