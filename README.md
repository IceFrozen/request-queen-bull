## Overview  
- This is a simple http request base on bull，used to integrate the sdk server to send information to others
  
## characteristic:    
  
- keep doing the job until it fail  
- record the job which is failed or success  

## Uasge: 
- git clone https://github.com/IceFrozen/request-queen-bull.git
- npm install 
- make sure the redis service is running and change the redisConn in ./expamle/config.js
- npm test or node ./example/test.js

## Quick Start: 
```javascript
    const QueenClass = require('request-queen-bull')
    const config = require('./config')      //send the config and options
    const qc = new QueenClass("test",config)  
    qc.pushRequest("id",{data:"test"})   // id is the job tag   you can get it use job.jobTag 
    .on("fail",(job,err)=>{ 
	    console.log('fail')
    })
.   on("success",(job, res)=>{
		console.log("success:"+job.jobTag)   // print  id
	    console.log("success")
	    qc.stop()
    }).
    on('process',function (job) {    
        console.log("job is process!")
    })
    
```
## Config and options
example config.js
```javascript
module.exports = {
	redisConn:"redis://localhost:6379/",
	url:"http://localhost:8000/ping",
	type:"type1",				// the type of config in types
	stopTag:"SUCCESS",			//the success tag when the url return back in body
	types:{
	default:{  
		_delay: 3000,   			//the time of job retrid    number or array
		_delayStep:1,           	//delay  (number of retries )* _delayStep + _delay(number)
		failedSave:false,          // save to the redis or not when the job failed 
		retryNew:false,	            //the job is a new job instance in bull or the same job retrid in a period of time
		removeOnComplete:true,     //delete job automatically or not when job success 
		method:"GET"				// GET or POST
		// ... other job opts
 		},
 	type1:{   
			_delay: [3000,6000] ,   
			_delayStep:0,           
			failedSave:false,       
			retryNew:true,			
			removeOnComplete:true,    
			method:"GET"			
 		}
	}
}
```

## About The Author  
**Auther**: Jason Lee  
**Mail**: taozi031@163.com  
  
## Dependencies other Source  
**bull**  
-  GitHub: https://github.com/OptimalBits/bull
-  The fastest, more reliable redis based queue for nodejs. Carefully written for rock solid stability and atomicity.It uses redis for persistence, so the queue is not lost if the server goes down for any reason. Follow manast for news and updates regarding this library.