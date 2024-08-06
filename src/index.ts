import express from "express";
import cors from "cors";
import {user} from "./routes/user";
import {fiscalcode} from "./routes/fiscalcode";

const port:number = 50000;
const server = express();
server.use(cors());
server.use(express.json());
server.use("/users",user)
server.use("/fiscalcodes",fiscalcode)

server.get("/",(req,res) => res.send("Hello world!"));

server.listen(port,() => {
		console.log("Server is listening the port 50000.");
});