import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const port:number = 50000;
const server = express();
server.use(cors());
server.use(express.json());

server.get("/",(req,res) => res.send("Hello world!"));

server.listen(port,() => {
    console.log("Server is listening the port 50000.");
});