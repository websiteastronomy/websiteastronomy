import { auth } from "@/lib/auth"; // Adjust to standard alias
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
