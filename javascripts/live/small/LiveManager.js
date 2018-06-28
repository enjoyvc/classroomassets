var LiveManagerModule = LiveManagerModule || {};

function LiveManager(classRoomController) {
    this.classRoomController = classRoomController;
    LiveManagerModule.instance = this;

    this.PUBLISH_VIDEO_RESOLUTION_LD = null;//发布视频分辨率 -- 普清
    this.PUBLISH_VIDEO_RESOLUTION_SD = null;//发布视频分辨率 -- 标清
    this.PUBLISH_VIDEO_RESOLUTION_HD = null;//发布视频分辨率 -- 高清
    this.VIDEO_BANDWIDTH = 640;             //视频带宽

}
var videoindex = 0;// 全局变量，用于区分摄像头，默认使用第一个
var j = 0;
var k = 0;
var videoSource = new Array();      //记录摄像头
var audioSource = new Array();      //记录麦克风

var mediaObj = {
    "video_P":{"MEDIA_STATUS":null,"SET_STATUS":null,"OK_STATUS":null,"source_id":null},    //记录视频发布各流程状态
    "audio_P":{"MEDIA_STATUS":null,"SET_STATUS":null,"OK_STATUS":null,"source_id":null},    //记录音频发布各流程状态
    "share_P":{"MEDIA_STATUS":null,"SET_STATUS":null,"OK_STATUS":null,"source_id":null},    //记录共享屏幕发布各流程状态
    "video_S":{"MEDIA_STATUS":null,"SET_STATUS":null,"OK_STATUS":null,"source_id":null},    //记录视频订阅各流程状态
    "audio_S":{"MEDIA_STATUS":null,"SET_STATUS":null,"OK_STATUS":null,"source_id":null},    //记录音频订阅各流程状态
    "share_S":{"MEDIA_STATUS":null,"SET_STATUS":null,"OK_STATUS":null,"source_id":null}    //记录共享屏幕订阅各流程状态
};
var P_S_mediaObj = {        //记录发布和订阅的资源ID
    video:{
        publish:{userid:null,pid1:null,hid1:null,pid2:null,hid2:null},      //发布
        subscribe:[]    //订阅
    },
    audio:{
        publish:{userid:null,pid:null,hid:null},
        subscribe:[],
        subscribeLock:false,
        publishLock:false
    },
    share:{
        publish:{userid:null,pid1:null,hid1:null},      //发布
        subscribe:[]    //订阅
    }
};
var isTimeout = false;
var recreateMeetingCount = 0;
var role;   //用户角色
var userid; //用户ID
var realName;//用户名称
var classroomName = "";//课室名称
var roomId;   //房间ID
var sipRoomNumber;   //发布 or 订阅 需要用的会议室ID
var shouldReReg = true;  //重连
var teaSipCallNum = 0;      //记录老师发布视频的的个数
var isJoinMeetingSuccess = false;       //是否加入会议成功
var timer = null;                      //检测会议是否创建成功定时器
var CHECK_TIME = 1000*10;              //检测会议是否创建定时器时间间隔,从数据库获取
//=====视频注册url及端口======start
var url/* = '192.168.106.31'*/;
var port/* = '5062'*/;
var mydomain/* = 'enjoyvc.com'*/;
var txtArea/* = '3001'*/;
var ipsever;
//=====视频注册url及端口======end
//=====创建会议室所用参数======start
var createMeetingParam/* = 'MC999'*/;
var meetingType/* = '4'*/;
//=====创建会议室所用参数======end
//=====音频发布参数=====start
var pubAudio = '2';
//=====音频发布参数=====end
//=====发布和屏幕共享分辨率=====start
var SHARE_SCREEN_RESOLUTION = '{minWidth:1280, minHeight:720, maxWidth:1920, maxHeight:1080}';//默认值
var AUDIO_BANDWIDTH = 64;                   //音频带宽
var SHAREPC_BANDWIDTH = 512;                //共享屏幕带宽
//=====发布和屏幕共享分辨率=====end
//=====视频相关======start
var t_w_1 = 140;           //老师
var t_h_1 = 104;
var t_w_2 = 140;
var t_h_2 = 104;
var s_t_s_w = 114;       //老师订阅学生
var s_t_s_h = 84;
var s_w = 114;           //学生
var s_h = 84;
var s_s_t_w = 282;       //学生订阅老师
var s_s_t_h = 212;
var s_s_s_w = 114;       //学生订阅学生
var s_s_s_h = 84;
var share_w = 140;       //屏幕共享
var share_h = 104;

//=====视频相关======end
LiveManager.prototype = {
    init : function() {     // 初始化

        role = $('#role').val();    //用户角色
        userid = $('#userid').val();    //用户ID
        roomId = $('#classRoomId').val();   //房间ID
        sipRoomNumber = "C" + roomId;   //发布 or 订阅 需要用的会议室ID
        url = $('#liveHost').val();
        port = $('#videoPort').val();
        mydomain = $('#videoDomain').val();
        txtArea = $('#videoArea').val();
        createMeetingParam = $('#createMeetingParam').val();
        meetingType = $('#meetingControlType').val();
        ipsever = eval($('#ipsever').val());
        P_S_mediaObj.video.publish.userid = userid;
        P_S_mediaObj.audio.publish.userid = userid;
        P_S_mediaObj.share.publish.userid = userid;

        LiveManagerModule.instance = this;
        LiveManagerModule.instance._bindEvent();

    },
    getCurrentResolution : function(){
        //TODO::获取当前视频分辨率类型
    },
    useVideoBandwidth : function(){//使用对应视频带宽
        var bandwidth = null;
        if(LiveManagerModule.instance.getCurrentResolution() == 20){
            bandwidth = LiveManagerModule.instance.VIDEO_BANDWIDTH/4;
        }else if(LiveManagerModule.instance.getCurrentResolution() == 40){
            bandwidth = LiveManagerModule.instance.VIDEO_BANDWIDTH/2;
        }else{
            bandwidth = LiveManagerModule.instance.VIDEO_BANDWIDTH;
        }
        return bandwidth;
    },
    useResolution : function(){//使用当前分辨率
        var resolution = null;
        if(LiveManagerModule.instance.getCurrentResolution() == 20){
            resolution = LiveManagerModule.instance.PUBLISH_VIDEO_RESOLUTION_LD;
        }else if(LiveManagerModule.instance.getCurrentResolution() == 40){
            resolution = LiveManagerModule.instance.PUBLISH_VIDEO_RESOLUTION_SD;
        }else{
            resolution = LiveManagerModule.instance.PUBLISH_VIDEO_RESOLUTION_HD;
        }
        return resolution;
    },
    //--值--start
    memberSources:[],           //会议成员列表
    //--值--end
    _isOneself:function(id){        //验证是否为自己
        if(userid == id){
            return true;
        }
        return false;
    },
    _join_isInputPassword:function(needpass){       //验证会议是否加密,"1"为已加密
        if(needpass == '1'){
            return true;
        }
        return false;
    },
    _isBanVideo:function(status){       //是否禁用视频
        if(status == 0){
            return false;
        }
        return true;
    },
    _isBanAudio:function(status){         //是否禁用音频
        if(status == 0){
            return false;
        }
        return true;
    },
    _video_publish_successCMDtoSub : function(data){		//收到用户发布视频成功后，去订阅该视频
        var _w,_h,_this,idValue,videoName,videoSubRole;
        if(data.isTeacher){
            videoSubRole = 1;
            if(data.source_name == "video"){
                _w = s_s_t_w;
                _h = s_s_t_h;
                _this = $('#divVideoLocal_a')[0];
                idValue = 'divVideoLocal_a';
                videoName = "video";
            }else if(data.source_name == "video2"){
                _w = s_s_t_w;
                _h = s_s_t_h;
                _this = $('#divVideoLocal_b')[0];
                idValue = 'divVideoLocal_b';
                videoName = "video2";
            }
        }else{
            videoSubRole = 2;
            _this = $('#'+data.userid)[0];
            idValue = data.userid;
            videoName = "video";
            _w = s_s_s_w;
            _h = s_s_s_h;
        }
        if(_this != null && idValue != null && _w != null && _h != null &&
            videoName != null && videoSubRole != null && data.source_id != null && data.source_id !== ""){
         //   LiveManagerModule.instance._cleanSubscribeExcess(idValue);
            LiveManagerModule.instance._subscribe(_this, idValue, _w, _h,videoSubRole, videoName, data.userid, data.source_id);     //订阅视频
        }
    },
    _cleanSubscribeExcess : function(id){           //清除多余的视频
        $('#'+id).html('');
    },
    _video_hangup_allowCMDtoHangup : function(data){
        if(LiveManagerModule.instance._isOneself(data.userid)){
            var hangupID = null;
            if(data.source_name == 'video'){
                hangupID = P_S_mediaObj.video.publish.hid1;
            }else if(data.source_name == 'video2'){
                hangupID = P_S_mediaObj.video.publish.hid2;
            }
            if(hangupID != null && typeof(hangupID) !== 'undefined'){
                cfManager.publishSipHangUp(sipRoomNumber, hangupID);
            }
        }
    },
    _audio_hangup_allowCMDtoHangup : function(data){
        if(LiveManagerModule.instance._isOneself(data.userid)){
            var hangupID = P_S_mediaObj.audio.publish.hid;
            if (hangupID != null && typeof(hangupID) !== 'undefined') {
                cfManager.publishSipHangUp(sipRoomNumber, hangupID);
            }
        }
    },
    _stopvideoCMDtoUpdateSubscribe : function(data){
        if(!LiveManagerModule.instance._isOneself(data.userid)){
            if(data.status != 2){       //0 :未发布 1:禁止  2:发布
                var idx = null;
                for(var i=0;i<P_S_mediaObj.video.subscribe.length;i++){     //找到该用户的资源在资源列表中对应的索引
                    if(data.userid == P_S_mediaObj.video.subscribe[i].userid &&
                        data.videoName == P_S_mediaObj.video.subscribe[i].videoName){
                        idx = i;
                        break;
                    }
                }
                if(idx != null){                            //清除资源
                    P_S_mediaObj.video.subscribe.splice(idx,1);
                }
            }
        }
    },
    _findMemberByUserid : function(userid,memberList){             //返回对应的用户
        var obj = null;
        $.each(memberList,function(index,member){
            if(userid == member.userid){
                obj = member;
            }
        });
        return obj
    },
    _stopvideoCMDtoCleanMainFrame : function(data){
        if(data.status != 2){           //如果不是发布
            var currentVideo = LiveManagerModule.instance.getCurrentVideo();
            if(!LiveManagerModule.instance.getSharePCVideoStatus()){
                if(currentVideo == data.userid){
                    $('#teacher_a').attr('src','');     //清除主画面
                    LiveManagerModule.instance.leaveChange('t_1');
                }else {
                    var obj = LiveManagerModule.instance._findMemberByUserid(data.userid,LiveManagerModule.instance.memberSources);
                    if(obj != null) {
                        if (obj.roleid == 1) {
                            if (data.videoName == "video") {
                                if (currentVideo == 't_1') {
                                    $('#teacher_a').attr('src', '');     //清除主画面
                                    var bsrc = $('#divVideoLocal_b video').attr('src');
                                    if (typeof bsrc !== 'undefined' && bsrc != null) {
                                        LiveManagerModule.instance.changeVideoShow('t_2');
                                    } else {
                                        LiveManagerModule.instance.setCurrentVideo(null);
                                    }
                                }
                            } else if (data.videoName == "video2") {
                                if (currentVideo == 't_2') {
                                    $('#teacher_a').attr('src', '');     //清除主画面
                                    var asrc = $('#divVideoLocal_a video').attr('src');
                                    if (typeof asrc !== 'undefined' && asrc != null) {
                                        LiveManagerModule.instance.changeVideoShow('t_1');
                                    } else {
                                        LiveManagerModule.instance.setCurrentVideo(null);
                                    }
                                }
                            }
                        }
                    }
                }
            }else{
                if(role == 1){
                    if(currentVideo == data.userid){
                        LiveManagerModule.instance.leaveChange('t_1');
                    }
                }
            }
        }
    },
    _video_banCMDtoBan : function(data){
        if(LiveManagerModule.instance._isOneself(data.userid)){
            LiveManagerModule.instance.setVideoIsBan(true);
            LiveManagerModule.instance.closePublishVideo();
        }
    },
    getIsOwnCloseVideo : function(){
        //TODO::获取是否自己关闭视频状态
    },
    getIsOwnCloseAudio : function(){
        //TODO::获取是否自己关闭音频状态
    },
    _video_nobanCMDtoNoban:function(data){          //取消禁止视频
        if(LiveManagerModule.instance._isOneself(data.userid)){
            LiveManagerModule.instance.setVideoIsBan(false);
            if(LiveManagerModule.instance.getIsOwnCloseVideo())return;
            LiveManagerModule.instance.openPublishVideo();
        }
    },
    _audio_banCMDtoBan:function(data){      //禁止音频
        if(LiveManagerModule.instance._isOneself(data.userid)){
            LiveManagerModule.instance.setAudioIsBan(true);
            LiveManagerModule.instance.closePublishAudio();
        }
    },
    _audio_nobanCMDtoNoban:function(data){      //取消禁止音频
        if(LiveManagerModule.instance._isOneself(data.userid)){
            LiveManagerModule.instance.setAudioIsBan(false);
            if(LiveManagerModule.instance.getIsOwnCloseAudio())return;
            LiveManagerModule.instance.openPublishAudio();
        }
    },
    _forbidenvideoCMDtoOpenAndClose:function(data){     //全部学生禁止或开启视频
        if(data.status == 1){       //禁止    0:开启  1:禁止
            if(!LiveManagerModule.instance.getVideoIsBan()){        //(收到禁止视频命令,关闭视频)
                LiveManagerModule.instance.setVideoIsBan(true);
                LiveManagerModule.instance.closePublishVideo();
            }
        }else if(data.status == 0){    //开启
            if(LiveManagerModule.instance.getVideoIsBan()){         //(收到取消禁止命令,开启视频)
                LiveManagerModule.instance.setVideoIsBan(false);
                if(LiveManagerModule.instance.getIsOwnCloseVideo())return;
                LiveManagerModule.instance.openPublishVideo();
            }
        }
    },
    _forbidenaudioCMDtoOpenAndClose:function(data){         //全部学生禁止或开启音频
        if(data.status == 1){       //禁止
            if(!LiveManagerModule.instance.getAudioIsBan()){
                LiveManagerModule.instance.setAudioIsBan(true);
                LiveManagerModule.instance.closePublishAudio();
            }
        }else if(data.status == 0){    //开启
            if(LiveManagerModule.instance.getAudioIsBan()){
                LiveManagerModule.instance.setAudioIsBan(false);
                if(LiveManagerModule.instance.getIsOwnCloseAudio())return;
                if(!LiveManagerModule.instance.getAudioStatus())
                    LiveManagerModule.instance.openPublishAudio();
            }
        }
    },
    _changeCMDtoGetVideoTag : function(data){		//获取老师主画面所指向的video标签id
        var ts = null;
        if(data.videoid === "t_1"){
            ts = 'divVideoLocal_a';
        }else if(data.videoid === "t_2"){
            ts = 'divVideoLocal_b';
        }else{
            ts = data.videoid;
        }
        return ts;
    },
    _changeCMDtoHandupup : function(data,ts){		//设置学生举手状态(蓝色外边框)
        if(data.videoid !== "t_1" && data.videoid !== "t_2" && data.videoid != null){
            LiveManagerModule.instance.setStudentHandup(ts,0);
        }
    },
    _changeCMDtoHandupOff : function(data){		//关闭学生的举手状态
        if(role == 2 && LiveManagerModule.instance._isOneself(data.videoid)){
            LiveManagerModule.instance.studentHandupOff();
        }
    },
    _changeCMDtoChangeMainFrame : function(data,ts){                //改变主画面的显示
        var sourceSrc = $('#'+ts+' video').attr('src');
        if(!LiveManagerModule.instance.getSharePCVideoStatus()){    //如果不是共享屏幕状态
            $('#divVideoRemote video').attr('src',sourceSrc);
            if(typeof(sourceSrc) === "undefined"){
                $('#divVideoRemote video').attr('src','');
            }
        }else{
            if(role == 1){
                $('#divVideoRemote video').attr('src',sourceSrc);
                if(typeof(sourceSrc) === "undefined"){
                    $('#divVideoRemote video').attr('src','');
                }
            }
        }
    },
    _user_leaveCMDtoCleanP_S_mediaObjSource : function(data){		//清除自己订阅过的对应的用户的资源ID
        if(!LiveManagerModule.instance._isOneself(data.userid) && !data.isteacher){
            var id_index = LiveManagerModule.instance._findUserByUserid(data.userid,P_S_mediaObj.video.subscribe);
            if(id_index != null)
                P_S_mediaObj.video.subscribe.splice(id_index,1);
        }else if(!LiveManagerModule.instance._isOneself(data.userid) && data.isteacher){
            for(var i=0;i<P_S_mediaObj.video.subscribe.length;i++){     //这里用循环是因为老师可能会有2个视频
                if(data.userid == P_S_mediaObj.video.subscribe[i].userid){
                    P_S_mediaObj.video.subscribe.splice(i,1);
                }
            }
        }
    },
    _user_leaveCMDtoCleanMainFrame : function(data,currentVideo){
        if(!LiveManagerModule.instance.getSharePCVideoStatus()){    //如果不是共享屏幕状态
            if(currentVideo !== "t_1" && currentVideo !== "t_2"){
                if(currentVideo == data.userid){
                    if(role == 1){
                        if(LiveManagerModule.instance._isHaveFirstVideo())
                            LiveManagerModule.instance.leaveChange('t_1');
                        else if(LiveManagerModule.instance._isHavaSecondVideo())
                            LiveManagerModule.instance.leaveChange('t_2');

                    }
                }
            }else{
                if(data.isteacher){
                    $('#teacher_a').attr('src','');
                }
            }
        }else{
            if(role == 1){
                if(currentVideo == data.userid){
                    LiveManagerModule.instance.leaveChange('t_1');
                }
            }
        }
    },
    onReceive : function(data) {    // 接受到服务器端的回调
        var data =  JSON.parse(data);
        if(data!=null){
            if(data.cmd=="classroom:join"){     //用户加入通知
                LiveManagerModule.instance.memberSources = data.members;               //会议成员列表
                if(LiveManagerModule.instance._isOneself(data.userid)){
                    classroomName = data.classroom.name;        //课室名
                    realName = data.username;
                    CHECK_TIME = data.CHECK_CLASSROOM_IS_CREATE_INTERVAL*1000;           //检测会议是否创建的定时器时间
                    var checkInit = function(type, contents) {
                        if(typeof contents !== 'undefined'){		//如果有设备
                            if(typeof contents.video !== 'undefined' && contents.video.length >0){	//是否存在摄像头
                                videoSource = contents.video;
                                LiveManagerModule.instance.setVideoSource(videoSource.length);
                            }
                            if(typeof contents.audio !== 'undefined' && contents.audio.length >0){	//是否存在麦克风
                                audioSource = contents.audio;
                                LiveManagerModule.instance.setAudioSource(audioSource.length);
                            }
                        }
                    };
                    if(shouldReReg) {
                        var oParam = {
                            cb_MsgInfo: LiveManagerModule.instance._sipCBMsgInfo,  // 消息回调函数，自实现
                            cb_CheckMedia: checkInit,
                            disableDebug: false, // 是否启用Debug
                            disableVideo: false,  // 是否禁用Video
                            ipsever: ipsever
                        };
                        cfManager.appInit(oParam);
                    }
                    if(role == 1){
                        LiveManagerModule.instance.PUBLISH_VIDEO_RESOLUTION_HD = data.ET_VIDEO_SIZE_PUBLISH;          //发布视频分辨率高清
                        LiveManagerModule.instance.PUBLISH_VIDEO_RESOLUTION_SD = data.ET_VIDEO_SIZE_PUBLISH_SD;       //发布视频分辨率标清
                        LiveManagerModule.instance.PUBLISH_VIDEO_RESOLUTION_LD = data.ET_VIDEO_SIZE_PUBLISH_LD;       //发布视频分辨率普清
                        SHARE_SCREEN_RESOLUTION = data.ET_VIDEO_SIZE_SHAREPC;           //共享屏幕分辨率
                        AUDIO_BANDWIDTH = data.ET_BANDWIDTH_AUDIO;                      //音频带宽
                        LiveManagerModule.instance.VIDEO_BANDWIDTH = data.ET_BANDWIDTH_VIDEO;                      //视频带宽
                        SHAREPC_BANDWIDTH = data.ET_BANDWIDTH_VIDEO_SHAREPC;            //共享屏幕带宽
                        LiveManagerModule.instance.setDelayShowStatus(data.allow_delay);
                    }else{
                        LiveManagerModule.instance.PUBLISH_VIDEO_RESOLUTION_HD = data.ET_VIDEO_SIZE_PUBLISH;          //发布视频分辨率高清
                        LiveManagerModule.instance.PUBLISH_VIDEO_RESOLUTION_SD = data.ET_VIDEO_SIZE_PUBLISH_SD;       //发布视频分辨率标清
                        LiveManagerModule.instance.PUBLISH_VIDEO_RESOLUTION_LD = data.ET_VIDEO_SIZE_PUBLISH_LD;       //发布视频分辨率普清
                        SHARE_SCREEN_RESOLUTION = data.ET_VIDEO_SIZE_SHAREPC_S;           //共享屏幕分辨率
                        AUDIO_BANDWIDTH = data.ET_BANDWIDTH_AUDIO_S;                      //音频带宽
                        LiveManagerModule.instance.VIDEO_BANDWIDTH = data.ET_BANDWIDTH_VIDEO_S;                      //视频带宽
                        SHAREPC_BANDWIDTH = data.ET_BANDWIDTH_VIDEO_SHAREPC_S;            //共享屏幕带宽
                        if(LiveManagerModule.instance._teacherIsOpenAudio()){
                            LiveManagerModule.instance.setTeacherIsOpenAudioStatus(true);
                        }else{
                            LiveManagerModule.instance.setTeacherIsOpenAudioStatus(false);
                        }
                        var isBanVideo = LiveManagerModule.instance._isBanVideo(LiveManagerModule.instance.getTeacherControlAllVideoStatus());
                        LiveManagerModule.instance.setVideoIsBan(isBanVideo);
                        var isBanAudio = LiveManagerModule.instance._isBanAudio(LiveManagerModule.instance.getTeacherControlAllAudioStatus());
                        LiveManagerModule.instance.setAudioIsBan(isBanAudio);
                    }
                }
            }
            else if((data.error && data.error == "duplicated_member") || (typeof data.error === 'undefined' && data === "duplicated_member")){                           //重复登陆
            //    var msg = VC.ROUTER.LIVEBIG.HAVE_JOIN;
            //    var msg = "您已经和服务器断开连接或者您的账号已经在异处登录,请重新进入";
                var msg = VC.ROUTER.LIVEBIG.LIVE_RELOGIN_AND_DISCONNECTION;
                LiveManagerModule.instance.openErrorWindow(msg);
            }
            else if(data.cmd == "video:check_meeting_creating_status"){       //服务器通知客户端,重新发送注册命令
                var command = {
                    cmd: 'video:register_success',
                    roomid: roomId,
                    userid: userid,
                    userName:realName,
                    classroomName:classroomName
                };
                LiveManagerModule.instance.classRoomController.sendMessage(command);
            }
            else if(data.cmd == "video:create_meeting"){    //是否可以创建会议室通知
                console.debug("---------------------------------------------------:是否可以创建会议室通知",data.userid);
                cfManager.sipMeetingCreate(createMeetingParam, sipRoomNumber,  {area: txtArea, type: meetingType});     //创建会议
            }
            else if(data.cmd == "video:create_meeting_success"){    //会议室已成功创建通知
                console.log("---------------------------------------------------:会议室已成功创建通知");
                if(timer != null) {
                    clearInterval(timer);
                    timer = null;
                }
                cfManager.sipMeetingJoin(sipRoomNumber, sipRoomNumber);     //加入会议室
            }
            else if(data.cmd == "video:video_publish_success"){     //用户视频发布成功通知,收到此通知的用户去订阅
                if(!LiveManagerModule.instance._isOneself(data.userid))
                    LiveManagerModule.instance._video_publish_successCMDtoSub(data);        //订阅视频
            }
            else if(data.cmd == "video:audio_publish_success"){     //用户音频发布成功通知
                if(!LiveManagerModule.instance._isOneself(data.userid)){
                    /*if(P_S_mediaObj.audio.subscribe.length > 0) {
                        var hangupID = P_S_mediaObj.audio.subscribe[0].hid;
                    }
                    if(hangupID != null && hangupID !== "" && typeof(hangupID) != 'undefined'){
                        cfManager.subscribeSipHangUp(sipRoomNumber, hangupID);     //先挂机订阅过的音频
                    }*/
                    if(!LiveManagerModule.instance.getIsSubAudioStatus()) {
                //      pubAudio = '2';
                        if(!P_S_mediaObj.audio.subscribeLock)
                            LiveManagerModule.instance._audioSubscribe(data.userid, data.source_id);         //订阅音频
                    }
                    if(role == 2 && data.isTeacher){
                        LiveManagerModule.instance.setTeacherIsOpenAudioStatus(true);
                    }
                }
            }
            else if(data.cmd == "video:video_hangup_allow"){    //接受服务器挂机视频通知
                console.log("------------------------------:接受服务器挂机视频通知");
                LiveManagerModule.instance._video_hangup_allowCMDtoHangup(data);
            }
            else if(data.cmd == "video:audio_hangup_allow"){        //接受服务器挂机音频通知,只有对应的用户会收到此命令
                console.log("--------------------------------:接受服务器挂机音频通知");
                LiveManagerModule.instance._audio_hangup_allowCMDtoHangup(data);
            }
            else if(data.cmd == "userctrl:stopvideo"){     //更改列表视频状态
                LiveManagerModule.instance.setListStopvideo(data.userid,data.status);   //更新members中的用户的视频状态
                LiveManagerModule.instance._stopvideoCMDtoUpdateSubscribe(data);        //将该用户从订阅资源列表中删除
                LiveManagerModule.instance._stopvideoCMDtoCleanMainFrame(data);         //清除主画面
            }
            else if(data.cmd == "userctrl:stopspeak"){         //更改列表音频状态
                LiveManagerModule.instance.setListStopspeak(data.userid,data.status);
            }
            else if(data.cmd == "video:video_ban"){            //收到禁止命令
                LiveManagerModule.instance._video_banCMDtoBan(data);        //禁止视频
            }
            else if(data.cmd == "video:video_noban"){      //收到取消禁止命令
                LiveManagerModule.instance._video_nobanCMDtoNoban(data);        //取消禁止视频
            }
            else if(data.cmd == "video:audio_ban"){//收到禁止命令
                LiveManagerModule.instance._audio_banCMDtoBan(data);        //禁止音频
            }
            else if(data.cmd == "video:audio_noban"){  //收到取消禁止命令
                LiveManagerModule.instance._audio_nobanCMDtoNoban(data);    //取消禁止音频
            }
            else if(data.cmd == "controlpanel:forbidenvideo"){  //收到老师控制视频命令
                if(role == 2){
                    LiveManagerModule.instance._forbidenvideoCMDtoOpenAndClose(data);       //全部学生禁止或开启视频
                }
            }
            else if(data.cmd == "controlpanel:forbidenaudio"){ //收到老师控制音频命令
                if(role == 1){
                    return;
                }
                LiveManagerModule.instance._forbidenaudioCMDtoOpenAndClose(data);           //全部学生禁止或开启音频
            }
            else if(data.cmd == "video:change"){       //老师切换视频通知
                var ts = LiveManagerModule.instance._changeCMDtoGetVideoTag(data);
                LiveManagerModule.instance._changeCMDtoHandupup(data,ts);                 //设置学生举手状态(蓝色外边框)
//                LiveManagerModule.instance._changeCMDtoHandupOff(data);                   //关闭学生的举手状态
                LiveManagerModule.instance.setCurrentVideo(data.videoid);
                if(LiveManagerModule.instance.getClassroomType() !== 1){
                    LiveManagerModule.instance._changeCMDtoChangeMainFrame(data,ts);
                }
            }
            else if(data.cmd == "video:classroom_end"){        //结束课堂
                var msg = VC.ROUTER.LIVEBIG.CLASS_HAVE_CLOSE;
                LiveManagerModule.instance.showMessageWindow(msg);
                setTimeout(function(){
                    if(role == 1){
                        window.location.href = $('#vcliveHost').val() + '/app/camp/' + VC.ROUTER.LIVEBIG.PUBLIC_KEY + '/schedule.html';
                    }else if(role == 2){
                        window.location.href = $('#vcliveHost').val() + '/app/camp/' + VC.ROUTER.LIVEBIG.PUBLIC_KEY + '/schedule.html';
                    }
                },3000);
            }
            else if(data.cmd == "userctrl:handspeak"){     //学生举手
                LiveManagerModule.instance.setStudentHandup(data.userid,data.status);
            }
            else if(data.cmd == "controlpanel:online"){        //老师更改在线状态--未用
                LiveManagerModule.instance.setTeacherOnlineStatus(data.status);
            }
            else if(data.cmd == "userctrl:online"){        //学生更改在线状态--未用
                LiveManagerModule.instance.setStudentOnlineStatus(data.status,data.userid);
            }
            else if(data.cmd == "controlpanel:login"){     //未用
                if(data.result){
                    $.modal.close();
                }else{
                    return;
                }
            }
            else if(data.cmd == "classroom:kickuser"){          //试听提示
                if(LiveManagerModule.instance._isOneself(data.userid) && data.roomid == roomId){
                    var msg = VC.ROUTER.LIVEBIG.CLASS_AUDITION_END;
                    LiveManagerModule.instance.showMessageWindow(msg);
                    setTimeout(function(){
                        window.location.href = window.location.protocol + "//" + window.location.hostname + '/myvc';
                    },3000);
                }
            }
            else if(data.cmd == "controlpanel:nomoretime"){    //课堂时间提示闪烁
                if(data.roomid == roomId){
                    LiveManagerModule.instance.setDelayRemindCss(true);
                }
            }
            else if(data.cmd == "controlpanel:applydelay"){    //申请延时
                if(LiveManagerModule.instance._isOneself(data.userid) && role == 1){
                    LiveManagerModule.instance.setDelayApplyWindow(data);
                }
            }
            else if(data.cmd == "controlpanel:setdelay"){      //申请成功
                if(data.roomid == roomId){
                    LiveManagerModule.instance.setDelayRemindCss(false);
            //        $('#delayApply').hide();    //隐藏申请按钮
                    LiveManagerModule.instance.setDelayShowStatus(false);
                }
            }
            else if(data.cmd == "video:sharescreen"){      //老师开启共享屏幕成功
                if(!LiveManagerModule.instance._isOneself(data.userid) && data.isTeacher){
                    var _this = $('#stuShareVideo')[0];
                    var idValue = $('#stuShareVideo').attr('id');
                    var _w = share_w;
                    var _h = share_h;
                    var videoName = "share";
                    var videoSubRole = 1;
                    LiveManagerModule.instance._subSharePCVideo(_this,idValue,_w,_h,videoSubRole,videoName, data.userid, data.source_id);
                }
            }
            else if(data.cmd == "video:showscreen_hangup"){        //挂机订阅的共享屏幕
                if(!LiveManagerModule.instance._isOneself(data.userid)){
                    LiveManagerModule.instance.setSharePCVideoStatus(false);
                    P_S_mediaObj.share.subscribe.splice(0,1);
                    if(LiveManagerModule.instance.getTeaWhiteboardStatus()){
                        LiveManagerModule.instance.whiteboardOn();
                    }else{
                        var cid = LiveManagerModule.instance.getCurrentVideo();
                        var ts;
                        if(cid == 't_1') {
                            ts = 'divVideoLocal_a';
                        }
                        else if(cid == 't_2') {
                            ts = "divVideoLocal_b";
                        }
                        else {
                            ts = cid;
                        }
                        var cvideo = $('#'+ts+" video").attr('src');
                        $('#teacher_a').attr('src',cvideo);
                        if(typeof(cvideo) === "undefined"){
                            $('#teacher_a').attr('src','');
                        }
                    }
                }
            }
            else if(data.cmd == "controlpanel:showSchedule"){           //显示课件转换
                var showSchedule = new Object();
                showSchedule.status = true;
                showSchedule.documentindex = data.documentindex;
                showSchedule.total = data.total;
                showSchedule.errorcount = data.errorcount;
                LiveManagerModule.instance.setCoursewareShow(showSchedule);
            }else if(data.cmd == "chat:quit"){
                LiveManagerModule.instance._user_leaveCMDtoCleanP_S_mediaObjSource(data);
                var currentVideo = LiveManagerModule.instance.getCurrentVideo();
                LiveManagerModule.instance._user_leaveCMDtoCleanMainFrame(data,currentVideo);
                if(role == 2 && data.isteacher){
                    LiveManagerModule.instance.setTeacherIsOpenAudioStatus(false);
                }
                if(!LiveManagerModule.instance._isOneself(data.userid)) {
                    LiveManagerModule.instance.updateMembers(data.userid);
                }
            }else if(data.cmd == "classroom:timeout"){
                if(!LiveManagerModule.instance._isOneself(data.userid)){
                    LiveManagerModule.instance.updateMembers(data.userid);
                }else{
                    var msg = VC.ROUTER.LIVEBIG.LIVE_JOIN_TIMEOUT_TIPS;
                    LiveManagerModule.instance.showMessageWindow(msg);
                    isTimeout = true;
                    cfManager.sipUnRegister();
                }
            }
            LiveManagerModule.instance.applyData();
        }
    },
    setDelayShowStatus:function(value){
        //TODO::设置申请延时按钮的显示状态
    },
    getHasmeeting:function(){
        //TODO::获取会议是否创建状态
    },
    setCoursewareShow:function(obj){
        //TODO::显示课件转换进度
    },
    leaveChange:function(value){
        //TODO::主视频学生离开后改变主视频显示
    },
    setDelayApplyWindow: function (obj) {
        //TODO::设置申请延时的窗口数据
    },
    setDelayRemindCss:function(status){
        //TODO::设置时间提示闪烁
    },
    openSharePCVideo:function(){        //开启共享屏幕
        var _this = $("#shareVideo")[0];
        var idValue = $('#shareVideo').attr('id');
        var _w = share_w;
        var _h = share_h;
        LiveManagerModule.instance._sharePCVideo(_this,idValue,_w,_h);
    },
    closeSharePCVideo:function(){       //关闭共享屏幕
        var hangupID;
        if(role == 1){
            hangupID = P_S_mediaObj.share.publish.hid1;
            if(hangupID != null && hangupID !== "" && typeof(hangupID) !== 'undefined') {
                cfManager.publishSipHangUp(sipRoomNumber, hangupID);
            }else{
                LiveManagerModule.instance.setSharePCVideoStatus(false);
            }
        }
    },
    openErrorWindow:function(msg){
        //TODO::打开错误窗口
    },
    setSharePCVideoStatus: function (status) {
        //TODO::设置共享屏幕状态
    },
    getSharePCVideoStatus: function(){
        //TODO::获取共享屏幕状态
    },
    getTeaWhiteboardStatus:function(){
        //TODO::获取老师白板是否开启状态
    },
    whiteboardOn:function(){
        //TODO::开启白板
    },
    whiteboardOff:function(){
        //TODO::关闭白板
    },
    _findUserByUserid:function(userid,userList){
        var index = null;
        for(var i=0;i<userList.length;i++){
            if(userid == userList[i].userid){
                index = i;
                break;
            }
        }
        return index;
    },
    teacherChangeOnlineStatus:function(status){     //老师改变在线状态命令
        var command = {
            cmd:"controlpanel:online",
            roomid:roomId,
            status:status,
            userid:userid,
            userName:realName,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    studentChangeOnlineStatus:function(status){
        var command = {
            cmd:"userctrl:online",
            roomid:roomId,
            userid:userid,
            status:status,
            userName:realName,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    updateMembers:function(userid){
        //TODO::更新members--删除
    },
    studentHandupOff:function(){
        //TODO::关闭学生举手
    },
    getClassroomType:function(){
        //TODO::获取课程类型
    },
    setTeacherOnlineStatus:function(status){
        //TODO::设置老师在线状态
    },
    setStudentOnlineStatus:function(status,userid){
        //TODO::设置学生在线状态
    },
    setStudentHandup:function(){
        //TODO::设置学生举手状态
    },
    getTeacherControlAllVideoStatus:function(){
        //TODO::返回老师控制所有学生视频状态
    },
    getTeacherControlAllAudioStatus:function(){
        //TODO::返回老师控制所有学生音频状态
    },
    setListStopvideo:function(userid,status){
        //TODO::设置人员列表视频图标状态
    },
    setListStopspeak:function(userid,status){
        //TODO::设置人员列表音频图标状态
    },
    setVideoIsBan:function(status){
        //TODO::设置学生的视频禁止状态
    },
    getVideoIsBan:function(){
        //TODO::返回学生的视频禁止状态
    },
    setAudioIsBan:function(status){
        //TODO::设置学生的音频禁止状态
    },
    getAudioIsBan:function(){
        //TODO::返回学生的音频禁止状态
    },
    videoBanOn:function(){
        //TODO::设置视频禁止状态开启
    },
    videoBanOff:function(){
        //TODO::设置视频禁止状态关闭
    },
    audioBanOn:function(){
        //TODO::设置音频禁止状态开启
    },
    audioBanOff:function(){
        //TODO::设置音频禁止状态关闭
    },
    setCurrentVideo:function(num){     //设置老师当前视频是第几个
        //TODO::设置老师当前视频是第几个
    },
    getCurrentVideo:function(){
        //TODO::返回老师当前的主画面视频为哪个用户
    },
    setTeacherVideoOpenStatus:function(value,num){
        //TODO::记录老师摄像头开启状态
    },
    setVideoCloseStatus:function(num){
        //TODO::记录老师摄像头关闭状态
    },
    setStudentVideoOpenStatus:function(status){
        //TODO::记录学生摄像头开启状态
    },
    getStudentVideoOpenStatus:function(){
        //TODO::返回学生视频开启状态
    },
    setAudioStatus:function(status){
        //TODO::设置音频发布状态
    },
    getAudioStatus:function(){
        //TODO::获取音频发布状态
    },
    setVideoSource:function(number){
        //TODO::返回视频设备的数量
    },
    setAudioSource:function(number){
        //TODO::返回音频设备
    },
    setIsSubAudioStatus:function(status){
        //TODO::设置是否订阅过音频的状态
    },
    getIsSubAudioStatus:function(){
        //TODO::返回是否订阅过音频的状态
    },
    setTeacherIsOpenAudioStatus:function(status){
        //TODO::设置老师是否开启音频状态
    },
    getTeacherIsOpenAudioStatus:function(){
        //TODO::返回老师是否开启音频状态
    },
    showMessageWindow:function(msg){
        //TODO::弹出提示框
    },
    quitClassRoomJump:function(){
        //TODO::退出课室跳转
    },
    applyData : function(){
        //TODO::$scope.$apply
    },
    studentHandUp:function(){      //学生举手
        var command = {
            cmd:"userctrl:handspeak",
            roomid:roomId,
            userid:userid,
            status:1,
            userName:realName,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    closePublishAudio:function(){           //挂机音频
        var command = {             //请求挂机
            cmd:"video:audio_hangup",
            roomid:roomId,
            userid:userid,
            isTeacher:parseInt(role)==1?true:false,
            source_name:"audio",
            userName:realName,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    openPublishAudio:function(){            //发布音频
        var _this = $('#divAudio')[0];
        LiveManagerModule.instance._releaseOldPublishAudioResource(null,'audio');
        if(!P_S_mediaObj.audio.publishLock)
            LiveManagerModule.instance._audioPublish(_this);
    },
    closePublishVideo:function(){                   //学生挂机视频
        var command = {
            cmd:"video:video_hangup",
            roomid:roomId,
            userid:userid,
            isTeacher:false,
            source_name:"video",
            userName:realName,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    openPublishVideo:function(){        //发布自己的视频
        var _this = $('#'+userid)[0];
        var idValue = userid;
        var _w = s_w;
        var _h = s_h;
        LiveManagerModule.instance._releaseOldPublishVideoResources(role,'video');
        LiveManagerModule.instance._publish(_this, idValue, _w, _h);    // 学生发布视频
    },
    banPublishVideo:function(obj){  //通知学生禁止视频:此方法老师调用
        var command = {
            cmd:"video:video_ban",
            roomid:roomId,
            userid:obj.userid,
            isTeacher:false,
            source_name:"video",
            userName:obj.username,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    noBanPublishVideo:function(obj){        //通知学生取消禁止视频：此方法老师调用
        var command = {
            cmd:"video:video_noban",
            roomid:roomId,
            userid:obj.userid,
            isTeacher:false,
            source_name:"video",
            userName:obj.username,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    banPublishAudio:function(obj){      //通知学生禁止音频：此方法老师调用
        var command = {
            cmd:"video:audio_ban",
            roomid:roomId,
            userid:obj.userid,
            isTeacher:false,
            source_name:"audio",
            userName:obj.username,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    noBanPublishAudio:function(obj){        //通知学生取消禁止音频：此方法老师调用
        var command = {
            cmd:"video:audio_noban",
            roomid:roomId,
            userid:obj.userid,
            isTeacher:false,
            source_name:"audio",
            userName:obj.username,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    controlAllVideo:function(status){       //控制所有学生视频状态的命令
        var command = {
            cmd:"controlpanel:forbidenvideo",
            roomid:roomId,
            status:status,
            userid:userid,
            userName:realName,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    controlAllAudio:function(status){//控制所有学生音频状态的命令
        var command = {
            cmd:"controlpanel:forbidenaudio",
            roomid:roomId,
            status:status,
            userid:userid,
            userName:realName,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    changeVideoShow:function(obj){  //老师
        var command = {
            cmd:"video:change",
            roomid:roomId,
            videoid:obj,
            userid:userid,
            userName:realName,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    _register: function(url,port) { // 向视频API注册--ok
        if(isTimeout)return;
        var userName;           //此用户名用于注册至视频服务器
        if(role == 1){
            userName = 'com'+roomId+'_'+userid;
        }else if(role == 2){
            userName = 'mem'+roomId+'_'+userid;
        }
        var oExpertP = {        //注册参数
            id_Realm : mydomain, // 域，如 mydomain.tld
            id_PrivateIdentity : userName, // 私有ID,如 103
            id_PublicIdentity : ('sip:' + userName + '@' + mydomain), // 公有ID
            id_Password : '110', // 密码,如 101(暂时随便写)
            id_DisplayName : userName,
            //David edit
            //et_websocket_server_url : ('wss://' + '192.168.106.233/media' + ':' + '433'),
            //et_sip_outboundproxy_url : ('wss://' + '192.168.106.233/media' + ':' + '433'),
            
            et_websocket_server_url : ('wss://' + url + ':' + port),
            et_sip_outboundproxy_url : ('wss://' + url + ':' + port),
            //et_websocket_server_url : ('ws://' + url + ':' + port),
            //et_sip_outboundproxy_url : ('ws://' + url + ':' + port),

            
            et_ice_servers : ipsever,
            et_enable_rtcweb_breaker : true, // true or false
            et_disable_early_ims : true, // true or false
            et_enable_media_caching : false, // true or false
            et_bandwidth : null, // { audio:64, video:512 } or null
            et_video_size : '{ minWidth:640, minHeight:480, maxWidth:1920, maxHeight:1080 }',
            et_Area_Isp: txtArea
        };
        cfManager.sipRegister(oExpertP);
    },
    _sharePCVideo:function(_this, idValue, _w, _h){     //发布共享屏幕
        var tagVideo = cfManager.sipCreateVideoTag(idValue, "video", 'local',
            PublicStatic.StaticClass.tsk_string_random(3), _w, _h);
        var hangupID = cfManager.sipPublishCall('call-screenshare', sipRoomNumber, [{
            call_PhoneNumber: sipRoomNumber,
            audio_remote: null,
            video_local: tagVideo,
            video_remote: null,
            label_info: _this,
            et_bandwidth : '{ audio:'+AUDIO_BANDWIDTH+', video:'+SHAREPC_BANDWIDTH+' }',       //带宽 将数据存储在数据库
            et_video_size: SHARE_SCREEN_RESOLUTION //,minAspectRatio:1.77}', //cfManager.getImageResolution(),
        }]);
        if(role == 1){
            P_S_mediaObj.share.publish.hid1 = hangupID;
        }
    },
    _subSharePCVideo:function(_this,idValue,_w,_h,videoSubRole,videoName,userid,source_id){        //订阅共享屏幕
        var subObj = new Object();
        subObj.userid = userid;
        subObj.sid = source_id;
        subObj.videoName = videoName;
        subObj.role = videoSubRole;
        var hangupID = cfManager.sipSubscribeCall('call-screenshare',sipRoomNumber, [ {
            call_PhoneNumber : source_id,
            audio_remote : null,
            video_local : null,
            video_remote : cfManager.sipCreateVideoTag(idValue, "video", 'remote',
                PublicStatic.StaticClass.tsk_string_random(3), _w, _h),
            label_info : _this
        }]);
        subObj.hid = hangupID;
        P_S_mediaObj.share.subscribe.push(subObj);
    },
    _publish: function(_this, idValue, _w, _h) {    //发布视频
        console.debug("分辨率："+LiveManagerModule.instance.useResolution()+",带宽："+LiveManagerModule.instance.useVideoBandwidth());
        var tagVideo = cfManager.sipCreateVideoTag(idValue, "video", 'local',
            PublicStatic.StaticClass.tsk_string_random(3), _w, _h);
        var hangupID = cfManager.sipPublishCall('call-video',sipRoomNumber, [ {
            call_PhoneNumber : sipRoomNumber,
            audio_remote : null,
            video_local : tagVideo,
            video_remote : null,
            label_info : _this,
            et_bandwidth : '{ audio:'+AUDIO_BANDWIDTH+', video:'+LiveManagerModule.instance.useVideoBandwidth()+' }',       //带宽 将数据存储在数据库
            et_video_size : LiveManagerModule.instance.useResolution(),
            device_index: videoindex
        } ]);
        console.log("--------------->>>>_publish.hangupID="+hangupID);
        if(role == 1){
            if(teaSipCallNum == 1)
                P_S_mediaObj.video.publish.hid1 = hangupID;
            else if(teaSipCallNum == 2)
                P_S_mediaObj.video.publish.hid2 = hangupID;
        }else if(role == 2){
            P_S_mediaObj.video.publish.hid1 = hangupID;
        }
        console.log("--------------->>>>P_S_mediaObj.video.publish.hid1="+P_S_mediaObj.video.publish.hid1);
    },
    _subscribe: function(_this,idValue,_w,_h,videoSubRole,videoName,userid,source_id) {     //订阅视频
        LiveManagerModule.instance._cleanSubscribeExcess(idValue);
        var subObj = new Object();
        subObj.userid = userid;
        subObj.sid = source_id;
        subObj.videoName = videoName;
        subObj.role = videoSubRole;
        var hangupID = cfManager.sipSubscribeCall('call-video',sipRoomNumber, [ {
            call_PhoneNumber : source_id,
            audio_remote : null,
            video_local : null,
            video_remote : cfManager.sipCreateVideoTag(idValue, "video", 'remote',
                PublicStatic.StaticClass.tsk_string_random(3), _w, _h),
            label_info : _this,
            audio_mode:'0'
        }]);
        subObj.hid = hangupID;
        P_S_mediaObj.video.subscribe.push(subObj);
    },
    _audioPublish:function(_this){      //发布音频
        P_S_mediaObj.audio.publishLock = true;
        var hangupID = cfManager.sipPublishCall('call-audio',sipRoomNumber,[{
            call_PhoneNumber: sipRoomNumber,
            audio_remote: null,
            video_local: null,
            video_remote: null,
            label_info: _this,
            et_bandwidth : '{ audio:'+AUDIO_BANDWIDTH+', video:'+LiveManagerModule.instance.VIDEO_BANDWIDTH+' }'       //带宽 将数据存储在数据库
        }]);
        if(hangupID == null || typeof hangupID === 'undefined')
            P_S_mediaObj.audio.publishLock = false;
        P_S_mediaObj.audio.publish.hid = hangupID;
    },
    _audioSubscribe:function(user,source_id){       //订阅音频
        P_S_mediaObj.audio.subscribeLock = true;
        var subobj = new Object();
        subobj.userid = user;
        subobj.sid = source_id;
        var hangupID = cfManager.sipSubscribeCall('call-audio',sipRoomNumber,[{
            call_PhoneNumber: sipRoomNumber,        //一个会议对应一个音频，source_id取会议id
            audio_remote: document.getElementById('audioRemote'),
            video_local: null,
            video_remote: null,
            audio_mode:pubAudio
        }]);
        subobj.hid = hangupID;
        if(P_S_mediaObj.audio.subscribe.length > 0)
            P_S_mediaObj.audio.subscribe = [];
        if(hangupID == null || typeof hangupID === 'undefined')
            P_S_mediaObj.audio.subscribeLock = false;
        P_S_mediaObj.audio.subscribe.push(subobj);
    },
    _initCallBack: function (iCode, iMsgInfo, oSession) {    //初始化回调---ok
        if(iCode == ret_code.STACK_ING || iCode == ret_code.STACK_OK) {     //初始化回调----ok
            if(iCode == ret_code.STACK_ING) {
                console.log("-------------------------------:初始化成功");
                LiveManagerModule.instance._register(url,port);     //注册
            }
        }
    },
    _registerCallBack: function(iCode, iMsgInfo, oSession){     //注册回调---ok
        if(iCode == ret_code.REG_ING || iCode == ret_code.REG_OK) {
            if(iCode == ret_code.REG_OK){
                console.log("-------------------------------:注册成功");
                if(LiveManagerModule.instance.getHasmeeting()){
                    cfManager.sipMeetingJoin(sipRoomNumber, sipRoomNumber);     //加入会议室
                }else{
                    var command = {
                        cmd: 'video:register_success',
                        roomid: roomId,
                        userid: userid,
                        userName:realName,
                        classroomName:classroomName
                    };
                    LiveManagerModule.instance.classRoomController.sendMessage(command);
                    timer = null;
                    timer = setInterval(function(){
                        var commandReset = {
                            cmd:'video:check_meeting_creating_status',
                            roomid: roomId,
                            userid: userid,
                            userName:realName,
                            classroomName:classroomName
                        };
                        LiveManagerModule.instance.classRoomController.sendMessage(commandReset);
                    },CHECK_TIME);
                }
                shouldReReg = false;
            }
        }else if(iCode == ret_code.REG_FAIL){
            console.log("-----------------------------注册失败");
            LiveManagerModule.instance._register(url,port);
        }
    },
    _createMeetingCallBack: function(iCode, iMsgInfo, oSession){        //创建会议室回调---ok
        if(iCode == ret_code.MEET_CREATE){
            if((typeof(oSession) !== "undefined" && typeof(oSession.param) !== "undefined") && (oSession.param.result == 0 || oSession.param.result == 1)){   //0:为成功 1:为存在
                console.log("-------------------------------:创建会议成功");
                recreateMeetingCount++;
                var command = {
                    cmd : 'video:create_meeting_success',
                    roomid : roomId,
                    userid : userid,
                    userName : realName,
                    classroomName : classroomName
                };
                LiveManagerModule.instance.classRoomController.sendMessage(command);    //发送命令通知服务器会议室已创建
            }else if(typeof(oSession) !== "undefined" && typeof(oSession.param) !== "undefined" && oSession.param.result == 4){       //资源有限
                var command = {
                    cmd : 'video:create_meeting_unsuccess',
                    roomid : roomId,
                    userid : userid,
                    userName : realName,
                    classroomName : classroomName
                };
                LiveManagerModule.instance.classRoomController.sendMessage(command);
                var msg = VC.ROUTER.LIVEBIG.NO_CREATE_SUCCESS;
                LiveManagerModule.instance.showMessageWindow(msg);
            }else if(typeof(oSession) !== "undefined" && typeof(oSession.param) !== "undefined" && oSession.param.result == 7){       //超时
                console.log("-------------------------->>创建会议超时");
                cfManager.sipMeetingCreate(createMeetingParam, sipRoomNumber,  {area: txtArea, type: meetingType});     //创建会议
                console.log("-------------------------->>重新创建会议");
            }
        }
    },
    _joinMeetingCallBackToPublishVideo : function(){    //加入会议室成功后发布视频
        if(videoSource.length!=0){  //判断是否有摄像头
            if(role == 1){      //判断是老师还是学生
                var _this = $('#divVideoLocal_a')[0];
                var idValue = 'divVideoLocal_a';
                var _w = t_w_1;
                var _h = t_h_1;
                teaSipCallNum=1;        //老师发布第一个视频
                LiveManagerModule.instance._publish(_this, idValue, _w, _h);// 老师发布视频
            }else if(role == 2){
                if(!LiveManagerModule.instance.getStudentVideoOpenStatus()){           //是否发布过视频
                    if(!LiveManagerModule.instance.getVideoIsBan()){
                        var _this = $('#' + userid)[0];
                        var idValue = userid;
                        var _w = s_w;
                        var _h = s_h;
                        LiveManagerModule.instance._publish(_this, idValue, _w, _h);// 学生发布视频
                    }
                }
            }
        }
    },
    _joinMeetingCallBackToPublishAudio : function(){
        if(audioSource.length>=2){      //判断是否有麦克风
            if(!LiveManagerModule.instance.getAudioStatus()){       //判断是否发布过音频
                var _this = $('#divAudio')[0];
                if(role == 1){
            //        pubAudio = '2';
                    if(!P_S_mediaObj.audio.publishLock)
                        LiveManagerModule.instance._audioPublish(_this);
                }else if(role == 2){
                    if(!LiveManagerModule.instance.getAudioIsBan()){        //是否为禁音 1:禁音  0：开启
            //            pubAudio = '2';
                        if(!P_S_mediaObj.audio.publishLock)
                            LiveManagerModule.instance._audioPublish(_this);
                    }
                }
            }else{
                var msg = VC.ROUTER.LIVEBIG.HAVE_PUBLISH_AUDIO;
                LiveManagerModule.instance.showMessageWindow(msg);
            }
        }
    },
    _joinMeetingCallBackToSubscribeAudio : function(){
        if(!LiveManagerModule.instance.getIsSubAudioStatus()){
            a:
            for(var i=0;i<LiveManagerModule.instance.memberSources.length;i++){
                if(LiveManagerModule.instance.memberSources[i].userid != userid){       //从列表中排除自己(不能订阅自己的音频)
                    for(var j=0;j<LiveManagerModule.instance.memberSources[i].videoInfos.length;j++){
                        var videoInfos = LiveManagerModule.instance.memberSources[i].videoInfos[j];
                        if(videoInfos.sourceName == "audio" &&
                            videoInfos.sourceId !== ""/* && videoInfos.status == 2*/){
                            LiveManagerModule.instance._audioSubscribe(LiveManagerModule.instance.memberSources[i].userid,videoInfos.sourceId);
                            break a;
                        }
                    }
                }
            }
        }
    },
    _joinMeetingCallBackToSubscribeVideo : function(){
        for(var i=0;i<LiveManagerModule.instance.memberSources.length;i++){
            var members_userid = LiveManagerModule.instance.memberSources[i].userid;
            if(members_userid != userid){                           //排除自己(不能订阅自己的视频)
                var roleid = LiveManagerModule.instance.memberSources[i].roleid;
                for(var j=0;j<LiveManagerModule.instance.memberSources[i].videoInfos.length;j++){
                    var videoInfo = LiveManagerModule.instance.memberSources[i].videoInfos[j];
                    if(videoInfo.sourceName != "audio" && videoInfo.sourceId != ""/* && videoInfo.status == 2*/){
                        var _this;
                        var idValue;
                        var _w;
                        var _h;
                        var videoName = "video";        //用户记录订阅的是哪个摄像头
                        var videoSubRole;
                        if(roleid == 1){                //学生订阅老师
                            videoSubRole = 1;
                            if(videoInfo.sourceName == "video"){
                                _w = s_s_t_w;
                                _h = s_s_t_h;
                                _this = $('#divVideoLocal_a')[0];
                                idValue = 'divVideoLocal_a';
                                videoName = "video";
                            }else if(videoInfo.sourceName == "video2"){
                                _w = s_s_t_w;
                                _h = s_s_t_h;
                                _this = $('#divVideoLocal_b')[0];
                                idValue = 'divVideoLocal_b';
                                videoName = "video2"
                            }
                            if(_this != null && idValue != null && _w != null && _h != null)
                                LiveManagerModule.instance._subscribe(_this, idValue, _w, _h,videoSubRole, videoName, members_userid, videoInfo.sourceId);
                        }else if(roleid == 2){          //订阅其他学生
                            if(role == 1){
                                _w = s_t_s_w;
                                _h = s_t_s_h;
                            }else{
                                _w = s_s_s_w;
                                _h = s_s_s_h;
                            }
                            videoSubRole = 2;
                            _this = $('#'+members_userid)[0];
                            idValue = members_userid;
                            videoName = "video";
                            if(_this != null && idValue != null && _w != null && _h != null)
                                LiveManagerModule.instance._subscribe(_this, idValue, _w, _h,videoSubRole, videoName, members_userid, videoInfo.sourceId);
                        }
                    }
                }
            }
        }
    },
    _joinMeetingCallBackToSubscribeSharePCVideo : function(){
        var isOpenSharePCVideo = LiveManagerModule.instance.getSharePCVideoStatus();
        if(role == 2){
            if(isOpenSharePCVideo){     //判断是否需要订阅共享屏幕
                for(var i=0;i<LiveManagerModule.instance.memberSources.length;i++){
                    var members_userid = LiveManagerModule.instance.memberSources[i].userid;
                    var roleid = LiveManagerModule.instance.memberSources[i].roleid;
                    if(roleid == 1){
                        for(var j=0;j<LiveManagerModule.instance.memberSources[i].videoInfos.length;j++){
                            var videoInfo = LiveManagerModule.instance.memberSources[i].videoInfos[j];
                            if(videoInfo.sourceName === "share" && videoInfo.sourceId !== ""){
                                var _this = $('#stuShareVideo')[0];
                                var idValue = $('#stuShareVideo').attr('id');
                                var _w = share_w;
                                var _h = share_h;
                                var videoName = "share";
                                var videoSubRole = 1;
                                LiveManagerModule.instance._subSharePCVideo(_this,idValue,_w,_h,videoSubRole,videoName, members_userid, videoInfo.sourceId);
                            }
                        }
                    }
                }
            }
        }
    },
    _joinMeetingCallBack: function(iCode, iMsgInfo, oSession){       //加入会议室回调---ok
        if(iCode == ret_code.MEET_FAIL || iCode == ret_code.MEET_OTHER || iCode == ret_code.MEET_LIST || iCode == ret_code.MEET_NOT
            || iCode == ret_code.MEET_COME || iCode == ret_code.MEET_EXIST
            || iCode == ret_code.MEET_JOIN || iCode == ret_code.MEET_INFO){
            if(iCode == ret_code.MEET_JOIN && typeof(oSession) !== "undefined" && typeof(oSession.param) !== "undefined" && oSession.param.result == 0){    //加入会议室成功
                console.log("-------------------------------:加入会议成功");
                isJoinMeetingSuccess = true;
                LiveManagerModule.instance._joinMeetingCallBackToPublishVideo();     //发布视频
                LiveManagerModule.instance._joinMeetingCallBackToPublishAudio();     //发布音频
                LiveManagerModule.instance._joinMeetingCallBackToSubscribeAudio();   //订阅音频
                LiveManagerModule.instance._joinMeetingCallBackToSubscribeVideo();   //订阅视频
                LiveManagerModule.instance._joinMeetingCallBackToSubscribeSharePCVideo();   //订阅共享屏幕
            }else if(typeof(oSession) != "undefined" && typeof(oSession.param) !== "undefined" && oSession.param.result == 5){
                /*var msg = VC.ROUTER.LIVEBIG.JOIN_MEETING_ERROR;
                LiveManagerModule.instance.showMessageWindow(msg);*/
                if(recreateMeetingCount > 5){
                    var msg = VC.ROUTER.LIVEBIG.LIVE_NO_MEETING_TIPS;
                    LiveManagerModule.instance.showMessageWindow(msg);
                    return;
                }
                var command = {
                    cmd : 'video:create_meeting_unsuccess',
                    roomid : roomId,
                    userid : userid,
                    userName : realName,
                    classroomName : classroomName
                };
                LiveManagerModule.instance.classRoomController.sendMessage(command);
                var command2 = {
                    cmd: 'video:register_success',
                    roomid: roomId,
                    userid: userid,
                    userName:realName,
                    classroomName:classroomName
                };
                LiveManagerModule.instance.classRoomController.sendMessage(command2);
            }
        }
    },
    _publishAndSubscribeCallBack: function(iCode, iMsgInfo, oSession){      //发布和订阅回调
        if(iCode == ret_code.CALL_ING || iCode == ret_code.CALL_SEND
            || iCode == ret_code.CALL_SET || iCode == ret_code.CALL_OK
            || iCode == ret_code.CALL_MEDIA || iCode == ret_code.CALL_INCOME) {
            var callbackData = oSession;
            if(iCode == ret_code.CALL_MEDIA && typeof(callbackData) != "undefined"){
                var type = callbackData.o_type;     // 类型    P:发布       S:订阅
                var media_name = callbackData.o_SipSessionCall.mediaType.s_name;    //媒体类型  video:视频    audio:音频
                console.log("************************CALL_MEDIA:::::type="+type+",media_name="+media_name);
                if(type == "P" && media_name == "video"){
                    mediaObj.video_P.MEDIA_STATUS = true;
                }else if(type == "P" && media_name == "audio"){
                    mediaObj.audio_P.MEDIA_STATUS = true;
                }else if(type == "S" && media_name == "video"){
                    mediaObj.video_S.MEDIA_STATUS = true;
                }else if(type == "S" && media_name == "audio"){
                    mediaObj.audio_S.MEDIA_STATUS = true;
                }else if(type == "P" && media_name == "sccreen share"){
                    mediaObj.share_P.MEDIA_STATUS = true;
                }else if(type == "S" && media_name == "sccreen share"){
                    mediaObj.share_S.MEDIA_STATUS = true;
                }
            }
            else if(iCode == ret_code.CALL_SET && typeof(callbackData) != "undefined"){
                var type = callbackData.o_type;     // 类型    P:发布       S:订阅
                var media_name = callbackData.o_SipSessionCall.mediaType.s_name;    //媒体类型  video:视频    audio:音频
                console.log("************************CALL_SET:::::type="+type+",media_name="+media_name);
                if(type == "P" && media_name == "video"){
                    mediaObj.video_P.SET_STATUS = true;
                    mediaObj.video_P.source_id = oSession.source_id;
                }else if(type == "P" && media_name == "audio"){
                    mediaObj.audio_P.SET_STATUS = true;
                    mediaObj.audio_P.source_id = oSession.source_id;
                }else if(type == "S" && media_name == "video"){
                    mediaObj.video_S.SET_STATUS = true;
                    mediaObj.video_S.source_id = oSession.source_id;
                }else if(type == "S" && media_name == "audio"){
                    mediaObj.audio_S.SET_STATUS = true;
                    mediaObj.audio_S.source_id = oSession.source_id;
                }else if(type == "P" && media_name == "sccreen share"){
                    mediaObj.share_P.SET_STATUS = true;
                    mediaObj.share_P.source_id = oSession.source_id;
                }else if(type == "S" && media_name == "sccreen share"){
                    mediaObj.share_S.SET_STATUS = true;
                    mediaObj.share_S.source_id = oSession.source_id;
                }
            }else if(iCode == ret_code.CALL_OK && typeof(callbackData) != "undefined"){
                var type = callbackData.o_type;     // 类型    P:发布       S:订阅
                var media_name = callbackData.o_SipSessionCall.mediaType.s_name;    //媒体类型  video:视频    audio:音频
                console.log("************************CALL_SET:::::type="+type+",media_name="+media_name);
                if(type == "P" && media_name == "video"){
                    mediaObj.video_P.OK_STATUS = true;
                }else if(type == "P" && media_name == "audio"){
                    mediaObj.audio_P.OK_STATUS = true;
                }else if(type == "S" && media_name == "video"){
                    mediaObj.video_S.OK_STATUS = true;
                }else if(type == "S" && media_name == "audio"){
                    mediaObj.audio_S.OK_STATUS = true;
                }else if(type == "P" && media_name == "sccreen share"){
                    mediaObj.share_P.OK_STATUS = true;
                }else if(type == "S" && media_name == "sccreen share"){
                    mediaObj.share_S.OK_STATUS = true;
                }
            }
        }
    },
    _videoAndAudioHangupCallBack:function(iCode, iMsgInfo, oSession){
        var callbackData = oSession;
        if((iCode == ret_code.HANGUP_ING ||iCode == ret_code.HANGUP_OK) && typeof(callbackData) != 'undefined'){        //挂机成功回调
            var type = oSession.o_type;     //发布：P  订阅：S
            var media_name = oSession.o_SipSessionCall.mediaType.s_name;        //视频：video      音频：audio
            if(type == "P" && media_name == "video"){       //视频挂机成功
                var videoName = "video";
                if(role == 1){
                    console.log("*******************************:本地视频挂机成功");
                    var localID = oSession.labelInfo.id;
                    if(localID === 'divVideoLocal_a'){              //判断哪个视频挂机,清除对应的资源记录
                        videoName = "video";
                        P_S_mediaObj.video.publish.pid1 = null;
                        P_S_mediaObj.video.publish.hid1 = null;
                        LiveManagerModule.instance.setTeacherVideoOpenStatus(false,1);
                    }else if(localID === 'divVideoLocal_b'){
                        videoName = "video2";
                        P_S_mediaObj.video.publish.pid2 = null;
                        P_S_mediaObj.video.publish.hid2 = null;
                        LiveManagerModule.instance.setTeacherVideoOpenStatus(false,2);
                    }
                }else if(role == 2){
                    videoName = "video";
                    P_S_mediaObj.video.publish.pid1 = null;
                    P_S_mediaObj.video.publish.hid1 = null;
                    LiveManagerModule.instance.setStudentVideoOpenStatus(false);
                }
                var command = {             //通知服务器该视频已挂机成功,清除对应的资源记录
                    cmd:'video:video_hangup_success',
                    roomid:roomId,
                    userid:userid,
                    source_name:videoName,
                    userName:realName,
                    classroomName:classroomName
                };
                var stopvideoStatus = 0;
                if(role == 2){
                    if(LiveManagerModule.instance.getVideoIsBan()){
                        stopvideoStatus = 1;
                    }
                }
                var ctrlCommand = {
                    cmd:"userctrl:stopvideo",
                    userid:userid,
                    status:stopvideoStatus,
                    videoName:videoName,
                    roomid:roomId,
                    userName:realName,
                    classroomName:classroomName
                };
                LiveManagerModule.instance.classRoomController.sendMessage(ctrlCommand);
                LiveManagerModule.instance.classRoomController.sendMessage(command);
                console.debug("*************************************挂机视频成功:::",P_S_mediaObj);
            }
            else if(type == "P" && media_name == "audio"){      //音频挂机成功
                console.log("*************************************:本地音频挂机成功");
                P_S_mediaObj.audio.publishLock = false;
        //        pubAudio = '1';
                P_S_mediaObj.audio.publish.pid = null;
                P_S_mediaObj.audio.publish.hid = null;
                LiveManagerModule.instance.setAudioStatus(false);
                var command = {             //通知服务器,音频已挂机成功,更新members对应用户的资源记录
                    cmd:'video:audio_hangup_success',
                    roomid:roomId,
                    userid:userid,
                    source_name:'audio',
                    userName:realName,
                    classroomName:classroomName
                };
                var stopspeakStatus = 0;
                if(role == 2){
                    if(LiveManagerModule.instance.getAudioIsBan()){
                        stopspeakStatus = 1;
                    }
                }
                var ctrlCommand = {
                    cmd:"userctrl:stopspeak",
                    userid:userid,
                    status:stopspeakStatus,
                    roomid:roomId,
                    userName:realName,
                    classroomName:classroomName
                };
                LiveManagerModule.instance.classRoomController.sendMessage(ctrlCommand);
                LiveManagerModule.instance.classRoomController.sendMessage(command);
            }
            else if(type == "S" && media_name == "video"){     //视频挂机成功
                console.log("***********************************:挂机订阅视频成功");
                var i = null;
                $.each(P_S_mediaObj.video.subscribe,function(idx,subObj){
                    if(oSession.handup_id == subObj.hid){
                        i = idx;
                    }
                });
                if(i != null){
                    P_S_mediaObj.video.subscribe.splice(i,1);
                }
            }
            else if(type == "S" && media_name == "audio"){     //音频挂机成功
                console.log("******************************:挂机订阅的音频成功");
                LiveManagerModule.instance.setIsSubAudioStatus(false);
                P_S_mediaObj.audio.subscribe = [];
                P_S_mediaObj.audio.subscribeLock = false;
            }
            else if(type == "P" && media_name == "sccreen share"){      //共享屏幕挂机成功
                console.log("******************************:挂机本地共享屏幕成功");
                P_S_mediaObj.share.publish.pid1 = null;
                P_S_mediaObj.share.publish.hid1 = null;
                LiveManagerModule.instance.setSharePCVideoStatus(false);
                var command = {
                    cmd:"video:showscreen",
                    roomid:roomId,
                    status:false,
                    userid:userid,
                    userName:realName,
                    classroomName:classroomName
                };
                var command2 = {            //通知其他人,老师挂机共享屏幕
                    cmd:"video:showscreen_hangup",
                    roomid:roomId,
                    userid:userid,
                    isTeacher:true,
                    userName:realName,
                    classroomName:classroomName
                };
                LiveManagerModule.instance.classRoomController.sendMessage(command);
                LiveManagerModule.instance.classRoomController.sendMessage(command2);
            }else if(type == "S" && media_name == "sccreen share"){     //订阅共享屏幕挂机成功
                console.log("******************************:挂机订阅共享屏幕成功");
            }
        }
    },
    _isHaveFirstVideo:function(){
        var src = $('#divVideoLocal_a video').attr('src');
        if(typeof src !== 'undefined' && src != null){
            return true;
        }
        return false;
    },
    _isHavaSecondVideo:function(){
        var src = $('#divVideoLocal_b video').attr('src');
        if(typeof src !== 'undefined' && src != null){
            return true;
        }
        return false;
    },
    _cleanTeaPublishExcess: function(num){          //老师发布时清除多余的视频
        var a = null;
        if(num == 1)
            a = $('#divVideoLocal_a video');
        else
            a = $('#divVideoLocal_b video');
        if(a.length > 1){
            for(var i=0;i< a.length;i++){
                if(i != a.length-1){
                    a.eq(i).remove();
                }
            }
        }
    },
    _cleanStudentPublishExcess: function(){         //学生发布时清除多余的视频
        var a = $('#'+userid+' video');
        if(a.length > 1){
            for(var i=0;i< a.length;i++){
                if(i != a.length-1){
                    a.eq(i).remove();
                }
            }
        }
    },
    _videoPublishSuccessFun: function(oSession){        //视频发布成功后执行的方法
        if(mediaObj.video_P.MEDIA_STATUS && mediaObj.video_P.SET_STATUS && mediaObj.video_P.OK_STATUS){
            var videoName = "video";
            if(role == 1){
                var currentVideo = LiveManagerModule.instance.getCurrentVideo();
                if(typeof oSession !== 'undefined' && oSession.labelInfo.id === 'divVideoLocal_a') {//判断为第一个视频
                    P_S_mediaObj.video.publish.pid1 = mediaObj.video_P.source_id;           //存储发布id
                    videoName = "video";
                    if(!LiveManagerModule.instance._isHavaSecondVideo() && currentVideo === 't_2') {
                        LiveManagerModule.instance.setCurrentVideo(null);
                        currentVideo = LiveManagerModule.instance.getCurrentVideo();
                    }
                    if(currentVideo == null || (currentVideo != null && currentVideo === 't_1')){
                        LiveManagerModule.instance._cleanTeaPublishExcess(1);
                        var src = $('#divVideoLocal_a video').attr('src');
                        $('#divVideoRemote video').attr('src', src);
                        LiveManagerModule.instance.setCurrentVideo('t_1');       //记录当前视频
                        if(!LiveManagerModule.instance.getTeaWhiteboardStatus()) {
                            var updatevideoid = {       //通知其他人,老师已进入会议室并发布视频(如果不通知,那老师后进入的话,其他人的主画面就不会切换)
                                cmd: "video:change",
                                roomid: roomId,
                                userid: userid,
                                videoid: "t_1",
                                userName: realName,
                                classroomName: classroomName
                            };
                            LiveManagerModule.instance.classRoomController.sendMessage(updatevideoid);
                        }
                    }
                    LiveManagerModule.instance.setTeacherVideoOpenStatus(true,1);
                }else if(typeof oSession !== 'undefined' && oSession.labelInfo.id === 'divVideoLocal_b'){
                    P_S_mediaObj.video.publish.pid2 = mediaObj.video_P.source_id;
                    videoName = "video2";
                    if((currentVideo == null && !LiveManagerModule.instance._isHaveFirstVideo()) ||
                        (currentVideo != null && currentVideo === 't_2')){
                        LiveManagerModule.instance._cleanTeaPublishExcess(2);
                        var src = $('#divVideoLocal_b video').attr('src');
                        $('#divVideoRemote video').attr('src', src);
                        LiveManagerModule.instance.setCurrentVideo('t_2');
                        if (!LiveManagerModule.instance.getTeaWhiteboardStatus()) {
                            var updatevideoid = {
                                cmd: "video:change",
                                roomid: roomId,
                                userid: userid,
                                videoid: "t_2",
                                userName: realName,
                                classroomName: classroomName
                            };
                            LiveManagerModule.instance.classRoomController.sendMessage(updatevideoid);
                        }
                    }
                    LiveManagerModule.instance.setTeacherVideoOpenStatus(true,2);
                }
            }else if(role == 2){
                P_S_mediaObj.video.publish.pid1 = mediaObj.video_P.source_id;
                videoName = "video";
                LiveManagerModule.instance._cleanStudentPublishExcess();
                console.log("*******************************:学生视频发布成功");
                LiveManagerModule.instance.setStudentVideoOpenStatus(true);
                LiveManagerModule.instance.setVideoIsBan(false);
            }
            var command = {                 //通知服务器,视频发布成功,更新members对应用户的资源记录
                cmd:"video:video_publish_success",
                roomid:roomId,
                userid:userid,
                isTeacher:parseInt(role) == 1?true:false,
                source_name:videoName,
                source_id:mediaObj.video_P.source_id,
                userName:realName,
                classroomName:classroomName
            };
            var ctrlCommand = {             //更新controller中的members的用户资源记录
                cmd:"userctrl:stopvideo",
                userid:userid,
                status:2,
                videoName:videoName,
                roomid:roomId,
                userName:realName,
                classroomName:classroomName
            };
            LiveManagerModule.instance.classRoomController.sendMessage(ctrlCommand);
            LiveManagerModule.instance.classRoomController.sendMessage(command);
            mediaObj.video_P.MEDIA_STATUS = null;
            mediaObj.video_P.SET_STATUS = null;
            mediaObj.video_P.OK_STATUS = null;
            mediaObj.video_P.source_id = null;
        }
    },
    _audioPublishSuccessFun: function(){        //音频发布成功后执行的方法
        if(mediaObj.audio_P.MEDIA_STATUS && mediaObj.audio_P.SET_STATUS && mediaObj.audio_P.OK_STATUS){
            console.log("*******************************:音频发布成功");
            P_S_mediaObj.audio.publishLock = false;
            LiveManagerModule.instance.setAudioStatus(true);
        //    pubAudio = '2';
            var command = {                     //音频发布成功,通知服务器members对应用户的资源
                cmd:"video:audio_publish_success",
                roomid:roomId,
                userid:userid,
                isTeacher:parseInt(role)==1?true:false,
                source_name:"audio",
                source_id:mediaObj.audio_P.source_id,
                userName:realName,
                classroomName:classroomName
            };
            var ctrlCommand = {                 //更新controller中members的用户的音频资源
                cmd:"userctrl:stopspeak",
                userid:userid,
                status:2,
                roomid:roomId,
                userName:realName,
                classroomName:classroomName
            };
            LiveManagerModule.instance.classRoomController.sendMessage(ctrlCommand);
            LiveManagerModule.instance.classRoomController.sendMessage(command);
            mediaObj.audio_P.MEDIA_STATUS = null;
            mediaObj.audio_P.SET_STATUS = null;
            mediaObj.audio_P.OK_STATUS = null;
            mediaObj.audio_P.source_id = null;
            /*if(pubAudio == '2') {               //这里发布完音频后,需要判断是否订阅过音频,如果有则需要先挂机订阅过的音频，然后再订阅音频(解决回音)
                if (P_S_mediaObj.audio.subscribe.length > 0 &&
                    P_S_mediaObj.audio.subscribe[0].hid != null &&
                    P_S_mediaObj.audio.subscribe[0].hid != "") {
                    cfManager.subscribeSipHangUp(sipRoomNumber, P_S_mediaObj.audio.subscribe[0].hid);     //先挂机订阅过的
                    a:
                        for(var i=0;i<LiveManagerModule.instance.memberSources.length;i++){     //从members中找一个非自己的用户,订阅音频
                            if(LiveManagerModule.instance.memberSources[i].userid != userid){
                                for(var j=0;j<LiveManagerModule.instance.memberSources[i].videoInfos.length;j++){
                                    var videoInfos = LiveManagerModule.instance.memberSources[i].videoInfos[j];
                                    if(videoInfos.sourceName == "audio" &&
                                        videoInfos.sourceId != ""*//* && videoInfos.status == 2*//*){
                                        LiveManagerModule.instance._audioSubscribe(LiveManagerModule.instance.memberSources[i].userid,videoInfos.sourceId);
                                        break a;
                                    }
                                }
                            }
                        }
                }
            }*/
            P_S_mediaObj.audio.publish.pid = mediaObj.audio_P.source_id;
            if(role == 2)
                LiveManagerModule.instance.audioBanOff();
        }
    },
    _sharePublishSuccessFun: function(){        //发布共享屏幕成功后执行的方法
        if(mediaObj.share_P.MEDIA_STATUS && mediaObj.share_P.SET_STATUS && mediaObj.share_P.OK_STATUS){
            console.log("******************************:共享屏幕发布成功");
            P_S_mediaObj.share.publish.pid1 = mediaObj.share_P.source_id;
            LiveManagerModule.instance.setSharePCVideoStatus(true);
            var command = {                     //共享屏幕发布成功,通知老师共享屏幕发布成功其他人
                cmd:"video:sharescreen",
                roomid:roomId,
                userid:userid,
                isTeacher:parseInt(role) == 1?true:false,
                source_name:"share",
                source_id:P_S_mediaObj.share.publish.pid1,
                userName:realName,
                classroomName:classroomName
            };
            var command2 = {                    //通知服务器,记录共享屏幕是否开启状态
                cmd:"video:showscreen",
                roomid:roomId,
                status:true,
                userid:userid,
                userName:realName,
                classroomName:classroomName
            };
            LiveManagerModule.instance.classRoomController.sendMessage(command);
            LiveManagerModule.instance.classRoomController.sendMessage(command2);
            mediaObj.share_P.MEDIA_STATUS = null;
            mediaObj.share_P.SET_STATUS = null;
            mediaObj.share_P.OK_STATUS = null;
            mediaObj.share_P.source_id = null;
        }
    },
    _shareSubscribeSuccessFun: function(){
        if(mediaObj.share_S.MEDIA_STATUS && mediaObj.share_S.SET_STATUS && mediaObj.share_S.OK_STATUS){     //订阅共享屏幕成功
            console.log("*******************************:订阅共享屏幕成功");
            LiveManagerModule.instance.setSharePCVideoStatus(true);         //学生设置课室是否开启共享屏幕
            mediaObj.share_S.MEDIA_STATUS = null;
            mediaObj.share_S.SET_STATUS = null;
            mediaObj.share_S.OK_STATUS = null;
            mediaObj.share_S.source_id = null;
            if(role == 2){
                var ts;
                setTimeout(function(){
                    LiveManagerModule.instance.whiteboardOff();
                    ts = $('#stuShareVideo video').attr('src');
                    $('#divVideoRemote video').attr('src',ts);
                    if(typeof(ts) === "undefiend"){
                        $('#divVideoRemote video').attr('src','');
                    }
                },1500);
            }
        }
    },
    _videoSubscribeSuccessFun: function(oSession){      //视频订阅成功后执行的方法
        if(mediaObj.video_S.MEDIA_STATUS && mediaObj.video_S.SET_STATUS && mediaObj.video_S.OK_STATUS){
            console.log("*******************************:视频订阅成功");
            mediaObj.video_S.MEDIA_STATUS = null;
            mediaObj.video_S.SET_STATUS = null;
            mediaObj.video_S.OK_STATUS = null;
            mediaObj.video_S.source_id = null;
            var videoid = LiveManagerModule.instance.getCurrentVideo();
            if(role == 2){
                var ts;
                if(!LiveManagerModule.instance.getSharePCVideoStatus()){
                    if(videoid === 't_1'){//如果老师主画面为第一个视频
                        setTimeout(function(){
                            ts = $('#divVideoLocal_a video').attr('src');
                            $('#divVideoRemote video').attr('src', ts);
                            if(typeof(ts) === "undefiend"){
                                $('#divVideoRemote video').attr('src', '');
                            }
                        },1500);
                    }else if(videoid === 't_2'){//如果老师主画面为第二个视频
                        setTimeout(function(){
                            ts = $('#divVideoLocal_b video').attr('src');
                            $('#divVideoRemote video').attr('src', ts);
                            if(typeof(ts) === "undefined"){
                                $('#divVideoRemote video').attr('src','');
                            }
                        },1500);
                    }else if(videoid !== 't_1' && videoid !== 't_2' && videoid != null){//如果老师主画面为学生视频
                        setTimeout(function(){
                            ts = $('#' + videoid + ' video').attr('src');
                            $('#divVideoRemote video').attr('src', ts);
                            if(typeof(ts) === "undefined"){
                                $('#divVideoRemote video').attr('src','');
                            }
                        },1500);
                    }else{
                        var id = oSession.labelInfo.id;
                        if(id === 'divVideoLocal_a') {
                            LiveManagerModule.instance.setCurrentVideo('t_1');
                        }else if(id === 'divVideoLocal_b') {
                            LiveManagerModule.instance.setCurrentVideo('t_2');
                        }
                        setTimeout(function(){
                            ts = $('#'+id+' video').attr('src');
                            $('#divVideoRemote video').attr('src', ts);
                            if(typeof(ts) === "undefiend"){
                                $('#divVideoRemote video').attr('src', '');
                            }
                        },1500);
                    }
                }
            }else if(role == 1 && videoid != null){
                setTimeout(function(){
                    if(videoid !== 't_1' && videoid !== 't_2'){
                        ts = $('#' + videoid + ' video').attr('src');
                        $('#divVideoRemote video').attr('src', ts);
                        if (typeof(ts) === 'undefined') {
                            $('#divVideoRemote video').attr('src', '');
                        }
                    }
                },1500);
            }
        }
    },
    _teacherIsOpenAudio:function(){                     //判断老师是否发布过音频
        var isOpen = false;
        for(var i=0;i<LiveManagerModule.instance.memberSources.length;i++){
            var member_roleid = LiveManagerModule.instance.memberSources[i].roleid;
            if(member_roleid == 1){
                for(var j=0;j<LiveManagerModule.instance.memberSources[i].videoInfos.length;j++){
                    var videoInfos = LiveManagerModule.instance.memberSources[i].videoInfos[j];
                    if(videoInfos.sourceName == "audio" &&
                        videoInfos.sourceId !== ""/* && videoInfos.status == 2*/) {
                        isOpen = true;
                    }
                }
            }
        }
        return isOpen;
    },
    _audioSubscribeSuccessFun: function(){      //音频订阅成功后执行的方法
        if(mediaObj.audio_S.MEDIA_STATUS && mediaObj.audio_S.SET_STATUS && mediaObj.audio_S.OK_STATUS){        //音频订阅成功
            console.log("*******************************:音频订阅成功");
            mediaObj.audio_S.MEDIA_STATUS = null;
            mediaObj.audio_S.SET_STATUS = null;
            mediaObj.audio_S.OK_STATUS = null;
            mediaObj.audio_S.source_id = null;
            P_S_mediaObj.audio.subscribeLock = false;
            LiveManagerModule.instance.setIsSubAudioStatus(true);
        }
    },
    _unRegCallBack: function(iCode,iMsgInfo,oSession){
        if(iCode == ret_code.UNREG_ING || iCode == ret_code.UNREG_OK) {
            var command = {
                cmd:"classroom:unreg_ok",
                roomid:roomId,
                userid:userid,
                userName:realName,
                classroomName:classroomName
            };
            LiveManagerModule.instance.classRoomController.sendMessage(command);
            shouldReReg = true;
            var msg = VC.ROUTER.LIVEBIG.LIVE_DISCONNECT_VIDEO_SERVER;
            LiveManagerModule.instance.openErrorWindow(msg);
        }else if(iCode == ret_code.UNREG_INFO){
            console.log("-----------------------被服务器踢掉了,重复登陆");
            var command = {
                cmd:"classroom:unreg_info",
                roomid:roomId,
                userid:userid,
                userName:realName,
                classroomName:classroomName
            };
            LiveManagerModule.instance.classRoomController.sendMessage(command);
            var msg = VC.ROUTER.LIVEBIG.LIVE_REPEAT_LOGIN_VIDEO_SERVER;
            LiveManagerModule.instance.openErrorWindow(msg);
        }else if(iCode == ret_code.USER_OBJ){
            console.log("-----------------------用户对象不存在,Why?");
            var command = {
                cmd:"classroom:unreg_obj",
                roomid:roomId,
                userid:userid,
                userName:realName,
                classroomName:classroomName
            };
            LiveManagerModule.instance.classRoomController.sendMessage(command);
            var msg = VC.ROUTER.LIVEBIG.LIVE_NOT_EXIS_USER;
            LiveManagerModule.instance.openErrorWindow(msg);
        }else if(iCode ==ret_code.REG_EXPIRES){
        	var command = {
                    cmd:"classroom:reg_expires",
                    roomid:roomId,
                    userid:userid,
                    userName:realName,
                    classroomName:classroomName
                };
        	LiveManagerModule.instance.classRoomController.sendMessage(command);
        }
    },
    _sipCBMsgInfo:function(iCode, iMsgInfo, oSession) {  //回调函数
        LiveManagerModule.instance._initCallBack(iCode, iMsgInfo, oSession);
        LiveManagerModule.instance._registerCallBack(iCode, iMsgInfo, oSession);
        LiveManagerModule.instance._createMeetingCallBack(iCode, iMsgInfo, oSession);
        LiveManagerModule.instance._joinMeetingCallBack(iCode, iMsgInfo, oSession);
        LiveManagerModule.instance._publishAndSubscribeCallBack(iCode, iMsgInfo, oSession);
        LiveManagerModule.instance._videoPublishSuccessFun(oSession);
        LiveManagerModule.instance._sharePublishSuccessFun();
        LiveManagerModule.instance._audioPublishSuccessFun();
        LiveManagerModule.instance._videoSubscribeSuccessFun(oSession);
        LiveManagerModule.instance._shareSubscribeSuccessFun();
        LiveManagerModule.instance._audioSubscribeSuccessFun();
        LiveManagerModule.instance._videoAndAudioHangupCallBack(iCode, iMsgInfo, oSession);
        LiveManagerModule.instance._unRegCallBack(iCode,iMsgInfo,oSession);
        LiveManagerModule.instance._failCallBack(iCode,iMsgInfo,oSession);
        LiveManagerModule.instance._hangupFailCallBack(iCode,iMsgInfo,oSession);
        LiveManagerModule.instance._rejectCallBack(iCode,iMsgInfo,oSession);
    },
    _failCallBackTips : function(msg){//失败提示,显示在讨论区
        var el = $('<div class="message" ><p>['+ getTime() +']' + msg + '</p></div>');
        $('#messages').append(el);
    },
    _publishVideoFailCallBack : function(oSession){
        console.log("发布视频失败......");
        var command = {
            cmd:"classroom:video_publish_fail",
            roomid:roomId,
            userid:userid,
            userName:realName,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
        var msg = VC.ROUTER.LIVEBIG.LIVE_PUBLISH_VIDEO_FAIL;
        LiveManagerModule.instance._failCallBackTips(msg);
    },
    _publishAudioFailCallBack : function(oSession){
        console.log("发布音频失败......");
        P_S_mediaObj.audio.publishLock = false;
        var command = {
            cmd:"classroom:audio_publish_fail",
            roomid:roomId,
            userid:userid,
            userName:realName,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
        var msg = VC.ROUTER.LIVEBIG.LIVE_PUBLISH_AUDIO_FAIL;
        LiveManagerModule.instance._failCallBackTips(msg);
    },
    _publishSccreenShareFailCallBack : function(oSession){
        console.log("发布共享屏幕失败......");
        var command = {
            cmd:"classroom:sccreen_share_publish_fail",
            roomid:roomId,
            userid:userid,
            userName:realName,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
        var msg = VC.ROUTER.LIVEBIG.LIVE_PUBLISH_SCREEN_FAIL;
        LiveManagerModule.instance._failCallBackTips(msg);
    },
    _subscribeVideoFailCallBack : function(oSession){
        console.log("订阅视频失败......");
        var id = oSession.labelInfo.id;
        var command = {
            cmd:"classroom:video_subscribe_fail",
            roomid:roomId,
            userid:userid,
            userName:realName,
            classroomName:classroomName,
            params:id
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
        var msg = VC.ROUTER.LIVEBIG.LIVE_SUBSCRIBE_VIDEO_FAIL;
        LiveManagerModule.instance._failCallBackTips(msg);
    },
    _subscribeAudioFailCallBack : function(oSession){
        console.log("订阅音频失败......");
        var id = oSession.labelInfo.id;
        P_S_mediaObj.audio.subscribeLock = false;
        var command = {
            cmd:"classroom:audio_subscribe_fail",
            roomid:roomId,
            userid:userid,
            userName:realName,
            classroomName:classroomName,
            params:id
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
        var msg = VC.ROUTER.LIVEBIG.LIVE_SUBSCRIBE_AUDIO_FAIL;
        LiveManagerModule.instance._failCallBackTips(msg);
    },
    _subscribeSccreenShareFailCallBack : function(oSession){
        console.log("订阅共享屏幕失败......");
        var command = {
            cmd:"classroom:sccreen_share_subscribe_fail",
            roomid:roomId,
            userid:userid,
            userName:realName,
            classroomName:classroomName
        };
        LiveManagerModule.instance.classRoomController.sendMessage(command);
        var msg = VC.ROUTER.LIVEBIG.LIVE_SUBSCRIBE_SCREEN_FAIL;
        LiveManagerModule.instance._failCallBackTips(msg);
    },
    _failCallBack:function(iCode, iMsgInfo, oSession) {     //发布失败回调
        if(iCode == ret_code.CALL_FAIL || iCode == ret_code.CALL_ERROR || iCode == ret_code.CALL_LOFAIL || iCode == ret_code.CALL_ROFAIL) {
            if(typeof(oSession) !== "undefined") {
                var type = oSession.o_type;     // 类型    P:发布       S:订阅
                var media_name = oSession.o_SipSessionCall.mediaType.s_name;    //媒体类型  video:视频    audio:音频
                if(type === "P"){
                    if(media_name === "video"){
                        LiveManagerModule.instance._publishVideoFailCallBack(oSession);
                    }else if(media_name === "audio"){
                        LiveManagerModule.instance._publishAudioFailCallBack(oSession);
                    }else if(media_name === "sccreen share"){
                        LiveManagerModule.instance._publishSccreenShareFailCallBack(oSession);
                    }
                }else if(type === "S"){
                    if(media_name === "video"){
                        LiveManagerModule.instance._subscribeVideoFailCallBack(oSession);
                    }else if(media_name === "audio"){
                        LiveManagerModule.instance._subscribeAudioFailCallBack(oSession);
                    }else if(media_name === "sccreen share"){
                        LiveManagerModule.instance._subscribeSccreenShareFailCallBack(oSession);
                    }
                }
            }
        }
    },
    _hangupFailCallBack:function(iCode, iMsgInfo, oSession){        //挂机失败
        if(iCode == ret_code.HANGUP_FAIL && typeof(oSession) !== 'undefined'){
            console.log("------------->>>挂机失败");
            var type = oSession.o_type;     //发布：P  订阅：S
            var media_name = oSession.o_SipSessionCall.mediaType.s_name;        //视频：video      音频：audio
            if(type === 'P' && media_name === 'video'){
                var localID = oSession.labelInfo.id;
                var videoName = 'video';
                if(role == 1){
                    if(localID === 'divVideoLocal_b'){
                        videoName = 'video2';
                    }
                }
                var command = {
                    cmd:"video:video_hangup_fail",
                    roomid:roomId,
                    userid:userid,
                    source_name:videoName,
                    userName:realName,
                    classroomName:classroomName
                };
                LiveManagerModule.instance.classRoomController.sendMessage(command);
            }else if(type === 'P' && media_name === 'audio'){
                var command = {
                    cmd:"video:audio_hangup_fail",
                    roomid:roomId,
                    userid:userid,
                    source_name:'audio',
                    userName:realName,
                    classroomName:classroomName
                };
                LiveManagerModule.instance.classRoomController.sendMessage(command);
            }
        }
    },
    _rejectCallBack:function(iCode, iMsgInfo, oSession){    //拒绝允许
        if(iCode == ret_code.MEDIA_REJECT){     //拒绝
            console.debug("----->>>>>iCode=" + iCode + ",iMsgInfo=" + iMsgInfo + ",oSesson=" + oSession);
            //通知服务器
            var command = {
                cmd:"classroom:reject",
                roomid:roomId,
                userid:userid,
                userName:realName,
                classroomName:classroomName,
                params:oSession.o_event.o_session.s_type
            };
            LiveManagerModule.instance.classRoomController.sendMessage(command);
        }else if(iCode == ret_code.MEIDA_ACCEPT){       //允许
            console.debug("----->>>>>iCode=" + iCode + ",iMsgInfo=" + iMsgInfo + ",oSesson=" + oSession);
            //通知服务器
            var command = {
                cmd:"classroom:accept",
                roomid:roomId,
                userid:userid,
                userName:realName,
                classroomName:classroomName,
                params:oSession.o_event.o_session.s_type
            };
            LiveManagerModule.instance.classRoomController.sendMessage(command);
        }
    },
    _releaseOldPublishVideoResources:function(roleid,source_name){        //释放发布视频资源,roleid用户的角色,source_name为资源类型
        var hangupID = null;
        if(roleid == 1) {
            if (source_name == "video") {
                hangupID = P_S_mediaObj.video.publish.hid1;
            } else if (source_name == "video2") {
                hangupID = P_S_mediaObj.video.publish.hid2;
            }
        }else if(roleid == 2){
            if (source_name == "video") {
                hangupID = P_S_mediaObj.video.publish.hid1;
            }
        }
        if(hangupID != null){
            cfManager.publishSipHangUp(sipRoomNumber, hangupID);
        }
    },
    _releaseOldPublishAudioResource:function(roleid,source_name){        //释放发布音频资源,roleid用户的角色,source_name为资源类型
        if(source_name === "audio") {
            var hangupID = P_S_mediaObj.audio.publish.hid;
            if (hangupID != null && typeof(hangupID) !== 'undefined') {
                cfManager.publishSipHangUp(sipRoomNumber, hangupID);
            }
        }
    },
    _SingledoubleSip:function(num,status){  //单双摄像开关切换。num：1为第一个视频，num：2为第二个视频
        if(num == 2){
            if(!status){            //如果没开启
                    videoindex = 1;
                    var _this = document.getElementById('divVideoLocal_b');
                    var idValue = 'divVideoLocal_b';
                    var _w = t_w_2;
                    var _h = t_h_2;
                    teaSipCallNum=2;
                    LiveManagerModule.instance._releaseOldPublishVideoResources(1,'video2');
                    LiveManagerModule.instance._publish(_this, idValue, _w, _h); // 老师发布视频
            }else{                  //如果已开启，则请求挂机
                var command = {
                    cmd:"video:video_hangup",
                    roomid:roomId,
                    userid:userid,
                    isTeacher:true,
                    source_name:"video2",
                    userName:realName,
                    classroomName:classroomName
                };
                LiveManagerModule.instance.classRoomController.sendMessage(command);
            }
        }else if(num == 1){
            if(!status){
                videoindex = 0;
                var _this = document.getElementById('divVideoLocal_a');
                var idValue = 'divVideoLocal_a';
                var _w = t_w_1;
                var _h = t_h_1;
                teaSipCallNum=1;
                LiveManagerModule.instance._releaseOldPublishVideoResources(1,'video');
                LiveManagerModule.instance._publish(_this, idValue, _w, _h); // 老师发布视频
            }else{
                var command = {
                    cmd:"video:video_hangup",
                    roomid:roomId,
                    userid:userid,
                    isTeacher:true,
                    source_name:"video",
                    userName:realName,
                    classroomName:classroomName
                };
                LiveManagerModule.instance.classRoomController.sendMessage(command);
            }
        }
    },
    leaveClassroom:function(){
        if(role == 1){
            if(isJoinMeetingSuccess) {
                cfManager.sipMeetingLeave(sipRoomNumber, sipRoomNumber);
            }
            /*var command = {
                cmd: "video:classroom_end",
                role: 1,
                roomid: roomId,
                userid:userid,
                userName:realName,
                classroomName:classroomName
            };
            LiveManagerModule.instance.classRoomController.sendMessage(command);*/
        	window.location.href = $('#vcliveHost').val() + '/app/camp/' + VC.ROUTER.LIVEBIG.PUBLIC_KEY + '/schedule.html';
        }else if(role == 2){
            if(isJoinMeetingSuccess) {
                cfManager.sipMeetingLeave(sipRoomNumber, sipRoomNumber);
            }
            window.location.href = $('#vcliveHost').val() + '/app/camp/' + VC.ROUTER.LIVEBIG.PUBLIC_KEY + '/schedule.html';
        }
    },
    _bindEvent:function() {
        $('#delayApply').click(function(){
            if(role == 2)
                return;
            var command = {
                cmd:"controlpanel:applydelay",
                roomid:roomId,
                userid:userid,
                userName:realName,
                classroomName:classroomName
            };
            LiveManagerModule.instance.classRoomController.sendMessage(command);
        });
    }
};

// 刷新或关闭页面
function distoryRes() {
    if(isJoinMeetingSuccess)
        cfManager.sipMeetingLeave(sipRoomNumber, sipRoomNumber);      //离开会议
    var command = {
        cmd : "chat:leave",
        roomid : roomId,
        userid : userid,
        username : realName,
        isteacher : role == 1
    };
    LiveManagerModule.instance.classRoomController.sendMessage(command);
}



