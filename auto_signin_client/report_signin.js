var spawn = require('child_process').spawn;
var mqtt = require('./');
var http = require("http");
var qs = require("querystring");
var client = mqtt.connect("mqtt://121.42.201.80:1886");
var OUTPUT = [];
var MAC_LIST = {};
var interval = -1;

client.on("reconnect",function(){
	console.log("reconnecting");	
});

client.on("connect",function(){
	startScan();
});

function getMacs(callback){
	var data = {did:12345};
	var content = qs.stringify(data);
	var options = {
		hostname:"121.42.201.80",
		port:3001,
		path:"/getMacs",
		method:"GET"
	};
	var req = http.request(options,function(res){
		res.setEncoding('utf8');
		res.on('data',function(chunk){
			console.log(JSON.stringify(chunk));
			callback(chunk);
		});
	});
	req.on('error',function(e){
		console.log("problem:"+e.message);
	});	
	req.end();
}	

function stopScan(){
	if(interval != -1){
		clearInterval(interval);
	}
}


function startScan(){
var interval = setInterval(function(){
getMacs(function(care_macs){
MAC_LIST = {};
OUTPUT = [];
var care_macs = JSON.parse(care_macs.toString().toLowerCase());
for(var i=0;i<care_macs.length;i++){
	MAC_LIST[care_macs[i]] = 0;
}

nmap = spawn('nmap', ['-sP','192.168.1.1/24']);
nmap.stdout.on('data', function (data) {
	data = data.toString();
	if(data.indexOf("MAC Address:") > 0){
		OUTPUT.push(data.split("\n"));
	} 
});
nmap.stderr.on('data', function (data) { 
console.log('standard error output:\n' + data); 
});
nmap.on('exit', function (code, signal) {
	for(var i=0;i<OUTPUT.length;i++){
		for(var j=0;j<OUTPUT[i].length;j++){
			if(OUTPUT[i][j].indexOf("MAC Address:") >= 0){
				//MAC_LIST.push(OUTPUT[i][j].substr(13,17));
				var mac = OUTPUT[i][j].substr(13,17).toLowerCase();
				if(care_macs.indexOf(mac) >= 0){
					MAC_LIST[mac] = 1;
				}
			}
		}
	}
	console.log(JSON.stringify(MAC_LIST));
	client.publish("org.officekit.signin",JSON.stringify(MAC_LIST)); 
});
})
},15000);
};
