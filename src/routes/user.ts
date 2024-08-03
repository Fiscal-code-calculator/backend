import {Router} from "express";
import dotenv from "dotenv";
import * as bcrypt from "bcrypt";
import {Connection,FieldInfo,MysqlError} from "mysql";
import {connectDatabase} from "../mysql_manager/connection";

dotenv.config();
const user:Router = Router();

user.post("/login",async (req,res) => {
	const {email,password} = req.body;
	if(!email || !password){
		return res.status(406).send({message:"In the request missing required fields.",check:false});
	}
	if(typeof email !== "string" || typeof password !== "string"){
		return res.status(400).send({message:"In the request the email or the password are invalid.",check:false});
	}
	if(email === "" || password === ""){
		return res.status(400).send({message:"In the request the email or the password are empty string.",check:false});
	}
	const connection:Connection|false = await connectDatabase();
	if(connection === false){
		return res.status(500).send({message:"Error connection to the database.",check:false});
	}
	connection.query("SELECT * FROM users WHERE email='"+email+"'",(error:MysqlError,results:any,fields:FieldInfo[]) => {
		if(error){
			console.error(error);
			connection.end();
			return res.status(500).send({message:"Error while execute the query.",check:false});
		}
		if(!results){
			connection.end();
			return res.status(500).send({message:"Error while execute the query.",check:false});
		}
		if(results.length === 0){
			connection.end();
			return res.status(404).send({message:"User not found in the archive.",check:false});
		}
		for(let i:number = 0;i < results.length;i++){
			const result:any = results[i];
			if(result.email === email){
				const passwordHashed:string = result.password;
				const verification:boolean = bcrypt.compareSync(password,passwordHashed);
				if(verification === true){
					connection.end();
					return res.status(200).send({message:"Login executed successfully.",check:true});
				}else{
					connection.end();
					return res.status(400).send({message:"Password inserted is incorrect.",check:false});
				}
			}
		}
	});
});

user.post("/register",async (req,res) => {
	const {fullname,email,password} = req.body;
	if(!fullname || !email || !password){
		return res.status(406).send({message:"In the request missing required fields.",check:false});
	}
	if(typeof fullname !== "string" || typeof email !== "string" || typeof password !== "string"){
		return res.status(400).send({message:"In the request some fields are invalid.",check:false});
	}
	if(fullname === "" || email === "" || password === ""){
		return res.status(400).send({message:"In the request some fields are empty string.",check:false});
	}
	const connection:Connection|false = await connectDatabase();
	if(connection === false){
		return res.status(500).send({message:"Error connection to the database.",check:false});
	}
	const passwordHashed:string = await bcrypt.hash(password,10);
	connection.query("INSERT INTO users (fullname,email,password) VALUES ('"+fullname+"','"+email+"','"+passwordHashed+"')",(error:MysqlError,results:any,fields:FieldInfo[]) => {
		if(error){
			console.error(error);
			connection.end();
			return res.status(500).send({message:"Error while execute the query.",check:false});
		}
		if(!results){
			connection.end();
			return res.status(500).send({message:"Error while execute the query.",check:false});
		}
		connection.end();
		res.status(200).send({message:"Registration executed successfully.",check:true});
	});
});

export {user};