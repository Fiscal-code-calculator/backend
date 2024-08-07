import {Router} from "express";
import {Connection,FieldInfo,MysqlError} from "mysql";
import {checkRequest} from "./user";
import {connectDatabase} from "../mysql_manager/connection";
import {User} from "../interfaces/user.interface";

const fiscalcode:Router = Router();

function calculateFiscalCode(name:string,surname:string,gender:string,day:number,month:number,year:number,placeofbirth:string):string{


	//implementare in questa funzione il calcolo del codice fiscale
	return "AAABBB11A22C123P";


}

fiscalcode.get("/",async (req,res) => {
	const {authorization} = req.headers;
	const user:User|false = checkRequest(authorization);
	if(user === false){
		return res.status(403).send({message:"The token or the request are invalid to continue.",check:false});
	}
	const connection:Connection|false = await connectDatabase();
	if(connection === false){
		return res.status(500).send({message:"Error connection to the database.",check:false});
	}
	connection.query("SELECT * FROM fiscal_codes WHERE user='" + user.userId + "'",async (error:MysqlError,results:any,fields:FieldInfo[]) => {
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
			return res.status(200).send({message:[],check:true});
		}
		connection.end();
		res.status(200).send({message:results,check:true});
	});
});

fiscalcode.post("/",async (req,res) => {
	const {authorization} = req.headers;
	const user:User|false = checkRequest(authorization);
	if(user === false){
		return res.status(403).send({message:"The token or the request are invalid to continue.",check:false});
	}
	const {name,surname,gender,dateofbirth,placeofbirth} = req.body;
	if(!name || !surname || !gender || !dateofbirth || !placeofbirth){
		return res.status(406).send({message:"In the request missing required fields.",check:false});
	}
	if(typeof name !== "string" || typeof surname !== "string" || typeof gender !== "string" || typeof placeofbirth !== "string"){
		return res.status(400).send({message:"In the request some fields are invalid.",check:false});
	}
	if(name === "" || surname === "" || gender === "" || placeofbirth === ""){
		return res.status(400).send({message:"In the request some fields are an empty string.",check:false});
	}
	if(typeof dateofbirth !== "object"){
		res.status(400).send({message:"In the request the date of birth is invalid.",check:false});
	}
	const {day,month,year} = dateofbirth;
	if(!day || !month || !year){
		return res.status(406).send({message:"In the request missing required fields.",check:false});
	}
	if(typeof day !== "number" || typeof month !== "number" || typeof year !== "number"){
		return res.status(400).send({message:"In the request the day, the month or the year are invalid.",check:false});
	}
	if(day <= 0 || day > 31 || month <= 0 || month > 12 || year < 1900 || year > new Date().getFullYear()){
		return res.status(400).send({message:"In the request the day, the month or the year are invalid.",check:false});
	}
	const gender1:string = gender.trim().toLowerCase();
	if(gender1 !== "male" && gender1 !== "female"){
		return res.status(400).send({message:"In the request the gender is invalid.",check:false});
	}
	const newfiscalcode:string = calculateFiscalCode(name,surname,gender1,day,month,year,placeofbirth);
	const connection:Connection|false = await connectDatabase();
	if(connection === false){
		return res.status(500).send({message:"Error connection to the database.",check:false});
	}
	connection.query("INSERT INTO fiscal_codes (name,surname,date_of_birth,place_of_birth,gender,fiscal_code_calculated,user) VALUES ('"+name+"','"+surname+"','"+year+"-"+month+"-"+day+"','"+placeofbirth+"','"+gender1+"','"+newfiscalcode+"','"+user.userId+"')",(error:MysqlError,results:any,fields:FieldInfo[]) => {
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
		res.status(201).send({message:newfiscalcode,check:true});
	});
});

export {fiscalcode}