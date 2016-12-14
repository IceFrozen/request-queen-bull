console.log(__dirname)
const config = require('./config')
const QueenClass = require('../')
const qc = new QueenClass("test",config)

const express = require('express')
const app = express()

app.get('/ping', function (req, res) {
	console.log(req.query)
  res.send('SUCCESS')
})

app.listen(8000)

qc.pushRequest("id",{data:"test"})
.on("fail",(job,err)=>{
	console.log('fail')
})
.on("success",(job, res)=>{
	console.log("success")
	qc.stop()
}).on('process',function (job) {
})
