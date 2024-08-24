import dotenv from "dotenv";
import jwt,{JwtPayload} from "jsonwebtoken";
import {MysqlError} from "mysql";
import {Token} from "../interfaces/token.interface";
import {User} from "../interfaces/user.interface";
import {executeQuery} from "./mysql_manager.utils";

function checkToken(token:string):Promise<Token|null>{
	dotenv.config();
	return new Promise((resolve,reject) => {
		try{
			const payload:string|JwtPayload = jwt.verify(token,<string>process.env.JWT_PRIVATE);
			if(!payload){
				resolve(null);
				return;
			}
			if(typeof payload === "string"){
				resolve(null);
				return;
			}
			const now:number = Math.trunc(new Date().getTime() / 1000);
			if(now >= <number>payload.exp){
				resolve(null);
				return;
			}
			executeQuery<User>("SELECT * FROM users WHERE user_id=?",[payload.userId])
			.then(result => {
				if(!result || result === null){
					resolve(null);
				}else{
					const users:User[] = <User[]>result;
					if(users.length === 0){
						resolve(null);
					}else{
						resolve({userId:payload.userId,email:<string>payload.sub,expiration:<number>payload.exp});
					}
				}
			}).catch((error:MysqlError) => {
				console.error(error);
				resolve(null);
				return;
			});
		}catch(error){
			console.error(error);
			resolve(null);
		}
	});
}

function getExpirationTime(minutes:number):number{
	const now:number = Math.trunc(new Date().getTime() / 1000);
	return now + (minutes * 60);
}

function generateToken(id:number,email:string):string{
	dotenv.config();
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

function checkRequest(authorization:string|undefined):Promise<Token|false>{
	return new Promise((resolve,reject) => {
		if(!authorization){
			resolve(false);
			return;
		}
		if(typeof authorization !== "string"){
			resolve(false);
			return;
		}
		if(!authorization.includes("Bearer ")){
			resolve(false);
			return;
		}
		const details:string[] = authorization.split(" ");
		if(details.length != 2){
			resolve(false);
			return;
		}
		const token:string = details[1];
		checkToken(token)
		.then(payload => {
			if(payload === null){
				resolve(false);
			}else{
				resolve(payload);
			}
		});
	});
}

export {generateToken,checkRequest}