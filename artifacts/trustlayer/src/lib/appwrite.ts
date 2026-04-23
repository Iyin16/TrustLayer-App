import { Client, Account, Databases } from "appwrite";

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("69cea3c6001b7b61a722");

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };
