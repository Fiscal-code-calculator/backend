import {Request,Response,Router} from "express";
import * as bcrypt from "bcrypt";
import {MysqlError} from "mysql";
import {executeQuery} from "../utilities/mysql_manager.utils";
import {checkRequest,generateToken} from "../utilities/token_users.utils";
import {Token} from "../interfaces/token.interface";
import {User} from "../interfaces/user.interface";
import {FiscalCode} from "../interfaces/fiscalcode.interface";

export class UserRouter{
	private _router:Router;

	constructor(){
		this._router = Router();
		this.loadRoutes();
	}

	public get router():Router{
		return this._router;
	}

	private loadRoutes():void{
		this._router.post("/login",this.doLogin);
		this._router.post("/register",this.createProfile);
		this._router.get("/",this.getProfile);
		this._router.delete("/",this.deleteProfile);
		this._router.post("/changepassword",this.changePassword)
	}

	private doLogin(req:Request,res:Response):Response|undefined{
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
		const query:string = "SELECT * FROM users WHERE email=?";
		executeQuery<User>(query,[email])
		.then(result => {
			if(!result || result === null){
				return res.status(500).send({message:"Internal server error.",check:false});
			}
			const users:User[] = <User[]>result;
			if(users.length === 0){
				return res.status(404).send({message:"User not found.",check:false});
			}
			for(let i:number = 0;i < users.length;i++){
				const user:User = users[i];
				if(user.email === email){
					const passwordHashed:string = <string>user.password;
					const verification:boolean = bcrypt.compareSync(password,passwordHashed);
					if(verification === true){
						const token:string = generateToken(user.user_id,user.email);
						return res.status(200).send({message:token,check:true});
					}else{
						return res.status(401).send({message:"Username or password incorrect.",check:false});
					}
				}
			}
		}).catch((error:MysqlError) => {
			console.error(error);
			return res.status(500).send({message:"Internal server error.",check:false});
		});
	}

	private createProfile(req:Request,res:Response):Response|undefined{
		const {name,surname,email,password,repeatpassword} = req.body;
		if(!name || !surname || !email || !password || !repeatpassword){
			return res.status(406).send({message:"In the request missing required fields.",check:false});
		}
		if(typeof name !== "string" || typeof surname !== "string" || typeof email !== "string" || typeof password !== "string" || typeof repeatpassword !== "string"){
			return res.status(400).send({message:"In the request some fields are invalid.",check:false});
		}
		if(name === "" || surname === "" || email === "" || password === "" || repeatpassword === ""){
			return res.status(400).send({message:"In the request some fields are empty string.",check:false});
		}
		if(password !== repeatpassword){
			return res.status(400).send({message:"In the registration form the password and its repetition must have the same value.",check:false});
		}
		const query1:string = "SELECT * FROM users WHERE email=?";
		executeQuery<User>(query1,[email])
		.then(result1 => {
			if(!result1 || result1 === null){
				return res.status(500).send({message:"Internal server error.",check:false});
			}
			const users:User[] = <User[]>result1;
			if(users.length !== 0){
				return res.status(403).send({message:"The e-mail already exists in the database.",check:false});
			}
			const passwordHashed:string = bcrypt.hashSync(password,10);
			const query2:string = "INSERT INTO users (name,surname,email,password) VALUES (?,?,?,?)";
			executeQuery<User>(query2,[name,surname,email,passwordHashed])
			.then(result2 => {
				if(!result2 || result2 === null){
					return res.status(500).send({message:"Internal server error.",check:false});
				}
				res.status(201).send({message:"Registration executed successfully.",check:true});
			}).catch((error:MysqlError) => {
				console.error(error);
				return res.status(500).send({message:"Internal server error.",check:false});
			});
		}).catch((error:MysqlError) => {
			console.error(error);
			return res.status(500).send({message:"Internal server error.",check:false});
		});
	}

	private getProfile(req:Request,res:Response):Response|undefined{
		const {authorization} = req.headers;
		const token:Token|false = checkRequest(authorization);
		if(token === false){
			return res.status(403).send({message:"The token or the request are invalid to continue.",check:false});
		}
		const query:string = "SELECT * FROM users WHERE user_id=?";
		executeQuery<User>(query,[""+token.userId])
		.then(result => {
			if(!result || result === null){
				return res.status(500).send({message:"Internal server error.",check:false});
			}
			const users:User[] = <User[]>result;
			if(users.length === 0){
				return res.status(404).send({message:"User not found.",check:false});
			}
			for(let i:number = 0;i < users.length;i++){
				if(users[i].user_id === token.userId){
					const output:User = {
						user_id:users[i].user_id,
						name:users[i].name,
						surname:users[i].surname,
						email:users[i].email
					}
					return res.status(200).send({message:output,check:true})
				}
			}
		}).catch((error:MysqlError) => {
			console.error(error);
			return res.status(500).send({message:"Internal server error.",check:false});
		});
	}

	private deleteProfile(req:Request,res:Response):Response|undefined{
		const {authorization} = req.headers;
		const token:Token|false = checkRequest(authorization);
		if(token === false){
			return res.status(403).send({message:"The token or the request are invalid to continue.",check:false});
		}
		const query1:string = "DELETE FROM fiscal_codes WHERE user=?";
		executeQuery<FiscalCode>(query1,[""+token.userId])
		.then(result1 => {
			if(!result1 || result1 === null){
				return res.status(500).send({message:"Internal server error.",check:false});
			}
			const query2:string = "DELETE FROM users WHERE user_id=?";
			executeQuery<User>(query2,[""+token.userId])
			.then(result2 => {
				if(!result2 || result2 === null){
					res.status(500).send({message:"Internal server error.",check:false});
				}
				res.status(200).send({message:"User deleted correctly.",check:true});
			}).catch((error:MysqlError) => {
				console.error(error);
				return res.status(500).send({message:"Internal server error.",check:false});
			});
		}).catch((error:MysqlError) => {
			console.error(error);
			return res.status(500).send({message:"Internal server error.",check:false});
		});
	}

	private async changePassword(req:Request,res:Response):Promise<Response|undefined>{
		const {authorization} = req.headers;
		const token:Token|false = checkRequest(authorization);
		if(token === false){
			return res.status(403).send({message:"The token or the request are invalid to continue.",check:false});
		}
		const {newpassword,repeatpassword} = req.body;
		if(!newpassword || !repeatpassword){
			return res.status(406).send({message:"In the request missing required fields.",check:false});
		}
		if(typeof newpassword !== "string" || typeof repeatpassword !== "string"){
			return res.status(400).send({message:"In the request the new password or its repetition are invalid.",check:false});
		}
		if(newpassword === "" || repeatpassword === ""){
			return res.status(400).send({message:"In the request the new password or its repetition are an empty string.",check:false});
		}
		if(newpassword !== repeatpassword){
			return res.status(400).send({message:"The new password and its repetition must have the same value.",check:false});
		}
		const newPasswordHashed:string = await bcrypt.hash(newpassword,10);
		const query:string = "UPDATE users SET password=? WHERE user_id=?";
		executeQuery<User>(query,[newPasswordHashed,""+token.userId])
		.then(result => {
			if(!result || result === null){
				return res.status(500).send({message:"Internal server error.",check:false});
			}
			res.status(200).send({message:"Password updated correctly.",check:true})
		}).catch((error:MysqlError) => {
			console.error(error);
			return res.status(500).send({message:"Internal server error.",check:false});
		});
	}
}