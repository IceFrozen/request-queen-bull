module.exports = {
	redisConn:"redis://192.168.101.254:6379/",
	url:"http://localhost:8000/ping",
	type:"type1",				// the type of config 
	stopTag:"SUCCESS",			//the success tag when the url return back in body
	types:{
		default:{   //默认模式
				_delay: 3000,   			//the time of job retrid    number or array
				_delayStep:1,           	//delay  (number of retries )* _delayStep + _delay(number)
				failedSave:false,          // save to the redis or not when the job failed 
				retryNew:false,				//the job is a new job instance in bull or the same job retrid in a period of time
				removeOnComplete:true,     //delete job automatically or not when job success 
				method:"GET"				// GET or POST
											// ... other job opts
 		},
 		type1:{   
				_delay: [3000,3000] ,   
				_delayStep:0,           
				failedSave:false,       
				retryNew:true,			
				removeOnComplete:true,    
				method:"GET"			
				
 		}
	}
}
