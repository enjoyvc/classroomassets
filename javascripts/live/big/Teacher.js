/**
 * 老师
 * @constructor
 */
var TeacherModule = TeacherModule || {};
function Teacher(classRoomController){
    TeacherModule.instance = this;
    this.classRoomController = classRoomController;

    this.userid = classRoomController.getUserId();         //用户ID
    this.role = classRoomController.getRole();           //用户角色
    this.username = null;       //用户名
    this.online = 0;            //在线状态,默认为0
    this.avatar = "";           //头像
    this.isauth = 1;            //1：实名用户  0：非实名用户
    this.connectFirstVideo = false;     //是否连接了第一个视频设备
    this.openFirstVideoStatus = false;      //是否打开第一个摄像头。默认false
    this.connectSecondVideo = false;    //是否连接了第二个视频设备
    this.openSecondVideoStatus = false;     //是否打开第二个摄像头。默认false
    this.connectAudio = false;              //是否连接了麦克风。默认false
    this.openAudioStatus = false;           //是否打开音频。默认false
    this.privateMessage = [];               //私信列表
    this.handupList = [];                   //举手学生
    this.handupListViewShow = false;        //是否显示举手列表窗口,默认为false
    this.isSubscribeAudio = false;          //是否订阅过音频
    this.handupSelectStudent = null;          //存储学生举手列表中选择的学生
    this.isShowChangeClassroomModeView = false; //是否显示切换课程模式的视图
    this.isShowScrollView = true;               //是否显示走马灯视图
    this.guestid = null;
    this.guestname = "";

}
Teacher.prototype = {
    constructor : Teacher,
    init : function(){
        this.classroomInfoManager = TeacherModule.instance.classRoomController.getClassroomInfoManager();      //房间信息对象
        this.chatManager = TeacherModule.instance.classRoomController.getChatManager();     //聊天对象
        this.whiteBoardManager = TeacherModule.instance.classRoomController.getWhiteBoardManager();//白板对象
        this.liveManager = TeacherModule.instance.classRoomController.getLiveManager();     //媒体对象
    },
    getUserid : function(){     //获取用户ID
        return this.userid;
    },
    getRole : function(){       //获取角色
        return this.role;
    },
    isTeacher : function(){     //是否为老师
        return PublicStatic.StaticClass.isTeacherByRole(this.role);
    },
    isGuest : function() {
        return this.guestid != null;;
    },
    beGuest : function() {
        
    },
    notBeGuest : function() {

    },

    getUsername : function(){   //获取用户名
        return this.username;
    },
    getOnline : function(){     //获取在线状态值
        return this.online;
    },
    getAvatar : function(){     //获取头像
        return this.avatar;
    },
    getIsauth : function(){     //是否为实名用户
        return this.isauth;
    },
    isConnectFirstVideo : function(){       //是否连接了第一个摄像头
        return this.connectFirstVideo;
    },
    isConnectSecondVideo : function(){      //是否连接了第二个摄像头
        return this.connectSecondVideo;
    },
    getOpenFirstVideoStatus : function(){   //获取第一个摄像头状态
        return this.openFirstVideoStatus;
    },
    getOpenSecondVideoStatus : function(){  //获取第二个摄像头状态
        return this.openSecondVideoStatus;
    },
    isConnectAudio : function(){            //是否连接麦克风
        return this.connectAudio;
    },
    getOpenAudioStatus : function(){              //获取麦克风状态
        return this.openAudioStatus;
    },
    getPrivateMessage : function(){         //获取私信列表
        return this.privateMessage;
    },
    getHandupList : function(){             //获取举手学生列表
        return this.handupList;
    },
    deletePrivateMessageByUserid : function(userid){        //根据userid清除对应用户的信息
        PublicStatic.StaticClass.checkUserid(userid);
        var temp = [];
        $.each(this.privateMessage,function(i,o){
            if(o.userid != userid){
                temp.push(o);
            }
        });
        this.privateMessage = temp;
    },
    isEmptyForPrivateMessage : function(){      //私聊列表是否为空
        return this.privateMessage <1;
    },
    unshiftPrivateMessage : function(data){     //unshift私信列表,将最新的信息置于第一位
        this.privateMessage.unshift(data);
    },
    findIndexFromHandupListByUserid : function(userid){    //根据userid从举手列表中获取对应的索引
        return PublicStatic.StaticClass.findIndexFromMembersById(userid,TeacherModule.instance.handupList);
    },
    addUserToHandupList : function(obj){        //添加用户到举手列表
        if(obj != null)
            TeacherModule.instance.handupList.push(obj);
    },
    deleteUserFromHandupListByIndex : function(index){      //根据索引从举手列表删除对应的用户
        if(index != null)
            TeacherModule.instance.handupList.splice(index,1);
    },
    isEmptyForHandupList : function(){          //举手列表是否为空
        return this.handupList < 1;
    },
    getHandupListViewShow : function(){         //获取举手列表窗口的显示状态
        return this.handupListViewShow;
    },
    getIsSubscribeAudio : function(){           //获取是否订阅过音频的状态
        return TeacherModule.instance.isSubscribeAudio;
    },
    addUserToHandupSelectStudentByObject : function(obj){   //将选中的学生添加进列表
        if(obj != null)
            TeacherModule.instance.handupSelectStudent = obj;
    },
    clearHandupSelectStudentByUserid : function(userid){    //根据userid清除选中的学生
        if(this.handupSelectStudent != null && userid == this.handupSelectStudent.userid){
            this.handupSelectStudent = null;
        }
    },
    getHandupSelectStudent : function(){        //获取学生举手列表中选择的学生
        return this.handupSelectStudent;
    },
    isCanChangeVideoByHandupByValue : function(value){      //是否能够切换视频(举手)
        var flag = true;
        if(this.handupSelectStudent == null){
            flag = false;
        }else if(value != this.handupSelectStudent.userid){
            flag = false;
        } else {
            if (typeof (MCU_VER) === 'undefined') 
                var video_src = $('#handupVideo video').attr('src');
            else
                var video_src = $('#handupVideo video').prop('srcObject');
            if(typeof video_src === 'undefined' || video_src == null){
                flag = false;
            }
        }
        return flag;
    },
    isEmptyForHandupSelectStudent :function(){      //HandupSelectStudent是否为空
        return this.handupSelectStudent == null;
    },
    getIsShowChangeClassroomModeView : function(){  //获取是否显示切换课程模式窗口的状态
        return this.isShowChangeClassroomModeView;
    },
    getIsShowScrollView : function(){       //获取是否显示走马灯视图的状态
        return this.isShowScrollView;
    },
    isOneselfByUserid : function(id){   //根据用户ID判断当前用户是否为自己
        return this.userid == id;
    },
    setVideoConnectStatusByVideoConnectCount : function(VideoConnectCount){     //根据连接的视频设备数量设置状态
        if(VideoConnectCount > 0 && VideoConnectCount < 2) {
            this.connectFirstVideo = true;
        }else if(VideoConnectCount >=2) {
            this.connectFirstVideo = true;
            this.connectSecondVideo = true;
        }
    },
    setAudioConnectStatusByAudioConnectCount : function(AudioConnectCount){     //根据连接的音频设备数量设置状态
        if(AudioConnectCount >= 1){
            this.connectAudio = true;
        }
    },
    setVideoOpenStatusByValueAndType : function(value,type){        //根据value和type设置对应的视频打开状态   type(1:第一个视频,2:第二个视频)
        if(type == 1){
            this.openFirstVideoStatus = value;
        }else if(type == 2){
            this.openSecondVideoStatus = value;
        }
    },
    controlChat : function(){       //老师控制讨论区发言
        if(this.classroomInfoManager.getControlAllStudentChatStatus()==0){
            this.classroomInfoManager.controlAllStudentChatStatus = 1;   ////讨论区发言关闭
        }else{
            this.classroomInfoManager.controlAllStudentChatStatus = 0;//讨论区发言开启
        }
        //发送命令通知服务器,记录是否开启允许聊天状态
        var command = {
            cmd:"controlpanel:switch_discuss_zone_permission",
            roomid:this.classroomInfoManager.getRoomId(),
            status:this.classroomInfoManager.getControlAllStudentChatStatus(),
            userid:this.userid,
            userName:this.username,
            classroomName:this.classroomInfoManager.getClassroomName()
        };
        this.classRoomController.sendMessage(command);
    },
    openOrCloseApp : function(){    //打开或关闭程序
        var msg = VC.ROUTER.LIVEBIG.LIVE_DOC_AND_APP_TIPS;
        this.classroomInfoManager.showMessageWindow(msg);
    },
    setChatStatueByUser : function(user){    //左侧列表,老师控制学生讨论区发言
        var obj = this.classroomInfoManager.findObjectByIdAndMembers(user.userid,this.classroomInfoManager.getMembers());
        if(obj != null){
            if(user.stopchat == 0){
                this.classroomInfoManager.updateUserStopchatValueFromMembersByUseridAndValue(user.userid,1);
            }else{
                this.classroomInfoManager.updateUserStopchatValueFromMembersByUseridAndValue(user.userid,0);
            }
            var messagejson = new Object();
            messagejson.cmd = "userctrl:stopchat";
            messagejson.roomid = this.classroomInfoManager.getRoomId();
            messagejson.userid = user.userid;
            messagejson.status = obj.stopchat;
            messagejson.userName = user.username;
            messagejson.classroomName = this.classroomInfoManager.getClassroomName();
            this.classRoomController.sendMessage(messagejson);
        }
    },
    openPrivateMessageWindowToUser : function(user){  //左侧列表,老师打开对其他人的私信窗口
        this.deletePrivateMessageByUserid(user.userid);
        this.chatManager.openPrivateMessageWindowToUser(user.userid,user.username,user.avatar);
    },
    openPrivateMessage : function(){    //老师打开私信列表(打开别人发过来的信息)
        if(!this.isEmptyForPrivateMessage()){
            this.chatManager.openPrivateMessageWindowToUser(this.getPrivateMessage()[0].userid,this.getPrivateMessage()[0].username,this.getPrivateMessage()[0].avatar);   //打开窗口
            this.deletePrivateMessageByUserid(this.getPrivateMessage()[0].userid);
        }
    },
    firstVideoOnAndOff : function(){//老师开关第一个视频
        if(!this.isConnectFirstVideo()){
            var msg = VC.ROUTER.LIVEBIG.MEDIA_TIPS;
            this.classroomInfoManager.showMessageWindow(msg);return;
        }
        this.liveManager._SingledoubleSip(1,this.getOpenFirstVideoStatus());
    //    this.openFirstVideoStatus = !this.getOpenFirstVideoStatus();
    },
    secondVideoOnAndOff : function(){//老师开关第二个视频
        if(!this.isConnectSecondVideo()){
            var msg = VC.ROUTER.LIVEBIG.MEDIA_TIPS;
            this.classroomInfoManager.showMessageWindow(msg);return;
        }
        this.liveManager._SingledoubleSip(2,this.getOpenSecondVideoStatus());
    //    this.openSecondVideoStatus = !this.getOpenSecondVideoStatus();
    },
    audioOnAndOff : function(){//老师开关音频
        if(!this.isConnectAudio()){
            var msg = VC.ROUTER.LIVEBIG.MEDIA_TIPS;
            this.classroomInfoManager.showMessageWindow(msg);return;
        }
        if(this.getOpenAudioStatus()){
            this.liveManager.closePublishAudio();     //off
        }else{
            this.liveManager.openPublishAudio();      //on
        }
    },
    controlAllVideoIsOpen : function(){//控制所有学生视频的开关是否打开
        return this.classroomInfoManager.getControlAllStudentVideoStatus() == 0;
    },
    controlAllVideo : function(){//老师控制所有学生的视频开关
        if(this.controlAllVideoIsOpen()){
            this.liveManager.controlAllVideo(1);        //关
            this.classroomInfoManager.controlAllStudentVideoStatus = 1;
            this.classroomInfoManager.updateAllStudentStopvideoValueFromMembersAndSearchMembersByValue(1);
        }else{
            this.liveManager.controlAllVideo(0);        //开
            this.classroomInfoManager.controlAllStudentVideoStatus = 0;
            this.classroomInfoManager.updateAllStudentStopvideoValueFromMembersAndSearchMembersByValue(0);
        }
    },
    controlAllAudioIsOpen : function(){//控制所有学生音频的开关是否打开
        return this.classroomInfoManager.getControlAllStudentAudioStatus() == 0;
    },
    controlAllAudio : function(){//老师控制所有学生的音频开关
        if(this.controlAllAudioIsOpen()){
            this.liveManager.controlAllAudio(1);//关
            this.classroomInfoManager.controlAllStudentAudioStatus = 1;
        }else{
            this.liveManager.controlAllAudio(0);//开
            this.classroomInfoManager.controlAllStudentAudioStatus = 0;
        }
    },
    controlSingleStudentVideoOpenOrBan : function(obj){//老师控制单个学生的视频开关
        if(obj.stopvideo == 0){     //如果该学生没视频
            return;
        }
        if(obj.stopvideo == 2){     //如果该学生有视频
            this.liveManager.banPublishVideo(obj);             //禁止
        }else if(obj.stopvideo == 1){   //如果该学生被禁止
            this.liveManager.noBanPublishVideo(obj);           //开启
            this.classroomInfoManager.updateUserStopvideoValueFromMembersByUseridAndValue(obj.userid,0);
        }
    },
    controlSingleStudentAudioOpenOrBan : function(obj){//老师控制单个学生的音频开关
        if(obj.stopspeak == 0 && !this.classroomInfoManager.isTeachingMode()){//如果该学生没音频
            return;
        }
        if(obj.stopspeak == 2){ //如果该学生有音频
            this.liveManager.banPublishAudio(obj);  //禁止
        }else if(obj.stopspeak == 1){//如果该学生被禁止
            this.liveManager.noBanPublishAudio(obj); //开启
            this.classroomInfoManager.updateUserStopspeakValueFromMembersByUseridAndValue(obj.userid,0);
        }
    },
    shareScreenOnAndOff : function(){//老师共享屏幕开关
        if(this.classroomInfoManager.getTeacherShareVideo()){
            this.liveManager.closeSharePCVideo();//关
        }else{
            this.liveManager.openSharePCVideo();//开
        }
    },
    _changeHandupCss : function(){//通知举手的学生改变举手闪烁样式
        $.each(this.getHandupList(),function(index,member){
            var command = {
                cmd:"userctrl:handspeak",
                roomid:roomId,
                userid:member.userid,
                status:0,
                userName: member.username,
                classroomName: this.classroomInfoManager.getClassroomName()
            };
            this.liveManager.classRoomController.sendMessage(command);
        });
    },
    clearHandupListAndCss : function(){//清除举手列表和举手样式,通知学生举手结束
        this._changeHandupCss();
        this.classroomInfoManager.allowHandup = false;
        this.handupList = [];
        this.handupSelectStudent = null;
        var command2 = {
            cmd:"controlpanel:switch_global_raise_hand_permission",
            roomid:this.classroomInfoManager.getRoomId(),
            status:this.classroomInfoManager.getAllowHandup()?0:1,
            time:null,
            userid:this.getUserid(),
            userName:this.getUsername(),
            classroomName:this.classroomInfoManager.getClassroomName()
        };
        this.classRoomController.sendMessage(command2);
    },
    isCanAllowHandup : function(){//是否允许打开允许举手按钮
        if(!this.classroomInfoManager.isTeachingMode()){
            var msg = VC.ROUTER.LIVEBIG.DISCUSSION_HANDUP_TIPS;
            this.classroomInfoManager.showMessageWindow(msg);return;
        }
        if(this.classroomInfoManager.getAllowHandup()){
            var msg = VC.ROUTER.LIVEBIG.LIVE_OPEN_HANDUP_TIPS;
            this.classroomInfoManager.showMessageWindow(msg);
            return;
        }
        return true;
    },
    allowHandupOpen : function(){//老师允许举手
        this.classroomInfoManager.allowHandup = true;
        this.handupList = [];//每次允许举手都清空原来的列表
        if(!this.isEmptyForHandupSelectStudent()) {//如果之前选中过其他学生,则先禁用该学生,避免重复订阅
            this.liveManager.banPublishAudio(this.handupSelectStudent);
        }
        var command = {//通知学生,老师允许举手了
            cmd:"controlpanel:switch_global_raise_hand_permission",
            roomid:this.classroomInfoManager.getRoomId(),
            status:this.classroomInfoManager.getAllowHandup()?0:1,
            time:60,
            userid:this.getUserid(),
            userName:this.getUsername(),
            classroomName:this.classroomInfoManager.getClassroomName()
        };
        this.classRoomController.sendMessage(command);
    },
    handupListOpenAndClose : function(){//举手列表打开或关闭
        this.handupListViewShow = !this.handupListViewShow;
    },
    closeHandupList : function(){//关闭举手列表
        this.handupListViewShow = false;
    },
    audioStatusTitle : function(status){//学生麦克风状态提示
        var title = "";
        if(status == 1||(status == 0 && this.classroomInfoManager.isTeachingMode()))
            title = VC.ROUTER.LIVEBIG.LIVE_AUDIO_STATUS_TITLE;
        else if(status == 0)
            title = VC.ROUTER.LIVEBIG.LIVE_NO_STATUS_TITLE;
        return title;
    },
    videoStatusTitle : function(status){//学生摄像头状态提示
        var title = "";
        if(status == 1)
            title = VC.ROUTER.LIVEBIG.LIVE_VIDEO_STATUS_TITLE;
        else if(status == 0)
            title = VC.ROUTER.LIVEBIG.LIVE_NO_STATUS_TITLE;
        return title;
    },
    chatStatusTitle : function(status){//学生聊天状态提示
        var title = "";
        if(status == 1)
            title = VC.ROUTER.LIVEBIG.LIVE_CHAT_STATUS_TITLE;
        return title;
    },
    showOtherUserAvatar : function(url){//显示其他用户头像
        if(url === ""){
            return url;
        }
        return {
            'background-image': 'url('+url+')',
            'background-size': '100% 100%'
        };
    },
    addStudent : function(){//添加学生
        var url = window.location.protocol + "//" + window.location.hostname + '/order/teacher/1';
        window.open(url,'_blank');
    },
    openOrCloseWhiteboard : function(){//打开或关闭白板
        this.whiteBoardManager.openOrCloseWhiteboard();
    },
    sharewhiteboardToGuest : function(toUserid, enable) {
        var command = {
            cmd:"controlpanel:sharewbguest",
            roomid:this.classroomInfoManager.getRoomId(),
            status:enable,//0:关闭 1:打开
            userid:toUserid
        };
        this.classRoomController.sendMessage(command);
    },

    _findSourceIdByUserVideoInfos : function(videoInfos){       //获取订阅视频的资源id
        var source_id = null;
        $.each(videoInfos,function(index,media){
            if(media.sourceName === "video" && media.sourceId !== ""){
                source_id = media.sourceId;
                return false;
            }
        });
        return source_id;
    },
    clearGuest : function() {
        if(this.guestid != null) {
            $('#divVideoLocal_a').empty(); 
            //var m = this.classroomInfoManager.findObjectFromMembersById(this.guestid);
            //if(m != null)
            //    this.controlSingleStudentVideoOpenOrBan(m);
            this.sharewhiteboardToGuest(this.guestid, 0);
            this.guestid = null;
            this.guestname = "";
            var msg = "已取消嘉宾，并打开自己摄像头";//VC.ROUTER.LIVEBIG.NO_THIS_VIDEO;
            this.classroomInfoManager.showMessageWindow(msg);                        
        }
    },
    clearGuestForce : function(guestid) {       
        this.sharewhiteboardToGuest(guestid, 0);
    },
    setGuest : function(member) {
        if(this.guestid != null && this.guestid != member.userid) {
            var msg = "请先停止 " + this.guestname + " 嘉宾";//VC.ROUTER.LIVEBIG.NO_THIS_VIDEO;
            this.classroomInfoManager.showMessageWindow(msg);
            return;   
        }
        if (typeof (MCU_VER) === 'undefined')
            vsrc = $('#' + member.userid + ' video').attr('src');
        else
            vsrc = $('#' + member.userid + ' video').prop('srcObject');
        if(typeof vsrc === 'undefined' || vsrc == null){
            var msg = "该用户没有视频，不能成为嘉宾";//VC.ROUTER.LIVEBIG.NO_THIS_VIDEO;
            this.classroomInfoManager.showMessageWindow(msg);
            return;
        }
        if(this.getOpenFirstVideoStatus() == true)
            this.firstVideoOnAndOff();

        var source_id = this._findSourceIdByUserVideoInfos(member.videoInfos);   
        vhtml = '<video width="140" height="104" id="guest_video" autoplay="" style="opacity: 1; visibility: visible;"></video>';
        $('#divVideoLocal_a').append(vhtml);
        if (typeof (MCU_VER) === 'undefined')
            $('#divVideoLocal_a video').attr('src', vsrc);
        else
            $('#divVideoLocal_a video').prop('srcObject', vsrc);

        this.guestid = member.userid; 
        this.guestname = member.username;   
        this.liveManager.setGuestVideo(member.userid, source_id);
        this.sharewhiteboardToGuest(member.userid, 1);

        var msg = member.username + " 已成为嘉宾，并关闭自己摄像头";//VC.ROUTER.LIVEBIG.NO_THIS_VIDEO;
        this.classroomInfoManager.showMessageWindow(msg);

    },
    shareWhiteboardOpenAndClose : function(){//白板共享打开或关闭
        if(this.whiteBoardManager.getIsOpenShareWhiteboard()){    //如果已经打开共享白板,则关闭
            this.whiteBoardManager.isOpenShareWhiteboard = false;
            this.classroomInfoManager.updateAllUserStopwhiteboardValueFromMembersByValue(0);
            var command = {
                cmd:"controlpanel:sharewhiteboard",
                roomid:this.classroomInfoManager.getRoomId(),
                isTeacher:true,
                status:0,//0:关闭 1:打开
                userid:this.userid,
                userName:this.username,
                classroomName:this.classroomInfoManager.getClassroomName()
            };
            this.classRoomController.sendMessage(command);//通知其他人
        }else{                                  //如果已经关闭共享白板,则打开
            this.whiteBoardManager.isOpenShareWhiteboard = true;
            this.classroomInfoManager.updateAllUserStopwhiteboardValueFromMembersByValue(1);
            var command = {
                cmd:"controlpanel:sharewhiteboard",
                roomid:this.classroomInfoManager.getRoomId(),
                isTeacher:true,
                status:1,
                userid:this.userid,
                userName:this.username,
                classroomName:this.classroomInfoManager.getClassroomName()
            };
            this.classRoomController.sendMessage(command);
        }
    },
    commitVideoResolution : function(){//提交选择的视频分辨率
        if(TeacherModule.instance.getOpenFirstVideoStatus()){//是否打开了第一个视频
            TeacherModule.instance.firstVideoOnAndOff();//先关
            setTimeout(function(){
                TeacherModule.instance.firstVideoOnAndOff();//再开
            },1500);
        }
        if(TeacherModule.instance.getOpenSecondVideoStatus()){//是否打开了第二个视频
            TeacherModule.instance.secondVideoOnAndOff();
            setTimeout(function(){
                TeacherModule.instance.secondVideoOnAndOff();
            },2000);
        }
    }
}