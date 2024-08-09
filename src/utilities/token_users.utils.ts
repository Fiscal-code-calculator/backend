import dotenv from "dotenv";
import jwt,{JwtPayload} from "jsonwebtoken";
import {Token} from "../interfaces/token.interface";

function checkToken(token:string):Token|null{
	dotenv.config();
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

function checkRequest(authorization:any):Token|false{
	if(!authorization){
		return false;
	}
	if(typeof authorization !== "string"){
		return false;
	}
	if(!authorization.includes("Bearer ")){
		return false;
	}
	const details:string[] = authorization.split(" ");
	if(details.length != 2){
		return false;
	}
	const token:string = details[1];
	const payload:Token|null = checkToken(token);
	if(payload === null){
		return false;
	}
	return payload;
}

export {generateToken,checkRequest}