/**
 * 学生
 * @constructor
 */
var StudentModule = StudentModule || {};
function Student(classRoomController){
    StudentModule.instance = this;
    this.classRoomController = classRoomController;

    this.userid = classRoomController.getUserId();         //用户ID
    this.role = classRoomController.getRole();           //用户角色
    this.username = null;       //用户名
    this.online = 0;            //在线状态,默认为0
    this.avatar = "";           //头像
    this.isauth = 1;            //1：实名用户  0：非实名用户
    this.privateMessage = [];               //私信列表
    this.isSubscribeAudio = false;          //是否订阅过音频
    this.isShowScrollView = true;               //是否显示走马灯视图
    this.connectVideo = false;      //是否摄像头了视频设备
    this.openVideoStatus = false; //是否打开视频。默认false
    this.connectAudio = false;              //是否连接了麦克风。默认false
    this.openAudioStatus = false;           //是否打开音频。默认false
    this.banVideoStatus = false;        //是否禁止视频。默认false
    this.banAudioStatus = false;        //是否禁止音频。默认false
    this.isHandupStatus = false;          //是否举过手
    this.banChatStatus = false;         //是否禁用聊天
    this.teacherIsOpenAudio = false;    //老师是否打开音频
    this.viewTeacherVideoShow = 1;      //学生界面老师视频显示,1：老师第一个视频 2：老师第二个视频
    this.isOwnCloseVideo = false;       //是否自己关闭视频
    this.isOwnCloseAudio = false;       //是否自己关闭音频
    this.isGuestStatus = false;
}
Student.prototype = {
    constructor : Student,
    init : function(){
        this.classroomInfoManager = StudentModule.instance.classRoomController.getClassroomInfoManager();      //房间信息对象
        this.chatManager = StudentModule.instance.classRoomController.getChatManager();     //聊天对象
        this.liveManager = StudentModule.instance.classRoomController.getLiveManager();     //媒体对象
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
        return this.isGuestStatus;
    },
    beGuest : function() {
        this.isGuestStatus = true;
    },
    notBeGuest : function() {
        this.isGuestStatus = false;
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
    getPrivateMessage : function(){         //获取私信列表
        return this.privateMessage;
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
    getIsSubscribeAudio : function(){           //获取是否订阅过音频的状态
        return StudentModule.instance.isSubscribeAudio;
    },
    getIsShowScrollView : function(){       //获取是否显示走马灯视图的状态
        return this.isShowScrollView;
    },
    isConnectVideo : function(){    //是否连接了摄像头
        return this.connectVideo;
    },
    getOpenVideoStatus : function(){    //获取摄像头状态
        return this.openVideoStatus;
    },
    isConnectAudio : function(){            //是否连接麦克风
        return this.connectAudio;
    },
    getOpenAudioStatus : function(){          //获取麦克风状态
        return this.openAudioStatus;
    },
    getBanVideoStatus : function(){         //获取禁止视频状态
        return this.banVideoStatus;
    },
    getBanAudioStatus : function(){         //获取禁止音频状态
        return this.banAudioStatus;
    },
    getIsHandupStatus : function(){     //获取是否已经举手的状态
        return this.isHandupStatus;
    },
    getBanChatStatus : function(){      //获取禁止聊天状态
        return this.banChatStatus;
    },
    getTeacherIsOpenAudio : function(){ //获取老师是否打开音频
        return this.teacherIsOpenAudio;
    },
    isOneselfByUserid : function(id){   //根据用户ID判断当前用户是否为自己
        return this.userid == id;
    },
    getIsOwnCloseVideo : function(){//获取是否自己关闭视频的状态
        return this.isOwnCloseVideo;
    },
    getIsOwnCloseAudio : function(){//获取是否自己关闭音频的状态
        return this.isOwnCloseAudio;
    },
    setVideoConnectStatusByVideoConnectCount : function(VideoConnectCount){     //根据连接的视频设备数量设置状态
        if(VideoConnectCount > 0) {
            this.connectVideo = true;
        }
    },
    setAudioConnectStatusByAudioConnectCount : function(AudioConnectCount) {     //根据连接的音频设备数量设置状态
        if(AudioConnectCount >= 1){
            this.connectAudio = true;
        }
    },
    openPrivateMessage : function(){    //学生打开私信列表(打开别人发过来的信息)
        if(!this.isEmptyForPrivateMessage()){
            this.chatManager.openPrivateMessageWindowToUser(this.getPrivateMessage()[0].userid,this.getPrivateMessage()[0].username,this.getPrivateMessage()[0].avatar);   //打开窗口
            this.deletePrivateMessageByUserid(this.getPrivateMessage()[0].userid);
        }
    },
    _isOpenClass : function(){                          //验证当前课堂是否为公开课
        return this.classroomInfoManager.isOpenClass();
    },
    _isBigClass : function(){                           //验证当前课堂是否为大班
        return this.classroomInfoManager.getClassroomType() > 10;         //TODO::硬编码
    },
    _isauthUser : function(){                           //是否为实名用户   1：实名   0：非实名
        return this.getIsauth() == 1;
    },
    _validateOpenClassStudent : function(){             //验证学生是否在公开课大班下的非实名用户
        if(this._isOpenClass() && this._isBigClass() && !this._isauthUser()){
            return true;
        }
        return false;
    },
    openPrivateMessageWindowToUser : function(user){//左侧列表,老师打开对其他人的私信窗口
        /*if(this._validateOpenClassStudent()){
            var msg = VC.ROUTER.LIVEBIG.NO_AUTH_OPERATION_PRIVATE;
            this.classroomInfoManager.showMessageWindow(msg);
            return;
        }*///暂时屏蔽非实名用户的限制(20150324)
        this.deletePrivateMessageByUserid(user.userid);
        this.chatManager.openPrivateMessageWindowToUser(user.userid,user.username,user.avatar);
    },
    openPrivateMessageToTeacher : function(){//打开对老师的私聊
        var teacherObject = this.classroomInfoManager.findTeacherObjectFromMembers();
        this.openPrivateMessageWindowToUser(teacherObject);
    },
    videoOnAndOff : function(){//视频开关
        /*if(this._validateOpenClassStudent() && !this.getOpenVideoStatus()){      //公益课非实名用户且视频未打开时，不允许操作
            var msg = VC.ROUTER.LIVEBIG.NO_AUTH_OPERATION_ON_OFF;
            this.classroomInfoManager.showMessageWindow(msg);return;
        }*/
        if(!this.isConnectVideo()){//是否连接
            var msg = VC.ROUTER.LIVEBIG.MEDIA_TIPS;
            this.classroomInfoManager.showMessageWindow(msg);return;
        }
        if(this.getBanVideoStatus()){//是否禁用
            var msg = VC.ROUTER.LIVEBIG.VIDEO_HAVE_BAN;
            this.classroomInfoManager.showMessageWindow(msg);return;
        }
        if(this.getOpenVideoStatus()){
            this.isOwnCloseVideo = true;
            this.liveManager.closePublishVideo();            //关
        }else{
            this.isOwnCloseVideo = false;
            this.liveManager.openPublishVideo();             //开
        }
    },
    audioOnAndOff : function(){//音频开关
        /*if(this._validateOpenClassStudent() && !this.getOpenVideoStatus()){            //公益课非实名用户且音频未打开时，不能自己开启
            var msg = VC.ROUTER.LIVEBIG.NO_AUTH_OPERATION_ON_OFF;
            this.classroomInfoManager.showMessageWindow(msg);return;
        }*/
        if(!this.isConnectAudio()){           //是否连接设备
            var msg = VC.ROUTER.LIVEBIG.MEDIA_TIPS;
            this.classroomInfoManager.showMessageWindow(msg);return;
        }
        if(this.getBanAudioStatus()){              //是否被禁用
            var msg = VC.ROUTER.LIVEBIG.AUDIO_HAVE_BAN;
            this.classroomInfoManager.showMessageWindow(msg);return;
        }
        if(this.getOpenAudioStatus()){
            this.isOwnCloseAudio = true;
            this.liveManager.closePublishAudio();            //关
        }else{
            this.isOwnCloseAudio = false;
            this.liveManager.openPublishAudio();             //开
        }
    },
    teacherVideoShowSwitch : function(){//学生界面老师视频显示切换
        if(this.liveManager._isHaveFirstVideo() && this.liveManager._isHavaSecondVideo()){//又2个视频
            if(this.classroomInfoManager.getTeacherCurrentVideo() == 't_1'){
                this.viewTeacherVideoShow = 2;
            }else if(this.classroomInfoManager.getTeacherCurrentVideo() == 't_2'){
                this.viewTeacherVideoShow = 1;
            }
        }else if(this.liveManager._isHaveFirstVideo()){//只有第一个视频
            this.viewTeacherVideoShow = 1;
        }else if(this.liveManager._isHavaSecondVideo()){//只有第二个视频
            this.viewTeacherVideoShow = 2;
        }
        return this.viewTeacherVideoShow;
    },
    handup : function(){//举手
        /*if(this._validateOpenClassStudent()){大班公益课非实名用户不允许操作
            var msg = VC.ROUTER.LIVEBIG.NO_AUTH_NO_HANDUP;
            this.classroomInfoManager.showMessageWindow(msg);return;
        }*/
        if(!this.classroomInfoManager.isTeachingMode()){//讨论模式不允许举手
            var msg = VC.ROUTER.LIVEBIG.DISCUSSION_NO_HANDUP_CAN_TALK;
            this.classroomInfoManager.showMessageWindow(msg);
            return;
        }
        if(this.classroomInfoManager.getAllowHandup()){//是否被允许举手
            if(this.getIsHandupStatus()){//是否已经举过手了
                var msg = VC.ROUTER.LIVEBIG.HAVE_HANDUP;
                this.classroomInfoManager.showMessageWindow(msg);
                return;
            }
            this.isHandupStatus = true;
            this.liveManager.studentHandUp();//通知老师,该学生举手了
        }else{
            var msg = VC.ROUTER.LIVEBIG.NOW_NO_HANDUP;
            this.classroomInfoManager.showMessageWindow(msg);
        }
    },
    audioStatusTitle : function(status){//麦克风状态提示
        var title = "";
        if(this.getBanAudioStatus())
            title = VC.ROUTER.LIVEBIG.LIVE_AUDIO_STATUS_TITLE;
        else if(!this.isConnectAudio() || !this.getOpenVideoStatus())
            title = VC.ROUTER.LIVEBIG.LIVE_NO_STATUS_TITLE;
        return title;
    },
    videoStatusTitle : function(status){//摄像头状态提示
        var title = "";
        if(this.getBanVideoStatus())
            title = VC.ROUTER.LIVEBIG.LIVE_VIDEO_STATUS_TITLE;
        else if(!this.isConnectVideo() || !this.getOpenVideoStatus())
            title = VC.ROUTER.LIVEBIG.LIVE_NO_STATUS_TITLE;
        return title;
    },
    chatStatusTitle : function(status){//聊天状态提示
        var title = "";
        if(this.getBanChatStatus())
            title = VC.ROUTER.LIVEBIG.LIVE_CHAT_STATUS_TITLE;
        return title;
    },
    handupStatusTitle : function(){//举手状态提示
        var title = "";
        if(!(this.classroomInfoManager.getAllowHandup() || (this.getIsHandupStatus() && this.classroomInfoManager.isTeachingMode()))){
            title = VC.ROUTER.LIVEBIG.LIVE_NO_CAN_HANGUP_TIPS;
        }
        return title;
    },
    showAvatar : function(){//显示自己头像
        if(this.getAvatar() !== ""){
            return {
                'background-image':'url('+this.getAvatar()+')',
                'background-size':'100% 100%'
            }
        }
        return this.getAvatar();
    },
    showOtherUserAvatar : function(url){//显示其他用户头像
        if(url === ""){
            return url;
        }
        return {
            'background-image': 'url('+url+')',
            'background-size': '100% 100%'
        };
    }
}