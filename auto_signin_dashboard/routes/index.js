var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var db = mongoose.connect('mongodb://root:jmdlbl88@localhost:27017/officekit_signin');

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

/* GET home page. */
router.get('/', function(req, res, next) {
  Record.find({},function(err,docs){
	if(err){
		res.render('error',{message:err});
	}else if(docs.length > 0){
		var renderRec = [];
		for(var i=0;i<docs.length;i++){
			var render_rec = {};
			if(docs[i].state == 0){
				render_rec.state = "下班";
			}else{
				render_rec.state = "上班";
			}
			render_rec.name = docs[i].name;
			var date = new Date( docs[i].timestamp);
			render_rec.timestamp = date.toLocaleString();
			renderRec.push(render_rec);
		}
  		res.render('index', { records: renderRec });
	}
  });
});

router.get('/getMacs',function(req,res,next){
	Umac.find({},function(err,docs){
		var macs = [];
		if(err){
			res.send("[]");
		}else if(docs.length > 0){
			for(var i = 0;i<docs.length;i++){
				macs.push(docs[i].mac);	
			}
			res.send(JSON.stringify(macs));
		}else{res.send("[]");}
	});
});

router.get('/addMac',function(req,res,next){
	Umac.find({},function(err,docs){
                var macs = [];
                if(err){
                        console.log("find umaclist error" + err);
                }else{
                	res.render('addMac',{umacs:docs});
		}
        });
});

function isValidMAC(mac){
	var macs = mac.split(":");
	if(macs.length != 6){
		return false;
	}
	for(var i=0;i<6;i++){
		if(macs[i].length != 2) {
			return false;
		}
	}
	return true;
}

router.post('/addMac_act',function(req,res,next){
	var umac = new Umac();
	umac.name = req.body.name;
	umac.mac = req.body.mac.toLowerCase();
	
	if(umac.name && umac.mac && umac.name != "" && umac.mac != "" && isValidMAC(umac.mac)){
		umac.save(function(err){
			if(err){
				res.redirect("/addMac");
			}else{
				res.redirect("/addMac");
			}
		});
	}else{
		res.redirect("/addMac");
	}
	
});

module.exports = router;
