var ClassRoomControllerModule = ClassRoomControllerModule || {};

function ClassRoomController(){
    ClassRoomControllerModule.instance = this;
    this.role = $("#role").val();
    this.classRoomID = $("#classRoomId").val();
    this.userID = $("#userid").val();

    this.reConnectCount = 0;               //重连次数
    this.userManager = null;               //用户对象
    this.whiteBoardManager = null;         //白板对象
    this.chatManager = null;               //聊天对象
    this.liveManager = null;               //媒体对象
    this.classroomInfoManager = null;      //课室信息对象

    this.WS_KEEP_LIVE_INTERVAL = 2000;      //心跳检测间隔,从数据库获取
    this.ExitClassroom  = false;            //标识,课程是否已结束
	this.WSocket = null;                   //websocket对象
    this._initWebSocket = function(){     //创建websocket
        var WS = window['MozWebSocket'] ? MozWebSocket : WebSocket;
        if (!("WebSocket" in window)) {
            //TODO::硬编码
            alert("您的浏览器不支持,请更换其他浏览器");
            return false;
        }
        var url = 'wss://'+window.location.host+VC.ROUTER.LIVE.JOINROOM+'?roomid='+this.classRoomID+'&userid='+this.userID;
        this.WSocket = new ReconnectingWebSocket(url);
        return true;
    };
}
ClassRoomController.prototype = {
    constructor : ClassRoomController,
    init : function(){
    	if(window.location.search.indexOf('code') != -1){
            this.role = 1;
        }else if(window.location.search.indexOf('key') != -1){
            this.role = 2;
        }else{
            throw new Error("链接错误");
        }
        if(PublicStatic.StaticClass.isTeacherByRole(this.role)){
            this.userManager = new Teacher(this);
        }else{
            this.userManager = new Student(this);
        }
        this.classroomInfoManager = new ClassroomInfoManager(this);
        this.whiteBoardManager = new WhiteBoardManager(this);
        this.chatManager = new ChatManager(this);
        this.liveManager = new LiveManager(this);
        //初始化各对象
        this.userManager.init();
        this.classroomInfoManager.init();
        this.whiteBoardManager.init();
        this.chatManager.init();
        this.liveManager.init();
    },
    onReceive : function(evt){              //监听信息
        if(evt && evt.data){
            var jsonData = JSON.parse(evt.data);
            if(jsonData.cmd === "robot:talk"){          //接收机器人
                console.log("robot:talk------------->>>>robot come");
                ClassRoomControllerModule.instance.classroomInfoManager.sertime = jsonData.date;
                ClassRoomControllerModule.instance.classroomInfoManager.nowtime = $.now();
            }else if(jsonData.cmd == "classroom:join"){
                ClassRoomControllerModule.instance.WS_KEEP_LIVE_INTERVAL = jsonData.CHECK_WS_KEEP_LIVE_INTERVAL * 1000;
                setInterval(function(){
                    console.log("当前的WSocket.bufferedAmount=" + ClassRoomControllerModule.instance.WSocket.getBufferedAmount());
                    if(ClassRoomControllerModule.instance.WSocket.getBufferedAmount() == 0 ){
                        console.log("robot:reply----->>> send");
                        var command = { "cmd":"robot:reply","roomid":ClassRoomControllerModule.instance.classRoomID,"userid":ClassRoomControllerModule.instance.userID };
                        ClassRoomControllerModule.instance.sendMessage(command);
                    }
                },ClassRoomControllerModule.instance.WS_KEEP_LIVE_INTERVAL);
            }
            //广播接收到的信息给对应的模块
            ClassRoomControllerModule.instance.classroomInfoManager.onReceive(evt.data);
            ClassRoomControllerModule.instance.whiteBoardManager.onReceive(evt.data);
            ClassRoomControllerModule.instance.chatManager.onReceive(evt.data);
            ClassRoomControllerModule.instance.liveManager.onReceive(evt.data);
        }
    },
    sendMessage : function(data){          //发送信息
        if(!ClassRoomControllerModule.instance.WSocket || ClassRoomControllerModule.instance.WSocket.readyState != WebSocket.OPEN){
            console.log("发消息前检测到掉线了---->>>");
    //        var msg = VC.ROUTER.LIVEBIG.LIVE_RELOGIN_AND_DISCONNECTION;
    //        var msg = "连接已断开";
    //        ClassRoomControllerModule.instance.classroomInfoManager.openErrorWindow(msg);
            return;
        }
        console.log("Send Message: " + JSON.stringify(data));
        ClassRoomControllerModule.instance.WSocket.send(JSON.stringify(data));
    },
    initWS : function(){//初始化WS事件
    	if(!this._initWebSocket())
    		throw new Error("WS无法连接");
        this.WSocket.onmessage = function(evt){
            ClassRoomControllerModule.instance.onReceive(evt);
        };
        this.WSocket.onclose = function(){          //WS已关闭
            PublicStatic.StaticClass.isReConnect = true;
            console.log("WS已关闭");return;
            //TODO::重连
            var msg = VC.ROUTER.LIVEBIG.LIVE_RELOGIN_AND_DISCONNECTION;
            ClassRoomControllerModule.instance.classroomInfoManager.openErrorWindow(msg);
        };
        this.WSocket.onerror = function(evt){
            console.log("WS建立出错");
            ClassRoomControllerModule.instance.reConnectCount++;
            if(ClassRoomControllerModule.instance.reConnectCount >=3){
                var msg = "您的网络不稳定,连接已中断,请重新进入!";
                ClassRoomControllerModule.instance.classroomInfoManager.openErrorWindow(msg);
                return;
            }
        };
        this.WSocket.onopen = function(){
            PublicStatic.StaticClass.isReConnect = false;
            console.log("WS已建立");
            ClassRoomControllerModule.instance.reConnectCount = 0;
        };
        this.WSocket.messageAlert = function(){
            var msg = VC.ROUTER.LIVEBIG.LIVE_RELOGIN_AND_DISCONNECTION;
            ClassRoomControllerModule.instance.classroomInfoManager.openErrorWindow(msg);
            return;
        };
    },
    createWS : function(){              //创建WS连接
        this._initWebSocket();
    },
    closeWS : function(){               //关闭WS连接
        this.WSocket.close();
    },
    getUserManager:function(){          //获取用户对象
        return this.userManager;
    },
    getChatManager:function(){          //获取聊天对象
        return this.chatManager;
    },
    getLiveManager:function(){          //获取媒体对象
        return this.liveManager;
    },
    getWhiteBoardManager:function(){    //获取白板对象
        return this.whiteBoardManager;
    },
    getClassroomInfoManager:function(){ //获取房间对象
        return this.classroomInfoManager;
    },
    getRole : function(){           //获取角色值
        return this.role;
    },
    getUserId : function(){         //获取用户ID
        return this.userID;
    },
    getClassRoomId : function(){    //获取房间ID
        return this.classRoomID;
    },
    setExitClassroom:function(){    //课程已结束,更新标识
        this.ExitClassroom = true;
    }
};
