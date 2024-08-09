import {FiscalCodeApplication} from "./app";

const PORT:number = 50000;
const server:FiscalCodeApplication = new FiscalCodeApplication();

server.application.listen(PORT,() => {
		console.log(`Server is listening on the port ${PORT}.`);
});