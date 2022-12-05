import type { NextApiRequest, NextApiResponse } from "next";
import { createYoga } from "graphql-yoga";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { resolvers } from "@/prisma/generated/type-graphql";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any> & { ys: any }
) {
  if (process.env.NODE_ENV === "production" && req.method === "GET") {
    return res.status(405).send({
      message: "Method GET not allowed in production",
    });
  }

  if (!res.ys || process.env.NODE_ENV !== "production") {
    const schema = await buildSchema({
      resolvers,
      validate: false,
    });

    res.ys = createYoga({
      graphqlEndpoint: "/api/public/graphql",
      schema,
      context: {
        prisma,
      },
    });
  }

  return res.ys(req, res);
}
