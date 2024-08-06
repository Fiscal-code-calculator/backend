import {Router} from "express";
import dotenv from "dotenv";
import * as bcrypt from "bcrypt";
import {Connection,FieldInfo,MysqlError} from "mysql";
import jwt,{JwtPayload} from "jsonwebtoken";
import {connectDatabase} from "../mysql_manager/connection";
import {User} from "../interfaces/user.interface";

dotenv.config();
const user:Router = Router();

function checkToken(token:string):User|null{
	try{
			const payload:string|JwtPayload = jwt.verify(token,<string>process.env.JWT_PRIVATE);
			if(!payload){
					return null;
			}
			if(typeof payload === "string"){
					return null;
			}
			const now:number = Math.trunc(new Date().getTime() / 1000);
			if(now >= <number>payload.exp){
				return null;
			}
			return {userId:payload.userId,email:<string>payload.sub,expiration:<number>payload.exp};
	}catch(error){
			return null;
	}
}

function getExpirationTime(minutes:number):number{
	const now:number = Math.trunc(new Date().getTime() / 1000);
	return now + (minutes * 60);
}

function generateToken(id:number,email:string):string{
	const payload = {
		aud:"access",
		exp:getExpirationTime(60),
		sub:email,
		userId:id,
		email:email
	}
	const token:string = jwt.sign(payload,<string>process.env.JWT_PRIVATE,{algorithm:"HS256"});
	return token;
}

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
			return res.status(500).send({message:"Error while executing the query.",check:false});
		}
		if(!results){
			connection.end();
			return res.status(500).send({message:"Error while executing the query.",check:false});
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
					const token:string = generateToken(result.user_id,result.email);
					connection.end();
					return res.status(200).send({message:token,check:true});
				}else{
					connection.end();
					return res.status(401).send({message:"Password inserted is incorrect.",check:false});
				}
			}
		}
	});
});

user.post("/register",async (req,res) => {
	const {fullname,email,password,repeatpassword} = req.body;
	if(!fullname || !email || !password || !repeatpassword){
		return res.status(406).send({message:"In the request missing required fields.",check:false});
	}
	if(typeof fullname !== "string" || typeof email !== "string" || typeof password !== "string" || typeof repeatpassword !== "string"){
		return res.status(400).send({message:"In the request some fields are invalid.",check:false});
	}
	if(fullname === "" || email === "" || password === "" || repeatpassword === ""){
		return res.status(400).send({message:"In the request some fields are empty string.",check:false});
	}
	if(password !== repeatpassword){
		return res.status(400).send({message:"In the registration form the password and its repetition must have the same value.",check:false});
	}
	const connection:Connection|false = await connectDatabase();
	if(connection === false){
		return res.status(500).send({message:"Error connection to the database.",check:false});
	}
	connection.query("SELECT * FROM users WHERE email='" + email + "'",async (error1:MysqlError,results1:any,fields1:FieldInfo[]) => {
		if(error1){
			console.error(error1);
			connection.end();
			return res.status(500).send({message:"Error while executing the query.",check:false});
		}
		if(!results1){
			connection.end();
			return res.status(500).send({message:"Error while executing the query.",check:false});
		}
		if(results1.length !== 0){
			connection.end();
			return res.status(403).send({message:"The e-mail already exists in the database.",check:false});
		}
		const passwordHashed:string = await bcrypt.hash(password,10);
		connection.query("INSERT INTO users (fullname,email,password) VALUES ('"+fullname+"','"+email+"','"+passwordHashed+"')",(error2:MysqlError,results2:any,fields2:FieldInfo[]) => {
			if(error2){
				console.error(error2);
				connection.end();
				return res.status(500).send({message:"Error while executing the query.",check:false});
			}
			if(!results2){
				connection.end();
				return res.status(500).send({message:"Error while executing the query.",check:false});
			}
			connection.end();
			res.status(200).send({message:"Registration executed successfully.",check:true});
		});
	});
});

user.post("/changepassword",async (req,res) => {
	const {authorization} = req.headers;
	if(!authorization){
		return res.status(403).send({message:"User not authorized to execute request.",check:false});
	}
	if(typeof authorization !== "string"){
		return res.status(403).send({message:"User not authorized to execute request.",check:false});
	}
	if(!authorization.includes("Bearer ")){
		return res.status(403).send({message:"User not authorized to execute request.",check:false});
	}
	const details:string[] = authorization.split(" ");
	if(details.length != 2){
		return res.status(403).send({message:"User not authorized to execute request.",check:false});
	}
	const token:string = details[1];
	const payload:User|null = checkToken(token);
	if(payload === null){
		return res.status(403).send({message:"User not authorized to execute request.",check:false});
	}
	const user:User = <User>payload;
	const {newpassword} = req.body;
	if(!newpassword){
		return res.status(406).send({message:"In the request missing required fields.",check:false});
	}
	if(typeof newpassword !== "string"){
		return res.status(400).send({message:"In the request the new password is invalid.",check:false});
	}
	if(newpassword === ""){
		return res.status(400).send({message:"In the request the new password is an empty string.",check:false});
	}
	const newPasswordHashed:string = await bcrypt.hash(newpassword,10);
	const connection:Connection|false = await connectDatabase();
	if(connection === false){
		return res.status(500).send({message:"Error connection to the database.",check:false});
	}
	connection.query("UPDATE users SET password='" + newPasswordHashed + "' WHERE user_id='" + user.userId + "'",async (error:MysqlError,results:any,fields:FieldInfo[]) => {
		if(error){
			console.error(error);
			connection.end();
			return res.status(500).send({message:"Error while executing the query.",check:false});
		}
		if(!results){
			connection.end();
			return res.status(500).send({message:"Error while executing the query.",check:false});
		}
		connection.end();
		res.status(200).send({message:"Password updated correctly.",check:true})
	});
});

export {checkToken,user};