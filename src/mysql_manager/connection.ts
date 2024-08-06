import mysql,{Connection,MysqlError} from "mysql";
import dotenv from "dotenv";

function connectDatabase():Promise<Connection|false>{
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
				console.error(error);
				resolve(false);
			}else{
				console.log("Connected to database.");
				resolve(connection);
			}
		});
	});
}

export {connectDatabase}