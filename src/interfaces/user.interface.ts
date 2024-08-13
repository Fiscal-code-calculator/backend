export interface User{
	user_id:number,
	name:string,
	surname:string,
	date_of_birth?:Date,
	place_of_birth?:string,
	gender?:string,
	address?:string,
	email:string,
	password?:string
}