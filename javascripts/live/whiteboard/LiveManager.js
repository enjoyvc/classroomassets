var LiveManagerModule = LiveManagerModule || {};
function LiveManager(classRoomController) {
    this.classRoomController = classRoomController;
    LiveManagerModule.instance = this;

    this.url = $('#liveHost').val();//注册url
    this.port = $('#videoPort').val();//注册port
    this.mydomain = $('#videoDomain').val();//注册参数
    this.txtArea = $('#videoArea').val();//注册参数
    this.createMeetingParam = $('#createMeetingParam').val();//创建会议参数
    this.meetingType = $('#meetingControlType').val();//创建会议参数
    this.sipRoomNumber = null;      //发布 or 订阅 需要用的会议室ID

    this.defaultCmdParam = {};//命令默认参数
    this.showResolutionSelectView = false;//分辨率切换窗口显示状态,默认false
    this.currentResolution = 40;//LD:20 SD:40 HD:80
    this.PUBLISH_VIDEO_RESOLUTION_LD = null;//发布视频分辨率 -- 普清
    this.PUBLISH_VIDEO_RESOLUTION_SD = null;//发布视频分辨率 -- 标清
    this.PUBLISH_VIDEO_RESOLUTION_HD = null;//发布视频分辨率 -- 高清
    this.SHARE_SCREEN_RESOLUTION = null;//共享屏幕分辨率
    this.AUDIO_BANDWIDTH = 64;                   //音频带宽
    this.VIDEO_BANDWIDTH = 640;                  //视频带宽
    this.SHAREPC_BANDWIDTH = 512;                //共享屏幕带宽

    this.isConnectTimeout = false;              //是否连接超时
    this.recreateMeetingCount = 0;              //创建会议次数(防止一直重复创建)
    this.shouldReReg = true;                    //是否可以注册(防止重复注册)
    this.isJoinMeeting = false;                 //是否加入会议
    this.videoindex = 0;                        //用于区分摄像头，默认使用第一个
    this.videoSource = [];                      //存储视频设备信息
    this.audioSource = [];                      //存储音频设备信息

    this.pubAndSubresource = {                  //存储资源
        video : {       //视频
            publish:{userid:null,pid1:null,hid1:null,pid2:null,hid2:null},      //发布
            subscribe:[],    //订阅
            handup_subscribe:[]     //订阅举手学生
        },
        audio : {       //音频
            publish:{userid:null,pid:null,hid:null},
            subscribe:[]
        },
        share : {       //共享
            publish:{userid:null,pid1:null,hid1:null},      //发布
            subscribe:[]    //订阅
        }
    };
    this.audioSubscribeLock = false;              //防止同时订阅多个音频
    this.audioPublishLock = false;                //防止同时发布多个音频

}
var mediaObj = {
    "video_P":{"MEDIA_STATUS":null,"SET_STATUS":null,"OK_STATUS":null,"source_id":null},    //记录视频发布各流程状态
    "audio_P":{"MEDIA_STATUS":null,"SET_STATUS":null,"OK_STATUS":null,"source_id":null},    //记录音频发布各流程状态
    "share_P":{"MEDIA_STATUS":null,"SET_STATUS":null,"OK_STATUS":null,"source_id":null},    //记录共享屏幕发布各流程状态
    "video_S":{"MEDIA_STATUS":null,"SET_STATUS":null,"OK_STATUS":null,"source_id":null},    //记录视频订阅各流程状态
    "audio_S":{"MEDIA_STATUS":null,"SET_STATUS":null,"OK_STATUS":null,"source_id":null},    //记录音频订阅各流程状态
    "share_S":{"MEDIA_STATUS":null,"SET_STATUS":null,"OK_STATUS":null,"source_id":null}    //记录共享屏幕订阅各流程状态
};
var teaSipCallNum = 1;
var timer = null;                      //检测会议是否创建成功定时器
var CHECK_TIME = 1000*10;              //检测会议是否创建定时器时间间隔,从数据库获取
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
    constructor : LiveManager,
    init : function() {     // 初始化
        this.classroomInfoManager = LiveManagerModule.instance.classRoomController.getClassroomInfoManager();
        this.userManager = LiveManagerModule.instance.classRoomController.getUserManager();
        this.whiteBoardManager = LiveManagerModule.instance.classRoomController.getWhiteBoardManager();

        this.sipRoomNumber = "C" + LiveManagerModule.instance.classroomInfoManager.getRoomId();
        this.pubAndSubresource.video.publish.userid = LiveManagerModule.instance.userManager.getUserid();
        this.pubAndSubresource.audio.publish.userid = LiveManagerModule.instance.userManager.getUserid();
        this.pubAndSubresource.share.publish.userid = LiveManagerModule.instance.userManager.getUserid();

        LiveManagerModule.instance._bindEvent();
    },
    getShowResolutionSelectViewStatus : function(){//分辨率切换窗口显示状态
        return this.showResolutionSelectView;
    },
    openAndCloseResolutionView : function(){//打开或关闭分辨率选择窗口
        LiveManagerModule.instance.showResolutionSelectView = !LiveManagerModule.instance.showResolutionSelectView;
    },
    getCurrentResolution : function(){//获取当前视频分辨率类型
        return this.currentResolution;
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
    initDefaultCmdParam : function(roomid,userid,classroomName,userName){//初始化cmd的默认参数
        this.defaultCmdParam.roomid = roomid;
        this.defaultCmdParam.userid = userid;
        this.defaultCmdParam.classroomName = classroomName;
        this.defaultCmdParam.userName = userName;
    },
    getDefaultCmdParam : function(){//获取cmd默认参数
        return this.defaultCmdParam;
    },
    createPublishVideoParam : function(id,width,height){//创建发布视频参数对象  id:标签id width:宽度 height:高度
        var param = {};
        param.idObject = $('#'+id)[0];
        param.id = id;
        param.width = width;
        param.height = height;
        return param;
    },
    createSubscribeVideoParam : function(id,width,height,sourceId,userid,role,videoName){//创建订阅视频参数对象 id:标签id width:宽度 height:高度 sourceId:资源ID userid:被订阅者ID role:被订阅者角色 videoName:订阅的视频(只能填这2个:video:第1个视频 video2:第2个视频)
        var param = {};
        param.idObject = $('#'+id)[0];
        param.id = id;
        param.width = width;
        param.height = height;
        param.sourceId = sourceId;
        param.userid = userid;
        param.role = role;
        param.videoName = videoName;
        return param;
    },
    _video_publish_successCMDtoSub : function(data){		//收到用户发布视频成功后，去订阅该视频
        var param;
        if(data.isTeacher){
            if(data.source_name == "video"){
                param = LiveManagerModule.instance.createSubscribeVideoParam('divVideoLocal_a',s_s_t_w,s_s_t_h,data.source_id,data.userid,1,'video');
            }else if(data.source_name == "video2"){
                param = LiveManagerModule.instance.createSubscribeVideoParam('divVideoLocal_b',s_s_t_w,s_s_t_h,data.source_id,data.userid,1,'video2');
            }
        }else{
            if(!LiveManagerModule.instance.userManager.isTeacher())return;//因为大班默认学生用户不订阅其他学生视频
            if(LiveManagerModule.instance.pubAndSubresource.video.subscribe.length >= LiveManagerModule.instance.classroomInfoManager.getScrollMembersCount()){     //如果已经订阅满了，则不再订阅(大班走马灯限制)
                return;
            }
            param = LiveManagerModule.instance.createSubscribeVideoParam(data.userid,s_s_s_w,s_s_s_h,data.source_id,data.userid,2,'video');
        }
        LiveManagerModule.instance._subscribe(param);     //订阅视频
    },
    _cleanSubscribeExcess : function(id){           //订阅前清除多余的视频
        $('#'+id).html('');
    },
    _video_hangup_allowCMDtoHangup : function(data){
        if(LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid)){
            var hangupID = null;
            if(data.source_name == 'video'){
                hangupID = LiveManagerModule.instance.pubAndSubresource.video.publish.hid1;
            }else if(data.source_name == 'video2'){
                hangupID = LiveManagerModule.instance.pubAndSubresource.video.publish.hid2;
            }
            if(hangupID != null && typeof(hangupID) !== 'undefined'){
                cfManager.publishSipHangUp(LiveManagerModule.instance.sipRoomNumber, hangupID);
            }
        }
    },
    _audio_hangup_allowCMDtoHangup : function(data){
        if(LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid)){
            var hangupID = LiveManagerModule.instance.pubAndSubresource.audio.publish.hid;
            if (hangupID != null && typeof(hangupID) !== 'undefined') {
                cfManager.publishSipHangUp(LiveManagerModule.instance.sipRoomNumber, hangupID);
            }
        }
    },
    _stopvideoCMDtoUpdateSubscribe : function(data){
        if(!LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid)){
            if(data.status != 2){       //0 :未发布 1:禁止  2:发布
                var idx = null;
                for(var i=0;i<LiveManagerModule.instance.pubAndSubresource.video.subscribe.length;i++){     //找到该用户的资源在资源列表中对应的索引
                    if(data.userid == LiveManagerModule.instance.pubAndSubresource.video.subscribe[i].userid &&
                        data.videoName == LiveManagerModule.instance.pubAndSubresource.video.subscribe[i].videoName){
                        idx = i;
                        break;
                    }
                }
                if(idx != null){                            //清除资源
                    LiveManagerModule.instance.pubAndSubresource.video.subscribe.splice(idx,1);
                }
            }
        }
    },
    _stopvideoCMDtoCleanMainFrame : function(data){
        if(data.status != 2){           //如果不是发布
            var currentVideo = LiveManagerModule.instance.classroomInfoManager.getTeacherCurrentVideo();
            if(!LiveManagerModule.instance.classroomInfoManager.getTeacherShareVideo()){
                if(currentVideo == data.userid){
                    $('#teacher_a').attr('src','');     //清除主画面
                    LiveManagerModule.instance.leaveChange('t_1');
                }else {
                    var obj = LiveManagerModule.instance.classroomInfoManager.findObjectFromMembersById(data.userid);
                    if(obj != null) {
                        if (obj.roleid == 1) {
                            if (data.videoName == "video") {
                                if (currentVideo == 't_1') {
                                    $('#teacher_a').attr('src', '');     //清除主画面
                                    var bsrc = $('#divVideoLocal_b video').attr('src');
                                    if (typeof bsrc !== 'undefined' && bsrc != null) {
                                        LiveManagerModule.instance.changeVideoShow('t_2');
                                    } else {
                                        LiveManagerModule.instance.classroomInfoManager.teacherCurrentVideo = null;
                                    }
                                }
                            } else if (data.videoName == "video2") {
                                if (currentVideo == 't_2') {
                                    $('#teacher_a').attr('src', '');     //清除主画面
                                    var asrc = $('#divVideoLocal_a video').attr('src');
                                    if (typeof asrc !== 'undefined' && asrc != null) {
                                        LiveManagerModule.instance.changeVideoShow('t_1');
                                    } else {
                                        LiveManagerModule.instance.classroomInfoManager.teacherCurrentVideo = null;
                                    }
                                }
                            }
                        }
                    }
                }
            }else{
                if(LiveManagerModule.instance.userManager.isTeacher()){
                    if(currentVideo == data.userid){
                        LiveManagerModule.instance.leaveChange('t_1');
                    }
                }
            }
        }
    },
    _video_banCMDtoBan : function(data){
        if(LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid)){
            LiveManagerModule.instance.userManager.banVideoStatus = true;
            LiveManagerModule.instance.closePublishVideo();
        }
    },
    _video_nobanCMDtoNoban:function(data){          //取消禁止视频
        if(LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid)){
            LiveManagerModule.instance.userManager.banVideoStatus = false;
            if(LiveManagerModule.instance.userManager.getIsOwnCloseVideo())return;
            LiveManagerModule.instance.openPublishVideo();
        }
    },
    _audio_banCMDtoBan:function(data){      //禁止音频
        if(LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid)){
            LiveManagerModule.instance.userManager.banAudioStatus = true;
            LiveManagerModule.instance.closePublishAudio();
        }
    },
    _audio_nobanCMDtoNoban:function(data){      //取消禁止音频
        if(LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid)){
            LiveManagerModule.instance.userManager.banAudioStatus = false;
            if(LiveManagerModule.instance.userManager.getIsOwnCloseAudio())return;
            LiveManagerModule.instance.openPublishAudio();
        }
    },
    _forbidenvideoCMDtoOpenAndClose:function(data){     //全部学生禁止或开启视频
        if(data.status == 1){       //禁止    0:开启  1:禁止
            if(!LiveManagerModule.instance.userManager.getBanVideoStatus()){        //(收到禁止视频命令,关闭视频)
                LiveManagerModule.instance.userManager.banVideoStatus = true;
                LiveManagerModule.instance.closePublishVideo();
            }
        }else if(data.status == 0){    //开启
            if(LiveManagerModule.instance.userManager.getBanVideoStatus()){         //(收到取消禁止命令,开启视频)
                LiveManagerModule.instance.userManager.banVideoStatus = false;
                if(LiveManagerModule.instance.userManager.getIsOwnCloseVideo())return;
                LiveManagerModule.instance.openPublishVideo();
            }
        }
    },
    _forbidenaudioCMDtoOpenAndClose:function(data){         //全部学生禁止或开启音频
        if(data.status == 1){       //禁止
            if(!LiveManagerModule.instance.userManager.getBanAudioStatus()){
                LiveManagerModule.instance.userManager.banAudioStatus = true;
                LiveManagerModule.instance.closePublishAudio();
            }
        }else if(data.status == 0){    //开启
            if(LiveManagerModule.instance.userManager.getBanAudioStatus()){
                LiveManagerModule.instance.userManager.banAudioStatus = false;
                if(LiveManagerModule.instance.userManager.getIsOwnCloseAudio())return;
                if(!LiveManagerModule.instance.userManager.getOpenAudioStatus()){
                    LiveManagerModule.instance.openPublishAudio();
                }
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
            if(LiveManagerModule.instance.userManager.isTeacher() && (typeof data.type !== 'undefined' || data.type == 2)){      //返回举手的同学
                ts = 'handupVideo';
            }else {
                ts = data.videoid;
            }
        }
        return ts;
    },
    _changeCMDtoHandupup : function(data,ts){		//设置学生举手状态(蓝色外边框)
        if(data.videoid !== "t_1" && data.videoid !== "t_2" && data.videoid != null){
            LiveManagerModule.instance.setStudentHandup(ts,0);
        }
    },
    _changeCMDtoSubVideoByStudent : function(data){			//订阅其他学生的视频
        var subhid = LiveManagerModule.instance.findSubHidByUserid(data.videoid);
        if(subhid != null && typeof(subhid) !== 'undefined' && subhid !== ""){		//先判断是否订阅过该学生的视频,如果订阅过先挂机再订阅
            cfManager.subscribeSipHangUp(LiveManagerModule.instance.sipRoomNumber,subhid);
        }else{
            $.each(LiveManagerModule.instance.pubAndSubresource.video.subscribe,function(index,obj){
                if(obj.role == 2){
                    if(obj.hid != null) {
                        cfManager.subscribeSipHangUp(LiveManagerModule.instance.sipRoomNumber, obj.hid);
                    }
                }
            });
        }
        var sub_sourceid = LiveManagerModule.instance.classroomInfoManager.findSourceidFromMembersByUseridAndType(data.videoid,"video");//找到对应id的视频资源id(用于订阅)
        var param = LiveManagerModule.instance.createSubscribeVideoParam('currentVideo',s_s_s_w,s_s_s_h,sub_sourceid,data.videoid,2,'video');
        LiveManagerModule.instance._subscribe(param);
    },
    _changeCMDtoChangeMainFrame : function(data,ts){                //改变主画面的显示
        var sourceSrc;
        if(LiveManagerModule.instance.userManager.isTeacher()){		//如果自己是老师直接切换
            sourceSrc = $('#'+ts+' video').attr('src');
            $('#divVideoRemote video').attr('src',sourceSrc);
            if(typeof(sourceSrc) === "undefined"){
                if(ts !== 'divVideoLocal_a' && ts !== 'divVideoLocal_b'){
                    sourceSrc = $('#search_'+ts+' video').attr('src');
                    if(typeof(sourceSrc) !== 'undefined')
                        $('#divVideoRemote video').attr('src',sourceSrc);
                }
                $('#divVideoRemote video').attr('src','');
            }
            LiveManagerModule.instance.classroomInfoManager.teacherCurrentVideo = data.videoid;
        }else if(!LiveManagerModule.instance.userManager.isTeacher()){		//如果自己是学生
            if(data.videoid !== 't_1' && data.videoid !== 't_2' &&
                !LiveManagerModule.instance.userManager.isOneselfByUserid(data.videoid)){		//如果data.videoid为其它学生的id
                LiveManagerModule.instance._changeCMDtoSubVideoByStudent(data);
            }else{				//如果data.videoid为学生自己的id或为老师的视频1(t_1)或为老师的视频2(t_2)
                sourceSrc = $('#' + ts + ' video').attr('src');
            }
        }
        if(!LiveManagerModule.instance.classroomInfoManager.getTeacherShareVideo()){		//如果老师没有打开共享屏幕
            console.debug("currentVideo:----->>ts:"+ts+",sourceSrc:"+sourceSrc+",time="+new Date().toLocaleTimeString());
            $('#teacher_a').attr('src',sourceSrc);
            if(typeof(sourceSrc) === "undefined"){
                $('#teacher_a').attr('src','');
            }
            LiveManagerModule.instance.classroomInfoManager.teacherCurrentVideo = data.videoid;
        }
    },
    _user_leaveCMDtoCleanP_S_mediaObjSource : function(data){		//清除自己订阅过的对应的用户的资源ID
        if(!LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid) && !data.isteacher){
            var id_index = PublicStatic.StaticClass.findIndexFromMembersById(data.userid,LiveManagerModule.instance.pubAndSubresource.video.subscribe);
            if(id_index != null)
                LiveManagerModule.instance.pubAndSubresource.video.subscribe.splice(id_index,1);
        }else if(!LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid) && data.isteacher){
            for(var i=0;i<LiveManagerModule.instance.pubAndSubresource.video.subscribe.length;i++){     //这里用循环是因为老师可能会有2个视频
                if(data.userid == LiveManagerModule.instance.pubAndSubresource.video.subscribe[i].userid){
                    LiveManagerModule.instance.pubAndSubresource.video.subscribe.splice(i,1);
                }
            }
        }
    },
    _user_leaveCMDtoCleanMainFrame : function(data,currentVideo){
        if(!LiveManagerModule.instance.classroomInfoManager.getTeacherShareVideo()){    //如果不是共享屏幕状态
            if(currentVideo !== "t_1" && currentVideo !== "t_2"){
                if(currentVideo == data.userid){
                    if(LiveManagerModule.instance.userManager.isTeacher()){
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
            if(LiveManagerModule.instance.userManager.isTeacher()){
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
                if(LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid)){
                    CHECK_TIME = data.CHECK_CLASSROOM_IS_CREATE_INTERVAL*1000;           //检测会议是否创建的定时器时间
                    var checkInit = function(type, contents) {
                        if(typeof contents !== 'undefined'){		//如果有设备
                            if(typeof contents.video !== 'undefined' && contents.video.length >0){	//是否存在摄像头
                                LiveManagerModule.instance.videoSource = contents.video;
                                LiveManagerModule.instance.userManager.setVideoConnectStatusByVideoConnectCount(LiveManagerModule.instance.videoSource.length);
                            }
                            if(typeof contents.audio !== 'undefined' && contents.audio.length >0){	//是否存在麦克风
                                LiveManagerModule.instance.audioSource = contents.audio;
                                LiveManagerModule.instance.userManager.setAudioConnectStatusByAudioConnectCount(LiveManagerModule.instance.audioSource.length);
                            }
                        }
                    };
                    if(LiveManagerModule.instance.shouldReReg) {
                        var oParam = {
                            cb_MsgInfo: this._sipCBMsgInfo,  // 消息回调函数，自实现
                            cb_CheckMedia: checkInit,
                            disableDebug: false, // 是否启用Debug
                            disableVideo: false  // 是否禁用Video
                        };
                        cfManager.appInit(oParam);
                    };
                    if(LiveManagerModule.instance.userManager.isTeacher()){
                        LiveManagerModule.instance.PUBLISH_VIDEO_RESOLUTION_HD = data.ET_VIDEO_SIZE_PUBLISH;          //发布视频分辨率高清
                        LiveManagerModule.instance.PUBLISH_VIDEO_RESOLUTION_SD = data.ET_VIDEO_SIZE_PUBLISH_SD;       //发布视频分辨率标清
                        LiveManagerModule.instance.PUBLISH_VIDEO_RESOLUTION_LD = data.ET_VIDEO_SIZE_PUBLISH_LD;       //发布视频分辨率普清
                        LiveManagerModule.instance.SHARE_SCREEN_RESOLUTION = data.ET_VIDEO_SIZE_SHAREPC;           //共享屏幕分辨率
                        LiveManagerModule.instance.AUDIO_BANDWIDTH = data.ET_BANDWIDTH_AUDIO;                      //音频带宽
                        LiveManagerModule.instance.VIDEO_BANDWIDTH = data.ET_BANDWIDTH_VIDEO;                      //视频带宽
                        LiveManagerModule.instance.SHAREPC_BANDWIDTH = data.ET_BANDWIDTH_VIDEO_SHAREPC;            //共享屏幕带宽
                        LiveManagerModule.instance.setDelayShowStatus(data.allow_delay);    //课室延时状态
                    }else{
                        LiveManagerModule.instance.PUBLISH_VIDEO_RESOLUTION_HD = data.ET_VIDEO_SIZE_PUBLISH_S;          //发布视频分辨率
                        LiveManagerModule.instance.PUBLISH_VIDEO_RESOLUTION_SD = data.ET_VIDEO_SIZE_PUBLISH_SD_S;       //发布视频分辨率标清
                        LiveManagerModule.instance.PUBLISH_VIDEO_RESOLUTION_LD = data.ET_VIDEO_SIZE_PUBLISH_LD_S;       //发布视频分辨率普清
                        LiveManagerModule.instance.SHARE_SCREEN_RESOLUTION = data.ET_VIDEO_SIZE_SHAREPC_S;           //共享屏幕分辨率
                        LiveManagerModule.instance.AUDIO_BANDWIDTH = data.ET_BANDWIDTH_AUDIO_S;                      //音频带宽
                        LiveManagerModule.instance.VIDEO_BANDWIDTH = data.ET_BANDWIDTH_VIDEO_S;                      //视频带宽
                        LiveManagerModule.instance.SHAREPC_BANDWIDTH = data.ET_BANDWIDTH_VIDEO_SHAREPC_S;            //共享屏幕带宽
                        if(LiveManagerModule.instance._teacherIsOpenAudio()){
                            LiveManagerModule.instance.userManager.teacherIsOpenAudio = true;
                        }else{
                            LiveManagerModule.instance.userManager.teacherIsOpenAudio = false;
                        }
                        LiveManagerModule.instance.userManager.banVideoStatus = LiveManagerModule.instance.classroomInfoManager.getControlAllStudentVideoStatus()!=0;
                        LiveManagerModule.instance.userManager.banAudioStatus = LiveManagerModule.instance.classroomInfoManager.getControlAllStudentAudioStatus()!=0;
                    }
                }
            }
            else if((data.error && data.error == "duplicated_member") || (typeof data.error === 'undefined' && data === "duplicated_member")){
                var msg = VC.ROUTER.LIVEBIG.LIVE_RELOGIN_AND_DISCONNECTION;
                LiveManagerModule.instance.classroomInfoManager.openErrorWindow(msg);
            }
            else if(data.cmd == "video:check_meeting_creating_status"){       //服务器通知客户端,重新发送注册命令
                var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                command.cmd = 'video:register_success';
                LiveManagerModule.instance.classRoomController.sendMessage(command);
            }
            else if(data.cmd == "video:create_meeting"){    //是否可以创建会议室通知
                cfManager.sipMeetingCreate(LiveManagerModule.instance.createMeetingParam, LiveManagerModule.instance.sipRoomNumber,  {area: LiveManagerModule.instance.txtArea, type: LiveManagerModule.instance.meetingType});     //创建会议
            }
            else if(data.cmd == "video:create_meeting_success"){    //会议室已成功创建通知
                if(timer != null) {
                    clearInterval(timer);
                    timer = null;
                }
                cfManager.sipMeetingJoin(LiveManagerModule.instance.sipRoomNumber, LiveManagerModule.instance.sipRoomNumber);     //加入会议室
            }
            else if(data.cmd == "video:video_publish_success"){     //用户视频发布成功通知,收到此通知的用户去订阅
                if(!LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid)) {
                    LiveManagerModule.instance.classroomInfoManager.updateUserSourceidFromMembersByUseridAndTypeAndValue(data.userid,data.source_name,data.source_id);
                    LiveManagerModule.instance._video_publish_successCMDtoSub(data);        //订阅视频
                }
            }
            else if(data.cmd == "video:audio_publish_success"){     //用户音频发布成功通知
                if(!LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid)){
                    if(!LiveManagerModule.instance.userManager.getIsSubscribeAudio() && !LiveManagerModule.instance.audioSubscribeLock) {
                        LiveManagerModule.instance._audioSubscribe(data.userid, data.source_id);         //订阅音频
                    }
                    if(!LiveManagerModule.instance.userManager.isTeacher() && data.isTeacher){
                        LiveManagerModule.instance.userManager.teacherIsOpenAudio = true;
                    }
                }
            }
            else if(data.cmd == "video:video_hangup_allow"){    //接受服务器挂机视频通知
                LiveManagerModule.instance._video_hangup_allowCMDtoHangup(data);
            }
            else if(data.cmd == "video:audio_hangup_allow"){        //接受服务器挂机音频通知,只有对应的用户会收到此命令
                LiveManagerModule.instance._audio_hangup_allowCMDtoHangup(data);
            }
            else if(data.cmd == "userctrl:stopvideo"){     //更改列表视频状态
                LiveManagerModule.instance.classroomInfoManager.updateUserStopvideoValueFromMembersByUseridAndValue(data.userid,data.status);   //更新members中的用户的视频状态
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
                if(!LiveManagerModule.instance.userManager.isTeacher()){
                    LiveManagerModule.instance._forbidenvideoCMDtoOpenAndClose(data);       //全部学生禁止或开启视频
                }
            }
            else if(data.cmd == "controlpanel:forbidenaudio"){ //收到老师控制音频命令
                if(LiveManagerModule.instance.userManager.isTeacher()){
                    return;
                }
                LiveManagerModule.instance._forbidenaudioCMDtoOpenAndClose(data);           //全部学生禁止或开启音频
            }
            else if(data.cmd == "video:change"){       //老师切换视频通知
                LiveManagerModule.instance.classroomInfoManager.teacherCurrentVideo = data.videoid;
                var ts = LiveManagerModule.instance._changeCMDtoGetVideoTag(data);
                LiveManagerModule.instance._changeCMDtoHandupup(data,ts);                 //设置学生举手状态(蓝色外边框)
                if(LiveManagerModule.instance.classroomInfoManager.getClassroomType() !== 1){
                    LiveManagerModule.instance._changeCMDtoChangeMainFrame(data,ts);
                }
            }
            else if(data.cmd == "video:classroom_end"){        //结束课堂
                var msg = VC.ROUTER.LIVEBIG.CLASS_HAVE_CLOSE;
                LiveManagerModule.instance.classroomInfoManager.showMessageWindow(msg);
                setTimeout(function(){
                    if(LiveManagerModule.instance.userManager.isTeacher()){
                        window.location.href = $('#vcliveHost').val() + '/app/camp/' + VC.ROUTER.LIVEBIG.PUBLIC_KEY + '/schedule.html';			
                    }else if(!LiveManagerModule.instance.userManager.isTeacher()){
                        window.location.href = $('#vcliveHost').val() + '/app/camp/' + VC.ROUTER.LIVEBIG.PUBLIC_KEY + '/schedule.html';			
                    }
                },3000);
            }
            else if(data.cmd == "userctrl:handspeak"){     //学生举手
                LiveManagerModule.instance.setStudentHandup(data.userid,data.status);
            }
            else if(data.cmd == "controlpanel:online"){        //老师更改在线状态--未用
            }
            else if(data.cmd == "userctrl:online"){        //学生更改在线状态--未用
            }
            else if(data.cmd == "controlpanel:login"){     //未用
                if(data.result){
                    $.modal.close();
                }else{
                    return;
                }
            }
            else if(data.cmd == "classroom:kickuser"){          //试听提示
                if(LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid) && data.roomid == LiveManagerModule.instance.classroomInfoManager.getRoomId()){
                    var msg = VC.ROUTER.LIVEBIG.CLASS_AUDITION_END;
                    LiveManagerModule.instance.classroomInfoManager.showMessageWindow(msg);
                    setTimeout(function(){
                        window.location.href = window.location.protocol + "//" + window.location.hostname + '/myvc';
                    },3000);
                }
            }
            else if(data.cmd == "controlpanel:nomoretime"){    //课堂时间提示闪烁
                if(data.roomid == LiveManagerModule.instance.classroomInfoManager.getRoomId()){
                    LiveManagerModule.instance.setDelayRemindCss(true);
                }
            }
            else if(data.cmd == "controlpanel:applydelay"){    //申请延时
                if(LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid) && LiveManagerModule.instance.userManager.isTeacher()){
                    LiveManagerModule.instance.setDelayApplyWindow(data);
                }
            }
            else if(data.cmd == "controlpanel:setdelay"){      //申请成功
                if(data.roomid == LiveManagerModule.instance.classroomInfoManager.getRoomId()){
                    LiveManagerModule.instance.setDelayRemindCss(false);
                    LiveManagerModule.instance.setDelayShowStatus(false);
                }
            }
            else if(data.cmd == "video:sharescreen"){      //老师开启共享屏幕成功
                if(!LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid) && data.isTeacher){
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
                if(!LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid)){
                    LiveManagerModule.instance.classroomInfoManager.teacherShareVideo = false;
                    LiveManagerModule.instance.pubAndSubresource.share.subscribe.splice(0,1);
                    if(LiveManagerModule.instance.classroomInfoManager.getTeacherWhiteboardStatus()){
                        LiveManagerModule.instance.whiteBoardManager.isOpenWhiteboard = true;
                    }else{
                        var cid = LiveManagerModule.instance.classroomInfoManager.getTeacherCurrentVideo();
                        var ts;
                        if(cid == 't_1') {
                            ts = 'divVideoLocal_a';
                        }
                        else if(cid == 't_2') {
                            ts = "divVideoLocal_b";
                        }
                        else {
                            if(LiveManagerModule.instance.userManager.isOneselfByUserid(cid))
                                ts = cid;
                            else
                                ts = 'currentVideo';
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
                var currentVideo = LiveManagerModule.instance.classroomInfoManager.getTeacherCurrentVideo();
                LiveManagerModule.instance._user_leaveCMDtoCleanMainFrame(data,currentVideo);
                if(!LiveManagerModule.instance.userManager.isTeacher() && data.isteacher){
                    LiveManagerModule.instance.userManager.teacherIsOpenAudio = false;
                }
                if(!LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid)) {
                    LiveManagerModule.instance.userQuitCleanSource(data.userid);
                }
            }else if(data.cmd == "classroom:timeout"){
                if(!LiveManagerModule.instance.userManager.isOneselfByUserid(data.userid)){
                    LiveManagerModule.instance.userQuitCleanSource(data.userid);
                }else{
                    var msg = VC.ROUTER.LIVEBIG.LIVE_JOIN_TIMEOUT_TIPS;
                    LiveManagerModule.instance.classroomInfoManager.showMessageWindow(msg);
                    LiveManagerModule.instance.isConnectTimeout = true;
                    cfManager.sipUnRegister();
                }
            }
            LiveManagerModule.instance.applyData();
        }
    },
    leaveChange:function(value){//主视频学生离开后改变主视频显示
        this.classroomInfoManager.teacherCurrentVideo = value;
        this.changeVideoShow(value);
    },
    setListStopspeak:function(userid,status){//设置人员列表音频图标状态
        this.classroomInfoManager.updateUserStopspeakValueFromMembersByUseridAndValue(userid,status);
        var obj = this.classroomInfoManager.findObjectByIdAndMembers(userid,this.classroomInfoManager.getMembers());
        if(obj != null){
            if(!this.userManager.isTeacher() && PublicStatic.StaticClass.isTeacherByRole(obj.roleid)){
                if(status == 2)
                    this.userManager.teacherIsOpenAudio = true;
                else
                    this.userManager.teacherIsOpenAudio = false;
            }
        }
    },
    setDelayApplyWindow: function (obj) {
        //TODO::设置申请延时的窗口数据
    },
    setDelayRemindCss:function(status){
        //TODO::设置时间提示闪烁
    },
    setDelayShowStatus:function(value){
        //TODO::设置申请延时按钮的显示状态
    },
    setCoursewareShow:function(obj){
        //TODO::显示课件转换进度
    },
    quitClassRoomJump:function(){
        //TODO::退出课室跳转
    },
    applyData : function(){
        //TODO::$scope.$apply
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
        if(LiveManagerModule.instance.userManager.isTeacher()){
            hangupID = LiveManagerModule.instance.pubAndSubresource.share.publish.hid1;
            if(hangupID != null && hangupID !== "" && typeof(hangupID) !== 'undefined') {
                cfManager.publishSipHangUp(LiveManagerModule.instance.sipRoomNumber, hangupID);
            }else{
                LiveManagerModule.instance.classroomInfoManager.teacherShareVideo = false;
            }
        }
    },
    teacherChangeOnlineStatus:function(status){     //老师改变在线状态命令
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'controlpanel:online';
        command.status = status;
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    studentChangeOnlineStatus:function(status){
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'userctrl:online';
        command.status = status;
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    userQuitCleanSource : function(userid){//用户退出,清除信息和资源
        this.classroomInfoManager.deleteUserFromMembersByUserid(userid);
        this.classroomInfoManager.deleteUserFromSearchMembersByUserid(userid);
        if(this.userManager.isTeacher()) {
            var idx = this.userManager.findIndexFromHandupListByUserid(userid);
            this.userManager.deleteUserFromHandupListByIndex(idx);
            this.userManager.clearHandupSelectStudentByUserid(userid);
        }
        //走马灯
        if (this.userManager.getIsShowScrollView()) {
            this.classroomInfoManager.stopScrollVideo();
            this.classroomInfoManager.startScrollVideo();
        }
    },
    setStudentHandup:function(userid,status){//设置列表的学生举手闪烁状态
        this.classroomInfoManager.updateUserHandspeakValueFromMembersByUseridAndValue(userid,status);
        if(this.userManager.isTeacher()){
            if(status == 1){
                var obj = this.classroomInfoManager.findObjectByIdAndMembers(userid,this.classroomInfoManager.getMembers());
                this.userManager.addUserToHandupList(obj);
            }
        }
    },
    studentHandUp:function(){      //学生举手
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'userctrl:handspeak';
        command.status = 1;
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    closePublishAudio:function(){           //挂机音频
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'video:audio_hangup';
        command.source_name = 'audio';
        command.isTeacher = LiveManagerModule.instance.userManager.isTeacher();
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    openPublishAudio:function(){            //发布音频
        var _this = $('#divAudio')[0];
        LiveManagerModule.instance._releaseOldPublishAudioResource(null,'audio');
        if(!LiveManagerModule.instance.audioPublishLock)
            LiveManagerModule.instance._audioPublish(_this);
    },
    closePublishVideo:function(){                   //学生挂机视频
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'video:video_hangup';
        command.source_name = 'video';
        command.isTeacher = false;
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    openPublishVideo:function(){        //发布自己的视频
        var param = LiveManagerModule.instance.createPublishVideoParam(LiveManagerModule.instance.userManager.getUserid(),s_w,s_h);
        LiveManagerModule.instance._releaseOldPublishVideoResources(LiveManagerModule.instance.userManager.getRole(),'video');
        LiveManagerModule.instance._publish(param);    // 学生发布视频
    },
    banPublishVideo:function(obj){  //通知学生禁止视频:此方法老师调用
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'video:video_ban';
        command.source_name = 'video';
        command.isTeacher = false;
        command.userid = obj.userid;
        command.userName = obj.username;
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    noBanPublishVideo:function(obj){        //通知学生取消禁止视频：此方法老师调用
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'video:video_noban';
        command.source_name = 'video';
        command.isTeacher = false;
        command.userid = obj.userid;
        command.userName = obj.username;
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    banPublishAudio:function(obj){      //通知学生禁止音频：此方法老师调用
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'video:audio_ban';
        command.isTeacher = false;
        command.source_name = 'audio';
        command.userid = obj.userid;
        command.userName = obj.username;
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    noBanPublishAudio:function(obj){        //通知学生取消禁止音频：此方法老师调用
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'video:audio_noban';
        command.source_name = 'audio';
        command.isTeacher = false;
        command.userid = obj.userid;
        command.userName = obj.username;
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    controlAllVideo:function(status){       //控制所有学生视频状态的命令
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'controlpanel:forbidenvideo';
        command.status = status;
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    controlAllAudio:function(status){//控制所有学生音频状态的命令
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'controlpanel:forbidenaudio';
        command.status = status;
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    changeVideoShow:function(value){  //老师
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'video:change';
        command.videoid = value;
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    handupStudentShow:function(id){     //切换举手学生视频
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'video:change';
        command.videoid = id;
        command.type = 2;//1:老师直接点击视频切换,2:老师点击举手列表切换
        LiveManagerModule.instance.classRoomController.sendMessage(command);
    },
    hangupAllSubSip:function(){     //挂机所有订阅的视频
        $.each(LiveManagerModule.instance.pubAndSubresource.video.subscribe,function(idx,subObj){
            if(subObj.hid != null && subObj.hid !== ""){
                cfManager.subscribeSipHangUp(LiveManagerModule.instance.sipRoomNumber,subObj.hid);
            }
        });
    },
    _register: function(url,port) { // 向视频API注册--ok
        if(LiveManagerModule.instance.isConnectTimeout)return;
        var userName;           //此用户名用于注册至视频服务器
        if(LiveManagerModule.instance.userManager.isTeacher()){
            userName = 'com'+LiveManagerModule.instance.classroomInfoManager.getRoomId()+'_'+LiveManagerModule.instance.userManager.getUserid();
        }else if(!LiveManagerModule.instance.userManager.isTeacher()){
            userName = 'mem'+LiveManagerModule.instance.classroomInfoManager.getRoomId()+'_'+LiveManagerModule.instance.userManager.getUserid();
        }
        var oExpertP = {        //注册参数
            id_Realm : LiveManagerModule.instance.mydomain, // 域，如 mydomain.tld
            id_PrivateIdentity : userName, // 私有ID,如 103
            id_PublicIdentity : ('sip:' + userName + '@' + LiveManagerModule.instance.mydomain), // 公有ID
            id_Password : '110', // 密码,如 101(暂时随便写)
            id_DisplayName : userName,
            et_websocket_server_url : ('wss://' + url + ':' + port),
            et_sip_outboundproxy_url : ('wss://' + url + ':' + port),
            et_ice_servers : [{url: 'stun:14.18.248.8:3478'}],
            et_enable_rtcweb_breaker : true, // true or false
            et_disable_early_ims : true, // true or false
            et_enable_media_caching : false, // true or false
            et_bandwidth : null, // { audio:64, video:512 } or null
            et_video_size : '{ minWidth:640, minHeight:480, maxWidth:1920, maxHeight:1080 }',
            et_Area_Isp: LiveManagerModule.instance.txtArea
        };
        cfManager.sipRegister(oExpertP);
    },
    _sharePCVideo:function(_this, idValue, _w, _h){     //发布共享屏幕
        var tagVideo = cfManager.sipCreateVideoTag(idValue, "video", 'local',
            PublicStatic.StaticClass.tsk_string_random(3), _w, _h);
        var hangupID = cfManager.sipPublishCall('call-screenshare', LiveManagerModule.instance.sipRoomNumber, [{
            call_PhoneNumber: LiveManagerModule.instance.sipRoomNumber,
            audio_remote: null,
            video_local: tagVideo,
            video_remote: null,
            label_info: _this,
            et_bandwidth : '{ audio:'+LiveManagerModule.instance.AUDIO_BANDWIDTH+', video:'+LiveManagerModule.instance.SHAREPC_BANDWIDTH+' }',       //带宽 将数据存储在数据库
            et_video_size: LiveManagerModule.instance.SHARE_SCREEN_RESOLUTION
        }]);
        if(LiveManagerModule.instance.userManager.isTeacher()){
            LiveManagerModule.instance.pubAndSubresource.share.publish.hid1 = hangupID;
        }
    },
    _subSharePCVideo:function(_this,idValue,_w,_h,videoSubRole,videoName,userid,source_id){        //订阅共享屏幕
        var subObj = new Object();
        subObj.userid = userid;
        subObj.sid = source_id;
        subObj.videoName = videoName;
        subObj.role = videoSubRole;
        var hangupID = cfManager.sipSubscribeCall('call-screenshare',LiveManagerModule.instance.sipRoomNumber, [ {
            call_PhoneNumber : source_id,
            audio_remote : null,
            video_local : null,
            video_remote : cfManager.sipCreateVideoTag(idValue, "video", 'remote',
                PublicStatic.StaticClass.tsk_string_random(3), _w, _h),
            label_info : _this
        }]);
        subObj.hid = hangupID;
        LiveManagerModule.instance.pubAndSubresource.share.subscribe.push(subObj);
    },
    _publish: function(publishParamObject) {    //发布视频
        console.log("当前分辨率:"+LiveManagerModule.instance.useResolution()+",带宽:"+LiveManagerModule.instance.useVideoBandwidth());
        if(typeof publishParamObject === 'undefined')return;
        var tagVideo = cfManager.sipCreateVideoTag(publishParamObject.id, "video", 'local',
            PublicStatic.StaticClass.tsk_string_random(3), publishParamObject.width, publishParamObject.height);
        var hangupID = cfManager.sipPublishCall('call-video',LiveManagerModule.instance.sipRoomNumber, [ {
            call_PhoneNumber : LiveManagerModule.instance.sipRoomNumber,
            audio_remote : null,
            video_local : tagVideo,
            video_remote : null,
            label_info : publishParamObject.idObject,
            et_bandwidth : '{ audio:'+LiveManagerModule.instance.AUDIO_BANDWIDTH+', video:'+LiveManagerModule.instance.useVideoBandwidth()+' }',       //带宽 将数据存储在数据库
            et_video_size : LiveManagerModule.instance.useResolution(),
            device_index: LiveManagerModule.instance.videoindex
        } ]);
        if(LiveManagerModule.instance.userManager.isTeacher()){
            if(teaSipCallNum == 1)
                LiveManagerModule.instance.pubAndSubresource.video.publish.hid1 = hangupID;
            else if(teaSipCallNum == 2)
                LiveManagerModule.instance.pubAndSubresource.video.publish.hid2 = hangupID;
        }else{
            LiveManagerModule.instance.pubAndSubresource.video.publish.hid1 = hangupID;
        }
    },
    _subscribe: function(subscribeParamObject) {     //订阅视频
        if(typeof subscribeParamObject === 'undefined')return;
        LiveManagerModule.instance._cleanSubscribeExcess(subscribeParamObject.id);              //订阅前清除多余的视频
        var subObj = new Object();
        subObj.userid = userid;
        subObj.sid = subscribeParamObject.sourceId;
        subObj.videoName = subscribeParamObject.videoName;
        subObj.role = subscribeParamObject.role;
        var hangupID = cfManager.sipSubscribeCall('call-video',LiveManagerModule.instance.sipRoomNumber, [ {
            call_PhoneNumber : subscribeParamObject.sourceId,
            audio_remote : null,
            video_local : null,
            video_remote : cfManager.sipCreateVideoTag(subscribeParamObject.id, "video", 'remote',
                PublicStatic.StaticClass.tsk_string_random(3), subscribeParamObject.width, subscribeParamObject.height),
            label_info : subscribeParamObject.idObject,
            audio_mode:'0'
        }]);
        subObj.hid = hangupID;
        LiveManagerModule.instance.pubAndSubresource.video.subscribe.push(subObj);
    },
    _subscribeHandup: function(subscribeParamObject){        //订阅举手学生视频
        if(typeof subscribeParamObject === 'undefined')return;
        LiveManagerModule.instance._cleanSubscribeExcess(subscribeParamObject.id);
        var subHandupObj = new Object();
        subHandupObj.userid = userid;
        subHandupObj.sid = subscribeParamObject.sourceId;
        subHandupObj.videoName = subscribeParamObject.videoName;
        subHandupObj.role = subscribeParamObject.role;
        var hangupID = cfManager.sipSubscribeCall('call-video',LiveManagerModule.instance.sipRoomNumber, [ {
            call_PhoneNumber : subscribeParamObject.sourceId,
            audio_remote : null,
            video_local : null,
            video_remote : cfManager.sipCreateVideoTag(subscribeParamObject.id, "video", 'remote',
                PublicStatic.StaticClass.tsk_string_random(3), subscribeParamObject.width, subscribeParamObject.height),
            label_info : subscribeParamObject.idObject,
            audio_mode:'0'
        }]);
        subHandupObj.hid = hangupID;
        LiveManagerModule.instance.pubAndSubresource.video.handup_subscribe.push(subHandupObj);
    },
    _hangupSubscribeHandup: function(){             //挂机订阅举手的学生视频
        var subhid = null;
        if(LiveManagerModule.instance.pubAndSubresource.video.handup_subscribe.length > 0) {
            subhid = LiveManagerModule.instance.pubAndSubresource.video.handup_subscribe[0].hid;
        }
        if(subhid != null)
            cfManager.subscribeSipHangUp(LiveManagerModule.instance.sipRoomNumber,subhid);
    },
    _audioPublish:function(_this){      //发布音频
        LiveManagerModule.instance.audioPublishLock = true;
        var hangupID = cfManager.sipPublishCall('call-audio',LiveManagerModule.instance.sipRoomNumber,[{
            call_PhoneNumber: LiveManagerModule.instance.sipRoomNumber,
            audio_remote: null,
            video_local: null,
            video_remote: null,
            label_info: _this,
            et_bandwidth : '{ audio:'+LiveManagerModule.instance.AUDIO_BANDWIDTH+', video:'+LiveManagerModule.instance.VIDEO_BANDWIDTH+' }'       //带宽 将数据存储在数据库
        }]);
        if(hangupID == null || typeof hangupID === 'undefined')
            LiveManagerModule.instance.audioPublishLock = false;
        LiveManagerModule.instance.pubAndSubresource.audio.publish.hid = hangupID;
    },
    _audioSubscribe:function(user,source_id){       //订阅音频
        LiveManagerModule.instance.audioSubscribeLock = true;
        var subobj = new Object();
        subobj.userid = user;
        subobj.sid = source_id;
        var hangupID = cfManager.sipSubscribeCall('call-audio',LiveManagerModule.instance.sipRoomNumber,[{
            call_PhoneNumber: LiveManagerModule.instance.sipRoomNumber,        //一个会议对应一个音频，source_id取会议id
            audio_remote: document.getElementById('audioRemote'),
            video_local: null,
            video_remote: null,
            audio_mode:'2'
        }]);
        subobj.hid = hangupID;
        if(LiveManagerModule.instance.pubAndSubresource.audio.subscribe.length > 0)
            LiveManagerModule.instance.pubAndSubresource.audio.subscribe = [];
        if(hangupID == null || typeof hangupID === 'undefined')
            LiveManagerModule.instance.audioSubscribeLock = false;
        LiveManagerModule.instance.pubAndSubresource.audio.subscribe.push(subobj);
    },
    _initCallBack: function (iCode, iMsgInfo, oSession) {    //初始化回调---ok
        if(iCode == ret_code.STACK_ING || iCode == ret_code.STACK_OK) {     //初始化回调----ok
            if(iCode == ret_code.STACK_ING) {
                LiveManagerModule.instance._register(LiveManagerModule.instance.url,LiveManagerModule.instance.port);     //注册
            }
        }
    },
    _registerCallBack: function(iCode, iMsgInfo, oSession){     //注册回调---ok
        if(iCode == ret_code.REG_ING || iCode == ret_code.REG_OK) {
            if(iCode == ret_code.REG_OK){
                if(LiveManagerModule.instance.classroomInfoManager.isHasMeeting()){
                    cfManager.sipMeetingJoin(LiveManagerModule.instance.sipRoomNumber, LiveManagerModule.instance.sipRoomNumber);     //加入会议室
                }else{
                    var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                    command.cmd = 'video:register_success';
                    LiveManagerModule.instance.classRoomController.sendMessage(command);
                    timer = null;
                    timer = setInterval(function(){
                        var commandReset = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                        commandReset.cmd = 'video:check_meeting_creating_status';
                        LiveManagerModule.instance.classRoomController.sendMessage(commandReset);
                    },CHECK_TIME);
                }
                LiveManagerModule.instance.shouldReReg = false;
            }
        }else if(iCode == ret_code.REG_FAIL){
            //LiveManagerModule.instance._register(LiveManagerModule.instance.url,LiveManagerModule.instance.port);     //注册
        }
    },
    _createMeetingCallBack: function(iCode, iMsgInfo, oSession){        //创建会议室回调---ok
        if(iCode == ret_code.MEET_CREATE){
            if((typeof(oSession) !== "undefined" && typeof(oSession.param) !== "undefined") && (oSession.param.result == 0 || oSession.param.result == 1)){   //0:为成功 1:为存在
                LiveManagerModule.instance.recreateMeetingCount++;
                var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                command.cmd = 'video:create_meeting_success';
                LiveManagerModule.instance.classRoomController.sendMessage(command);    //发送命令通知服务器会议室已创建
            }else if(typeof(oSession) !== "undefined" && typeof(oSession.param) !== "undefined" && oSession.param.result == 4){       //资源有限
                var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                command.cmd = 'video:create_meeting_unsuccess';
                LiveManagerModule.instance.classRoomController.sendMessage(command);
                var msg = VC.ROUTER.LIVEBIG.NO_CREATE_SUCCESS;
                LiveManagerModule.instance.classroomInfoManager.showMessageWindow(msg);
            }else if(typeof(oSession) !== "undefined" && typeof(oSession.param) !== "undefined" && oSession.param.result == 7){       //超时
                cfManager.sipMeetingCreate(LiveManagerModule.instance.createMeetingParam, LiveManagerModule.instance.sipRoomNumber,  {area: LiveManagerModule.instance.txtArea, type: LiveManagerModule.instance.meetingType});     //创建会议
            }
        }
    },
    _joinMeetingCallBackToPublishVideo : function(){    //加入会议室成功后发布视频
        if(LiveManagerModule.instance.videoSource.length!=0){  //判断是否有摄像头
            if(LiveManagerModule.instance.userManager.isTeacher()){      //判断是老师还是学生
                var param = LiveManagerModule.instance.createPublishVideoParam('divVideoLocal_a',t_w_1,t_h_1);
                teaSipCallNum=1;        //老师发布第一个视频
                LiveManagerModule.instance._publish(param);// 老师发布视频
            }else if(!LiveManagerModule.instance.userManager.isTeacher()){
                if(!LiveManagerModule.instance.userManager.getOpenVideoStatus()){           //是否发布过视频
                    if(!LiveManagerModule.instance.userManager.getBanVideoStatus()){
                        var param = LiveManagerModule.instance.createPublishVideoParam(LiveManagerModule.instance.userManager.getUserid(),s_w,s_h);
                        LiveManagerModule.instance._publish(param);// 学生发布视频
                    }
                }
            }
        }
    },
    _joinMeetingCallBackToPublishAudio : function(){
        if(LiveManagerModule.instance.audioSource.length>=2){      //判断是否有麦克风
            if(!LiveManagerModule.instance.userManager.getOpenAudioStatus()){       //判断是否发布过音频
                var _this = $('#divAudio')[0];
                if(LiveManagerModule.instance.userManager.isTeacher()){
                    if(!LiveManagerModule.instance.audioPublishLock)
                        LiveManagerModule.instance._audioPublish(_this);
                }else if(!LiveManagerModule.instance.userManager.isTeacher()){
                    if(!LiveManagerModule.instance.userManager.getBanAudioStatus()){        //是否为禁音 1:禁音  0：开启
                        if(!LiveManagerModule.instance.audioPublishLock)
                            LiveManagerModule.instance._audioPublish(_this);
                    }
                }
            }else{
                var msg = VC.ROUTER.LIVEBIG.HAVE_PUBLISH_AUDIO;
                LiveManagerModule.instance.classroomInfoManager.showMessageWindow(msg);
            }
        }
    },
    _joinMeetingCallBackToSubscribeAudio : function(){
        if(!LiveManagerModule.instance.userManager.getIsSubscribeAudio()){
            a:
            for(var i=0;i<LiveManagerModule.instance.classroomInfoManager.getMembers().length;i++){
                if(LiveManagerModule.instance.classroomInfoManager.getMembers()[i].userid != LiveManagerModule.instance.userManager.getUserid()){       //从列表中排除自己(不能订阅自己的音频)
                    for(var j=0;j<LiveManagerModule.instance.classroomInfoManager.getMembers()[i].videoInfos.length;j++){
                        var videoInfos = LiveManagerModule.instance.classroomInfoManager.getMembers()[i].videoInfos[j];
                        if(videoInfos.sourceName == "audio" &&
                            videoInfos.sourceId !== ""/* && videoInfos.status == 2*/){
                            LiveManagerModule.instance._audioSubscribe(LiveManagerModule.instance.classroomInfoManager.getMembers()[i].userid,videoInfos.sourceId);
                            break a;
                        }
                    }
                }
            }
        }
    },
    _joinMeetingCallBackToSubscribeVideo : function(){
        for(var i=0;i<LiveManagerModule.instance.classroomInfoManager.getMembers().length;i++){
            if(LiveManagerModule.instance.pubAndSubresource.video.subscribe.length >= LiveManagerModule.instance.classroomInfoManager.getScrollMembersCount()){
                break;
            }
            var members_userid = LiveManagerModule.instance.classroomInfoManager.getMembers()[i].userid;
            if(members_userid != LiveManagerModule.instance.userManager.getUserid()){                           //排除自己(不能订阅自己的视频)
                var roleid = LiveManagerModule.instance.classroomInfoManager.getMembers()[i].roleid;
                for(var j=0;j<LiveManagerModule.instance.classroomInfoManager.getMembers()[i].videoInfos.length;j++){
                    var videoInfo = LiveManagerModule.instance.classroomInfoManager.getMembers()[i].videoInfos[j];
                    if(videoInfo.sourceName != "audio" && videoInfo.sourceId !== ""){
                        var param;
                        if(roleid == 1){                //学生订阅老师
                            if(videoInfo.sourceName == "video"){
                                param = LiveManagerModule.instance.createSubscribeVideoParam('divVideoLocal_a',s_s_t_w,s_s_t_h,videoInfo.sourceId,members_userid,1,'video');
                            }else if(videoInfo.sourceName == "video2"){
                                param = LiveManagerModule.instance.createSubscribeVideoParam('divVideoLocal_b',s_s_t_w,s_s_t_h,videoInfo.sourceId,members_userid,1,'video2');
                            }
                            LiveManagerModule.instance._subscribe(param);
                        }else if(roleid == 2){          //订阅其他学生
                            var currentVideo = LiveManagerModule.instance.classroomInfoManager.getTeacherCurrentVideo();
                            if(!LiveManagerModule.instance.userManager.isTeacher()) {       //如果当前用户为学生,则只订阅老师当前主画面的学生,用于学生和老师画面同步
                                if(currentVideo !== 't_1' && currentVideo !== 't_2' && currentVideo != null && currentVideo !== ""){
                                    if(currentVideo == members_userid){
                                        param = LiveManagerModule.instance.createSubscribeVideoParam('currentVideo',s_w,s_h,videoInfo.sourceId,currentVideo,2,'video');
                                        LiveManagerModule.instance._subscribe(param);
                                    }
                                }
                            }else if(LiveManagerModule.instance.userManager.isTeacher()){		//老师订阅学生
                                param = LiveManagerModule.instance.createSubscribeVideoParam(members_userid,s_t_s_w,s_t_s_h,videoInfo.sourceId,members_userid,2,'video');
                                LiveManagerModule.instance._subscribe(param);
                            }
                        }
                    }
                }
            }
        }
    },
    _joinMeetingCallBackToSubscribeSharePCVideo : function(){
        var isOpenSharePCVideo = LiveManagerModule.instance.classroomInfoManager.getTeacherShareVideo();
        if(!LiveManagerModule.instance.userManager.isTeacher()){
            if(isOpenSharePCVideo){     //判断是否需要订阅共享屏幕
                for(var i=0;i<LiveManagerModule.instance.classroomInfoManager.getMembers().length;i++){
                    var members_userid = LiveManagerModule.instance.classroomInfoManager.getMembers()[i].userid;
                    var roleid = LiveManagerModule.instance.classroomInfoManager.getMembers()[i].roleid;
                    if(roleid == 1){
                        for(var j=0;j<LiveManagerModule.instance.classroomInfoManager.getMembers()[i].videoInfos.length;j++){
                            var videoInfo = LiveManagerModule.instance.classroomInfoManager.getMembers()[i].videoInfos[j];
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
                LiveManagerModule.instance.isJoinMeeting = true;
                LiveManagerModule.instance._joinMeetingCallBackToPublishVideo();     //发布视频
                LiveManagerModule.instance._joinMeetingCallBackToPublishAudio();     //发布音频
                LiveManagerModule.instance._joinMeetingCallBackToSubscribeAudio();   //订阅音频
                LiveManagerModule.instance._joinMeetingCallBackToSubscribeVideo();   //订阅视频
                LiveManagerModule.instance._joinMeetingCallBackToSubscribeSharePCVideo();   //订阅共享屏幕
            }else if(typeof(oSession) !== "undefined" && typeof(oSession.param) != "undefined" && oSession.param.result == 5){
                if(LiveManagerModule.instance.recreateMeetingCount > 5){
                    var msg = VC.ROUTER.LIVEBIG.LIVE_NO_MEETING_TIPS;
                    LiveManagerModule.instance.classroomInfoManager.showMessageWindow(msg);
                    return;
                }
                var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                command.cmd = 'video:create_meeting_unsuccess';
                LiveManagerModule.instance.classRoomController.sendMessage(command);
                var command2 = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                command2.cmd = 'video:register_success';
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
                if(LiveManagerModule.instance.userManager.isTeacher()){
                    console.log("*******************************:本地视频挂机成功");
                    var localID = oSession.labelInfo.id;
                    if(localID === 'divVideoLocal_a'){              //判断哪个视频挂机,清除对应的资源记录
                        videoName = "video";
                        LiveManagerModule.instance.pubAndSubresource.video.publish.pid1 = null;
                        LiveManagerModule.instance.pubAndSubresource.video.publish.hid1 = null;
                        LiveManagerModule.instance.userManager.setVideoOpenStatusByValueAndType(false,1);
                    }else if(localID === 'divVideoLocal_b'){
                        videoName = "video2";
                        LiveManagerModule.instance.pubAndSubresource.video.publish.pid2 = null;
                        LiveManagerModule.instance.pubAndSubresource.video.publish.hid2 = null;
                        LiveManagerModule.instance.userManager.setVideoOpenStatusByValueAndType(false,2);
                    }
                }else if(!LiveManagerModule.instance.userManager.isTeacher()){
                    videoName = "video";
                    LiveManagerModule.instance.pubAndSubresource.video.publish.pid1 = null;
                    LiveManagerModule.instance.pubAndSubresource.video.publish.hid1 = null;
                    LiveManagerModule.instance.userManager.openVideoStatus = false;
                }
                var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                command.cmd = 'video:video_hangup_success';//通知服务器该视频已挂机成功,清除对应的资源记录
                command.source_name = videoName;
                var stopvideoStatus = 0;
                if(!LiveManagerModule.instance.userManager.isTeacher()){
                    if(LiveManagerModule.instance.userManager.getBanVideoStatus()){
                        stopvideoStatus = 1;
                    }
                }
                var ctrlCommand = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                ctrlCommand.cmd = 'userctrl:stopvideo';
                ctrlCommand.videoName = videoName;
                ctrlCommand.status = stopvideoStatus;
                LiveManagerModule.instance.classRoomController.sendMessage(ctrlCommand);
                LiveManagerModule.instance.classRoomController.sendMessage(command);
            }
            else if(type == "P" && media_name == "audio"){      //音频挂机成功
                console.log("*************************************:本地音频挂机成功");
                LiveManagerModule.instance.audioPublishLock = false;
                LiveManagerModule.instance.pubAndSubresource.audio.publish.pid = null;
                LiveManagerModule.instance.pubAndSubresource.audio.publish.hid = null;
                LiveManagerModule.instance.userManager.openAudioStatus = false;
                var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                command.cmd = 'video:audio_hangup_success';//通知服务器,音频已挂机成功,更新members对应用户的资源记录
                command.source_name = 'audio';
                var stopspeakStatus = 0;
                if(!LiveManagerModule.instance.userManager.isTeacher()){
                    if(LiveManagerModule.instance.userManager.getBanAudioStatus()){
                        stopspeakStatus = 1;
                    }
                }
                var ctrlCommand = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                ctrlCommand.cmd = 'userctrl:stopspeak';
                ctrlCommand.status = stopspeakStatus;
                LiveManagerModule.instance.classRoomController.sendMessage(ctrlCommand);
                LiveManagerModule.instance.classRoomController.sendMessage(command);
            }
            else if(type == "S" && media_name == "video"){     //视频挂机成功
                console.log("***********************************:挂机订阅视频成功");
                var i = null;
                $.each(LiveManagerModule.instance.pubAndSubresource.video.subscribe,function(idx,subObj){
                    if(oSession.handup_id == subObj.hid){
                        i = idx;
                        return false;
                    }
                });
                if(i != null && i !== ""){
                    LiveManagerModule.instance.pubAndSubresource.video.subscribe.splice(i,1);
                }
                if(oSession.labelInfo.id === "handupVideo"){
                    LiveManagerModule.instance.pubAndSubresource.video.handup_subscribe = [];
                }
            }
            else if(type == "S" && media_name == "audio"){     //音频挂机成功
                console.log("******************************:挂机订阅的音频成功");
                LiveManagerModule.instance.userManager.isSubscribeAudio = false;
                LiveManagerModule.instance.pubAndSubresource.audio.subscribe = [];
                LiveManagerModule.instance.audioSubscribeLock = false;
            }
            else if(type == "P" && media_name == "sccreen share"){      //共享屏幕挂机成功
                console.log("******************************:挂机本地共享屏幕成功");
                LiveManagerModule.instance.pubAndSubresource.share.publish.pid1 = null;
                LiveManagerModule.instance.pubAndSubresource.share.publish.hid1 = null;
                LiveManagerModule.instance.classroomInfoManager.teacherShareVideo = false;
                var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                command.cmd = 'video:showscreen';
                command.status = false;
                var command2 = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                command2.cmd = 'video:showscreen_hangup';//通知其他人,老师挂机共享屏幕
                command2.isTeacher = true;
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
        var a = $('#'+LiveManagerModule.instance.userManager.getUserid()+' video');
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
            if(LiveManagerModule.instance.userManager.isTeacher()){
                if(typeof oSession !== 'undefined' && oSession.labelInfo.id === 'divVideoLocal_a'){//判断为第一个视频
                    LiveManagerModule.instance.pubAndSubresource.video.publish.pid1 = mediaObj.video_P.source_id;           //存储发布id
                    LiveManagerModule.instance._cleanTeaPublishExcess(1);
                    videoName = "video";
                    var src = $('#divVideoLocal_a video').attr('src');
                    $('#divVideoRemote video').attr('src', src);
                    LiveManagerModule.instance.classroomInfoManager.teacherCurrentVideo = 't_1';       //记录当前视频
                    if (!LiveManagerModule.instance.classroomInfoManager.getTeacherWhiteboardStatus()) {
                        var updatevideoid = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                        updatevideoid.cmd = 'video:change';//通知其他人,老师已进入会议室并发布视频(如果不通知,那老师后进入的话,其他人的主画面就不会切换)
                        updatevideoid.videoid = 't_1';
                        LiveManagerModule.instance.classRoomController.sendMessage(updatevideoid);
                    }
                    LiveManagerModule.instance.userManager.setVideoOpenStatusByValueAndType(true,1);
                }else if(typeof oSession !== 'undefined' && oSession.labelInfo.id === 'divVideoLocal_b'){
                    LiveManagerModule.instance.pubAndSubresource.video.publish.pid2 = mediaObj.video_P.source_id;
                    LiveManagerModule.instance._cleanTeaPublishExcess(2);
                    videoName = "video2";
                    if(!LiveManagerModule.instance._isHaveFirstVideo()){//是否有第一个视频
                        var updatevideoid = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                        updatevideoid.cmd = 'video:change';
                        updatevideoid.videoid = 't_2';
                        LiveManagerModule.instance.classRoomController.sendMessage(updatevideoid);
                        LiveManagerModule.instance.classroomInfoManager.teacherCurrentVideo = 't_2';
                    }
                    LiveManagerModule.instance.userManager.setVideoOpenStatusByValueAndType(true,2);
                }
            }else if(!LiveManagerModule.instance.userManager.isTeacher()){
                LiveManagerModule.instance._cleanStudentPublishExcess();
                videoName = "video";
                LiveManagerModule.instance.pubAndSubresource.video.publish.pid1 = mediaObj.video_P.source_id;
                LiveManagerModule.instance.userManager.openVideoStatus = true;
                LiveManagerModule.instance.userManager.banVideoStatus = false;
            }
            var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
            command.cmd = 'video:video_publish_success';//通知服务器,视频发布成功,更新members对应用户的资源记录
            command.isTeacher = LiveManagerModule.instance.userManager.isTeacher();
            command.source_name = videoName;
            command.source_id = mediaObj.video_P.source_id;
            var ctrlCommand = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
            ctrlCommand.cmd = 'userctrl:stopvideo'; //更新members的用户资源记录
            ctrlCommand.status = 2;
            ctrlCommand.videoName = videoName;
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
            LiveManagerModule.instance.audioPublishLock = false;
            var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
            command.cmd = 'video:audio_publish_success';//音频发布成功,通知服务器members对应用户的资源
            command.source_name = 'audio';
            command.isTeacher = LiveManagerModule.instance.userManager.isTeacher();
            command.source_id = mediaObj.audio_P.source_id;
            var ctrlCommand = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
            ctrlCommand.cmd = 'userctrl:stopspeak';//更新members的用户的音频资源
            ctrlCommand.status = 2;
            LiveManagerModule.instance.classRoomController.sendMessage(ctrlCommand);
            LiveManagerModule.instance.classRoomController.sendMessage(command);
            mediaObj.audio_P.MEDIA_STATUS = null;
            mediaObj.audio_P.SET_STATUS = null;
            mediaObj.audio_P.OK_STATUS = null;
            mediaObj.audio_P.source_id = null;
            LiveManagerModule.instance.pubAndSubresource.audio.publish.pid = mediaObj.audio_P.source_id;
            LiveManagerModule.instance.userManager.openAudioStatus = true;
            if(!LiveManagerModule.instance.userManager.isTeacher())
                LiveManagerModule.instance.userManager.banAudioStatus = false;
        }
    },
    _sharePublishSuccessFun: function(){        //发布共享屏幕成功后执行的方法
        if(mediaObj.share_P.MEDIA_STATUS && mediaObj.share_P.SET_STATUS && mediaObj.share_P.OK_STATUS){
            console.log("******************************:共享屏幕发布成功");
            LiveManagerModule.instance.pubAndSubresource.share.publish.pid1 = mediaObj.share_P.source_id;
            LiveManagerModule.instance.classroomInfoManager.teacherShareVideo = true;
            var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
            command.cmd = 'video:sharescreen';//共享屏幕发布成功,通知老师共享屏幕发布成功其他人
            command.isTeacher = LiveManagerModule.instance.userManager.isTeacher();
            command.source_name = 'share';
            command.source_id = LiveManagerModule.instance.pubAndSubresource.share.publish.pid1;
            var command2 = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
            command2.cmd = 'video:showscreen';//通知服务器,记录共享屏幕是否开启状态
            command2.status = true;
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
            LiveManagerModule.instance.classroomInfoManager.teacherShareVideo = true;         //学生设置课室是否开启共享屏幕
            mediaObj.share_S.MEDIA_STATUS = null;
            mediaObj.share_S.SET_STATUS = null;
            mediaObj.share_S.OK_STATUS = null;
            mediaObj.share_S.source_id = null;
            if(!LiveManagerModule.instance.userManager.isTeacher()){
                var ts;
                setTimeout(function(){
                    LiveManagerModule.instance.whiteBoardManager.isOpenWhiteboard = false;
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
            var videoid = LiveManagerModule.instance.classroomInfoManager.getTeacherCurrentVideo();
            if(!LiveManagerModule.instance.userManager.isTeacher()){
                var ts;
                if(!LiveManagerModule.instance.classroomInfoManager.getTeacherShareVideo()){
                    if(videoid == "t_1"){                   //如果老师主画面为第一个视频
                        setTimeout(function(){
                            ts = $('#divVideoLocal_a video').attr('src');
                            $('#divVideoRemote video').attr('src', ts);
                            if(typeof(ts) === "undefiend"){
                                $('#divVideoRemote video').attr('src', '');
                            }
                        },1500);
                    }else if(videoid == "t_2") {             //如果老师主画面为第二个视频
                        setTimeout(function(){
                            ts = $('#divVideoLocal_b video').attr('src');
                            $('#divVideoRemote video').attr('src', ts);
                            if(typeof(ts) === "undefined"){
                                $('#divVideoRemote video').attr('src','');
                            }
                        },1500);
                    }else if(videoid !== 't_1' && videoid !== 't_2' && videoid != null) {                                  //如果老师主画面为学生视频
                        setTimeout(function(){
                            if(LiveManagerModule.instance.classroomInfoManager.getTeacherCurrentVideo() == LiveManagerModule.instance.userManager.getUserid()){
                                var t = $('#'+LiveManagerModule.instance.userManager.getUserid()+' video').attr('src');
                                $('#divVideoRemote video').attr('src',t);
                                return;
                            }
                            ts = $('#currentVideo video').attr('src');
                            $('#divVideoRemote video').attr('src',ts);
                            if(typeof(ts) === "undefined"){
                                $('#divVideoRemote video').attr('src','');
                            }
                        },1500);
                    }else{
                        var id = oSession.labelInfo.id;
                        if(id === 'divVideoLocal_a') {
                            LiveManagerModule.instance.classroomInfoManager.teacherCurrentVideo = 't_1';
                        }else if(id === 'divVideoLocal_b') {
                            LiveManagerModule.instance.classroomInfoManager.teacherCurrentVideo = 't_2';
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
            }else if(LiveManagerModule.instance.userManager.isTeacher() && videoid != null){
                var htmlId = oSession.labelInfo.id;
                if(htmlId == 'handupVideo'){
                    setTimeout(function(){
                        ts = $('#handupVideo video').attr('src');
                        $('#divVideoRemote video').attr('src', ts);
                        if(typeof(ts) === "undefiend"){
                            $('#divVideoRemote video').attr('src', '');
                        }
                    },1500);
                }
            }
        }
    },
    _teacherIsOpenAudio:function(){                     //判断老师是否发布过音频
        var isOpen = false;
        for(var i=0;i<LiveManagerModule.instance.classroomInfoManager.getMembers().length;i++){
            var member_roleid = LiveManagerModule.instance.classroomInfoManager.getMembers()[i].roleid;
            if(member_roleid == 1){
                for(var j=0;j<LiveManagerModule.instance.classroomInfoManager.getMembers()[i].videoInfos.length;j++){
                    var videoInfos = LiveManagerModule.instance.classroomInfoManager.getMembers()[i].videoInfos[j];
                    if(videoInfos.sourceName == "audio" &&
                        videoInfos.sourceId !== ""/* && videoInfos.status == 2*/) {
                        isOpen = true;
                    }
                }
                break;
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
            LiveManagerModule.instance.audioSubscribeLock = false;
            LiveManagerModule.instance.userManager.isSubscribeAudio = true;
        }
    },
    _unRegCallBack: function(iCode,iMsgInfo,oSession){
        if(iCode == ret_code.UNREG_ING || iCode == ret_code.UNREG_OK){
            console.log("------------------------与服务器中断");
            var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
            command.cmd = 'classroom:unreg_ok';
            LiveManagerModule.instance.classRoomController.sendMessage(command);
            LiveManagerModule.instance.shouldReReg = true;
            var msg = VC.ROUTER.LIVEBIG.LIVE_DISCONNECT_VIDEO_SERVER;
            LiveManagerModule.instance.classroomInfoManager.openErrorWindow(msg);
        }else if(iCode == ret_code.UNREG_INFO){
            console.log("-----------------------被服务器踢掉了,重复登陆");
            var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
            command.cmd = 'classroom:unreg_info';
            LiveManagerModule.instance.classRoomController.sendMessage(command);
            var msg = VC.ROUTER.LIVEBIG.LIVE_REPEAT_LOGIN_VIDEO_SERVER;
            LiveManagerModule.instance.classroomInfoManager.openErrorWindow(msg);
        }else if(iCode == ret_code.USER_OBJ){
            console.log("-----------------------用户对象不存在,Why?");
            var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
            command.cmd = 'classroom:unreg_obj';
            LiveManagerModule.instance.classRoomController.sendMessage(command);
            var msg = VC.ROUTER.LIVEBIG.LIVE_NOT_EXIS_USER;
            LiveManagerModule.instance.classroomInfoManager.openErrorWindow(msg);
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
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'classroom:video_publish_fail';
        LiveManagerModule.instance.classRoomController.sendMessage(command);
        var msg = VC.ROUTER.LIVEBIG.LIVE_PUBLISH_VIDEO_FAIL;
        LiveManagerModule.instance._failCallBackTips(msg);
    },
    _publishAudioFailCallBack : function(oSession){
        console.log("发布音频失败......");
        LiveManagerModule.instance.audioPublishLock = false;
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'classroom:audio_publish_fail';
        LiveManagerModule.instance.classRoomController.sendMessage(command);
        var msg = VC.ROUTER.LIVEBIG.LIVE_PUBLISH_AUDIO_FAIL;
        LiveManagerModule.instance._failCallBackTips(msg);
    },
    _publishSccreenShareFailCallBack : function(oSession){
        console.log("发布共享屏幕失败......");
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'classroom:sccreen_share_publish_fail';
        LiveManagerModule.instance.classRoomController.sendMessage(command);
        var msg = VC.ROUTER.LIVEBIG.LIVE_PUBLISH_SCREEN_FAIL;
        LiveManagerModule.instance._failCallBackTips(msg);
    },
    _subscribeVideoFailCallBack : function(oSession){
        console.log("订阅视频失败......");
        var id = oSession.labelInfo.id;
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'classroom:video_subscribe_fail';
        command.params = id;
        LiveManagerModule.instance.classRoomController.sendMessage(command);
        var msg = VC.ROUTER.LIVEBIG.LIVE_SUBSCRIBE_VIDEO_FAIL;
        LiveManagerModule.instance._failCallBackTips(msg);
    },
    _subscribeAudioFailCallBack : function(oSession){
        console.log("订阅音频失败......");
        var id = oSession.labelInfo.id;
        LiveManagerModule.instance.audioSubscribeLock = false;
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'classroom:audio_subscribe_fail';
        command.params = id;
        LiveManagerModule.instance.classRoomController.sendMessage(command);
        var msg = VC.ROUTER.LIVEBIG.LIVE_SUBSCRIBE_AUDIO_FAIL;
        LiveManagerModule.instance._failCallBackTips(msg);
    },
    _subscribeSccreenShareFailCallBack : function(oSession){
        console.log("订阅共享屏幕失败......");
        var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
        command.cmd = 'classroom:sccreen_share_subscribe_fail';
        LiveManagerModule.instance.classRoomController.sendMessage(command);
        var msg = VC.ROUTER.LIVEBIG.LIVE_SUBSCRIBE_SCREEN_FAIL;
        LiveManagerModule.instance._failCallBackTips(msg);
    },
    _failCallBack:function(iCode, iMsgInfo, oSession) {     //发布失败回调
        if(iCode == ret_code.CALL_FAIL || iCode == ret_code.CALL_ERROR || iCode == ret_code.CALL_LOFAIL || iCode == ret_code.CALL_ROFAIL) {
            if(typeof(oSession) !== "undefined"){
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
                if(LiveManagerModule.instance.userManager.isTeacher()){
                    if(localID === 'divVideoLocal_b'){
                        videoName = 'video2';
                    }
                }
                var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                command.cmd = 'video:video_hangup_fail';
                command.source_name = videoName;
                LiveManagerModule.instance.classRoomController.sendMessage(command);
            }else if(type === 'P' && media_name === 'audio'){
                var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                command.cmd = 'video:audio_hangup_fail';
                command.source_name = 'audio';
                LiveManagerModule.instance.classRoomController.sendMessage(command);
            }
        }
    },
    _rejectCallBack:function(iCode, iMsgInfo, oSession){    //拒绝允许
        if(iCode == ret_code.MEDIA_REJECT){
            var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
            command.cmd = 'classroom:reject';//拒绝设备
            command.params = oSession.o_event.o_session.s_type;
            LiveManagerModule.instance.classRoomController.sendMessage(command);
        }else if(iCode == ret_code.MEIDA_ACCEPT){
            var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
            command.cmd = 'classroom:accept';
            command.params = oSession.o_event.o_session.s_type;
            LiveManagerModule.instance.classRoomController.sendMessage(command);
        }
    },
    _releaseOldPublishVideoResources:function(roleid,source_name){        //释放发布视频资源,roleid用户的角色,source_name为资源类型
        var hangupID = null;
        if(roleid == 1) {
            if (source_name == "video") {
                hangupID = LiveManagerModule.instance.pubAndSubresource.video.publish.hid1;
            } else if (source_name == "video2") {
                hangupID = LiveManagerModule.instance.pubAndSubresource.video.publish.hid2;
            }
        }else if(roleid == 2){
            if (source_name == "video") {
                hangupID = LiveManagerModule.instance.pubAndSubresource.video.publish.hid1;
            }
        }
        if(hangupID != null){
            cfManager.publishSipHangUp(LiveManagerModule.instance.sipRoomNumber, hangupID);
        }
    },
    _releaseOldPublishAudioResource:function(roleid,source_name){        //释放发布音频资源,roleid用户的角色,source_name为资源类型
        if(source_name === "audio") {
            var hangupID = LiveManagerModule.instance.pubAndSubresource.audio.publish.hid;
            if (hangupID != null && typeof(hangupID) !== 'undefined') {
                cfManager.publishSipHangUp(LiveManagerModule.instance.sipRoomNumber, hangupID);
            }
        }
    },
    _SingledoubleSip:function(num,status){  //单双摄像开关切换。num：1为第一个视频，num：2为第二个视频,status:为当前视频是否已经开启了
        if(num == 2){
            if(!status){            //如果没开启
                LiveManagerModule.instance.videoindex = 1;
                var param = LiveManagerModule.instance.createPublishVideoParam('divVideoLocal_b',t_w_2,t_h_2);
                teaSipCallNum=2;
                LiveManagerModule.instance._releaseOldPublishVideoResources(1,'video2');
                LiveManagerModule.instance._publish(param); // 老师发布视频
            }else{                  //如果已开启，则请求挂机
                var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                command.cmd = 'video:video_hangup';
                command.isTeacher = true;
                command.source_name = 'video2';
                LiveManagerModule.instance.classRoomController.sendMessage(command);
            }
        }else if(num == 1){
            if(!status){
                LiveManagerModule.instance.videoindex = 0;
                var param = LiveManagerModule.instance.createPublishVideoParam('divVideoLocal_a',t_w_1,t_h_1);
                teaSipCallNum=1;
                LiveManagerModule.instance._releaseOldPublishVideoResources(1,'video');
                LiveManagerModule.instance._publish(param); // 老师发布视频
            }else{
                var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
                command.cmd = 'video:video_hangup';
                command.isTeacher = true;
                command.source_name = 'video';
                LiveManagerModule.instance.classRoomController.sendMessage(command);
            }
        }
    },
    leaveClassroom:function(){
        if(LiveManagerModule.instance.userManager.isTeacher()){
            if(LiveManagerModule.instance.isJoinMeeting) {
                cfManager.sipMeetingLeave(LiveManagerModule.instance.sipRoomNumber, LiveManagerModule.instance.sipRoomNumber);
            }
            /*var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
            command.cmd = 'video:classroom_end';
            command.role = 1;
            LiveManagerModule.instance.classRoomController.sendMessage(command);*/
        	window.location.href = $('#vcliveHost').val() + '/app/camp/' + VC.ROUTER.LIVEBIG.PUBLIC_KEY + '/schedule.html';
        }else if(!LiveManagerModule.instance.userManager.isTeacher()){
            if(LiveManagerModule.instance.isJoinMeeting) {
                cfManager.sipMeetingLeave(LiveManagerModule.instance.sipRoomNumber, LiveManagerModule.instance.sipRoomNumber);
            }
            window.location.href = $('#vcliveHost').val() + '/app/camp/' + VC.ROUTER.LIVEBIG.PUBLIC_KEY + '/schedule.html';
        }
    },
    findSubHidByUserid:function(userid){        //查找订阅的用户的挂机id
        var sub_hid = null;
        $.each(LiveManagerModule.instance.pubAndSubresource.video.subscribe,function(index,obj){
            if(userid == obj.userid){
                sub_hid = obj.hid;
                return false;
            }
        });
        return sub_hid;
    },
    handUpSubSip:function(sub_hid){    //根据sub_hid挂机自己订阅的视频
        if(sub_hid != null && sub_hid !== "")
            cfManager.subscribeSipHangUp(LiveManagerModule.instance.sipRoomNumber, sub_hid);
    },
    _bindEvent:function() {
        $('#delayApply').click(function(){
            if(!LiveManagerModule.instance.userManager.isTeacher())
                return;
            var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
            command.cmd = 'controlpanel:applydelay';
            LiveManagerModule.instance.classRoomController.sendMessage(command);
        });
    }
};

// 刷新或关闭页面
function distoryRes() {
    if(LiveManagerModule.instance.isJoinMeeting)
        cfManager.sipMeetingLeave(LiveManagerModule.instance.sipRoomNumber, LiveManagerModule.instance.sipRoomNumber);      //离开会议
    var command = PublicStatic.StaticClass.clone(LiveManagerModule.instance.getDefaultCmdParam());
    command.cmd = 'chat:leave';
    LiveManagerModule.instance.classRoomController.sendMessage(command);
}