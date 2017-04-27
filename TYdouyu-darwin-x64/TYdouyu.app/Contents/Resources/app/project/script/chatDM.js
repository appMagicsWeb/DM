var http = require('http');
var net = require('net');

var danmuServer = {
	ip: 'openbarrage.douyutv.com',
	port: 8601
}
var danmuClient;
var rollType;
var rollKey;
var roomInfoApiRoot = 'http://open.douyucdn.cn/api/RoomApi/room/';

var service = {
	roomInfo: {},
	roomInfoStatus: {
		isReady: false
	},
	chatStatus: {
		hasStartFetchMsg: false,
		stopFetchMsg: false
	},
	isStartRoll: false,
	candidates: [],
	messages: [],
	isSpeak: false,

	giftConfig: {}
};

fetchChatInfo.onclick = function() {
	document.getElementById('chatList').innerHTML = ''
	connDanmuServ(ipt.value); //32892
}

function connDanmuServ(roomID) {
	console.log("寻找弹幕服务器中...");
	danmuClient = net.connect({
			host: danmuServer.ip,
			port: danmuServer.port
		},
		function() {
			console.log("弹幕服务器找到 开始连接");

			var loginServer = "type@=loginreq/roomid@=" + roomID + "/";
			var joinGroup = "type@=joingroup/rid@=" + roomID + "/gid@=-9999/";

			danmuClient.write(toBytes(loginServer));
			danmuClient.write(toBytes(joinGroup));
			console.log('login request sent');
			service.chatStatus.hasStartFetchMsg = true;

			//keep Alive!
			setInterval(function() {
				danmuClient.write(toBytes("type@=keeplive/tick@=" + Math.floor(Date.now() / 1000) + "/"));
			}, 45000);
		});

	danmuClient.on('data', function(data) {
		var msg = data.toString();
		var qItem = parseReadable(msg);
		console.log(qItem)
		handleChatMsg(qItem)

		// service.messages.push(qItem);
		// $rootScope.$broadcast('newMsgArrive');

		// if (service.isSpeak && qItem.type === 'msg') {
		//   var msg = new SpeechSynthesisUtterance(qItem.content);
		//   msg.lang = 'zh-CN';
		//   window.speechSynthesis.speak(msg);
		// }

		// if (service.isStartRoll) {
		//   if (rollType === 'keyWord' && qItem.type === 'msg' && qItem.content.indexOf(rollKey) > -1) {
		//     qItem.getLucky = false;
		//     service.candidates.push(qItem);
		//     $rootScope.$broadcast('newCandidateArrive');
		//   }
		//   if (rollType === 'gift' && qItem.type === 'gift') {
		//     var idx = lodash.findIndex(service.candidates, function(o) {
		//       return o.userName === qItem.userName;
		//     });
		//     if (idx > -1) {
		//       service.candidates[idx].giftValue += qItem.giftValue
		//       $rootScope.$broadcast('newCandidateArrive');
		//     } else {
		//       var newCandi = {
		//         userName: qItem.userName,
		//         giftValue: qItem.giftValue,
		//         getLucky: false
		//       };
		//       service.candidates.push(newCandi);
		//       $rootScope.$broadcast('newCandidateArrive');
		//     }
		//   }
		// }

	});

	/*  danmuClient.on('end', function() {
	    console.error('Disconnect to Danmu server');
	    util.showMsg("弹幕服务器连接断开");
	  });

	  danmuClient.on('error', function() {
	    console.error('Error: Danmu server');
	    util.showMsg("弹幕服务器连接错误");
	    connDanmuServ(roomID);
	    util.showMsg("重连弹幕服务器...");
	  });*/

}
var chatArr = [];

function handleChatMsg(msg) {
	if(document.getElementsByTagName('li').length > 14){
		document.getElementsByTagName('li')[0].remove()
	}
	if(msg.type == 'msg') {
		createChatMsg(msg.userName, msg.content)
	} else if(msg.type == 'gift') {
		createChatMsg(msg.userName, '')
	} else if(msg.type == 'unkonwn') {

	}

	//	if(msg.userName != 'undefined' && msg.content != 'undefined') {
	//		var chatBox = document.getElementById('chatList');
	//		var chatItem = document.createElement('li');
	//
	//		var con = document.createTextNode(msg.userName + ': ' + msg.content);
	//
	//		chatItem.appendChild(con);
	//		chatBox.appendChild(chatItem)
	//	}

}

function createChatMsg(name, con) {
	var chatBox = document.getElementById('chatList');
	var chatItem = document.createElement('li');
	if(con != '') {
		var con = document.createTextNode(name + ': ' + con);
	} else {
		var con = document.createTextNode(name + '送礼物啦啦~');
	}

	chatItem.appendChild(con);
	chatBox.appendChild(chatItem)

}

function deserialize(rawData) {
	var rawToString = rawData.substring(rawData.indexOf('type@=')).trim();
	var dataArr = rawToString.split('/');
	var dataObj = {}

	var kv = "";
	var v;
	for(var i = 0; i < dataArr.length - 1; i++) {
		kv = dataArr[i].split('@=');
		if(kv && kv[1]) {
			v = kv[1];
			v = v.replace(/@S/g, '/');
			v = v.replace(/@A/g, '@');
			dataObj[kv[0]] = v;
		}

	};

	if(dataObj.type === "bc_buy_deserve") {
		dataArr = dataObj.sui.split('/');
		dataObj.sui = {};
		for(var i = 0; i < dataArr.length - 1; i++) {
			kv = dataArr[i].split('@=');
			if(kv && kv[1]) {
				v = kv[1];
				v = v.replace(/@S/g, '/');
				v = v.replace(/@A/g, '@');
				dataObj.sui[kv[0]] = v;
			}
		};
	};
	return dataObj;
}

function parseReadable(rawData) {
	var item = {};
	var dataObj = deserialize(rawData);

	if(dataObj.type === 'chatmsg') {
		item.type = 'msg';
		item.userName = dataObj.nn;
		item.content = dataObj.txt;
	} else if(dataObj.type === 'uenter') {
		item.type = 'userEnter';
		item.userName = dataObj.nn;
	} else if(dataObj.type === 'dgb') {
		item.type = 'gift';
		item.userName = dataObj.nn;
		item.hits = dataObj.hits;

		var giftInfo = {};

		for(var i = 0; i < service.giftConfig.length; i++) {
			if(service.giftConfig[i].id == dataObj.gfid) {
				giftInfo = service.giftConfig[i];
				break;
			}
		};
		item.giftValue = giftInfo.gx;

		if(giftInfo.type === "1") {
			if(giftInfo.name !== '100鱼丸')
				item.giftName = giftInfo.name + '(' + giftInfo.pc + ' 鱼丸)';
			else
				item.giftName = giftInfo.pc + ' 鱼丸';
		} else {
			item.giftName = giftInfo.name + '(' + giftInfo.pc + ' 鱼翅)';
		}

		item.icon = giftInfo.mimg;

	} else if(dataObj.type === 'bc_buy_deserve') {
		item.type = 'gift';
		// console.log(dataObj);
		item.userName = dataObj.sui.nick;
		item.hits = dataObj.hits;

		var lvl = dataObj.lev;
		if(lvl == 1) {
			item.giftName = "初级酬勤";
			item.giftValue = 150;
		};
		if(lvl == 2) {
			item.giftName = "中级酬勤";
			item.giftValue = 300;
		};
		if(lvl == 3) {
			item.giftName = "高级酬勤";
			item.giftValue = 500;
		};
	} else if(dataObj.type === 'blackres') {
		// console.log(dataObj);
		item.type = 'blackList';
		item.managerName = dataObj.snick;
		item.userName = dataObj.dnick;
		item.time = parseInt(dataObj.limittime) / 3600;
	} else if(dataObj.type === 'keeplive') {
		//do nothing
		item.type = 'keeplive';
	} else {
		// console.log(dataObj);
		item.type = 'unknown';
		item.str = 'unknown';
	};
	return item;
}

function toBytes(content) {
	var length = [content.length + 9, 0x00, 0x00, 0x00];
	var magic = [0xb1, 0x02, 0x00, 0x00]; //little ending hex number 689
	var ending = [0x00];
	var contentArr = [];

	for(var i = 0; i < content.length; ++i) {
		contentArr.push(content.charCodeAt(i));
	}

	var msg = length.concat(length, magic, contentArr, ending);
	var buf = new Buffer(msg);

	return buf;
}