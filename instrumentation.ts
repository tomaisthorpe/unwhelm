import { registerOTel } from "@vercel/otel";
import { PrismaInstrumentation } from "@prisma/instrumentation";

export function register() {
  registerOTel({
    serviceName: "unwhelm",
    instrumentations: [new PrismaInstrumentation({ middleware: true })],
  });
}
