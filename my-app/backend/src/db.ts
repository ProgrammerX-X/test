import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();
const client = new MongoClient(process.env.DB_LOGIN_FOR_USERS_PROJECTS || '')
export const connection = client.db('users_projects')
const client_login = new MongoClient(process.env.DB_LOGIN || '')
export const connection_login = client_login.db('login')