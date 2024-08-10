import mysql,{Connection,FieldInfo,MysqlError,OkPacket} from "mysql";
import dotenv from "dotenv";

function connectDatabase():Promise<Connection>{
	dotenv.config();
	return new Promise((resolve,reject) => {
		const connection:Connection = mysql.createConnection({
			host:process.env.DATABASE_HOST,
			user:process.env.DATABASE_USERNAME,
			password:process.env.DATABASE_PASSWORD,
			database:process.env.DATABASE_NAME
		});

		connection.connect(function(error:MysqlError){
			if(error){
				reject(error);
			}else{
				resolve(connection);
			}
		});
	});
}

function executeQuery<T>(query:string,params:string[]):Promise<T[]|OkPacket|null>{
	return new Promise((resolve,reject) => {
		if(!query || !params){
			resolve(null);
			return;
		}
		if(query === "" || params.length === 0){
			resolve(null);
			return;
		}
		connectDatabase()
		.then(connection => {
			connection.query(query,params,(error:MysqlError|null,results?:T[]|OkPacket,fields?:FieldInfo[]) => {
				if(error){
					connection.end();
					reject(error);
				}else{
					if(!results){
						connection.end();
						resolve(null);
					}else{
						connection.end();
						resolve(results);
					}
				}
			});
		}).catch(reject);
	});
}

export {executeQuery};