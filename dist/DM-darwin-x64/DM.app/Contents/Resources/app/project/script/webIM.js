window.addEventListener("touchmove", function(e) {
	e.preventDefault(); //取消事件的默认动作
	e.stopPropagation(); //不再派发事件
});

var webIM = {
	init: function() {
		this.isMsgSendToIM = false;
		
		//帐号模式，0-表示独立模式，1-表示托管模式
		this.accountMode = 0;

		//官方 demo appid,需要开发者自己修改（托管模式）
		this.sdkAppID = 1400027504;
		this.accountType = 11632;
		this.avChatRoomId = IMRoom.value; //默认房间群ID，群类型必须是直播聊天室（AVChatRoom），这个为官方测试ID(托管模式)

		this.selType = webim.SESSION_TYPE.GROUP;
		this.selToID = ''; //当前选中聊天id（当聊天类型为私聊时，该值为好友帐号，否则为群号）
		this.selSess = null; //当前聊天会话

		//默认群组头像(选填)
		this.selSessHeadUrl = 'img/2017.jpg';

		//当前用户身份
		this.loginInfo = {
			'sdkAppID': this.sdkAppID, //用户所属应用id,必填
			'appIDAt3rd': this.sdkAppID, //用户所属应用id，必填
			'accountType': this.accountType, //用户所属应用帐号类型，必填
			'identifier': '802650', //当前用户ID,必须是否字符串类型，选填
			'identifierNick': "null", //当前用户昵称，选填
			'userSig': 'eJxFkFFPgzAUhf8LrxrTdi0wkz0wNNGBE2Qz05cG1uLqQku6UtiM-11sJL5*X27OOffL26TFTdm2gtHS0Jlm3q0HvGuH*dAKzWlZG65HDAkhCIDJWq5PQslRIAAJRDMA-qVgXBpRC3cYAuSTyZzEx4ie7vP4McoapXZpv*FduJZ3HXtQZZweqsNVcNE9GKBftc8v9WqtWSSilZxbst0d3-JsKHL7HusqskFxXjZJ4SfLT8tMr7LXbYL6xWIKY0fqxv3Wx2M9FBCA-6QRDXd8DjEOQjzxcr9XnTTUnFvuvvH9A*B6WEU_', //当前用户身份凭证，必须是字符串类型，选填
			'headurl': 'img/2016.gif' //当前用户默认头像，选填
		};

		//监听事件
		this.listeners = {
			"onConnNotify": this.onConnNotify, //选填
			"jsonpCallback": this.jsonpCallback, //IE9(含)以下浏览器用到的jsonp回调函数,移动端可不填，pc端必填
			"onBigGroupMsgNotify": this.onBigGroupMsgNotify, //监听新消息(大群)事件，必填
			"onMsgNotify": this.onMsgNotify, //监听新消息(私聊(包括普通消息和全员推送消息)，普通群(非直播聊天室)消息)事件，必填
			"onGroupSystemNotifys": this.onGroupSystemNotifys, //监听（多终端同步）群系统消息事件，必填
			"onGroupInfoChangeNotify": this.onGroupInfoChangeNotify //监听群资料变化事件，选填
		};

		//监听（多终端同步）群系统消息方法
		this.onGroupSystemNotifys = {};

		this.isAccessFormalEnv = true; //是否访问正式环境

		if(webim.Tool.getQueryString("isAccessFormalEnv") == "false") {
			this.isAccessFormalEnv = false; //访问测试环境
		}

		this.isLogOn = false; //是否在浏览器控制台打印sdk日志

		//其他对象，选填
		this.options = {
			'isAccessFormalEnv': this.isAccessFormalEnv, //是否访问正式环境，默认访问正式，选填
			'isLogOn': this.isLogOn //是否开启控制台打印日志,默认开启，选填
		};

		this.curPlayAudio = null; //当前正在播放的audio对象

		this.openEmotionFlag = false; //是否打开过表情

		this.sdkLogin(); //sdk登录
		this.msgSendToIM();
	},
	sdkLogin: function() {
		let that = this;
		webim.login(this.loginInfo, this.listeners, this.options,
			function(identifierNick) {
				//identifierNick为登录用户昵称(没有设置时，为帐号)，无登录态时为空
				//				alert('webim登录成功');
				//				that.applyJoinBigGroup()
			},
			function(err) {
				console.log(err.ErrorInfo);
			}
		);
	},
	msgSendToIM: function() {
		var that = this;
		connectIM.onclick = function() {
			that.isMsgSendToIM = true;
			that.avChatRoomId = IMRoom.value
			that.applyJoinBigGroup();
			//webIM.sendMsg({ "type": "gift", "userName": "mudcry", "hits": "24", "giftName": "undefined(undefined 鱼翅)" })
		}
	},
	//进入大群
	applyJoinBigGroup: function() {
		let that = this;
		var options = {
			'GroupId': this.avChatRoomId //群id
		};
		webim.applyJoinBigGroup(
			options,
			function(resp) {
				//JoinedSuccess:加入成功; WaitAdminApproval:等待管理员审批
				if(resp.JoinedStatus && resp.JoinedStatus == 'JoinedSuccess') {
					console.log('进群成功');
					that.selToID = that.avChatRoomId;
					//that.observer.sendJoinMsg();
				}
			},
			function(err) {
				console.log(err.ErrorInfo);
			}
		);
	},
	//监听大群新消息（普通，点赞，提示，红包）
	onBigGroupMsgNotify(msgList) {
		for(var i = msgList.length - 1; i >= 0; i--) { //遍历消息，按照时间从后往前
			var msg = msgList[i];
			//console.warn(msg);
			//显示收到的消息
			console.log('监听大群新消息 :')
			console.log(JSON.stringify(msg))
			//			instance.observer.onTextMessage(msg);
		}
	},
	//IE9(含)以下浏览器用到的jsonp回调函数
	jsonpCallback: function(rspData) {
		webim.setJsonpLastRspData(rspData); //设置接口返回的数据
	},
	sendMsg: function(msg) {
		console.log(JSON.stringify(msg))
		var extData = this.buildRewardMessage(msg)
		console.log(extData)

		if(!this.selSess) {
			this.selSess = new webim.Session(this.selType, this.selToID, this.selToID, this.selSessHeadUrl, Math.round(new Date().getTime() / 1000));
		}
		var isSend = true; //是否为自己发送
		var seq = -1; //消息序列，-1表示sdk自动生成，用于去重
		var random = Math.round(Math.random() * 4294967296); //消息随机数，用于去重
		var msgTime = Math.round(new Date().getTime() / 1000); //消息时间戳
		var subType = webim.GROUP_MSG_SUB_TYPE.REDPACKET; //群消息子类型-红包消息，优先级最高

		var msg = new webim.Msg(this.selSess, isSend, seq, random, msgTime, this.loginInfo.identifier, subType, this.loginInfo.identifierNick);
		var msgtosend = extData;
		var text_obj = new webim.Msg.Elem.Text(JSON.stringify(extData));
		msg.addText(text_obj);
		let that = this;
		console.log(msg)
		webim.sendMsg(msg, function(resp) {
			console.log('发打赏消息成功');
		}, function(err) {
			console.log("发送打赏消息失败:" + err.ErrorInfo);
		});
	},
	buildRewardMessage: function(msg) {
		var obj = {};
		obj.type = '0';
		obj.msg = '打赏🎁啦~~';
		obj.ctime = '' + new Date().getTime();
		obj.isDY = true;
		obj.chatRoomId = this.avChatRoomId;
		obj.userAvatar = 'store.loginUser.avatar';
		obj.userId = '' + 'store.loginUser.uuid';
		obj.userName = '斗鱼' + msg.userName;
		return obj;
	},
	//监听连接状态回调变化事件
	onConnNotify(resp) {
		switch(resp.ErrorCode) {
			case webim.CONNECTION_STATUS.ON:
				//				console.log('连接状态正常...');
				break;
			case webim.CONNECTION_STATUS.OFF:
				console.log('连接已断开，无法收到新消息，请检查下你的网络是否正常');
				break;
			default:
				console.log('未知连接状态,status=' + resp.ErrorCode);
				break;
		}
	},
	//监听新消息(私聊(包括普通消息、全员推送消息)，普通群(非直播聊天室)消息)事件
	onMsgNotify(newMsgList) {},
	//监听 群资料变化 群提示消息
	onGroupInfoChangeNotify(groupInfo) {},

}
webIM.init();