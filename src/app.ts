import express,{Application} from "express";
import cors from "cors";
import {UserRouter} from "./routes/user";
import {FiscalCodeRouter} from "./routes/fiscalcode";

export class FiscalCodeApplication{
	private _application:Application;

	constructor(){
		this._application = express();
		this.loadMiddlewares();
		this.loadRoutes();
	}

	public get application():Application{
		return this._application;
	}

	private loadMiddlewares():void{
		this._application.use(cors());
		this._application.use(express.json());
	}

	private loadRoutes():void{
		const user:UserRouter = new UserRouter();
		const fiscalcode:FiscalCodeRouter = new FiscalCodeRouter();
		this._application.get("/",(req,res) => res.send("Hello world!"));
		this._application.use("/users",user.router);
		this._application.use("/fiscalcodes",fiscalcode.router);
	}
}