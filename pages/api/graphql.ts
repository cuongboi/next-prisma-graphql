import type { NextApiRequest, NextApiResponse } from "next";
import { createYoga } from "graphql-yoga";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { resolvers } from "@/prisma/generated/type-graphql";
import {
  AuthClass,
  getEnforcer,
  parsePolicyEffect,
} from "@/utils/authorization";
import deepMerge from "@/utils/deepMerge";

export const config = {
  api: {
    bodyParser: false,
  },
};

let server: any;

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

  if (!server) {
    const schema = await buildSchema({
      resolvers,
      validate: false,
    });

    const enforcer = await getEnforcer();

    prisma.$use(async (params, next) => {
      const auth = await AuthClass.getAuth();

      try {
        const [result, policy] = await enforcer.enforceEx(
          {
            path: req.url,
            method: req.method,
          },
          auth,
          params
        );

        if (!result) {
          throw new Error("Not authorized");
        }

        params.args = deepMerge(params.args, parsePolicyEffect(policy));

        return await next(params);
      } catch (e: any) {
        console.log(e.message);

        return [];
      }
    });

    server = createYoga({
      graphqlEndpoint: "/api/graphql",
      schema,
      context: { prisma },
    });
  }

  return server(req, res);
}
