import {Request,Response,Router} from "express";
import {MysqlError} from "mysql";
import {calculateFiscalCode} from "../utilities/calculator_fiscal_code.utils";
import {checkRequest} from "../utilities/token_users.utils";
import {executeQuery} from "../utilities/mysql_manager.utils";
import {Token} from "../interfaces/token.interface";
import {FiscalCode} from "../interfaces/fiscalcode.interface";

export class FiscalCodeRouter{
	private _router:Router;

	constructor(){
		this._router = Router();
		this.loadRoutes();
	}

	public get router():Router{
		return this._router;
	}

	private loadRoutes():void{
		this._router.get("/",this.getAll);
		this._router.post("/",this.createElement);
	}

	private getAll(req:Request,res:Response):Response|undefined{
		const {authorization} = req.headers;
		const token:Token|false = checkRequest(authorization);
		if(token === false){
			return res.status(403).send({message:"The token or the request are invalid to continue.",check:false});
		}
		const query:string = "SELECT * FROM fiscal_codes WHERE user=?";
		executeQuery<FiscalCode>(query,[""+token.userId])
		.then(result => {
			if(!result || result === null){
				return res.status(500).send({message:"Internal server error.",check:false});
			}
			res.status(200).send({message:result,check:true});
		}).catch((error:MysqlError) => {
			console.error(error);
			return res.status(500).send({message:"Internal server error.",check:false});
		});
	}

	private createElement(req:Request,res:Response):Response|undefined{
		const {authorization} = req.headers;
		const token:Token|false = checkRequest(authorization);
		if(token === false){
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
		const actualYear:number = new Date().getFullYear();
		const initialYear:number = actualYear - 250;
		if(day <= 0 || day > 31 || month <= 0 || month > 12 || year < initialYear || year > actualYear){
			return res.status(400).send({message:"In the request the day, the month or the year are invalid.",check:false});
		}
		if(month === 2 && day > 29){
			return res.status(400).send({message:"The month of february has maximum 29 days.",check:false});
		}
		const month30Days:boolean = month === 4 || month === 6 || month === 9 || month === 11;
		if(month30Days === true && day > 30){
			return res.status(400).send({message:"The month selected has maximum 30 days.",check:false});
		}
		const gender1:string = gender.trim().toLowerCase();
		if(gender1 !== "male" && gender1 !== "female"){
			return res.status(400).send({message:"In the request the gender is invalid.",check:false});
		}
		const newfiscalcode:string = calculateFiscalCode(name,surname,gender1,day,month,year,placeofbirth);
		const query:string = "INSERT INTO fiscal_codes (name,surname,date_of_birth,place_of_birth,gender,fiscal_code_calculated,user) VALUES (?,?,?,?,?,?,?)";
		executeQuery<FiscalCode>(query,[name,surname,year+"-"+month+"-"+day,placeofbirth,gender1,newfiscalcode,""+token.userId])
		.then(result => {
			if(!result || result === null){
				return res.status(500).send({message:"Internal server error.",check:false});
			}
			res.status(201).send({message:newfiscalcode,check:true});
		}).catch((error:MysqlError) => {
			console.error(error);
			return res.status(500).send({message:"Internal server error.",check:false});
		});
	}
}