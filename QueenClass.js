
const Queue = require('bull')
const _ = require('lodash');
const request = require('request');
const querystring = require('querystring')
const NOINITED=1
const INITED=2
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const defaltType = {
				_delay: 5000,    		//默认失败之后 每隔一段时间重发
				_delayStep:0,           //计算公式为 发送次数 * _delayStep + _delay
				failedSave:false,          //失败的任务是否保留 retryNew 必须为true 才生效
				retryNew:false,				//是否每次都要开一个新的bull记录 而不是原有是setTimeout
				removeOnComplete:true,     //是否完成后自动删除
				method:"GET"						// GET or past
} 

const TaskQueen = function(id,config) {
	EventEmitter.call(this)
	this.id = id
  this.config = config
  this.type = config.type || defaltType
  this.status = NOINITED
  this.setTimeoutMap = {}
  return this.init();
};
util.inherits(TaskQueen,EventEmitter);
TaskQueen.prototype.getId = function(){
  return this.id
}
TaskQueen.prototype.init = function(){
  this.queen = Queue(this.id,this.config.redisConn)
  this.status = INITED
  let self = this
  this.queen.process(function(job, done){
			console.log("invoke:"+job.opts.jobTag)
			self.emit('process',job)
			if(job.opts.method === 'GET'){
				return self._reqestGet(job.data,done)
			}else{
				return self._reqestGet(job.data,done)
			}
	})
	this.queen.on('resumed',self.retry.bind(this,'resumed'))
	this.queen.on('completed',self._emit.bind(this,'success'))
	this.queen.on('error',self._emit.bind(this,'error'))
	this.queen.on('cleaned',self._emit.bind(this,'cleaned'))
	this.queen.on('stalled',self._emit.bind(this,'stalled'))
	this.queen.on('failed',self.retry.bind(this))
	this.queen.on('ready',self._emit.bind(this,'ready'))
	this.queen.on('active',self._emit.bind(this,'active'))
	this.queen.on('progress',self._emit.bind(this,'progress'))
	this.queen.on('paused',self._emit.bind(this,'paused'))
	this.queen.on('resumed',self._emit.bind(this,'resumed'))
	this.queen.on('cleaned',self._emit.bind(this,'cleaned'))
  console.log("task bat:" + this.id + " init ")
  return this
}
TaskQueen.prototype.getTypes = function(){
	if(this.status  !== INITED) {
		throw new Error("has no init!!")
	}
	if(_.isString(this.type)){
		if(this.config.types[this.type]){
			return _.cloneDeep(this.config.types[this.type])
		}else{
			return _.cloneDeep(defaltType)
		}
	}
	return _.cloneDeep(this.type)
}


TaskQueen.prototype._emit = function(name,job,...needles){
	this.emit(name,job,needles)
}



TaskQueen.prototype._reqestGet =function(data,next){
	if(this.status  !== INITED) {
		throw new Error("has no init!!")
	}
	let finalUrl = this.config.url + '?' +querystring.stringify(data)
	let self = this;
	request.get(finalUrl,{timeout:3000},function(err,res){
	 		if(err){
				console.log(err)
	 			return next(new Error("retry"))
	 		}	
	 		let body = res.body
	 		if(_.includes(body,self.config.stopTag)){
	 			next(null,res)
	 		}else{
	 			return next(new Error('retry'))
	 		}
	 })
}
TaskQueen.prototype._reqestPost =function(data,next){
	if(this.status  !== INITED) {
		throw new Error("has no init!!")
	}
	 request.post(this.config.url,data,function(err,res){
	 		if(err){
	 			return next(new Error("retry"))
	 		}	
	 		let body = res.body
	 		if(_.includes(body,self.config.stopTag)){
	 			next(null,res)
	 		}else{
	 			next(new Error('retry'))
	 		}
	 })
}
//发送请求
TaskQueen.prototype.pushRequest = function(jobTag,data){
		if(this.status  !== INITED) {
			throw new Error("has no init!!")
		}
		let opts = this.getTypes()
		opts.jobTag = jobTag
		opts.attemptsMade = 0
		opts.delay = 1000;  //第一次发送 立即发送
		opts._data = data;  //第一次发送 立即发送
		if(opts.jobId) {
			throw new Error("error! the jobId can't be exist")
		}
		this.queen.add(data,opts)
		return this
}


TaskQueen.prototype.onEvent = function (key,fun) {
	this.queen.on(key,fun)
	return this
}
TaskQueen.prototype.stop = function(){ 
  	for(let key in this.setTimeoutMap){
  		clearTimeout(this.setTimeoutMap[key])
  	}
}
TaskQueen.prototype.stop = function () {
	this.queen.close()
	return this
} 
TaskQueen.prototype.retry = function (job) {
	console.log('retry',job.opts.jobTag)
	let data = job.data
	let opts = job.opts
	let attemptsMade = job.attemptsMade -1
	if(opts.retryNew){
		attemptsMade=  opts.attemptsMade
	}
	if(this.setTimeoutMap[job.jobId]){
		clearTimeout(this.setTimeoutMap[job.jobId])
	}
	if(_.isArray(opts._delay)){
		let delay_time = opts._delay[attemptsMade]
		if(!delay_time){
			return this.emit('fail',job)
		}else{
			opts.delay = delay_time
		}
	}else{
		opts.delay = opts._delay + (attemptsMade * opts._delayStep)
	}
	if(opts.retryNew){
		opts.attemptsMade += 1
		if(!opts.failedSave){
			job.remove()
		}
		delete opts.jobId
		this.queen.add(data,opts)
	}else{

		this.setTimeoutMap[job.jobId] = setTimeout(function(){job.retry()},opts.delay)
	}
}


module.exports = TaskQueen