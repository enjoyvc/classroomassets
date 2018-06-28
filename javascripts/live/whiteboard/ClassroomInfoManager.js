var ClassroomInfoModule = ClassroomInfoModule || {};

function ClassroomInfoManager(classRoomController){
    ClassroomInfoModule.instance = this;
    this.classRoomController = classRoomController;

    this.userManager = classRoomController.getUserManager();        //用户对象.

    this.roomId = classRoomController.getClassRoomId();             //房间ID
    this.classroomName = null;      //房间名
    this.classroomType = null;      //课堂类型(1-1,小班,大班)
    this.classroomMode = 0;         //课堂模式,默认为0  0为授课模式，1为讨论模式
    this.openClass = false;         //课堂公开课,默认为false
    this.quota = 0;                 //课堂设置人数的最大容量
    this.hasmeeting = false;        //会议是否创建,默认为false
    this.teacherShareVideo = false; //老师是否共享屏幕
    this.teacherWhiteboardStatus = false;//老师是否开启白板
    this.teacherCurrentVideo = null;    //老师当前的视频,老师：'t_1','t_2';学生：userid
    this.scrollMembersCount = 8;      //走马灯显示数量
    this.scrollMembersTime = 8000;       //走马灯切换时间
    this.controlAllStudentAudioStatus = 0;  //老师控制所有学生音频的开关状态.0:开启    1:禁止
    this.controlAllStudentVideoStatus = 0;  //老师控制所有学生视频的开关状态.1：禁止   0：开启
    this.controlAllStudentChatStatus = 0;   //老师控制讨论区发言状态,0:true,1:false
    this.allowHandup = false;           //老师是否允许学生举手    true==0,false==1
    this.members = [];              //课室用户列表
    this.searchMembers = [];        //存储查询的用户列表

    this.stime = null;      //开始时间
    this.etime = null;      //结束时间
    this.sertime = null;    //机器人回调时间
    this.nowtime = null;    //当前时间




}
ClassroomInfoManager.prototype = {
    constructor : ClassroomInfoManager,
    init : function(){
        this.whiteBoardManager = ClassroomInfoModule.instance.classRoomController.getWhiteBoardManager();
        this.liveManager = ClassroomInfoModule.instance.classRoomController.getLiveManager();
    },
    getRoomId : function(){         //获取房间ID
        return this.roomId;
    },
    getClassroomName : function(){  //获取房间名
        return this.classroomName;
    },
    getClassroomType : function(){  //获取课程类型
        return this.classroomType;
    },
    getClassroomMode : function(){  //获取课程模式
        return this.classroomMode;
    },
    isTeachingMode : function(){    //是否为授课模式
        if(this.classroomMode == '0')
            return true;
        return false;
    },
    isOpenClass : function(){       //是否为公开课
        return this.openClass;
    },
    getQuota : function(){          //获取课室的人数最大容量
        return this.quota;
    },
    isHasMeeting : function(){     //是否已创建会议(该会议指视频的会议)
        return this.hasmeeting;
    },
    getTeacherShareVideo : function(){  //老师是否共享屏幕
        return this.teacherShareVideo;
    },
    getTeacherWhiteboardStatus : function(){    //老师是否开启白板
        return this.teacherWhiteboardStatus;
    },
    getTeacherCurrentVideo : function(){        //老师主画面
        return this.teacherCurrentVideo;
    },
    setScrollMembersCount : function(value){    //设置走马灯显示数量
        if(this.userManager.isTeacher()){
            this.scrollMembersCount = value + 1;
        }else{
            this.scrollMembersCount = value - 1;
        }
    },
    getScrollMembersCount : function(){     //获取走马灯显示数量
        return this.scrollMembersCount;
    },
    setScrollMembersTime : function(value){ //设置走马灯切换时间
        this.scrollMembersTime = value;
    },
    getScrollMembersTime : function(){      //获取走马灯切换时间
        return this.scrollMembersTime;
    },
    getControlAllStudentAudioStatus :function(){    //获取老师控制所有学生的音频开关状态
        return this.controlAllStudentAudioStatus;
    },
    getControlAllStudentVideoStatus : function(){   //获取老师控制所有学生的视频开关状态
        return this.controlAllStudentVideoStatus;
    },
    getControlAllStudentChatStatus : function(){    //获取老师控制所有学生的聊天开关状态
        return this.controlAllStudentChatStatus;
    },
    getAllowHandup : function(){            //获取允许举手状态
        return this.allowHandup;
    },
    setAllowHandup : function(value){       //存储允许举手状态
        ClassroomInfoModule.instance.allowHandup = value;
    },
    getMembers : function(){        //获取课室用户列表
        return ClassroomInfoModule.instance.members;
    },
    getSearchMembers : function(){  //获取查询的用户列表
        return ClassroomInfoModule.instance.searchMembers;
    },
    setZonePermission : function(value){    //设置讨论区发言
        if(!ClassroomInfoModule.instance.userManager.isTeacher()){
            ClassroomInfoModule.instance.userManager.banChatStatus = !(value==0);
        }else{
            ClassroomInfoModule.instance.controlAllStudentChatStatus = value;
            ClassroomInfoModule.instance.updateMembersAllStudentStopchatValue(value);
        }
    },
    getStime : function(){
        return this.stime;
    },
    getEtime : function(){
        return this.etime;
    },
    getSertime : function(){
        return this.sertime;
    },
    getNowtime : function(){
        return this.nowtime;
    },
    updateAllStudentStopvideoValueFromMembersAndSearchMembersByValue : function(value){ //根据value值从members和searchMembers中修改所有学生的stopvideo值
        this.updateAllStudentStopvideoValueFromMembersByValue(value);
        this.updateAllStudentStopvideoValueFromSearchMembersByValue(value);
    },
    //--------------------------members function start
    updateMembersAllStudentStopchatValue : function(value){    //根据value值修改用户列表每一个学生的stopchat值
        $.each(ClassroomInfoModule.instance.members,function(i,o){
            if(!PublicStatic.StaticClass.isTeacherByRole(o.roleid)){
                ClassroomInfoModule.instance.members[i].stopchat = value;
            }
        });
    },
    updateUserStopchatValueFromMembersByUseridAndValue : function(userid,value){    //根据userid和value值修改列表中该用户的stopchat值
        var i = this.findIndexFromMembersById(userid);
        if(i != null)
            ClassroomInfoModule.instance.members[i].stopchat = value;
    },
    updateUserStopwhiteboardValueFromMembersByUseridAndValue : function(userid,value){  //根据userid和value值修改列表中该用户的stopwhiteboard值
        var i = this.findIndexFromMembersById(userid);
        if(i != null)
            ClassroomInfoModule.instance.members[i].stopwhiteboard = value;
    },
    updateAllUserStopwhiteboardValueFromMembersByValue : function(value){   //根据value值修改列表中所有用户的stopwhiteboard值,设置列表成员的白板图标状态:0为不可用,1为可用
        $.each(ClassroomInfoModule.instance.members,function(i,o){
            ClassroomInfoModule.instance.members[i].stopwhiteboard = value;
        });
    },
    updateUserStopvideoValueFromMembersByUseridAndValue : function(userid,value){   //根据userid和value值修改列表中该用户的stopvideo值
        var i = this.findIndexFromMembersById(userid);
        if(i != null)
            ClassroomInfoModule.instance.members[i].stopvideo = value;
    },
    updateAllStudentStopvideoValueFromMembersByValue : function(value){          //根据value值修改members中所有用户的stopvideo值
        $.each(ClassroomInfoModule.instance.members,function(i,o){
            if(!PublicStatic.StaticClass.isTeacherByRole(o.roleid))
                ClassroomInfoModule.instance.members[i].stopvideo = value;
        });
    },
    updateUserStopspeakValueFromMembersByUseridAndValue : function(userid,value){   //根据userid和value值修改列表中该用户的stopspeak值
        var i = this.findIndexFromMembersById(userid);
        if(i != null)
            ClassroomInfoModule.instance.members[i].stopspeak = value;
    },
    updateUserHandspeakValueFromMembersByUseridAndValue : function(userid,value){   //根据userid和value值修改列表中该用户的handspeak值
        var i = this.findIndexFromMembersById(userid);
        if(i != null)
            ClassroomInfoModule.instance.members[i].handspeak = value;
    },
    updateUserSourceidFromMembersByUseridAndTypeAndValue : function(userid,type,value){  //根据userid,type和value值修改列表中该用户的资源ID值
        var index = this.findIndexFromMembersById(userid);
        if(index != null){
            $.each(ClassroomInfoModule.instance.members[index].videoInfos,function(i,o){
                if(o.sourceName === type){
                    ClassroomInfoModule.instance.members[index].videoInfos[i].sourceId = value;
                    return false;
                }
            });
        }
    },
    findIndexFromMembersById : function(userid){        //根据ID从列表中获取索引
        return PublicStatic.StaticClass.findIndexFromMembersById(userid,ClassroomInfoModule.instance.members);
    },
    findObjectFromMembersById : function(userid){//根据ID从列表中获取对象
        return PublicStatic.StaticClass.findObjectByIdAndMembers(userid,ClassroomInfoModule.instance.members);
    },
    findObjectByIdAndMembers : function(userid,members){ //根据userid和member获取对象
        return PublicStatic.StaticClass.findObjectByIdAndMembers(userid,members);
    },
    findObjectFromMembersByIndex : function(index){     //根据索引从列表中获取对象
        return PublicStatic.StaticClass.findObjectFromMembersByIndex(index,ClassroomInfoModule.instance.members);
    },
    findSourceidFromMembersByUseridAndType : function(userid,type){  //根据userid和type从列表中获取对应用户的资源ID
        var sourceId = null;
        $.each(ClassroomInfoModule.instance.members,function(i,o){
            if(userid == o.userid){
                var videoInfoList = o.videoInfos;
                $.each(videoInfoList,function(j,k){
                    if(k.sourceName === type && k.sourceId !== ""){
                        sourceId = k.sourceId;
                        return false;
                    }
                });
            }
        });
        return sourceId;
    },
    findTeacherObjectFromMembers : function(){          //从列表中获取老师对象
        return PublicStatic.StaticClass.findTeacherObjectFromMembers(ClassroomInfoModule.instance.members);
    },
    deleteUserFromMembersByIndex : function(index){     //根据索引从列表中删除用户
        if(index != null)
            ClassroomInfoModule.instance.members.splice(index,1);
    },
    deleteUserFromMembersByUserid : function(userid){   //根据userid从列表中删除对应用户
        var i = this.findIndexFromMembersById(userid);
        this.deleteUserFromMembersByIndex(i);
    },
    addUserToMembersByObject : function(obj){           //将obj添加进列表中
        if(obj != null)
            ClassroomInfoModule.instance.members.push(obj);
    },
    //--------------------------members function end
    //--------------------------searchMembers function start
    updateAllStudentStopvideoValueFromSearchMembersByValue : function(value){       //根据value值修改searchMembers中所有学生的stopvideo值
        $.each(ClassroomInfoModule.instance.searchMembers,function(i,o){
            if(!PublicStatic.StaticClass.isTeacherByRole(o.roleid))
                ClassroomInfoModule.instance.searchMembers[i].stopvideo = value;
        });
    },
    deleteUserFromSearchMembersByUserid : function(userid){ //根据userid从列表中删除对应用户
        var index = PublicStatic.StaticClass.findIndexFromMembersById(userid,ClassroomInfoModule.instance.searchMembers);
        if(index != null)
            ClassroomInfoModule.instance.searchMembers.splice(index,1);
    },
    //--------------------------searchMembers function end
    changeClassroomMode : function(){//改变课程模式
        if(this.isTeachingMode()){            //当前为授课模式
            this.classroomMode = 1;
            $.each(ClassroomInfoModule.instance.getMembers(),function(index,obj){
                ClassroomInfoModule.instance.updateUserStopspeakValueFromMembersByUseridAndValue(obj.userid,0);
            });
        }else{                                              //当前为讨论模式
            this.classroomMode = 0;
            $.each(ClassroomInfoModule.instance.getMembers(),function(index,obj){
                ClassroomInfoModule.instance.updateUserStopspeakValueFromMembersByUseridAndValue(obj.userid,1);
            });
        }
        var command = {
            roomid:this.getRoomId(),
            cmd:"controlpanel:inclass",
            isteacher:true,
            sharewhiteboard:0,
            status:this.getClassroomMode(),             // 0 授课   1 讨论
            userid:this.userManager.getUserid(),
            userName:this.userManager.getUsername(),
            classroomName:this.getClassroomName()
        };
        this.classRoomController.sendMessage(command);//通知学生,课程模式已改变
    },
    onReceive : function(data){     //接收信息
        var data =  JSON.parse(data);
        if(data.cmd !== "robot:reply")
            console.debug(data);
        if(data.cmd == "classroom:join"){       //用户加入,初始化数据
            if (data.classroom.stime != 0 &&  data.classroom.etime != 0) {
                ClassroomInfoModule.instance.stime = data.classroom.stime;
                ClassroomInfoModule.instance.etime = data.classroom.etime;
            }
            if(ClassroomInfoModule.instance.userManager.isOneselfByUserid(data.userid)){
                var obj = ClassroomInfoModule.instance.findObjectByIdAndMembers(data.userid,data.members);
                if(obj != null){
                    ClassroomInfoModule.instance.userManager.username = obj.username;      //名称
                    ClassroomInfoModule.instance.userManager.online = obj.online;          //在线状态
                    ClassroomInfoModule.instance.userManager.avatar = obj.avatar;           //头像
                    ClassroomInfoModule.instance.userManager.isauth = obj.isauth;           //实名
                }
                ClassroomInfoModule.instance.roomId = data.roomid;                      //课堂ID
                ClassroomInfoModule.instance.classroomName = data.classroom.name;       //课堂标题
                ClassroomInfoModule.instance.classroomType = data.classroom.quota;      //课堂类型(1对1,小班,大班)
                ClassroomInfoModule.instance.classroomMode = data.controlpanel.inclass; //设置课堂模式--0:授课 1:讨论
                ClassroomInfoModule.instance.openClass = data.classroom.ispublic;       //课堂是否公开课
                ClassroomInfoModule.instance.setCourseTitle(data.classroom.name);//TODO
                ClassroomInfoModule.instance.quota = data.classroom.quota;          //课堂人数的最大容量
                ClassroomInfoModule.instance.teacherShareVideo = data.classroom.showscreen;//老师共享屏幕状态
                ClassroomInfoModule.instance.teacherWhiteboardStatus = data.show;   //老师白板开启状态
                ClassroomInfoModule.instance.teacherCurrentVideo = data.videoid;    //老师当前的主画面视频
                ClassroomInfoModule.instance.setScrollMembersCount(data.CLASSROOM_SCROLL_MEMBERS_COUNT);//走马灯显示数量
                ClassroomInfoModule.instance.setScrollMembersTime(data.CLASSROOM_SCROLL_MEMBERS_TIME);//走马灯切换时间
                ClassroomInfoModule.instance.controlAllStudentAudioStatus = data.controlpanel.forbidenaudio;//记录老师控制所有学生音频的状态
                ClassroomInfoModule.instance.setAllowHandup(data.controlpanel.switch_global_raise_hand_permission==0);//记录老师允许举手的状态
                if(!data.isReConnect){        //只在第一次初始化（防止重连时视频丢失）
                    ClassroomInfoModule.instance.members = data.members;                //用户列表
                }
                ClassroomInfoModule.instance.setZonePermission(data.controlpanel.switch_discuss_zone_permission);       //设置讨论区发言
                ClassroomInfoModule.instance.startScrollVideo();//TODO::开始走马灯
                ClassroomInfoModule.instance.liveManager.initDefaultCmdParam(data.roomid,data.userid,data.classroom.name,obj.username);
            }else{
                if(!data.isReConnect)
                    ClassroomInfoModule.instance.updateClassroomInfoDataOtherJoin(data);
            }
            ClassroomInfoModule.instance.hasmeeting = data.hasmeeting;      //会议是否创建
            ClassroomInfoModule.instance.controlAllStudentVideoStatus = data.controlpanel.forbidenvideo;//记录老师控制所有学生视频的状态
            if(data.controlpanel.forbidenvideo == 1){
                ClassroomInfoModule.instance.updateAllStudentStopvideoValueFromMembersAndSearchMembersByValue(data.controlpanel.forbidenvideo);
            }

            ClassroomInfoModule.instance.setShareWhiteBoardStatus(data.controlpanel.sharewhiteboard==1);                   //设置共享白板
        }else if(data.cmd == "controlpanel:inclass"){                   //老师切换课程模式
            ClassroomInfoModule.instance.classroomMode = data.status;
        }else if(data.cmd == "controlpanel:switch_global_raise_hand_permission"){              //老师允许举手通知
            if(!ClassroomInfoModule.instance.userManager.isTeacher()){
                if(data.status == 0) {
                    var msg = VC.ROUTER.LIVEBIG.LIVE_CAN_HANGUP_TIPS;
                    ClassroomInfoModule.instance.showMessageWindow(msg);
                }
                ClassroomInfoModule.instance.setAllowHandup(data.status==0);
                if(!ClassroomInfoModule.instance.getAllowHandup())
                    ClassroomInfoModule.instance.userManager.isHandupStatus = false;
            }
        }else if(data.cmd == "controlpanel:switch_discuss_zone_permission"){      //讨论区发言
            if(!ClassroomInfoModule.instance.userManager.isTeacher()){
                ClassroomInfoModule.instance.userManager.banChatStatus = !(data.status==0);
            }else{
                var value = data.status==0?0:1;
                ClassroomInfoModule.instance.updateMembersAllStudentStopchatValue(value);
            }
        }else if(data.cmd === "userctrl:stopchat"){     //禁止或允许用户讨论区发言
            ClassroomInfoModule.instance.updateUserStopchatValueFromMembersByUseridAndValue(data.userid,data.status);
            if(!ClassroomInfoModule.instance.userManager.isTeacher() && ClassroomInfoModule.instance.userManager.isOneselfByUserid(data.userid)){
                ClassroomInfoModule.instance.userManager.banChatStatus = data.status == 1;//0:开  1:禁
            }
        }else if(data.cmd == "controlpanel:sharewhiteboard"){   //共享白板通知(此命令为老师通知所有学生开启共享白板)
            if(!ClassroomInfoModule.instance.userManager.isTeacher()){              //只有学生处理这个命令
                if(data.status == 1){               //学生收到后,判断为1开启白板共享，否则关闭
                    var msg = VC.ROUTER.LIVEBIG.LIVE_WHITEBOARD_ON_TIPS;
                    ClassroomInfoModule.instance.showMessageWindow(msg);
                    ClassroomInfoModule.instance.whiteBoardManager.isOpenTools = true;//开启工具条
                    ClassroomInfoModule.instance.whiteBoardManager.isOpenShareWhiteboard = true;
                    ClassroomInfoModule.instance.updateAllUserStopwhiteboardValueFromMembersByValue(1);
                }else{
                    var msg = VC.ROUTER.LIVEBIG.LIVE_WHITEBOARD_OFF_TIPS;
                    ClassroomInfoModule.instance.showMessageWindow(msg);
                    ClassroomInfoModule.instance.whiteBoardManager.isOpenTools = false;
                    ClassroomInfoModule.instance.whiteBoardManager.isOpenShareWhiteboard = false;
                    ClassroomInfoModule.instance.updateAllUserStopwhiteboardValueFromMembersByValue(0);
                }
            }
        }
    },
    updateClassroomInfoDataOtherJoin : function(data){
        var index = this.findIndexFromMembersById(data.userid);
        if(index != null)
            this.deleteUserFromMembersByIndex(index);                  //删除旧的
        var obj = this.findObjectByIdAndMembers(data.userid,data.members);//从新的members里面获取新的
        this.addUserToMembersByObject(obj);                            //添加新的
        if(this.getControlAllStudentChatStatus() == 1)
            this.updateMembersAllStudentStopchatValue(1);              //更新图标状态
        //走马灯
        if (this.userManager.getIsShowScrollView()) {
            this.stopScrollVideo();
            this.startScrollVideo();
        }
    },
    setShareWhiteBoardStatus : function(status){//设置共享白板
        ClassroomInfoModule.instance.whiteBoardManager.isOpenShareWhiteboard = status;
    },
    setCourseTitle : function(data){
        //TODO::设置课程标题
    },
    showMessageWindow : function(msg){
        //TODO::信息提示
    },
    operationMessageWindow : function(msg){
        //TODO::清除白板数据提示
    },
    openErrorWindow : function(msg){
        //TODO::错误提示
    },
    startScrollVideo : function(){
        //TODO::开始走马灯
    },
    stopScrollVideo : function(){
        //TODO::停止走马灯
    }
};