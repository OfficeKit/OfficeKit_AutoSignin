var mqtt    = require('mqtt');
var client  = mqtt.connect('mqtt://121.42.201.80:1887');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var db = mongoose.connect('mongodb://root:jmdlbl88@localhost:27017/officekit_signin');
var events = require("events");
var emitter = new events.EventEmitter();
var offline_counts = {};

var recordSchema = new Schema({
     name: String,
     state: Number, 
     timestamp: Number
});

var umacSchema = new Schema({ 
     name:String,
     mac:String
});

var Umac = mongoose.model("Umac",umacSchema);
var Record = mongoose.model("Record",recordSchema); 

/*var umcc = new Umac();
    umcc.name = "lizhi";
    umcc.mac = "8c:3a:e3:43:b1:9b";
    umcc.save(function(err){
      if(err){
          console.log(err);
      }else{
          console.log("save success!");
    }
});*/


mongoose.connection.on("connected",function(){
	console.log("database conneted!");
});

mongoose.connection.on("error",function(err){
	console.log("Mongoose connection error!"+err);
});

mongoose.connection.on("disconnected",function(){
	console.log("Mongoose disconnected!");
});

function deleteRecord(thisname,thisstate,sptime){
	Record.findOneAndRemove({name:thisname,state:thisstate,timestamp:{$gt:sptime}},function(err,doc){
	});
}

function insertRecord(thisname,thisstate){
	var rec = new Record(); 
	rec.name = thisname;
	rec.state = thisstate;
	rec.timestamp = (new Date()).getTime();
	rec.save(function(err){
		if(err){
			console.log(err);
		}else{
			console.log(thisname+"insert state:"+thisstate);
		}
	});
}

function updateRecord(thisname,thisstate){
	Record.update({name:thisname,state:thisstate},{timestamp:(new Date()).getTime()},function(err){
		if(err){
			console.log(err);
		}else{
			console.log("update success!:"+thisname);
		}
	})
}

emitter.on("online",function(arg){
	offline_counts[arg] = 0;
	Umac.find({mac:arg.toLowerCase()},function(err,docs){
		if(err){
			console.log(err);
		}else if(docs.length != 0){
			var thisname = docs[0].name;
			var sptime = (new Date()).getTime() - (new Date()).getTime()%86400000;
			Record.find({timestamp:{$gt:sptime},name:thisname,state:1},function(err,recs){
				if(err){
					console.log(err);
				}else if(docs.recs == 0){
					insertRecord(thisname,1);	
				}else{
					console.log("already signin!");
				}
			});
			//delete today's offline record
			deleteRecord(thisname,0,sptime);
		}else{
			console.log("there is no name in the DB.");
		}
	});		
});

emitter.on("offline",function(arg){
	if(offline_counts[arg]){
		if(++offline_counts[arg] == 5){
			Umac.find({mac:arg},function(err,docs){
				if(err){
					console.log(err);
				}else if(docs[0].name){
					var sptime = (new Date()).getTime() - (new Date()).getTime()%86400000;
					Record.find({name:docs[0].name,state:0,timestamp:{$gt:sptime}},function(err,records){
						if(err){
							console.log(err);
						}else if(records.length == 0){
							insertRecord(docs[0].name,0);
						}else{
							updateRecord(docs[0].name,0);
						}
					});
				}
			});
		}
	}else{
		offline_counts[arg] = 1;
	}
});

client.on('connect', function () {
  console.log("connected!");
  client.subscribe('org.officekit.signin');
});

client.on('message', function (topic, message) {
  // message is Buffer
  var mac_arr = JSON.parse(message.toString());

  for(var mac in mac_arr){
	if(mac_arr[mac] == 1){
		emitter.emit("online",mac);					
	}else{
		emitter.emit("offline",mac);
	}
  }
});
