import mysql,{Connection,MysqlError} from "mysql";
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

export {connectDatabase}