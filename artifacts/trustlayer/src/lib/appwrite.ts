import { Client, Account, Databases, ID } from "appwrite";

const endpoint = import.meta.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string;
const projectId = import.meta.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string;

if (!endpoint || !projectId) {
  throw new Error(
    "Missing NEXT_PUBLIC_APPWRITE_ENDPOINT or NEXT_PUBLIC_APPWRITE_PROJECT_ID env vars.",
  );
}

const client = new Client().setEndpoint(endpoint).setProject(projectId);
const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases, ID };
